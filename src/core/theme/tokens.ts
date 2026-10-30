export const AppColors = {
  background: '#F2F7F3',
  surface: '#FFFFFF',
  border: '#DFE9E1',
  primary: '#176344',
  accent: '#299A63',
  accentText: '#176344',
  mint: '#DDF2E3',
  text: '#14251D',
  muted: '#61736A',
  loss: '#BE123C',
  streak: '#946200',
  gold: '#F59E0B',
  onPrimary: '#FFFFFF',
  courtDark: '#09281E',
  strava: '#FC5200',
  cyan: '#00B4D8',
} as const;

export const AppColorsDark = {
  background: '#07080A',
  surface: '#111317',
  border: '#1B1F26',
  primary: '#00D665',
  accent: '#00E872',
  accentText: '#00E872',
  mint: '#0D2E1C',
  text: '#FFFFFF',
  muted: '#7E8695',
  loss: '#EF4444',
  streak: '#F5A623',
  gold: '#F59E0B',
  onPrimary: '#07080A',
  courtDark: '#09281E',
  strava: '#FC5200',
  cyan: '#00B4D8',
} as const;

export const AppTokens = {
  radius: 20,
  touchTarget: 48,
  contentWidth: 720,
} as const;

export type RankGroupKey =
  | 'newbie'
  | 'weak'
  | 'lowerIntermediate'
  | 'intermediate'
  | 'upperIntermediate'
  | 'advanced'
  | 'strong'
  | 'eliteAmateur';

export interface RankGroupInfo {
  key: RankGroupKey;
  label: string;
}

export const RankGroups: Record<RankGroupKey, RankGroupInfo> = {
  newbie: { key: 'newbie', label: 'Nhập môn' },
  weak: { key: 'weak', label: 'Yếu' },
  lowerIntermediate: { key: 'lowerIntermediate', label: 'Trung bình yếu' },
  intermediate: { key: 'intermediate', label: 'Trung bình' },
  upperIntermediate: { key: 'upperIntermediate', label: 'Trung bình khá' },
  advanced: { key: 'advanced', label: 'Khá' },
  strong: { key: 'strong', label: 'Tốt' },
  eliteAmateur: { key: 'eliteAmateur', label: 'Cao thủ phong trào' },
};

export interface RankTier {
  id: string;
  label: string;
  minimumElo: number;
  group: RankGroupInfo;
  description: string;
}

