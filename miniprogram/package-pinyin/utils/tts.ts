/** 拼音朗读：全拼口诀（声母 → 韵母 → 整读），并行预下载 */

const TTS_HOST = 'https://dict.youdao.com';
/** 口诀之间的停顿 */
const GAP_MS = 110;
/** 韵母与整读之间略停，像老师「拼起来」 */
const BLEND_GAP_MS = 150;

const { getInitials, getFinalById, resolveFinalId } = require('../data/tools/pinyin');

let audio: WechatMiniprogram.InnerAudioContext | null = null;
let pendingTip = '';
let playToken = 0;

function getAudio(): WechatMiniprogram.InnerAudioContext {
  if (!audio) {
    audio = wx.createInnerAudioContext();
    audio.obeyMuteSwitch = false;
    audio.volume = 1;
    audio.playbackRate = 1;
  }
  return audio;
}

/** 在线读音 URL（发布前请在小程序后台配置 dict.youdao.com 为 downloadFile 合法域名） */
export function remoteTtsUrl(char: string): string {
  const c = [...(char || '')][0] || char;
  return `${TTS_HOST}/dictvoice?audio=${encodeURIComponent(c)}&le=zh`;
}

function lookupInitialTip(initial: string): string {
  const row = getInitials().find((item: { id: string }) => item.id === initial);
  return row?.tip || '';
}

function lookupFinalTip(finalWithTone: string): string {
  const id = resolveFinalId(finalWithTone);
  return getFinalById(id)?.tip || '';
}

/** j/q/x 等：韵母口诀「衣/鱼」带 y 音；iu/ui：口诀「优/威」会听成 na iu */
function shouldSkipFinalTip(initial: string, finalWithTone: string): boolean {
  if (!finalWithTone) return false;
  const finalId = resolveFinalId(finalWithTone);

  if (finalId === 'iu' || finalId === 'ui') return true;

  if (!initial || initial === '—') return false;

  if (initial === 'j' || initial === 'q' || initial === 'x') return true;

  if (['z', 'c', 's', 'zh', 'ch', 'sh', 'r'].includes(initial) && finalId === 'i') {
    return true;
  }

  if (initial === 'y' || initial === 'w') return true;

  return false;
}

/** iu/ui 等：声母口诀（如「纳」）+ 韵母口诀（如「优」）会拼成 na iu，只整读例字 */
function shouldSkipInitialTip(initial: string, finalWithTone: string): boolean {
  if (!initial || initial === '—' || !finalWithTone) return false;
  const finalId = resolveFinalId(finalWithTone);
  if (finalId === 'iu' || finalId === 'ui') return true;
  return false;
}

/** 全拼：声母口诀 → 韵母口诀 → 例字整读（去重） */
function buildPinyinParts(input: {
  char: string;
  initial?: string;
  final?: string;
}): string[] {
  const { char, initial, final } = input;
  if (!char) return [];

  const parts: string[] = [];
  const skipIni = shouldSkipInitialTip(initial || '', final || '');
  const iniTip =
    !skipIni && initial && initial !== '—' ? lookupInitialTip(initial) : '';
  const finTip =
    final && !shouldSkipFinalTip(initial || '', final) ? lookupFinalTip(final) : '';

  if (iniTip && iniTip !== char) parts.push(iniTip);
  if (finTip && finTip !== iniTip && finTip !== char) parts.push(finTip);
  parts.push(char);

  return parts;
}

function downloadChar(char: string, token: number): Promise<string> {
  return new Promise((resolve) => {
    if (!char || token !== playToken) {
      resolve('');
      return;
    }
    const url = remoteTtsUrl(char);
    wx.downloadFile({
      url,
      success(res) {
        if (token !== playToken) {
          resolve('');
          return;
        }
        if (res.statusCode !== 200 || !res.tempFilePath) {
          resolve('');
          return;
        }
        wx.getFileSystemManager().getFileInfo({
          filePath: res.tempFilePath,
          success(info) {
            // 有道失败时返回约 120B 的 JSON，不是真音频
            resolve(token === playToken && info.size > 200 ? res.tempFilePath : '');
          },
          fail: () => resolve(''),
        });
      },
      fail: () => resolve(''),
    });
  });
}

function playLocalSrc(src: string, token: number): Promise<void> {
  return new Promise((resolve) => {
    if (!src || token !== playToken) {
      resolve();
      return;
    }

    const ctx = getAudio();
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      ctx.offEnded(onEnded);
      ctx.offError(onError);
      resolve();
    };

    const onEnded = () => finish();
    const onError = () => finish();

    ctx.onEnded(onEnded);
    ctx.onError(onError);
    ctx.stop();
    ctx.src = src;
    ctx.play();
  });
}

function gapBeforeIndex(index: number, total: number): number {
  // 最后一段是整读，前一段后多停一拍
  if (index === total - 2) return BLEND_GAP_MS;
  return GAP_MS;
}

async function speakSequence(chars: string[], token: number): Promise<void> {
  const srcList = await Promise.all(chars.map((c) => downloadChar(c, token)));
  if (token !== playToken) return;

  let played = 0;
  for (let i = 0; i < srcList.length; i += 1) {
    if (token !== playToken) return;
    const src = srcList[i];
    if (!src) continue;
    await playLocalSrc(src, token);
    played += 1;
    if (token !== playToken) return;
    if (i < srcList.length - 1) {
      await new Promise((r) => setTimeout(r, gapBeforeIndex(i, srcList.length)));
    }
  }
  if (played === 0 && token === playToken) speakFailed();
}

function speakFailed(): void {
  if (pendingTip) {
    wx.showToast({ title: pendingTip, icon: 'none' });
  }
}

export interface SpeakPinyinInput {
  pinyin: string;
  char: string;
  initial?: string;
  final?: string;
}

/** 全拼朗读：如 波 → 啊 → 八 */
export function speakPinyin(input: SpeakPinyinInput, fallbackTip?: string): void {
  const { pinyin, char, initial, final } = input;
  if (!char) return;

  pendingTip = fallbackTip || `${pinyin} · ${char}`;
  playToken += 1;
  const token = playToken;

  const parts = buildPinyinParts({ char, initial, final });
  speakSequence(parts, token).catch(() => {
    if (token === playToken) speakFailed();
  });
}

/** 朗读单个汉字（非拼音场景） */
export function speakChinese(text: string, fallbackTip?: string): void {
  const content = (text || '').trim();
  if (!content) return;
  const char = [...content][0] || content;
  speakPinyin({ pinyin: content, char }, fallbackTip || content);
}

export function stopSpeak(): void {
  try {
    playToken += 1;
    audio?.stop();
  } catch {
    /* ignore */
  }
}

/** 供微信依赖分析识别 */
export const TTS_MODULE = 1;
