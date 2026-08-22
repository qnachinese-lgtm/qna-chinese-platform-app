-- ════════════════════════════════════════════════════════════════════
-- QNA Chinese — Lược đồ cơ sở dữ liệu / 資料庫綱要
-- Chạy toàn bộ file này trong Supabase → SQL Editor.
-- 在 Supabase 的 SQL Editor 貼上整份執行。
-- ════════════════════════════════════════════════════════════════════

-- ─── 0. Kiểu dữ liệu / 自訂型別 ────────────────────────────────────
do $$ begin
  create type user_role as enum ('student', 'teacher', 'editor', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type card_kind as enum ('recognize', 'write');  -- 識 / 寫，兩張獨立卡
exception when duplicate_object then null; end $$;

do $$ begin
  create type content_status as enum ('draft', 'in_review', 'published');
exception when duplicate_object then null; end $$;


-- ─── 1. profiles ──────────────────────────────────────────────────
-- Mỗi người dùng một dòng. Tạo tự động khi đăng ký (trigger ở cuối file).
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  role          user_role not null default 'student',
  native_lang   text not null default 'vi',      -- vi | zh | en
  script_pref   text not null default 'trad',    -- trad | simp
  phonetic_pref text not null default 'pinyin',  -- pinyin | zhuyin | hanviet | off
  target_exam   text,                            -- hsk | tocfl | none
  current_level int  not null default 1,
  streak_days   int  not null default 0,
  last_active   date,
  created_at    timestamptz not null default now()
);

-- ─── 2. lexemes — bảng lõi / 核心詞條表 ───────────────────────────
-- Tất cả mọi thứ khác đều tham chiếu tới bảng này.
create table if not exists public.lexemes (
  id           bigserial primary key,
  trad         text not null,
  simp         text not null,
  pinyin       text[] not null,          -- ['guó','jì']  逐字
  zhuyin       text[] not null,          -- ['ㄍㄨㄛˊ','ㄐㄧˋ']
  hanviet      text[] not null,          -- ['quốc','tế']  ← 核心差異欄位
  hv_class     smallint not null default 0
                 check (hv_class between 0 and 3),
                 -- 0 = không phải từ Hán-Việt / 非漢越詞
                 -- 1 = đồng hình đồng nghĩa  / 同形同義（可直接遷移）
                 -- 2 = cùng gốc, khác cách dùng / 同源但用法有差
                 -- 3 = bạn giả / 假朋友（必須拆解）
  hv_vi_word   text,                     -- từ tiếng Việt thực sự tương ứng
  hv_warning   text,                     -- bắt buộc khi hv_class in (2,3)
  gloss_vi     text not null,
  gloss_en     text,
  pos          text,
  hsk_level    smallint,                 -- 1..7  (7 = HSK 7–9)
  tocfl_level  text,                     -- 入門級 / 基礎級 / 進階級 …
  cefr         text,
  audio_tw     text,
  audio_cn     text,
  ambiguous    boolean not null default false,  -- 繁簡一對多，須人工鎖定
  created_at   timestamptz not null default now(),
  constraint hv_warning_required
    check (hv_class not in (2,3) or hv_warning is not null)
);
create index if not exists lexemes_trad_idx  on public.lexemes (trad);
create index if not exists lexemes_simp_idx  on public.lexemes (simp);
create index if not exists lexemes_hv_idx    on public.lexemes (hv_class);
create index if not exists lexemes_hsk_idx   on public.lexemes (hsk_level);

