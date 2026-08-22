import type { Lexeme, LessonToken } from "@/lib/types";

/**
 * Bộ sinh đề tự động / 自動出題引擎
 * ---------------------------------------------------------------
 * Đầu vào: từ vựng + hội thoại của một bài học.
 * Đầu ra: danh sách câu hỏi ĐÃ CÓ sẵn phương án nhiễu và đáp án.
 *
 * Sinh đề một lần rồi lưu vào CSDL (chứ không sinh lại mỗi lần mở bài)
 * vì ba lý do: chấm điểm ổn định, giáo viên sửa/xóa được từng câu, và
 * cả lớp làm cùng một đề nên số liệu điểm yếu mới so sánh được.
 *
 * 出題一次就存進資料庫，不是每次開啟重生成：批改才穩定、老師才改得動、
 * 全班同一份題目，弱點統計才有意義。
 */

export type ExerciseKind =
  | "mcq_meaning"
  | "cloze"
  | "word_order"
  | "hv_discriminate"
  | "listening"
  | "writing";

export interface GeneratedItem {
  kind: ExerciseKind;
  prompt_vi: string;
  payload: Record<string, unknown>;
  answer: Record<string, unknown>;
  explain_vi: string;
  explain_zh: string;
  lexeme_id: number | null;
  points: number;
  auto_graded: boolean;
}

export const KIND_LABEL: Record<ExerciseKind, string> = {
  mcq_meaning: "Chọn nghĩa",
  cloze: "Điền vào chỗ trống",
  word_order: "Sắp xếp câu",
  hv_discriminate: "Từ Hán-Việt",
  listening: "Nghe hiểu",
  writing: "Viết chữ",
};

/* ─── tiện ích ─── */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

/** Đóng gói 1 đáp án đúng + 3 nhiễu thành 4 lựa chọn đã trộn */
function makeOptions(correct: string, distractors: string[]) {
  const opts = shuffle([correct, ...distractors.slice(0, 3)]);
  return { options: opts, correct: String(opts.indexOf(correct)) };
}

/** Từ nội dung có ý nghĩa (bỏ trợ từ, dấu câu) — dùng làm đáp án */
function isContentWord(lx: Lexeme) {
  const pos = lx.pos ?? "";
  return !/trợ từ|particle|助詞/i.test(pos);
}

/* ─── 1. Chọn nghĩa đúng ─── */
function genMcqMeaning(lx: Lexeme, pool: Lexeme[]): GeneratedItem {
  const distractors = pick(
    pool.filter((o) => o.id !== lx.id).map((o) => o.gloss_vi),
    3
  );
  const { options, correct } = makeOptions(lx.gloss_vi, distractors);
  return {
    kind: "mcq_meaning",
    prompt_vi: `「${lx.trad}」có nghĩa là gì?`,
    payload: { word_trad: lx.trad, word_simp: lx.simp, pinyin: lx.pinyin, options },
    answer: { correct },
    explain_vi: `${lx.trad} (${lx.pinyin.join(" ")}) = ${lx.gloss_vi}.`,
    explain_zh: `${lx.trad}：${lx.gloss_vi}`,
    lexeme_id: lx.id,
    points: 1,
    auto_graded: true,
  };
}

/* ─── 2. Điền vào chỗ trống (khoét một từ khỏi câu trong bài) ─── */
function genCloze(
  line: LessonToken[],
  target: LessonToken,
  pool: Lexeme[]
): GeneratedItem | null {
  const lx = target.lexeme;
  if (!lx) return null;

  const idx = line.indexOf(target);
  const render = (toks: LessonToken[]) =>
    toks.map((t) => (t.lexeme ? t.lexeme.trad : t.punctuation ?? "")).join("");

  const before = render(line.slice(0, idx));
  const after = render(line.slice(idx + 1));

  const distractors = pick(
    pool.filter((o) => o.id !== lx.id).map((o) => o.trad),
    3
  );
  const { options, correct } = makeOptions(lx.trad, distractors);

  return {
    kind: "cloze",
    prompt_vi: "Chọn từ đúng để hoàn thành câu:",
    payload: { before, after, options },
    answer: { correct },
    explain_vi: `Câu đầy đủ: ${before}${lx.trad}${after} — ${lx.gloss_vi}.`,
    explain_zh: `完整句：${before}${lx.trad}${after}`,
    lexeme_id: lx.id,
    points: 1,
    auto_graded: true,
  };
}

