export type RankGroup =
  | 'Nhập môn'
  | 'Yếu'
  | 'Trung bình yếu'
  | 'Trung bình'
  | 'Trung bình khá'
  | 'Khá'
  | 'Tốt'
  | 'Cao thủ phong trào';

export interface RankTierInfo {
  key: string;
  label: string;
  minimumElo: number;
  group: RankGroup;
  description: string;
}

export const RANK_TIERS: RankTierInfo[] = [
  {
    key: 'newbie',
    label: 'Nhập môn',
    minimumElo: 300,
    group: 'Nhập môn',
    description: 'Đang làm quen luật, cách cầm vợt và điểm chạm cầu.',
  },
  {
    key: 'weakMinus',
    label: 'Yếu-',
    minimumElo: 400,
    group: 'Yếu',
    description: 'Biết luật cơ bản nhưng còn khó đưa cầu qua lưới ổn định.',
  },
  {
    key: 'weak',
    label: 'Yếu',
    minimumElo: 450,
    group: 'Yếu',
    description: 'Duy trì được cầu chậm; giao và phông còn nhiều lỗi.',
  },
  {
    key: 'weakPlus',
    label: 'Yếu+',
    minimumElo: 500,
    group: 'Yếu',
    description: 'Đã có giao, phông, bỏ nhỏ cơ bản; di chuyển còn bị động.',
  },
  {
    key: 'lowerIntermediateMinus',
    label: 'TBY-',
    minimumElo: 550,
    group: 'Trung bình yếu',
    description: 'Biết kỹ thuật nền nhưng điểm chạm và vị trí đứng chưa đều.',
  },
  {
    key: 'lowerIntermediate',
    label: 'TBY',
    minimumElo: 600,
    group: 'Trung bình yếu',
    description: 'Đánh được các tình huống quen; dễ hụt khi bị đổi hướng.',
  },
  {
    key: 'lowerIntermediatePlus',
    label: 'TBY+',
    minimumElo: 650,
    group: 'Trung bình yếu',
    description: 'Cơ bản ổn định hơn, bắt đầu giữ vị trí và phối hợp đánh đôi.',
  },
  {
    key: 'intermediateMinus',
    label: 'TB-',
    minimumElo: 700,
    group: 'Trung bình',
    description: 'Có bộ pháp và cầu cơ bản; giảm độ ổn định khi bị ép tốc độ.',
  },
  {
    key: 'intermediate',
    label: 'TB',
    minimumElo: 750,
    group: 'Trung bình',
    description: 'Duy trì được nhịp cầu, phông và phòng thủ cơ bản, biết đổi công thủ.',
  },
  {
    key: 'intermediatePlus',
    label: 'TB+',
    minimumElo: 800,
    group: 'Trung bình',
    description: 'Chủ động khai thác khoảng trống, phối hợp đôi và điều cầu rõ ý đồ.',
  },
  {
    key: 'upperIntermediateMinus',
    label: 'TBK-',
    minimumElo: 900,
    group: 'Trung bình khá',
    description: 'Nền kỹ thuật chắc; bước đầu tạo và duy trì thế chủ động.',
  },
  {
    key: 'upperIntermediate',
    label: 'TBK',
    minimumElo: 950,
    group: 'Trung bình khá',
    description: 'Phối hợp nhiều đường cầu, bọc lót và giữ nhịp tốt.',
  },
  {
    key: 'upperIntermediatePlus',
    label: 'TBK+',
    minimumElo: 1000,
    group: 'Trung bình khá',
    description: 'Đọc tình huống nhanh, điều hướng phòng thủ và ít lỗi cầu thuận lợi.',
  },
  {
    key: 'advancedMinus',
    label: 'Khá-',
    minimumElo: 1100,
    group: 'Khá',
    description: 'Có nhiều phương án xử lý và giữ được độ ổn định khi bị ép.',
  },
  {
    key: 'advanced',
    label: 'Khá',
    minimumElo: 1200,
    group: 'Khá',
    description: 'Kiểm soát nhịp, điểm rơi và chuyển trạng thái công thủ hiệu quả.',
  },
  {
    key: 'advancedPlus',
    label: 'Khá+',
    minimumElo: 1300,
    group: 'Khá',
    description: 'Độ ổn định cao khi bị ép, xử lý linh hoạt và biến hóa.',
  },
  {
    key: 'strongMinus',
    label: 'Tốt-',
    minimumElo: 1400,
    group: 'Tốt',
    description: 'Thể lực và kỹ chiến thuật toàn diện, thi đấu chủ động.',
  },
  {
    key: 'strong',
    label: 'Tốt',
    minimumElo: 1500,
    group: 'Tốt',
    description: 'Lực đánh mạnh, tốc độ cao và giữ được phong độ xuyên suốt set đấu.',
  },
  {
    key: 'strongPlus',
    label: 'Tốt+',
    minimumElo: 1600,
    group: 'Tốt',
    description: 'Độ ổn định rất cao, thích ứng tốt với nhiều lối chơi mạnh.',
  },
  {
    key: 'eliteAmateur',
    label: 'Cao thủ phong trào',
    minimumElo: 1700,
    group: 'Cao thủ phong trào',
    description: 'Nhóm dẫn đầu trong hệ thống; không tự suy ra danh hiệu bán chuyên hoặc chuyên nghiệp.',
  },
];

export function rankTierFromElo(elo: number): RankTierInfo {
  const clamped = Math.max(0, elo);
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (clamped >= RANK_TIERS[i].minimumElo) {
      return RANK_TIERS[i];
    }
  }
  return RANK_TIERS[0];
}

