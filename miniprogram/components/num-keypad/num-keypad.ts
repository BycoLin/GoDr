Component({
  properties: {
    maxLen: { type: Number, value: 2 },
  },
  data: {
    keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'ok'],
  },
  methods: {
    onTap(e: WechatMiniprogram.TouchEvent) {
      const key = e.currentTarget.dataset.key as string;
      this.triggerEvent('key', { key });
    },
  },
});