export const RankTiers: RankTier[] = [
  {
    id: 'newbie',
    label: 'Nhập môn',
    minimumElo: 300,
    group: RankGroups.newbie,
    description: 'Đang làm quen luật, cách cầm vợt và điểm chạm cầu.',
  },
  {
    id: 'weakMinus',
    label: 'Yếu-',
    minimumElo: 400,
    group: RankGroups.weak,
    description: 'Biết luật cơ bản nhưng còn khó đưa cầu qua lưới ổn định.',
  },
  {
    id: 'weak',
    label: 'Yếu',
    minimumElo: 450,
    group: RankGroups.weak,
    description: 'Duy trì được cầu chậm; giao và phông còn nhiều lỗi.',
  },
  {
    id: 'weakPlus',
    label: 'Yếu+',
    minimumElo: 500,
    group: RankGroups.weak,
    description: 'Đã có giao, phông, bỏ nhỏ cơ bản; di chuyển còn bị động.',
  },
  {
    id: 'lowerIntermediateMinus',
    label: 'TBY-',
    minimumElo: 550,
    group: RankGroups.lowerIntermediate,
    description: 'Biết kỹ thuật nền nhưng điểm chạm và vị trí đứng chưa đều.',
  },
  {
    id: 'lowerIntermediate',
    label: 'TBY',
    minimumElo: 600,
    group: RankGroups.lowerIntermediate,
    description: 'Đánh được các tình huống quen; dễ hụt khi bị đổi hướng.',
  },
  {
    id: 'lowerIntermediatePlus',
    label: 'TBY+',
    minimumElo: 650,
    group: RankGroups.lowerIntermediate,
    description: 'Cơ bản ổn định hơn, bắt đầu giữ vị trí và phối hợp đánh đôi.',
  },
  {
    id: 'intermediateMinus',
    label: 'TB-',
    minimumElo: 700,
    group: RankGroups.intermediate,
    description: 'Có bộ pháp và cầu cơ bản; giảm độ ổn định khi bị ép tốc độ.',
  },
  {
    id: 'intermediate',
    label: 'TB',
    minimumElo: 750,
    group: RankGroups.intermediate,
    description: 'Duy trì được nhịp cầu, phông và phòng thủ cơ bản, biết đổi công thủ.',
  },
  {
    id: 'intermediatePlus',
    label: 'TB+',
    minimumElo: 800,
    group: RankGroups.intermediate,
    description: 'Chủ động khai thác khoảng trống, phối hợp đôi và điều cầu rõ ý đồ.',
  },
  {
    id: 'upperIntermediateMinus',
    label: 'TBK-',
    minimumElo: 900,
    group: RankGroups.upperIntermediate,
    description: 'Nền kỹ thuật chắc; bước đầu tạo và duy trì thế chủ động.',
  },
  {
    id: 'upperIntermediate',
    label: 'TBK',
    minimumElo: 950,
    group: RankGroups.upperIntermediate,
    description: 'Phối hợp nhiều đường cầu, bọc lót và giữ nhịp tốt.',
  },
  {
    id: 'upperIntermediatePlus',
    label: 'TBK+',
    minimumElo: 1000,
    group: RankGroups.upperIntermediate,
    description: 'Đọc tình huống nhanh, điều hướng phòng thủ và ít lỗi cầu thuận lợi.',
  },
  {
    id: 'advancedMinus',
    label: 'Khá-',
    minimumElo: 1100,
    group: RankGroups.advanced,
    description: 'Có nhiều phương án xử lý và giữ được độ ổn định khi bị ép.',
  },
  {
    id: 'advanced',
    label: 'Khá',
    minimumElo: 1200,
    group: RankGroups.advanced,
    description: 'Kiểm soát nhịp, điểm rơi và chuyển trạng thái công thủ hiệu quả.',
  },
  {
    id: 'advancedPlus',
    label: 'Khá+',
    minimumElo: 1300,
    group: RankGroups.advanced,
    description: 'Chiến thuật linh hoạt, tạo áp lực liên tục trước đối thủ mạnh.',
  },
  {
    id: 'strongMinus',
    label: 'Tốt-',
    minimumElo: 1400,
    group: RankGroups.strong,
    description: 'Kỹ thuật và thể lực vững; duy trì chất lượng ở nhịp thi đấu cao.',
  },
  {
    id: 'strong',
    label: 'Tốt',
    minimumElo: 1500,
    group: RankGroups.strong,
    description: 'Đọc trận, xử lý cầu khó và phối hợp đồng đội ở mức phong trào mạnh.',
  },
  {
    id: 'strongPlus',
    label: 'Tốt+',
    minimumElo: 1600,
    group: RankGroups.strong,
    description: 'Độ ổn định rất cao, thích ứng tốt với nhiều lối chơi mạnh.',
  },
  {
    id: 'eliteAmateur',
    label: 'Cao thủ phong trào',
    minimumElo: 1700,
    group: RankGroups.eliteAmateur,
    description: 'Nhóm dẫn đầu trong hệ thống; không tự suy ra danh hiệu bán chuyên hoặc chuyên nghiệp.',
  },
];

export function getRankTierFromElo(elo: number): RankTier {
  if (elo < 0) elo = 0;
  for (let i = RankTiers.length - 1; i >= 0; i--) {
    if (elo >= RankTiers[i].minimumElo) {
      return RankTiers[i];
    }
  }
  return RankTiers[0];
}

export function getNextRankTier(currentTier: RankTier): RankTier | null {
  const index = RankTiers.findIndex((t) => t.id === currentTier.id);
  if (index >= 0 && index + 1 < RankTiers.length) {
    return RankTiers[index + 1];
  }
  return null;
}

