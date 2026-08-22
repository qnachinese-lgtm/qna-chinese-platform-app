"use client";

import { usePrefs } from "@/components/PrefsProvider";
import type { Phonetic, Script } from "@/lib/types";

const SCRIPTS: [Script, string][] = [
  ["trad", "繁體"],
  ["simp", "简体"],
];
const PHONS: [Phonetic, string][] = [
  ["pinyin", "Pinyin"],
  ["hanviet", "Hán-Việt"],
  ["zhuyin", "注音"],
  ["off", "Tắt"],
];

/** Hai công tắc xuyên suốt toàn trang / 貫穿全站的兩顆開關 */
export function Toolbar({ crumb }: { crumb: string }) {
  const { script, phonetic, showVi, setScript, setPhonetic, setShowVi } =
    usePrefs();

  return (
    <header className="topbar">
      <div className="crumb">{crumb}</div>
      <div className="spacer" />

      <span className="segcap">Chữ</span>
      <div className="seg">
        {SCRIPTS.map(([v, label]) => (
          <button
            key={v}
            aria-pressed={script === v}
            onClick={() => setScript(v)}
          >
            {label}
          </button>
        ))}
      </div>

      <span className="segcap">Chú âm</span>
      <div className="seg">
        {PHONS.map(([v, label]) => (
          <button
            key={v}
            aria-pressed={phonetic === v}
            onClick={() => setPhonetic(v)}
          >
            {label}
          </button>
        ))}
      </div>

      <span className="segcap">Dịch</span>
      <div className="seg">
        <button aria-pressed={showVi} onClick={() => setShowVi(true)}>
          Hiện
        </button>
        <button aria-pressed={!showVi} onClick={() => setShowVi(false)}>
          Ẩn
        </button>
      </div>
    </header>
  );
}
