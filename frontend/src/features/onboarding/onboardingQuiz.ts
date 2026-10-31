import { getRankTierFromElo, RankTier } from '../../core/theme/tokens';

export interface QuizChoice {
  label: string;
  points: number;
}

export interface QuizQuestion {
  category: string;
  title: string;
  choices: QuizChoice[];
}

export const BASE_ELO = 300;
export const MAXIMUM_INITIAL_ELO = 850;

export const ONBOARDING_QUESTIONS: QuizQuestion[] = [
  {
    category: 'Nền tảng đào tạo',
    title: 'Bạn học chơi cầu lông theo hình thức nào?',
    choices: [
      { label: 'Tự chơi với bạn bè, chưa từng học qua thầy/lớp cơ bản', points: 0 },
      { label: 'Tự tập theo video hướng dẫn (YouTube/TikTok) và có tập bộ chân', points: 50 },
      { label: 'Đã học lớp cơ bản với HLV (dưới 6 tháng)', points: 120 },
      { label: 'Đã học cơ bản và nâng cao bài bản với HLV (trên 6 tháng)', points: 200 },
    ],
  },
  {
    category: 'Xử lý cầu cuối sân',
    title: 'Khi bị đối thủ phông cầu sâu về sát vạch cuối sân bên phía trái tay (Backhand), bạn thường xử lý thế nào?',
    choices: [
      { label: 'Thường bị hụt cầu hoặc chỉ đẩy nhẹ trả qua lưới được nửa sân', points: 0 },
      { label: 'Cố gắng lùi nhanh để vòng đầu (Overhead) đánh thuận tay trả về cuối sân', points: 60 },
      { label: 'Vung vợt trái tay (ve cầu) đưa cầu bay qua lưới về giữa sân đối phương', points: 100 },
      { label: 'Ve cầu (Backhand clear) nổ cầu đi thẳng về cuối sân đối phương hoặc chém cầu chéo sân', points: 150 },
    ],
  },
  {
    category: 'Chiến thuật đánh đôi',
    title: 'Trong trận đánh đôi, khi đồng đội của bạn lùi về sau nhảy đập cầu (Smash), bạn sẽ làm gì?',
    choices: [
      { label: 'Đứng nguyên ở phần sân của mình (chia đôi sân trái – phải) để thủ', points: 0 },
      { label: 'Chủ động di chuyển lên sát chữ T (trên lưới) để rình chụp cầu và bọc lót', points: 100 },
      { label: 'Lên lưới bịt góc thẳng, đồng thời quan sát hướng đập của đồng đội để bắt bài đường trả cầu của đối thủ', points: 150 },
    ],
  },
  {
    category: 'Mức căng cước',
    title: 'Cây vợt bạn đang đánh thường xuyên nhất được đan (căng) ở mức bao nhiêu kg?',
    choices: [
      { label: 'Dưới 9.5 kg (hoặc dùng vợt mua sẵn đã có lưới, không nhớ số kg)', points: 0 },
      { label: 'Từ 9.5 kg – 10.5 kg (khoảng 21 – 23 lbs)', points: 50 },
      { label: 'Từ 10.5 kg – 11.5 kg (khoảng 24 – 25 lbs)', points: 100 },
      { label: 'Trên 11.5 kg (từ 26 lbs trở lên)', points: 130 },
    ],
  },
  {
    category: 'Kinh nghiệm thi đấu',
    title: 'Tần suất ra sân hiện tại và kinh nghiệm thi đấu của bạn?',
    choices: [
      { label: 'Thỉnh thoảng mới đánh (1 buổi/tuần hoặc ít hơn), chỉ đánh vui vẻ', points: 0 },
      { label: 'Đánh đều đặn 2–3 buổi/tuần tại sân cố định', points: 50 },
      { label: 'Đánh ≥ 3 buổi/tuần, đã từng tham gia giải nội bộ CLB/Trường/Công ty', points: 100 },
      { label: 'Đã từng đạt giải (Top 1-2-3) tại các giải phong trào cấp Quận/Thành phố hoặc giải CLB mở rộng', points: 150 },
    ],
  },
];

export function calculateRawElo(answers: number[]): number {
  if (answers.length !== ONBOARDING_QUESTIONS.length) {
    throw new Error('Cần trả lời đủ 5 câu hỏi.');
  }
  let points = BASE_ELO;
  for (let i = 0; i < answers.length; i++) {
    const choice = ONBOARDING_QUESTIONS[i].choices[answers[i]];
    if (!choice) throw new Error('Đáp án không hợp lệ.');
    points += choice.points;
  }
  return points;
}

export function calculateInitialElo(answers: number[]): number {
  const raw = calculateRawElo(answers);
  return Math.min(Math.max(raw, BASE_ELO), MAXIMUM_INITIAL_ELO);
}

export function calculateInitialTier(answers: number[]): RankTier {
  return getRankTierFromElo(calculateInitialElo(answers));
}