-- ─── 3. lessons + tokens ──────────────────────────────────────────
create table if not exists public.lessons (
  id          bigserial primary key,
  slug        text unique not null,
  title_vi    text not null,
  title_trad  text not null,
  title_simp  text not null,
  level       smallint not null,          -- bậc 1..6, 7..9 = văn ngôn W1..W3
  hsk_level   smallint,
  tocfl_level text,
  summary_vi  text,
  status      content_status not null default 'draft',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- Một dòng = một token trong hội thoại (từ hoặc dấu câu).
create table if not exists public.lesson_tokens (
  id         bigserial primary key,
  lesson_id  bigint not null references public.lessons(id) on delete cascade,
  line_no    int    not null,
  seq        int    not null,
  speaker    text,
  line_vi    text,                        -- bản dịch tiếng Việt của cả dòng
  lexeme_id  bigint references public.lexemes(id),
  punctuation text,                       -- nếu là dấu câu thì điền ở đây
  unique (lesson_id, line_no, seq)
);
create index if not exists lesson_tokens_lesson_idx on public.lesson_tokens (lesson_id, line_no, seq);

-- ─── 4. articles — đọc hiểu phân cấp ──────────────────────────────
create table if not exists public.articles (
  id          bigserial primary key,
  slug        text unique not null,
  title_vi    text not null,
  title_trad  text not null,
  title_simp  text not null,
  body_trad   text not null,
  body_simp   text not null,
  level       smallint not null,
  word_count  int,
  topic       text,
  status      content_status not null default 'draft',
  created_at  timestamptz not null default now()
);

-- ─── 5. classes / enrollments ─────────────────────────────────────
create table if not exists public.classes (
  id         bigserial primary key,
  name       text not null,
  code       text unique not null,        -- mã lớp học, vd. QNA-2026A
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  class_id   bigint not null references public.classes(id) on delete cascade,
  student_id uuid   not null references public.profiles(id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (class_id, student_id)
);

-- ─── 6. progress ──────────────────────────────────────────────────
create table if not exists public.progress (
  user_id      uuid   not null references public.profiles(id) on delete cascade,
  lesson_id    bigint not null references public.lessons(id) on delete cascade,
  percent      smallint not null default 0 check (percent between 0 and 100),
  seconds_spent int   not null default 0,
  quiz_score   smallint,
  completed_at timestamptz,
  updated_at   timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- ─── 7. srs_cards + review_log ────────────────────────────────────
create table if not exists public.srs_cards (
  id          bigserial primary key,
  user_id     uuid   not null references public.profiles(id) on delete cascade,
  lexeme_id   bigint not null references public.lexemes(id) on delete cascade,
  kind        card_kind not null default 'recognize',
  due         date   not null default current_date,
  stability   real   not null default 1.0,
  difficulty  real   not null default 5.0,
  reps        int    not null default 0,
  lapses      int    not null default 0,
  last_review date,
  unique (user_id, lexeme_id, kind)
);
create index if not exists srs_due_idx on public.srs_cards (user_id, due);

create table if not exists public.review_log (
  id         bigserial primary key,
  user_id    uuid   not null references public.profiles(id) on delete cascade,
  card_id    bigint not null references public.srs_cards(id) on delete cascade,
  rating     smallint not null check (rating between 1 and 4), -- 1 again … 4 easy
  elapsed_ms int,
  reviewed_at timestamptz not null default now()
);
create index if not exists review_log_user_idx on public.review_log (user_id, reviewed_at desc);


-- ════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- Quy tắc viết ở tầng cơ sở dữ liệu, không phải ở frontend.
-- 規則寫在資料庫層，不是前端——前端被繞過也拿不到別人的資料。
-- ════════════════════════════════════════════════════════════════════

alter table public.profiles      enable row level security;
alter table public.lexemes       enable row level security;
alter table public.lessons       enable row level security;
alter table public.lesson_tokens enable row level security;
alter table public.articles      enable row level security;
alter table public.classes       enable row level security;
alter table public.enrollments   enable row level security;
alter table public.progress      enable row level security;
alter table public.srs_cards     enable row level security;
alter table public.review_log    enable row level security;

-- Hàm phụ trợ: người dùng hiện tại có phải là biên tập viên / quản trị?
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('editor','admin')
  );
$$;

-- Giáo viên của lớp mà học viên này đang học?
create or replace function public.teaches_student(student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.enrollments e
    join public.classes c on c.id = e.class_id
    where e.student_id = student and c.teacher_id = auth.uid()
  );
$$;

-- profiles: bản thân đọc/ghi; giáo viên đọc học viên của mình
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.teaches_student(id) or public.is_staff());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- Nội dung: ai đã đăng nhập đều đọc được bản đã xuất bản
drop policy if exists lexemes_select on public.lexemes;
create policy lexemes_select on public.lexemes for select
  to authenticated using (true);

drop policy if exists lexemes_write on public.lexemes;
create policy lexemes_write on public.lexemes for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists lessons_select on public.lessons;
create policy lessons_select on public.lessons for select
  to authenticated using (status = 'published' or public.is_staff());

drop policy if exists lessons_write on public.lessons;
create policy lessons_write on public.lessons for all
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists lesson_tokens_select on public.lesson_tokens;
create policy lesson_tokens_select on public.lesson_tokens for select
  to authenticated using (
    exists (select 1 from public.lessons l
            where l.id = lesson_id and (l.status = 'published' or public.is_staff()))
  );

drop policy if exists articles_select on public.articles;
create policy articles_select on public.articles for select
  to authenticated using (status = 'published' or public.is_staff());

-- Lớp học
drop policy if exists classes_select on public.classes;
create policy classes_select on public.classes for select
  using (teacher_id = auth.uid()
         or exists (select 1 from public.enrollments e
                    where e.class_id = id and e.student_id = auth.uid()));

drop policy if exists classes_write on public.classes;
create policy classes_write on public.classes for all
  using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());

