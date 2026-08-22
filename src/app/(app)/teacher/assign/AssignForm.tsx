"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KIND_LABEL, type ExerciseKind } from "@/lib/exercises";

interface Cls { id: number; name: string; code: string }
interface Lsn { id: number; title_vi: string; title_trad: string; level: number }

const KINDS: ExerciseKind[] = [
  "mcq_meaning",
  "cloze",
  "word_order",
  "hv_discriminate",
  "listening",
  "writing",
];
const DEFAULTS: Record<ExerciseKind, number> = {
  mcq_meaning: 3,
  cloze: 2,
  word_order: 2,
  hv_discriminate: 2,
  listening: 2,
  writing: 1,
};

export function AssignForm({ classes, lessons }: { classes: Cls[]; lessons: Lsn[] }) {
  const router = useRouter();
  const [classId, setClassId] = useState(classes[0]?.id ?? 0);
  const [lessonId, setLessonId] = useState(lessons[0]?.id ?? 0);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [counts, setCounts] = useState<Record<ExerciseKind, number>>(DEFAULTS);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const total = KINDS.reduce((s, k) => s + counts[k], 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);

    const res = await fetch("/api/assignments/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        class_id: classId,
        lesson_id: lessonId,
        title,
        due_at: due ? new Date(due).toISOString() : null,
        counts,
      }),
    });
    const json = await res.json();
    setBusy(false);

    if (!res.ok) {
      setErr(json.error ?? "Không tạo được bài tập");
      return;
    }
    setMsg(`Đã tạo bài tập với ${json.item_count} câu hỏi.`);
    router.refresh();
  }

  if (classes.length === 0) {
    return (
      <p className="note">
        Bạn chưa có lớp nào. Tạo lớp trong bảng <code>classes</code> trước (xem
        README mục 5). / 先建立班級。
      </p>
    );
  }

  return (
    <form className="card" onSubmit={submit}>
      <div className="field">
        <label htmlFor="cls">Lớp</label>
        <select
          id="cls"
          className="inp"
          value={classId}
          onChange={(e) => setClassId(Number(e.target.value))}
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="lsn">Bài học</label>
        <select
          id="lsn"
          className="inp"
          value={lessonId}
          onChange={(e) => setLessonId(Number(e.target.value))}
        >
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              Bậc {l.level} · {l.title_vi} ({l.title_trad})
            </option>
          ))}
        </select>
      </div>

      <div className="row" style={{ gap: 10 }}>
        <div className="field" style={{ flex: 2, margin: 0 }}>
          <label htmlFor="ttl">Tiêu đề (bỏ trống sẽ tự đặt)</label>
          <input
            id="ttl"
            className="inp"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Bài tập tuần 3"
          />
        </div>
        <div className="field" style={{ flex: 1, margin: 0 }}>
          <label htmlFor="due">Hạn nộp</label>
          <input
            id="due"
            className="inp"
            type="datetime-local"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
        </div>
      </div>

      <div style={{ margin: "18px 0 6px" }}>
        <label
          style={{
            fontFamily: "var(--mono)", fontSize: 9.5, letterSpacing: ".13em",
            color: "var(--text-3)", textTransform: "uppercase",
          }}
        >
          Số câu mỗi loại · 各題型題數（共 {total} câu）
        </label>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {KINDS.map((k) => (
          <div
            key={k}
            className="row"
            style={{ justifyContent: "space-between", gap: 12 }}
          >
            <span style={{ fontSize: 13.5 }}>
              {KIND_LABEL[k]}
              {k === "hv_discriminate" && (
                <span className="chip lotus" style={{ marginLeft: 8 }}>
                  bẫy Hán-Việt
                </span>
              )}
              {k === "writing" && (
                <span className="chip amber" style={{ marginLeft: 8 }}>
                  chấm tay
                </span>
              )}
            </span>
            <input
              className="inp"
              style={{ width: 74 }}
              type="number"
              min={0}
              max={10}
              value={counts[k]}
              onChange={(e) =>
                setCounts({ ...counts, [k]: Number(e.target.value) })
              }
            />
          </div>
        ))}
      </div>

      {err && <p className="err">{err}</p>}
      {msg && <p className="ok">{msg}</p>}

      <button
        className="btn wide"
        type="submit"
        disabled={busy || total === 0}
        style={{ marginTop: 18 }}
      >
        {busy ? "Đang sinh đề…" : `Tạo bài tập (${total} câu)`}
      </button>
    </form>
  );
}