/* ─── 3. Sắp xếp thành câu (kéo thả) ─── */
function genWordOrder(line: LessonToken[]): GeneratedItem | null {
  const words = line.filter((t) => t.lexeme);
  if (words.length < 4 || words.length > 9) return null;

  const correctOrder = words.map((t) => String(t.id));
  const tiles = shuffle(
    words.map((t) => ({ id: String(t.id), text: t.lexeme!.trad, simp: t.lexeme!.simp }))
  );
  // Nếu trộn xong vẫn trùng thứ tự gốc thì đảo hai ô đầu.
  if (tiles.map((t) => t.id).join() === correctOrder.join() && tiles.length > 1) {
    [tiles[0], tiles[1]] = [tiles[1], tiles[0]];
  }

  const vi = line.find((t) => t.line_vi)?.line_vi ?? "";
  const full = words.map((t) => t.lexeme!.trad).join("");

  return {
    kind: "word_order",
    prompt_vi: `Sắp xếp thành câu đúng: “${vi}”`,
    payload: { tiles, hint_vi: vi },
    answer: { order: correctOrder },
    explain_vi: `Trật tự đúng: ${full}`,
    explain_zh:
      "越南語的修飾語多在中心詞之後（sách mới ＝「書新」），中文相反。這是越南學生最常出錯的地方。",
    lexeme_id: null,
    points: 2,
    auto_graded: true,
  };
}

/* ─── 4. Phân biệt từ Hán-Việt (bẫy bạn giả) ─── */
function genHvDiscriminate(lx: Lexeme, pool: Lexeme[]): GeneratedItem | null {
  if (lx.hv_class !== 2 && lx.hv_class !== 3) return null;

  const trap = lx.hanviet.join(" "); // cách đọc Hán-Việt — chính là cái bẫy
  const distractors = [
    trap,
    ...pick(
      pool.filter((o) => o.id !== lx.id).map((o) => o.gloss_vi),
      2
    ),
  ];
  const { options, correct } = makeOptions(
    lx.hv_vi_word ?? lx.gloss_vi,
    distractors
  );

  return {
    kind: "hv_discriminate",
    prompt_vi: `Trong tiếng Trung,「${lx.trad}」nghĩa là gì?`,
    payload: {
      word_trad: lx.trad,
      word_simp: lx.simp,
      hanviet: lx.hanviet,
      hv_class: lx.hv_class,
      options,
    },
    answer: { correct },
    explain_vi:
      lx.hv_warning ??
      `${lx.trad} đọc Hán-Việt là “${trap}”, nhưng nghĩa tiếng Trung là “${lx.hv_vi_word ?? lx.gloss_vi}”.`,
    explain_zh: `漢越音「${trap}」與中文詞義已分岔，屬第 ${lx.hv_class} 類，必須單獨記。`,
    lexeme_id: lx.id,
    points: 2,
    auto_graded: true,
  };
}

/* ─── 5. Nghe hiểu ─── */
function genListening(lx: Lexeme, pool: Lexeme[]): GeneratedItem {
  const distractors = pick(
    pool.filter((o) => o.id !== lx.id).map((o) => o.trad),
    3
  );
  const { options, correct } = makeOptions(lx.trad, distractors);
  return {
    kind: "listening",
    prompt_vi: "Nghe rồi chọn từ bạn nghe được:",
    payload: {
      audio_tw: lx.audio_tw ?? null,
      audio_cn: lx.audio_cn ?? null,
      // Chưa có file ghi âm thì hiện pinyin để bài tập vẫn dùng được.
      // 還沒錄音時退回顯示拼音，題目照樣可用。
      fallback_pinyin: lx.pinyin.join(" "),
      options,
    },
    answer: { correct },
    explain_vi: `${lx.trad} — ${lx.pinyin.join(" ")} — ${lx.gloss_vi}`,
    explain_zh: `${lx.trad}（${lx.pinyin.join(" ")}）`,
    lexeme_id: lx.id,
    points: 1,
    auto_graded: true,
  };
}

