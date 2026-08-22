"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Phonetic, Script } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

interface Prefs {
  script: Script;
  phonetic: Phonetic;
  showVi: boolean;
  setScript: (s: Script) => void;
  setPhonetic: (p: Phonetic) => void;
  setShowVi: (v: boolean) => void;
}

const Ctx = createContext<Prefs | null>(null);

/**
 * Tùy chọn hiển thị: phồn/giản, chú âm, bản dịch tiếng Việt.
 * Lưu vào profile để đổi máy vẫn giữ nguyên; localStorage chỉ là bộ nhớ đệm.
 * 顯示偏好存進 profile，換裝置也保留；localStorage 只是快取。
 */
export function PrefsProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: { script?: Script; phonetic?: Phonetic };
}) {
  const [script, setScriptState] = useState<Script>(initial?.script ?? "trad");
  const [phonetic, setPhoneticState] = useState<Phonetic>(
    initial?.phonetic ?? "pinyin"
  );
  const [showVi, setShowVi] = useState(true);

  useEffect(() => {
    try {
      const s = localStorage.getItem("qna.script") as Script | null;
      const p = localStorage.getItem("qna.phonetic") as Phonetic | null;
      if (s) setScriptState(s);
      if (p) setPhoneticState(p);
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

  function setScript(s: Script) {
    setScriptState(s);
    try {
      localStorage.setItem("qna.script", s);
    } catch {}
    void persist({ script_pref: s });
  }

  function setPhonetic(p: Phonetic) {
    setPhoneticState(p);
    try {
      localStorage.setItem("qna.phonetic", p);
    } catch {}
    void persist({ phonetic_pref: p });
  }

  return (
    <Ctx.Provider
      value={{ script, phonetic, showVi, setScript, setPhonetic, setShowVi }}
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
