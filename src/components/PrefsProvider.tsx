"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Phonetic, Script } from "@/lib/types";
import { translate, type UiLang } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

interface Prefs {
  script: Script;
  phonetic: Phonetic;
  showVi: boolean;
  uiLang: UiLang;
  setScript: (s: Script) => void;
  setPhonetic: (p: Phonetic) => void;
  setShowVi: (v: boolean) => void;
  setUiLang: (l: UiLang) => void;
  /** Dịch một khoá sang ngôn ngữ giao diện hiện tại / 依目前介面語言翻譯 */
  t: (key: string) => string;
}

const Ctx = createContext<Prefs | null>(null);

/**
 * Tuỳ chọn hiển thị: phồn/giản, chú âm, bản dịch, ngôn ngữ giao diện.
 * Lưu vào profile để đổi máy vẫn giữ; localStorage chỉ là bộ nhớ đệm.
 * 顯示偏好存進 profile，換裝置也保留；localStorage 只是快取。
 */
export function PrefsProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: { script?: Script; phonetic?: Phonetic; uiLang?: UiLang };
}) {
  const [script, setScriptState] = useState<Script>(initial?.script ?? "trad");
  const [phonetic, setPhoneticState] = useState<Phonetic>(
    initial?.phonetic ?? "pinyin"
  );
  const [uiLang, setUiLangState] = useState<UiLang>(initial?.uiLang ?? "vi");
  const [showVi, setShowVi] = useState(true);

  useEffect(() => {
    try {
      const s = localStorage.getItem("qna.script") as Script | null;
      const p = localStorage.getItem("qna.phonetic") as Phonetic | null;
      const l = localStorage.getItem("qna.uilang") as UiLang | null;
      if (s) setScriptState(s);
      if (p) setPhoneticState(p);
      if (l) setUiLangState(l);
    } catch {
      /* trình duyệt chặn storage — dùng mặc định */
    }
  }, []);

  async function persist(patch: Record<string, string>) {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) await supabase.from("profiles").update(patch).eq("id", user.id);
    } catch {
      /* chưa đăng nhập hoặc mất mạng — bỏ qua */
    }
  }

  function remember(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  }

  function setScript(s: Script) {
    setScriptState(s);
    remember("qna.script", s);
    void persist({ script_pref: s });
  }

  function setPhonetic(p: Phonetic) {
    setPhoneticState(p);
    remember("qna.phonetic", p);
    void persist({ phonetic_pref: p });
  }

  function setUiLang(l: UiLang) {
    setUiLangState(l);
    remember("qna.uilang", l);
    void persist({ ui_lang: l });
  }

  const t = (key: string) => translate(key, uiLang);

  return (
    <Ctx.Provider
      value={{
        script,
        phonetic,
        showVi,
        uiLang,
        setScript,
        setPhonetic,
        setShowVi,
        setUiLang,
        t,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function usePrefs() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePrefs phải dùng bên trong <PrefsProvider>");
  return v;
}
