export interface Wallet {
  points: number;
  bestCombo: number;
  totalCorrect: number;
  totalAnswered: number;
  bossClears: number;
  dailyClears: number;
  sessions: number;
}

const KEY = 'wallet';

function emptyWallet(): Wallet {
  return {
    points: 0,
    bestCombo: 0,
    totalCorrect: 0,
    totalAnswered: 0,
    bossClears: 0,
    dailyClears: 0,
    sessions: 0,
  };
}

export function loadWallet(): Wallet {
  try {
    const data = wx.getStorageSync(KEY) as Wallet | '';
    if (!data || typeof data !== 'object') return emptyWallet();
    return { ...emptyWallet(), ...data };
  } catch {
    return emptyWallet();
  }
}

export function saveWallet(wallet: Wallet): void {
  wx.setStorageSync(KEY, wallet);
}

/** 单题得分：答对 10 * (1 + floor(combo/3)) */
export function pointsForCorrect(combo: number): number {
  return 10 * (1 + Math.floor(Math.max(combo, 1) / 3));
}

export function starsBonus(stars: number): number {
  if (stars >= 3) return 30;
  if (stars === 2) return 20;
  if (stars === 1) return 10;
  return 0;
}

export interface SessionRewardInput {
  correct: number;
  total: number;
  stars: number;
  bestCombo: number;
  sessionPoints: number;
  isBoss?: boolean;
  isDaily?: boolean;
  cleared?: boolean;
}

export function applySessionReward(input: SessionRewardInput): Wallet {
  const wallet = loadWallet();
  wallet.points += input.sessionPoints + starsBonus(input.stars);
  wallet.bestCombo = Math.max(wallet.bestCombo, input.bestCombo);
  wallet.totalCorrect += input.correct;
  wallet.totalAnswered += input.total;
  wallet.sessions += 1;
  if (input.isBoss && input.cleared) wallet.bossClears += 1;
  if (input.isDaily && input.cleared) wallet.dailyClears += 1;
  saveWallet(wallet);
  return wallet;
}

export function clearWallet(): void {
  wx.removeStorageSync(KEY);
}
