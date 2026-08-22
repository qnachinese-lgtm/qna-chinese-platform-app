"use client";

import { useEffect, useRef, useState } from "react";
import type { AssignmentItem } from "@/lib/types";

export type Response = Record<string, any>;

interface Props {
  item: AssignmentItem;
  value: Response;
  onChange: (r: Response) => void;
  locked?: boolean;
  /** Sau khi nộp bài: chỉ số đáp án đúng (hoặc thứ tự đúng) */
  correct?: Response | null;
  isCorrect?: boolean | null;
}

/** Điều phối: chọn giao diện theo loại câu hỏi / 依題型分派 */
export function ExerciseItem(props: Props) {
  switch (props.item.kind) {
    case "word_order":
      return <WordOrder {...props} />;
    case "writing":
      return <Writing {...props} />;
    case "listening":
      return <Listening {...props} />;
    case "cloze":
      return <Cloze {...props} />;
    default:
      return <Choice {...props} />;
  }
}

/* ───────────────────────── lựa chọn A/B/C/D ───────────────────── */
function optionState(
  i: number,
  value: Response,
  correct?: Response | null,
  locked?: boolean
) {
  const picked = value?.choice === String(i);
  if (!locked) return picked ? "picked" : "idle";
  const right = correct?.correct === String(i);
  if (right) return "right";
  if (picked) return "wrong";
  return "idle";
}

const OPT_STYLE: Record<string, React.CSSProperties> = {
  idle: {},
  picked: { borderColor: "var(--zhu)", background: "var(--zhu-wash)" },
  right: { borderColor: "var(--jade)", background: "var(--jade-wash)" },
  wrong: { borderColor: "var(--zhu)", background: "var(--zhu-wash)" },
};

function OptionList({
  options,
  value,
  onChange,
  locked,
  correct,
}: {
  options: string[];
  value: Response;
  onChange: (r: Response) => void;
  locked?: boolean;
  correct?: Response | null;
}) {
  return (
    <div className="optlist">
      {options.map((o, i) => {
        const st = optionState(i, value, correct, locked);
        return (
          <button
            key={i}
            className="opt"
            style={OPT_STYLE[st]}
            disabled={locked}
            aria-pressed={value?.choice === String(i)}
            onClick={() => onChange({ choice: String(i) })}
          >
            <span className="k">{"ABCD"[i]}</span>
            <span>{o}</span>
            {st === "right" && <span className="mark ok">✓</span>}
            {st === "wrong" && <span className="mark no">✕</span>}
          </button>
        );
      })}
    </div>
  );
}

function Choice({ item, value, onChange, locked, correct }: Props) {
  const p = item.payload;
  return (
    <div>
      {p.word_trad && (
        <div className="bigword">
          {p.word_trad}
          {p.hanviet && (
            <span className="hvhint">{(p.hanviet as string[]).join(" ")}</span>
          )}
        </div>
      )}
      {item.kind === "hv_discriminate" && (
        <p className="trap">
          Cẩn thận: âm Hán-Việt không phải lúc nào cũng là nghĩa tiếng Trung.
        </p>
      )}
      <OptionList
        options={p.options ?? []}
        value={value}
        onChange={onChange}
        locked={locked}
        correct={correct}
      />
    </div>
  );
}

/* ───────────────────────── điền vào chỗ trống ──────────────────── */
function Cloze({ item, value, onChange, locked, correct }: Props) {
  const p = item.payload;
  const chosen =
    value?.choice != null ? (p.options ?? [])[Number(value.choice)] : null;
  return (
    <div>
      <div className="clozeline">
        <span>{p.before}</span>
        <span className={`blank${chosen ? " filled" : ""}`}>
          {chosen ?? "　　"}
        </span>
        <span>{p.after}</span>
      </div>
      <OptionList
        options={p.options ?? []}
        value={value}
        onChange={onChange}
        locked={locked}
        correct={correct}
      />
    </div>
  );
}

/* ───────────────────────── nghe hiểu ───────────────────────────── */
function Listening({ item, value, onChange, locked, correct }: Props) {
  const p = item.payload;
  const audio = p.audio_tw ?? p.audio_cn ?? null;
  const ref = useRef<HTMLAudioElement | null>(null);

  return (
    <div>
      <div className="audiorow">
        <button
          className="playbig"
          onClick={() => ref.current?.play()}
          disabled={!audio}
          aria-label="Nghe"
        >
          ▶
        </button>
        {audio ? (
          <audio ref={ref} src={audio} preload="none" />
        ) : (
          <div>
            <div className="fallback">{p.fallback_pinyin}</div>
            <p className="fallbacknote">
              Chưa có file ghi âm — tạm hiện pinyin.
              <br />
              尚未錄音，暫時顯示拼音。
            </p>
          </div>
        )}
      </div>
      <OptionList
        options={p.options ?? []}
        value={value}
        onChange={onChange}
        locked={locked}
        correct={correct}
      />
    </div>
  );
}

/* ───────────────────────── sắp xếp thành câu ───────────────────── */
interface Tile {
  id: string;
  text: string;
  simp: string;
}

