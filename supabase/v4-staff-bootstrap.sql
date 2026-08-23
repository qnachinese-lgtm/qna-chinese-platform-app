-- ════════════════════════════════════════════════════════════════════
-- QNA Chinese v4 — Danh sách email nhân sự / 教職員 email 白名單
--
-- Vấn đề: không thể cấp quyền giáo viên cho một tài khoản chưa tồn tại.
-- Cách giải: ghi trước email vào bảng staff_emails. Ngay khi email đó
-- đăng ký, trigger handle_new_user sẽ tạo profile với đúng vai trò,
-- tạo luôn lớp QNA-2026A và gom các học viên chưa có lớp vào đó.
--
-- 問題：帳號還不存在，沒辦法先給老師權限。
-- 作法：把 email 先寫進白名單。那個 email 一註冊，觸發器就直接給角色、
-- 建好班級 QNA-2026A，並把還沒有班級的學生收進來。
--
-- Chạy SAU v2-placement-i18n.sql. Chạy lại nhiều lần cũng không sao.
-- 在 v2 之後執行，可重複執行。
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. Bảng email nhân sự / 白名單資料表 ─────────────────────────
create table if not exists public.staff_emails (
  email     text primary key,
  role      user_role not null default 'teacher',
  note      text,
  added_at  timestamptz not null default now()
);

alter table public.staff_emails enable row level security;

-- Chỉ nhân sự đọc/ghi được bảng này. Trigger chạy security definer nên
-- vẫn đọc được dù người đăng ký chưa có quyền gì.
-- 只有教職員讀得到；觸發器是 security definer，不受這條政策限制。
drop policy if exists staff_emails_staff on public.staff_emails;
create policy staff_emails_staff on public.staff_emails for all
  using (public.is_staff()) with check (public.is_staff());

insert into public.staff_emails (email, role, note) values
  ('qnachinese@gmail.com', 'admin', 'Quyên Huỳnh — chủ nền tảng / 站主')
on conflict (email) do update
  set role = excluded.role, note = excluded.note;


-- ─── 2. Trigger đăng ký: đọc白名單 rồi cấp vai trò ────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role  user_role;
  v_class bigint;
begin
  -- Tra白名單. Nếu bảng chưa tồn tại hay lỗi gì thì coi như học viên thường.
  -- 查白名單；查不到或出錯就當一般學生，絕不能讓註冊失敗。
  begin
    select s.role into v_role
      from public.staff_emails s
     where lower(s.email) = lower(new.email);
  exception when others then
    v_role := null;
  end;

  -- Phần BẮT BUỘC phải thành công: tạo profile. Không bọc exception ở đây.
  -- 這段一定要成功：建立 profile。
  -- Lưu ý: trong ON CONFLICT DO UPDATE phải viết "profiles.role",
  -- KHÔNG được viết "public.profiles.role" — Postgres sẽ báo lỗi.
  -- 注意：ON CONFLICT DO UPDATE 裡只能寫 profiles.role，不能加 public. 前綴。
  insert into public.profiles (id, display_name, native_lang, role, ui_lang)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'native_lang', 'vi'),
    coalesce(v_role, 'student'::user_role),
    -- giáo viên đọc tiếng Trung, học viên đọc tiếng Việt
    -- 老師預設中文介面，學生預設越南文
    case when v_role is null then 'vi' else 'zh' end
  )
  on conflict (id) do update
    set role    = coalesce(v_role, profiles.role),
        ui_lang = case when v_role is null then profiles.ui_lang else 'zh' end;

  -- Nhân sự đầu tiên: tạo sẵn lớp mặc định và gom học viên chưa có lớp.
  -- Bọc exception: hỏng chỗ này cũng KHÔNG được chặn việc đăng ký.
  -- 第一個教職員：順手建好預設班級，把還沒分班的學生收進來。
  -- 這段包了例外處理：就算出錯也不能擋住註冊。
  if v_role in ('teacher', 'admin') then
    begin
      insert into public.classes (name, code, teacher_id)
      values ('QNA 2026A', 'QNA-2026A', new.id)
      on conflict (code) do nothing
      returning id into v_class;

      if v_class is null then
        select id into v_class from public.classes where code = 'QNA-2026A';
      end if;

      if v_class is not null then
        insert into public.enrollments (class_id, student_id)
        select v_class, p.id
          from public.profiles p
         where p.role = 'student'
           and not exists (select 1 from public.enrollments e where e.student_id = p.id)
        on conflict do nothing;
      end if;
    exception when others then
      raise warning 'staff bootstrap skipped: %', sqlerrm;
    end;
  end if;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ─── 3. Nếu email trong白名單 ĐÃ đăng ký rồi thì nâng quyền ngay ──
--     若白名單上的 email 已經註冊過，這裡直接補上權限。
update public.profiles p
   set role    = s.role,
       ui_lang = 'zh'
  from public.staff_emails s
  join auth.users u on lower(u.email) = lower(s.email)
 where p.id = u.id
   and p.role is distinct from s.role;
