/** 拼音朗读：本地音频打进包内，个人未认证也可用 */

let audio: WechatMiniprogram.InnerAudioContext | null = null;
let pendingTip = '';

function charKey(char: string): string {
  return [...char].map((c) => (c.codePointAt(0) || 0).toString(16)).join('_');
}

function getAudio(): WechatMiniprogram.InnerAudioContext {
  if (!audio) {
    audio = wx.createInnerAudioContext();
    // 跟读不受手机静音键影响（与答题音效分开）
    audio.obeyMuteSwitch = false;
    audio.volume = 1;
    audio.onError(() => {
      const src = audio?.src || '';
      if (src.endsWith('.mp3')) {
        audio!.src = src.replace(/\.mp3$/, '.wav');
        audio!.play();
        return;
      }
      if (pendingTip) {
        wx.showToast({ title: pendingTip, icon: 'none' });
      }
    });
  }
  return audio;
}

/** 打进包内的本地读音路径（mp3） */
export function localTtsPath(char: string): string {
  return `/assets/tts/${charKey(char)}.mp3`;
}

/**
 * 朗读汉字：优先本地 mp3，没有再试 wav
 */
export function speakChinese(text: string, fallbackTip?: string): void {
  const content = (text || '').trim();
  if (!content) return;
  pendingTip = fallbackTip || content;

  const char = [...content][0] || content;
  const key = charKey(char);
  const mp3 = `/assets/tts/${key}.mp3`;

  try {
    const ctx = getAudio();
    ctx.stop();
    ctx.src = mp3;
    ctx.play();
  } catch (err) {
    console.warn('speakChinese failed', err);
    wx.showToast({ title: pendingTip, icon: 'none' });
  }
}

export function stopSpeak(): void {
  try {
    audio?.stop();
  } catch {
    /* ignore */
  }
}
