/** 答题反馈音效（叭叭双音） */

const OK_SRC = '/assets/sfx/ok.wav';
const BAD_SRC = '/assets/sfx/bad.wav';
const MUTE_KEY = 'sfxMuted';

let okAudio: WechatMiniprogram.InnerAudioContext | null = null;
let badAudio: WechatMiniprogram.InnerAudioContext | null = null;

function ensureAudio(
  current: WechatMiniprogram.InnerAudioContext | null,
  src: string,
): WechatMiniprogram.InnerAudioContext {
  if (current) return current;
  const audio = wx.createInnerAudioContext();
  audio.src = src;
  audio.obeyMuteSwitch = true;
  audio.volume = 0.85;
  return audio;
}

export function isSfxMuted(): boolean {
  try {
    return Boolean(wx.getStorageSync(MUTE_KEY));
  } catch {
    return false;
  }
}

export function setSfxMuted(muted: boolean) {
  try {
    wx.setStorageSync(MUTE_KEY, muted ? 1 : 0);
  } catch {
    /* ignore */
  }
}

export function playOkSfx() {
  if (isSfxMuted()) return;
  try {
    okAudio = ensureAudio(okAudio, OK_SRC);
    okAudio.stop();
    okAudio.seek(0);
    okAudio.play();
  } catch (err) {
    console.warn('playOkSfx failed', err);
  }
}

export function playBadSfx() {
  if (isSfxMuted()) return;
  try {
    badAudio = ensureAudio(badAudio, BAD_SRC);
    badAudio.stop();
    badAudio.seek(0);
    badAudio.play();
  } catch (err) {
    console.warn('playBadSfx failed', err);
  }
}

export function playAnswerSfx(correct: boolean) {
  if (correct) playOkSfx();
  else playBadSfx();
}
