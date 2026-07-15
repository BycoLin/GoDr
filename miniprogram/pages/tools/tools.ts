Page({
  data: {
    entries: [
      {
        id: 'puzzle',
        title: '数字排队',
        short: '排一排',
        mark: '数',
        tone: 'tone-blue',
        action: 'puzzle',
      },
      {
        id: 'pinyin',
        title: '拼音练习',
        short: '声母韵母',
        mark: '拼',
        tone: 'tone-green',
        action: 'pinyin',
      },
      {
        id: 'english',
        title: '单词闪卡',
        short: '翻翻看',
        mark: '词',
        tone: 'tone-cyan',
        action: 'english',
      },
      {
        id: 'visual',
        title: '看图口算',
        short: '算一算',
        mark: '算',
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
