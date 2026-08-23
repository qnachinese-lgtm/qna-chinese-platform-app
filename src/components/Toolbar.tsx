"use client";

import { usePrefs } from "@/components/PrefsProvider";
import type { UiLang } from "@/lib/i18n";
import type { Phonetic, Script } from "@/lib/types";

const SCRIPTS: [Script, string][] = [
  ["trad", "繁體"],
  ["simp", "简体"],
];
const PHONS: [Phonetic, string][] = [
  ["pinyin", "Pinyin"],
  ["hanviet", "Hán-Việt"],
  ["zhuyin", "注音"],
  ["off", "—"],
];
const LANGS: [UiLang, string][] = [
  ["vi", "VI"],
  ["zh", "中"],
];

/** Các công tắc xuyên suốt toàn trang / 貫穿全站的顯示開關 */
export function Toolbar({ crumb }: { crumb: string }) {
  const {
    script,
    phonetic,
    showVi,
    uiLang,
    setScript,
    setPhonetic,
    setShowVi,
    setUiLang,
    t,
  } = usePrefs();

  return (
    <header className="topbar">
      <div className="crumb">{crumb}</div>
      <div className="spacer" />

      <span className="segcap">{t("bar.uilang")}</span>
      <div className="seg">
        {LANGS.map(([v, label]) => (
          <button key={v} aria-pressed={uiLang === v} onClick={() => setUiLang(v)}>
            {label}
          </button>
        ))}
      </div>

      <span className="segcap">{t("bar.script")}</span>
      <div className="seg">
        {SCRIPTS.map(([v, label]) => (
          <button key={v} aria-pressed={script === v} onClick={() => setScript(v)}>
            {label}
          </button>
        ))}
      </div>

      <span className="segcap">{t("bar.phonetic")}</span>
      <div className="seg">
        {PHONS.map(([v, label]) => (
          <button
            key={v}
            aria-pressed={phonetic === v}
            onClick={() => setPhonetic(v)}
            title={v === "off" ? t("bar.off") : label}
          >
            {label}
          </button>
        ))}
      </div>

      <span className="segcap">{t("bar.translation")}</span>
      <div className="seg">
        <button aria-pressed={showVi} onClick={() => setShowVi(true)}>
          {t("bar.show")}
        </button>
        <button aria-pressed={!showVi} onClick={() => setShowVi(false)}>
          {t("bar.hide")}
        </button>
      </div>
    </header>
  );
}
