"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface PendingAnswer {
  id: number;
  student: string;
  prompt: string;
  target: string;
  strokes: string | null;
}

/** Chấm tay câu viết chữ / 手寫題批改 */
export function WritingGrader({ pending }: { pending: PendingAnswer[] }) {
  const router = useRouter();
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [busy, setBusy] = useState<number | null>(null);

  async function grade(id: number, ok: boolean) {
    setBusy(id);
    const supabase = createClient();
    const { error } = await supabase.rpc("grade_writing", {
      ans_id: id,
      ok,
      note: null,
    });
    setBusy(null);
    if (!error) {
      setDone((d) => ({ ...d, [id]: ok }));
      router.refresh();
    }
  }

  if (pending.length === 0) {
    return (
      <p className="note" style={{ marginTop: 30 }}>
        Không có câu viết tay nào đang chờ. Mọi câu khác đã được chấm tự động
        ngay khi học viên nộp bài.
        <br />
        沒有待批改的手寫題；其餘題目在學生交卷當下就自動批改完了。
      </p>
    );
  }

  return (
    <>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "38px 0 6px" }}>
        Chấm chữ viết tay
      </h2>
      <p className="lede" style={{ marginBottom: 16 }}>
        Máy không chấm được nét bút. Xem rồi bấm Đạt hoặc Chưa đạt — điểm sẽ tự
        cộng vào bài làm của học viên.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
          gap: 14,
        }}
      >
        {pending.map((p) => (
          <div className="card" key={p.id}>
            <div
              className="row"
              style={{ justifyContent: "space-between", marginBottom: 10 }}
            >
              <b style={{ fontSize: 14 }}>{p.student}</b>
              <span className="chip">{p.target}</span>
            </div>

            <div
              className="mizi"
              style={{ width: "100%", height: "auto", aspectRatio: "1" }}
            >
              <span className="guide">{p.target}</span>
              {p.strokes && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.strokes}
                  alt={`Nét bút của ${p.student}`}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    zIndex: 2,
                  }}
                />
              )}
            </div>

            {done[p.id] !== undefined ? (
              <p
                className="ok"
                style={{ color: done[p.id] ? "var(--jade)" : "var(--zhu)" }}
              >
                {done[p.id] ? "Đã cho đạt ✓" : "Đã đánh dấu chưa đạt"}
              </p>
            ) : (
              <div className="row" style={{ marginTop: 12, gap: 8 }}>
                <button
                  className="btn"
                  style={{ flex: 1, justifyContent: "center" }}
                  disabled={busy === p.id}
                  onClick={() => grade(p.id, true)}
                >
                  Đạt
                </button>
                <button
                  className="btn ghost"
                  style={{ flex: 1, justifyContent: "center" }}
                  disabled={busy === p.id}
                  onClick={() => grade(p.id, false)}
                >
                  Chưa đạt
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