drop policy if exists enrollments_select on public.enrollments;
create policy enrollments_select on public.enrollments for select
  using (student_id = auth.uid()
         or exists (select 1 from public.classes c
                    where c.id = class_id and c.teacher_id = auth.uid()));

drop policy if exists enrollments_insert on public.enrollments;
create policy enrollments_insert on public.enrollments for insert
  with check (student_id = auth.uid());

-- Dữ liệu cá nhân: CHỈ bản thân (giáo viên đọc được tiến độ học viên mình dạy)
drop policy if exists progress_own on public.progress;
create policy progress_own on public.progress for all
  using (user_id = auth.uid() or public.teaches_student(user_id))
  with check (user_id = auth.uid());

drop policy if exists srs_own on public.srs_cards;
create policy srs_own on public.srs_cards for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists review_log_own on public.review_log;
create policy review_log_own on public.review_log for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());


-- ════════════════════════════════════════════════════════════════════
-- TRIGGER: tạo profile tự động khi có người đăng ký
-- 有人註冊時自動建立 profile
-- ════════════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, native_lang)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'native_lang', 'vi')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ════════════════════════════════════════════════════════════════════
-- RPC: vào lớp bằng mã lớp / 用班級代碼入班
-- ════════════════════════════════════════════════════════════════════
create or replace function public.join_class(class_code text)
returns bigint language plpgsql security definer set search_path = public as $$
declare cid bigint;
begin
  select id into cid from public.classes where upper(code) = upper(class_code);
  if cid is null then
    raise exception 'Mã lớp không tồn tại / 班級代碼不存在: %', class_code;
  end if;
  insert into public.enrollments (class_id, student_id)
  values (cid, auth.uid())
  on conflict do nothing;
  return cid;
end $$;

-- ════════════════════════════════════════════════════════════════════
-- VIEW: bảng điều khiển của giáo viên / 老師儀表板
-- ════════════════════════════════════════════════════════════════════
create or replace view public.class_roster
with (security_invoker = true) as
select
  c.id            as class_id,
  c.code          as class_code,
  p.id            as student_id,
  p.display_name,
  p.current_level,
  p.streak_days,
  p.last_active,
  (select count(*) from public.progress pr
     where pr.user_id = p.id and pr.completed_at is not null) as lessons_done,
  (select count(*) from public.srs_cards s
     where s.user_id = p.id and s.due <= current_date)        as cards_due
from public.classes c
join public.enrollments e on e.class_id = c.id
join public.profiles    p on p.id = e.student_id;
