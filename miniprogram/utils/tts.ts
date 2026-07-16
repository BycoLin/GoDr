/** 拼音朗读：本地音频打进包内，个人未认证也可用 */

import { isSfxMuted } from './sfx';

let audio: WechatMiniprogram.InnerAudioContext | null = null;

function getAudio(): WechatMiniprogram.InnerAudioContext {
  if (!audio) {
    audio = wx.createInnerAudioContext();
    audio.obeyMuteSwitch = true;
    audio.volume = 1;
  }
  return audio;
}

function charKey(char: string): string {
  return [...char].map((c) => (c.codePointAt(0) || 0).toString(16)).join('_');
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
  const tip = fallbackTip || content;

  if (isSfxMuted()) {
    wx.showToast({ title: tip, icon: 'none' });
    return;
  }

  const char = [...content][0] || content;
  const key = charKey(char);
  const mp3 = `/assets/tts/${key}.mp3`;
  const wav = `/assets/tts/${key}.wav`;

  try {
    const ctx = getAudio();
    ctx.stop();
    let triedWav = false;
    ctx.onError(() => {
      if (!triedWav) {
        triedWav = true;
        ctx.src = wav;
        ctx.play();
        return;
      }
      wx.showToast({ title: tip, icon: 'none' });
    });
    ctx.src = mp3;
    ctx.play();
  } catch (err) {
    console.warn('speakChinese failed', err);
    wx.showToast({ title: tip, icon: 'none' });
  }
}

export function stopSpeak(): void {
  try {
    audio?.stop();
  } catch {
    /* ignore */
  }
}