function WordOrder({ item, value, onChange, locked, correct }: Props) {
  const tiles: Tile[] = item.payload.tiles ?? [];
  const order: string[] = value?.order ?? [];
  const placed = order
    .map((id) => tiles.find((t) => t.id === id))
    .filter(Boolean) as Tile[];
  const bank = tiles.filter((t) => !order.includes(t.id));
  const dragFrom = useRef<number | null>(null);

  function put(id: string) {
    if (locked) return;
    onChange({ order: [...order, id] });
  }
  function take(id: string) {
    if (locked) return;
    onChange({ order: order.filter((x) => x !== id) });
  }
  function move(from: number, to: number) {
    if (locked || from === to) return;
    const next = [...order];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    onChange({ order: next });
  }

  const correctOrder: string[] | null = correct?.order ?? null;

  return (
    <div>
      {item.payload.hint_vi && (
        <p className="hint">“{item.payload.hint_vi}”</p>
      )}

      <div className={`slot${placed.length ? "" : " empty"}`}>
        {placed.length === 0 && (
          <span className="slothint">Kéo hoặc bấm từ bên dưới vào đây</span>
        )}
        {placed.map((t, i) => {
          const wrongHere =
            locked && correctOrder ? correctOrder[i] !== t.id : false;
          return (
            <button
              key={t.id}
              className={`tile${wrongHere ? " bad" : locked ? " good" : ""}`}
              draggable={!locked}
              onDragStart={() => (dragFrom.current = i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragFrom.current !== null) move(dragFrom.current, i);
                dragFrom.current = null;
              }}
              onClick={() => take(t.id)}
            >
              {t.text}
            </button>
          );
        })}
      </div>

      <div className="bank">
        {bank.map((t) => (
          <button
            key={t.id}
            className="tile ghosttile"
            draggable={!locked}
            onDragEnd={() => put(t.id)}
            onClick={() => put(t.id)}
          >
            {t.text}
          </button>
        ))}
        {bank.length === 0 && (
          <span className="slothint">Hết từ — kiểm tra lại thứ tự.</span>
        )}
      </div>

      {locked && correctOrder && (
        <p className="answerline">
          Trật tự đúng:{" "}
          <b>
            {correctOrder
              .map((id) => tiles.find((t) => t.id === id)?.text ?? "")
              .join("")}
          </b>
        </p>
      )}
    </div>
  );
}

/* ───────────────────────── viết chữ ────────────────────────────── */
function Writing({ item, value, onChange, locked }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawing = useRef(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    cv.width = rect.width * 2;
    cv.height = rect.height * 2;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.scale(2, 2);
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = getComputedStyle(document.body).color;
    ctxRef.current = ctx;

    // Đã nộp rồi thì vẽ lại nét bút đã lưu.
    const saved = value?.strokes as string | undefined;
    if (saved) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = saved;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pos(e: React.PointerEvent) {
    const r = e.currentTarget.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  }

  function commit() {
    const cv = canvasRef.current;
    if (!cv) return;
    // Ghi chú: bản production nên đẩy ảnh lên Supabase Storage thay vì
    // nhét data URL vào jsonb. Ở quy mô lớp học thì cách này chấp nhận được.
    // 正式版應改存 Supabase Storage，班級規模用 data URL 可接受。
    onChange({ strokes: cv.toDataURL("image/png") });
  }

  function clear() {
    const cv = canvasRef.current;
    const ctx = ctxRef.current;
    if (!cv || !ctx) return;
    ctx.clearRect(0, 0, cv.width, cv.height);
    setDirty(false);
    onChange({});
  }

  return (
    <div>
      <div className="writinghead">
        <div>
          <div className="hvhint" style={{ marginLeft: 0 }}>
            {item.payload.hanviet} · {item.payload.gloss_vi}
          </div>
        </div>
        {!locked && (
          <button className="btn ghost" onClick={clear} style={{ padding: "6px 12px" }}>
            Xóa
          </button>
        )}
      </div>

      <div className="mizi">
        <span className="guide">{item.payload.target}</span>
        <canvas
          ref={canvasRef}
          style={{ pointerEvents: locked ? "none" : "auto" }}
          onPointerDown={(e) => {
            if (locked) return;
            const ctx = ctxRef.current;
            if (!ctx) return;
            drawing.current = true;
            const [x, y] = pos(e);
            ctx.beginPath();
            ctx.moveTo(x, y);
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return;
            const ctx = ctxRef.current;
            if (!ctx) return;
            const [x, y] = pos(e);
            ctx.lineTo(x, y);
            ctx.stroke();
            setDirty(true);
          }}
          onPointerUp={() => {
            if (!drawing.current) return;
            drawing.current = false;
            commit();
          }}
        />
      </div>

      <p className="fallbacknote" style={{ marginTop: 10 }}>
        {locked
          ? "Nét bút đã nộp. Giáo viên sẽ chấm tay câu này."
          : dirty
            ? "Đã lưu nét bút. Viết lại bất cứ lúc nào."
            : "Viết bằng chuột hoặc ngón tay. Câu này giáo viên chấm tay."}
      </p>
    </div>
  );
}
