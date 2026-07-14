Page({
  data: {
    entries: [
      {
        id: 'puzzle',
        title: '益智数字',
        desc: '数字排队 · 看图算一算',
        tone: 'tone-blue',
        action: 'puzzle',
      },
      {
        id: 'pinyin',
        title: '拼音发音天天练',
        desc: '学拼音，学识字，练拼读',
        tone: 'tone-green',
        action: 'pinyin',
      },
      {
        id: 'english',
        title: '单词天天练',
        desc: '学英语，背单词（认读闪卡）',
        tone: 'tone-cyan',
        action: 'english',
      },
      {
        id: 'visual',
        title: '看图口算',
        desc: '拿走一些，还剩多少',
        tone: 'tone-teal',
        action: 'visual',
      },
    ],
  },

  onTap(e: WechatMiniprogram.TouchEvent) {
    const action = e.currentTarget.dataset.action as string;
    if (action === 'pinyin') {
      wx.navigateTo({ url: '/pages/pinyin/pinyin' });
      return;
    }
    if (action === 'english') {
      wx.navigateTo({
        url: '/pages/flashcard/flashcard?packId=english-g1-g2&grade=1',
      });
      return;
    }
    if (action === 'visual') {
      wx.navigateTo({ url: '/pages/visual-math/visual-math' });
      return;
    }
    if (action === 'puzzle') {
      wx.navigateTo({ url: '/pages/number-line/number-line' });
      return;
    }
  },
});
