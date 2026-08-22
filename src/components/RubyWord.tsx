"use client";

import type { Lexeme, Phonetic, Script } from "@/lib/types";

/**
 * Bộ hiển thị chữ + chú âm / 標音渲染元件
 * ---------------------------------------------------------------
 * Đây là trái tim kỹ thuật của QNA Chinese.
 * KHÔNG chuyển đổi chuỗi lúc chạy: phồn thể, giản thể, pinyin, chú âm
 * và âm Hán-Việt đều là cột riêng trong CSDL, render chỉ việc lấy ra.
 * Nhờ vậy chuyển đổi không có độ trễ và không bao giờ sai.
 *
 * 不做即時字串轉換：繁、簡、拼音、注音、漢越音都是資料庫欄位，
 * 渲染時直接取用——切換零延遲、零錯誤。
 *
 * Chú âm phải xếp DỌC bên phải chữ, pinyin/Hán-Việt xếp NGANG bên trên.
 * `ruby-position: inter-character` hỗ trợ không đồng đều giữa các trình
 * duyệt, nên ta tự dựng bằng flexbox — xem .cc trong globals.css.
 */
export function RubyWord({
  lexeme,
  script,
  phonetic,
  hot,
  known,
  onClick,
}: {
  lexeme: Lexeme;
  script: Script;
  phonetic: Phonetic;
  hot?: boolean;
  known?: boolean;
  onClick?: (lex: Lexeme) => void;
}) {
  const text = script === "trad" ? lexeme.trad : lexeme.simp;
  const chars = Array.from(text);

  let ph: string[] | null = null;
  if (phonetic === "pinyin") ph = lexeme.pinyin;
  else if (phonetic === "zhuyin") ph = lexeme.zhuyin;
  else if (phonetic === "hanviet") ph = lexeme.hanviet;

  const above = phonetic === "pinyin" || phonetic === "hanviet";

  return (
    <span
      className="w"
      role="button"
      tabIndex={0}
      data-hot={hot ? "true" : undefined}
      data-known={known ? "true" : undefined}
      data-hv={lexeme.hv_class || undefined}
      onClick={() => onClick?.(lexeme)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(lexeme);
        }
      }}
    >
      {chars.map((c, i) => (
        <span className="cc" key={i}>
          {above && ph?.[i] ? (
            <span className={`ph ${phonetic}`}>{ph[i]}</span>
          ) : null}
          <span className="ch">{c}</span>
          {phonetic === "zhuyin" && ph?.[i] ? (
            <span className="ph zhuyin">{ph[i]}</span>
          ) : null}
        </span>
      ))}
    </span>
  );
}
