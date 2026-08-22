/**
 * FSRS rút gọn / 精簡版 FSRS
 * ---------------------------------------------------------------
 * Đủ dùng cho sản phẩm thật, và quan trọng hơn: nó ghi lại review_log
 * để sau này hồi quy lại tham số bằng dữ liệu thật của học viên Việt Nam.
 *
 * 這是可上線的簡化版。重點不在公式多精確，而在 review_log 有記錄，
 * 之後可以用越南學習者的真實資料回歸出自己的參數。
 *
 * Điểm khác biệt của QNA: từ Hán-Việt loại 1 (đồng hình đồng nghĩa)
 * được nhân hệ số khoảng cách — người Việt vốn đã biết những từ này.
 * 漢越 Loại 1 的間隔直接乘上係數：越南學生本來就會這些詞。
 */

export type Rating = 1 | 2 | 3 | 4; // again / hard / good / easy

export interface CardState {
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
}

export interface Scheduled extends CardState {
  intervalDays: number;
  due: string; // YYYY-MM-DD
}

const MIN_D = 1;
const MAX_D = 10;
const REQUEST_RETENTION = 0.9;
const MAX_INTERVAL = 365 * 3;

/** Hệ số thưởng cho từ Hán-Việt / 漢越詞間隔加成 */
export const HV_BONUS: Record<number, number> = {
  0: 1.0,
  1: 1.8, // đồng hình đồng nghĩa — nhớ rất nhanh
  2: 1.1, // cùng gốc nhưng khác cách dùng — lợi thế nhỏ
  3: 0.8, // bạn giả — cần ôn DÀY HƠN bình thường
};

function clampDifficulty(d: number) {
  return Math.min(MAX_D, Math.max(MIN_D, d));
}

function nextDifficulty(d: number, rating: Rating) {
  // rating 3 (good) giữ nguyên; 1 (again) làm khó hơn; 4 (easy) làm dễ hơn
  const delta = -0.8 * (rating - 3);
  return clampDifficulty(d + delta);
}

function nextStability(s: number, d: number, rating: Rating) {
  if (rating === 1) {
    // Quên — độ ổn định tụt mạnh nhưng không về 0
    return Math.max(0.4, s * 0.35);
  }
  const easeBonus = rating === 4 ? 1.3 : rating === 2 ? 0.85 : 1.0;
  const difficultyPenalty = 1 + (MAX_D - d) * 0.09;
  return s * difficultyPenalty * easeBonus;
}

function intervalFromStability(s: number) {
  // I = S * ln(R) / ln(0.9)  → với R = 0.9 thì I ≈ S
  const i = (s * Math.log(REQUEST_RETENTION)) / Math.log(0.9);
  return Math.min(MAX_INTERVAL, Math.max(1, Math.round(i)));
}

export function schedule(
  card: CardState,
  rating: Rating,
  hvClass: number = 0,
  today: Date = new Date()
): Scheduled {
  const difficulty = nextDifficulty(card.difficulty, rating);
  const stability = nextStability(card.stability, difficulty, rating);

  const bonus = HV_BONUS[hvClass] ?? 1;
  const intervalDays = Math.max(
    1,
    Math.round(intervalFromStability(stability) * bonus)
  );

  const due = new Date(today);
  due.setDate(due.getDate() + intervalDays);

  return {
    stability,
    difficulty,
    reps: card.reps + 1,
    lapses: card.lapses + (rating === 1 ? 1 : 0),
    intervalDays,
    due: due.toISOString().slice(0, 10),
  };
}

/** Nhãn hiển thị cho nút ôn tập / 複習按鈕上的預估間隔 */
export function previewIntervals(card: CardState, hvClass = 0) {
  return ([1, 2, 3, 4] as Rating[]).map((r) => ({
    rating: r,
    days: schedule(card, r, hvClass).intervalDays,
  }));
}
