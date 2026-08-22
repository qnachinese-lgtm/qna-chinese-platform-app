export type Script = "trad" | "simp";
export type Phonetic = "pinyin" | "zhuyin" | "hanviet" | "off";
export type CardKind = "recognize" | "write";

/** 0 không phải Hán-Việt · 1 đồng hình đồng nghĩa · 2 khác cách dùng · 3 bạn giả */
export type HvClass = 0 | 1 | 2 | 3;

export interface Lexeme {
  id: number;
  trad: string;
  simp: string;
  pinyin: string[];
  zhuyin: string[];
  hanviet: string[];
  hv_class: HvClass;
  hv_vi_word: string | null;
  hv_warning: string | null;
  gloss_vi: string;
  gloss_en: string | null;
  pos: string | null;
  hsk_level: number | null;
  tocfl_level: string | null;
  cefr: string | null;
  audio_tw?: string | null;
  audio_cn?: string | null;
}

export interface LessonToken {
  id: number;
  line_no: number;
  seq: number;
  speaker: string | null;
  line_vi: string | null;
  punctuation: string | null;
  lexeme: Lexeme | null;
}

export interface Lesson {
  id: number;
  slug: string;
  title_vi: string;
  title_trad: string;
  title_simp: string;
  level: number;
  hsk_level: number | null;
  tocfl_level: string | null;
  summary_vi: string | null;
}

export interface Profile {
  id: string;
  display_name: string | null;
  role: "student" | "teacher" | "editor" | "admin";
  native_lang: string;
  script_pref: Script;
  phonetic_pref: Phonetic;
  target_exam: string | null;
  current_level: number;
  streak_days: number;
  last_active: string | null;
}

/* ─── Bài tập / 作業 ─── */
export interface Assignment {
  id: number;
  class_id: number;
  lesson_id: number | null;
  title: string;
  instructions_vi: string | null;
  due_at: string | null;
  created_at: string;
}

export interface AssignmentItem {
  id: number;
  seq: number;
  kind: string;
  prompt_vi: string;
  payload: Record<string, any>;
  points: number;
  auto_graded: boolean;
}

/** Một dòng trả về từ RPC submission_review — CÓ đáp án, chỉ sau khi nộp bài */
export interface ReviewRow {
  item_id: number;
  seq: number;
  kind: string;
  prompt_vi: string;
  payload: Record<string, any>;
  response: Record<string, any>;
  is_correct: boolean | null;
  needs_review: boolean;
  answer: Record<string, any> | null;
  explain_vi: string | null;
  explain_zh: string | null;
}

export const HV_LABEL: Record<HvClass, string> = {
  0: "",
  1: "Loại 1 · đồng hình đồng nghĩa",
  2: "Loại 2 · cùng gốc, khác cách dùng",
  3: "Loại 3 · bạn giả (từ dễ nhầm)",
};
