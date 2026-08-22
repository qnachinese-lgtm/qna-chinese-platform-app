"use client";

import Link from "next/link";
import { useState } from "react";
import { Toolbar } from "@/components/Toolbar";
import { usePrefs } from "@/components/PrefsProvider";
import { createClient } from "@/lib/supabase/client";
import { previewIntervals, schedule, type Rating } from "@/lib/fsrs";
import { HV_LABEL, type CardKind, type Lexeme } from "@/lib/types";

export interface DueCard {
  id: number;
  kind: CardKind;
  due: string;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  lexeme: Lexeme;
}

const GRADES: [Rating, string][] = [
  [1, "Quên"],
  [2, "Khó"],
  [3, "Được"],
  [4, "Dễ"],
];

export function ReviewSession({ cards }: { cards: DueCard[] }) {
  const { script, phonetic } = usePrefs();
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());

  const card = cards[i];

  async function grade(rating: Rating) {
    if (!card) return;
    const next = schedule(
      {
        stability: card.stability,
        difficulty: card.difficulty,
        reps: card.reps,
        lapses: card.lapses,
      },
      rating,
      card.lexeme.hv_class
    );

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("srs_cards")
        .update({
          stability: next.stability,
          difficulty: next.difficulty,
          reps: next.reps,
          lapses: next.lapses,
          due: next.due,
          last_review: new Date().toISOString().slice(0, 10),
        })
        .eq("id", card.id);

      // review_log là nguồn dữ liệu để sau này hồi quy tham số FSRS
      await supabase.from("review_log").insert({
        user_id: user.id,
        card_id: card.id,
        rating,
        elapsed_ms: Date.now() - startedAt,
      });
    }

    setDone((d) => d + 1);
    setRevealed(false);
    setStartedAt(Date.now());
    setI((n) => n + 1);
  }

  if (!card) {
    return (
      <>
        <Toolbar crumb="Ôn tập" />
        <div className="wrap">
          <div className="reviewcard">
            <div style={{ fontSize: 40 }}>✓</div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: "12px 0 8px" }}>
              {done > 0
                ? `Xong ${done} thẻ hôm nay`
                : "Không có thẻ nào đến hạn"}
            </h1>
            <p style={{ color: "var(--text-2)", fontSize: 14 }}>
              Thêm từ mới bằng cách mở một bài học và bấm vào từ bạn muốn nhớ.
            </p>
            <div
              className="row"
              style={{ justifyContent: "center", marginTop: 18 }}
            >
              <Link href="/learn" className="btn">
                Tới bài học
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const lx = card.lexeme;
  const text = script === "trad" ? lx.trad : lx.simp;
  const ph =
    phonetic === "zhuyin"
      ? lx.zhuyin
      : phonetic === "hanviet"
        ? lx.hanviet
        : lx.pinyin;
  const previews = previewIntervals(card, lx.hv_class);

  return (
    <>
      <Toolbar crumb="Ôn tập" />
      <div className="wrap">
        <div
          className="row"
          style={{ justifyContent: "space-between", marginBottom: 18 }}
        >
          <span className="chip zhu">
            {card.kind === "recognize" ? "Nhận diện · 識" : "Viết chữ · 寫"}
          </span>
          <span className="chip num">
            {i + 1} / {cards.length}
          </span>
        </div>

        <div className="reviewcard">
          <div className="big">{text}</div>

          {revealed ? (
            <>
              <div
                style={{
                  color: "var(--zhu)",
                  fontSize: 15,
                  marginTop: 10,
                  fontFamily: "var(--han)",
                }}
              >
                {ph.join(" ")}
              </div>
              <div style={{ fontSize: 17, marginTop: 10 }}>{lx.gloss_vi}</div>

              {lx.hv_class > 0 && (
                <div
                  style={{
                    marginTop: 14,
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "var(--lotus-wash)",
                    textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 9.5,
                      letterSpacing: ".13em",
                      textTransform: "uppercase",
                      color: "var(--lotus)",
                    }}
                  >
                    {HV_LABEL[lx.hv_class]}
                  </div>
                  <b
                    style={{
                      color: "var(--lotus)",
                      fontStyle: "italic",
                      fontSize: 15,
                    }}
                  >
                    {lx.hanviet.join(" ")}
                  </b>
                  {lx.hv_vi_word ? ` → ${lx.hv_vi_word}` : null}
                  {lx.hv_warning && (
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "var(--text-2)",
                        marginTop: 6,
                        lineHeight: 1.65,
                      }}
                    >
                      {lx.hv_warning}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <p
              style={{
                color: "var(--text-3)",
                fontSize: 13.5,
                marginTop: 16,
              }}
            >
              {card.kind === "write"
                ? "Viết chữ này ra giấy rồi bấm để kiểm tra"
                : "Nhớ nghĩa rồi bấm để kiểm tra"}
            </p>
          )}
        </div>

        {revealed ? (
          <div className="grades">
            {GRADES.map(([r, label]) => (
              <button key={r} onClick={() => grade(r)}>
                {label}
                <small>
                  {previews.find((p) => p.rating === r)?.days ?? 1} ngày
                </small>
              </button>
            ))}
          </div>
        ) : (
          <div
            className="row"
            style={{ justifyContent: "center", marginTop: 16 }}
          >
            <button className="btn" onClick={() => setRevealed(true)}>
              Hiện đáp án
            </button>
          </div>
        )}

        {lx.hv_class === 1 && (
          <p className="note" style={{ maxWidth: 560, margin: "22px auto 0" }}>
            Đây là từ Hán-Việt <b>đồng hình đồng nghĩa</b> — khoảng cách ôn tập
            được nhân 1,8 lần vì bạn vốn đã biết từ này trong tiếng Việt.
          </p>
        )}
      </div>
    </>
  );
}
