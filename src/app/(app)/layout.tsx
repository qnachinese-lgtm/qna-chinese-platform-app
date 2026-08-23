import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrefsProvider } from "@/components/PrefsProvider";
import { Rail } from "@/components/Rail";
import type { UiLang } from "@/lib/i18n";
import type { Phonetic, Script } from "@/lib/types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, script_pref, phonetic_pref, ui_lang")
    .eq("id", user.id)
    .single();

  const isTeacher =
    profile?.role === "teacher" ||
    profile?.role === "admin" ||
    profile?.role === "editor";

  return (
    <PrefsProvider
      initial={{
        script: (profile?.script_pref as Script) ?? "trad",
        phonetic: (profile?.phonetic_pref as Phonetic) ?? "pinyin",
        // Giáo viên mặc định giao diện tiếng Trung, học viên tiếng Việt.
        // 老師預設中文介面，學生預設越南文。
        uiLang: (profile?.ui_lang as UiLang) ?? (isTeacher ? "zh" : "vi"),
      }}
    >
      <div className="shell">
        <Rail isTeacher={isTeacher} />
        <div className="main">{children}</div>
      </div>
    </PrefsProvider>
  );
}
