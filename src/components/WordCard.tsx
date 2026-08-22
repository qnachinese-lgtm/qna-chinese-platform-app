"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { HV_LABEL, type Lexeme, type Script } from "@/lib/types";

/** Thẻ tra từ / 詞卡：釋義 + 三軌標音 + 漢越分類警示 */
export function WordCard({
  lexeme,
  script,
  onClose,
  onKnown,
}: {
  lexeme: Lexeme;
  script: Script;
  onClose: () => void;
  onKnown: (id: number) => void;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function addToReview() {
    setBusy(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMsg("Cần đăng nhập để lưu / 需登入才能儲存");
      setBusy(false);
      return;
    }
    // Một từ, hai thẻ: nhận diện và viết. / 一詞兩卡：識與寫。
    const { error } = await supabase.from("srs_cards").upsert(
      [
        { user_id: user.id, lexeme_id: lexeme.id, kind: "recognize" },
        { user_id: user.id, lexeme_id: lexeme.id, kind: "write" },
      ],
      { onConflict: "user_id,lexeme_id,kind", ignoreDuplicates: true }
    );
    setMsg(error ? `Lỗi: ${error.message}` : "Đã thêm ✓");
    setBusy(false);
  }

  const hv = lexeme.hv_class;

  return (
    <div className="wordcard">
      <button className="wc-x" onClick={onClose} aria-label="Đóng">
        ✕
      </button>
      <div className="wc-h">
        {script === "trad" ? lexeme.trad : lexeme.simp}
      </div>
      <div className="wc-ph">
        {lexeme.pinyin.join(" ")}　{lexeme.zhuyin.join(" ")}
      </div>

      {hv > 0 && (
        <div className="wc-hv">
          <span className="lbl">{HV_LABEL[hv]}</span>
          <b>{lexeme.hanviet.join(" ")}</b>
          {lexeme.hv_vi_word ? ` → ${lexeme.hv_vi_word}` : null}
        </div>
      )}

      <div className="wc-def">{lexeme.gloss_vi}</div>
      {lexeme.hv_warning && <div className="wc-note">{lexeme.hv_warning}</div>}

      <div className="wc-act">
        <button className="pri" onClick={addToReview} disabled={busy}>
          {msg ?? "Thêm vào ôn tập"}
        </button>
        <button onClick={() => onKnown(lexeme.id)}>Đã thuộc</button>
      </div>
    </div>
  );
}
