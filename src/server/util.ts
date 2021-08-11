import { Player } from 'hypixel-types';

export const EASY_LEVELS = 4;
export const EASY_LEVELS_XP = 7000;
export const XP_PER_PRESTIGE = 96 * 5000 + EASY_LEVELS_XP;
export const LEVELS_PER_PRESTIGE = 100;

export const getLevelForExp = (exp: number): number => {
  const prestiges = Math.floor(exp / XP_PER_PRESTIGE);

  let level = prestiges * LEVELS_PER_PRESTIGE;

  let expWithoutPrestiges = exp - prestiges * XP_PER_PRESTIGE;

  for (let i = 1; i <= EASY_LEVELS; ++i) {
    const expForEasyLevel = getExpForLevel(i);
    if (expWithoutPrestiges < expForEasyLevel) break;
    level++;
    expWithoutPrestiges -= expForEasyLevel;
  }

  level += expWithoutPrestiges / 5000;

  return level;
};

export const getExpForLevel = (level: number): number => {
  if (level == 0) return 0;

  const respectedLevel = getLevelRespectingPrestige(level);
  if (respectedLevel > EASY_LEVELS) {
    return 5000;
  }

  switch (respectedLevel) {
    case 1:
      return 500;
    case 2:
      return 1000;
    case 3:
      return 2000;
    case 4:
      return 3500;
  }
  return 5000;
};

export const getLevelRespectingPrestige = (level: number): number => {
  return level > 3000 ? level - 3000 : level % LEVELS_PER_PRESTIGE;
};

export const rankWeights = {
  NON_DONOR: 1,
  VIP: 2,
  VIP_PLUS: 3,
  MVP: 4,
  MVP_PLUS: 5,
  SUPERSTAR: 6,
  YOUTUBER: 60,
  JR_HELPER: 70,
  HELPER: 80,
  MODERATOR: 90,
  ADMIN: 100,
};

export type Rank = keyof typeof rankWeights;

export const rankPrefixes: Record<Rank, string> = {
  NON_DONOR: '§7',
  VIP: '§a[VIP]',
  VIP_PLUS: '§a[VIP§6+§a]',
  MVP: '§b[MVP]',
  MVP_PLUS: '§b[MVP§c+§b]',
  SUPERSTAR: '§6[MVP§c++§6]',
  YOUTUBER: '§c[§fYOUTUBE§c]',
  JR_HELPER: '§9[JR HELPER]',
  HELPER: '§9[HELPER]',
  MODERATOR: '§2[MOD]',
  ADMIN: '§c[ADMIN]',
};

export const isStaff = (player: Player): boolean => {
  const rank = player.rank ?? 'NORMAL';
  return rank !== 'NORMAL';
};

export const getRank = (player: Player): Rank => {
  let out: Rank | undefined;

  if (isStaff(player)) out = player.rank as Rank;

  ['monthlyPackageRank', 'newPackageRank', 'packageRank'].forEach(key => {
    const rank = player[key];
    if (rank === 'NONE') return;
    if (rank && (!out || (rankWeights[rank as Rank] ?? 0) > (out ? rankWeights[out] : 0)))
      out = rank as Rank;
  });

  out ??= 'NON_DONOR';

  return out;
};

export const stripFormatting = (text: string): string => text.replace(/§[0-9a-f]/gi, '');

export const getRankPlaintext = (player: Player): string =>
  stripFormatting(rankPrefixes[getRank(player)]);