/* ─── 6. Viết chữ (nộp nét bút, giáo viên chấm) ─── */
function genWriting(lx: Lexeme): GeneratedItem {
  const char = Array.from(lx.trad)[0];
  return {
    kind: "writing",
    prompt_vi: `Viết chữ「${char}」vào ô mễ tự.`,
    payload: {
      target: char,
      word: lx.trad,
      hanviet: lx.hanviet.join(" "),
      gloss_vi: lx.gloss_vi,
    },
    answer: {},
    explain_vi: `${lx.trad} — ${lx.gloss_vi}. Giáo viên sẽ xem nét bút của bạn.`,
    explain_zh: "手寫題交筆跡，由老師批閱。",
    lexeme_id: lx.id,
    points: 2,
    auto_graded: false,
  };
}

/* ═══════════════════════════════════════════════════════════════
   Bộ sinh đề chính
   ═══════════════════════════════════════════════════════════════ */
export interface GenerateOptions {
  counts?: Partial<Record<ExerciseKind, number>>;
}

const DEFAULT_COUNTS: Record<ExerciseKind, number> = {
  mcq_meaning: 3,
  cloze: 2,
  word_order: 2,
  hv_discriminate: 2,
  listening: 2,
  writing: 1,
};

export function generateItems(
  lexemes: Lexeme[],
  tokens: LessonToken[],
  opts: GenerateOptions = {}
): GeneratedItem[] {
  const counts = { ...DEFAULT_COUNTS, ...(opts.counts ?? {}) };
  const pool = lexemes.filter(isContentWord);
  const items: GeneratedItem[] = [];

  // Gom hội thoại theo dòng
  const lineMap = new Map<number, LessonToken[]>();
  tokens.forEach((t) => {
    const arr = lineMap.get(t.line_no) ?? [];
    arr.push(t);
    lineMap.set(t.line_no, arr);
  });
  const lines = Array.from(lineMap.values());

  // 1) chọn nghĩa
  pick(pool, counts.mcq_meaning).forEach((lx) =>
    items.push(genMcqMeaning(lx, pool))
  );

  // 2) khoét từ trong câu thật của bài
  let clozeLeft = counts.cloze;
  for (const line of shuffle(lines)) {
    if (clozeLeft <= 0) break;
    const candidates = line.filter((t) => t.lexeme && isContentWord(t.lexeme));
    if (!candidates.length) continue;
    const target = pick(candidates, 1)[0];
    const item = genCloze(line, target, pool);
    if (item) {
      items.push(item);
      clozeLeft--;
    }
  }

  // 3) sắp xếp câu
  let orderLeft = counts.word_order;
  for (const line of shuffle(lines)) {
    if (orderLeft <= 0) break;
    const item = genWordOrder(line);
    if (item) {
      items.push(item);
      orderLeft--;
    }
  }

  // 4) bẫy Hán-Việt — ưu tiên nhóm 3 (bạn giả) rồi mới tới nhóm 2
  const hvPool = [
    ...lexemes.filter((l) => l.hv_class === 3),
    ...lexemes.filter((l) => l.hv_class === 2),
  ];
  hvPool.slice(0, counts.hv_discriminate).forEach((lx) => {
    const item = genHvDiscriminate(lx, pool);
    if (item) items.push(item);
  });

  // 5) nghe hiểu
  pick(pool, counts.listening).forEach((lx) => items.push(genListening(lx, pool)));

  // 6) viết chữ
  pick(pool, counts.writing).forEach((lx) => items.push(genWriting(lx)));

  return items;
}
