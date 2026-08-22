-- ════════════════════════════════════════════════════════════════════
-- QNA Chinese — Bài tập tương tác / 互動作業系統
-- Chạy SAU schema.sql. / 在 schema.sql 之後執行（seed.sql 之前或之後都可以）。
--
-- Nguyên tắc thiết kế quan trọng nhất:
--   ĐỀ BÀI và ĐÁP ÁN nằm ở hai bảng khác nhau.
--   Học viên đọc được "assignment_items", KHÔNG đọc được "assignment_keys".
--   Việc chấm bài do hàm "grade_submission" (security definer) làm ở phía
--   máy chủ. Nghĩa là đáp án không bao giờ được gửi xuống trình duyệt.
--
--   題目與答案分開存兩張表：學生讀得到 items，讀不到 keys。
--   批改由 security definer 的 RPC 在伺服器端做，答案永遠不會下發到前端。
--   這不是「前端記得不要顯示答案」，是資料庫層根本不給。
-- ════════════════════════════════════════════════════════════════════

do $$ begin
  create type exercise_kind as enum (
    'mcq_meaning',      -- chọn nghĩa đúng          選詞義
    'cloze',            -- điền vào chỗ trống       克漏字
    'word_order',       -- sắp xếp thành câu        排序組句
    'hv_discriminate',  -- phân biệt từ Hán-Việt    漢越假朋友辨析
    'listening',        -- nghe và chọn             聽力
    'writing'           -- viết chữ trong ô mễ tự   米字格手寫
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type submission_status as enum ('in_progress', 'submitted', 'graded');
exception when duplicate_object then null; end $$;


-- ─── 1. assignments ───────────────────────────────────────────────
create table if not exists public.assignments (
  id          bigserial primary key,
  class_id    bigint not null references public.classes(id)  on delete cascade,
  lesson_id   bigint          references public.lessons(id)  on delete set null,
  title       text   not null,
  instructions_vi text,
  due_at      timestamptz,
  created_by  uuid   not null references public.profiles(id) on delete cascade,
  published   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists assignments_class_idx on public.assignments (class_id, due_at desc);

-- ─── 2. assignment_items — ĐỀ BÀI (học viên đọc được) ─────────────
create table if not exists public.assignment_items (
  id            bigserial primary key,
  assignment_id bigint not null references public.assignments(id) on delete cascade,
  seq           int    not null,
  kind          exercise_kind not null,
  prompt_vi     text   not null,
  payload       jsonb  not null default '{}'::jsonb,  -- KHÔNG chứa đáp án
  lexeme_id     bigint references public.lexemes(id) on delete set null,
  points        smallint not null default 1,
  auto_graded   boolean not null default true,        -- writing = false
  unique (assignment_id, seq)
);
create index if not exists assignment_items_a_idx on public.assignment_items (assignment_id, seq);

-- ─── 3. assignment_keys — ĐÁP ÁN (chỉ giáo viên đọc được) ─────────
create table if not exists public.assignment_keys (
  item_id      bigint primary key references public.assignment_items(id) on delete cascade,
  answer       jsonb not null,
  explain_vi   text,          -- giải thích hiện ra SAU khi nộp bài
  explain_zh   text
);

-- ─── 4. submissions ───────────────────────────────────────────────
create table if not exists public.submissions (
  id            bigserial primary key,
  assignment_id bigint not null references public.assignments(id) on delete cascade,
  student_id    uuid   not null references public.profiles(id)    on delete cascade,
  status        submission_status not null default 'in_progress',
  score         int,
  max_score     int,
  started_at    timestamptz not null default now(),
  submitted_at  timestamptz,
  unique (assignment_id, student_id)
);

create table if not exists public.submission_answers (
  id            bigserial primary key,
  submission_id bigint not null references public.submissions(id)       on delete cascade,
  item_id       bigint not null references public.assignment_items(id)  on delete cascade,
  response      jsonb  not null default '{}'::jsonb,
  is_correct    boolean,
  needs_review  boolean not null default false,   -- bài viết tay chờ giáo viên
  teacher_note  text,
  answered_at   timestamptz not null default now(),
  unique (submission_id, item_id)
);
create index if not exists submission_answers_sub_idx on public.submission_answers (submission_id);


-- ════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════════
alter table public.assignments        enable row level security;
alter table public.assignment_items   enable row level security;
alter table public.assignment_keys    enable row level security;
alter table public.submissions        enable row level security;
alter table public.submission_answers enable row level security;

-- Người dùng hiện tại có ở trong lớp này không?
create or replace function public.in_class(cid bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.enrollments e
                 where e.class_id = cid and e.student_id = auth.uid());
$$;

create or replace function public.owns_class(cid bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.classes c
                 where c.id = cid and c.teacher_id = auth.uid());
$$;

-- assignments: học viên trong lớp đọc được bài đã phát; giáo viên toàn quyền
drop policy if exists assignments_select on public.assignments;
create policy assignments_select on public.assignments for select
  using ((published and public.in_class(class_id)) or public.owns_class(class_id));

drop policy if exists assignments_write on public.assignments;
create policy assignments_write on public.assignments for all
  using (public.owns_class(class_id)) with check (public.owns_class(class_id));

-- items: đọc được nếu đọc được assignment cha
drop policy if exists assignment_items_select on public.assignment_items;
create policy assignment_items_select on public.assignment_items for select
  using (exists (select 1 from public.assignments a where a.id = assignment_id
                 and ((a.published and public.in_class(a.class_id)) or public.owns_class(a.class_id))));

drop policy if exists assignment_items_write on public.assignment_items;
create policy assignment_items_write on public.assignment_items for all
  using (exists (select 1 from public.assignments a
                 where a.id = assignment_id and public.owns_class(a.class_id)))
  with check (exists (select 1 from public.assignments a
                 where a.id = assignment_id and public.owns_class(a.class_id)));

-- keys: CHỈ giáo viên. Học viên không có bất kỳ policy select nào ⇒ không đọc được.
drop policy if exists assignment_keys_teacher on public.assignment_keys;
create policy assignment_keys_teacher on public.assignment_keys for all
  using (exists (select 1 from public.assignment_items i
                 join public.assignments a on a.id = i.assignment_id
                 where i.id = item_id and public.owns_class(a.class_id)))
  with check (exists (select 1 from public.assignment_items i
                 join public.assignments a on a.id = i.assignment_id
                 where i.id = item_id and public.owns_class(a.class_id)));

-- submissions: bản thân học viên + giáo viên của lớp
drop policy if exists submissions_rw on public.submissions;
create policy submissions_rw on public.submissions for all
  using (student_id = auth.uid()
         or exists (select 1 from public.assignments a
                    where a.id = assignment_id and public.owns_class(a.class_id)))
  with check (student_id = auth.uid());

drop policy if exists submission_answers_rw on public.submission_answers;
create policy submission_answers_rw on public.submission_answers for all
  using (exists (select 1 from public.submissions s where s.id = submission_id
                 and (s.student_id = auth.uid()
                      or exists (select 1 from public.assignments a
                                 where a.id = s.assignment_id and public.owns_class(a.class_id)))))
  with check (exists (select 1 from public.submissions s
                      where s.id = submission_id and s.student_id = auth.uid()));


-- ════════════════════════════════════════════════════════════════════
-- RPC 1: mở (hoặc lấy lại) bài làm / 開始作答
-- ════════════════════════════════════════════════════════════════════
create or replace function public.start_submission(a_id bigint)
returns bigint language plpgsql security definer set search_path = public as $$
declare sid bigint; cid bigint;
begin
  select class_id into cid from public.assignments where id = a_id and published;
  if cid is null then raise exception 'Bài tập không tồn tại / 作業不存在'; end if;
  if not public.in_class(cid) and not public.owns_class(cid) then
    raise exception 'Bạn không thuộc lớp này / 你不在這個班級';
  end if;

  insert into public.submissions (assignment_id, student_id)
  values (a_id, auth.uid())
  on conflict (assignment_id, student_id) do nothing;

  select id into sid from public.submissions
   where assignment_id = a_id and student_id = auth.uid();
  return sid;
end $$;


-- ════════════════════════════════════════════════════════════════════
-- RPC 2: nộp bài + chấm điểm + đẩy câu sai vào hàng đợi ôn tập
--        交卷、批改、錯題自動回流 SRS
--
-- Đây là chỗ đáp án được dùng tới, và nó chạy trên máy chủ.
-- 答案只在這裡被讀取，而這裡是伺服器端。
-- ════════════════════════════════════════════════════════════════════
create or replace function public.grade_submission(s_id bigint)
returns table (score int, max_score int, pending int)
language plpgsql security definer set search_path = public as $$
declare
  v_student uuid;
  v_score   int := 0;
  v_max     int := 0;
  v_pending int := 0;
  r         record;
  ok        boolean;
begin
  select student_id into v_student from public.submissions where id = s_id;
  if v_student is null or v_student <> auth.uid() then
    raise exception 'Không phải bài làm của bạn / 這不是你的作答';
  end if;

  for r in
    select i.id as item_id, i.kind, i.points, i.auto_graded, i.lexeme_id,
           k.answer, sa.response, sa.id as ans_id
      from public.assignment_items i
      join public.submissions s on s.id = s_id
      left join public.assignment_keys k on k.item_id = i.id
      left join public.submission_answers sa
             on sa.item_id = i.id and sa.submission_id = s_id
     where i.assignment_id = s.assignment_id
  loop
    v_max := v_max + r.points;

    -- Bài viết tay: không chấm tự động được, để giáo viên xem.
    if not r.auto_graded then
      v_pending := v_pending + 1;
      if r.ans_id is not null then
        update public.submission_answers
           set needs_review = true, is_correct = null
         where id = r.ans_id;
      end if;
      continue;
    end if;

    ok := false;
    if r.ans_id is not null and r.answer is not null then
      if r.kind = 'word_order' then
        ok := (r.response -> 'order') = (r.answer -> 'order');
      else
        ok := (r.response ->> 'choice') is not null
          and (r.response ->> 'choice') = (r.answer ->> 'correct');
      end if;
    end if;

    if r.ans_id is not null then
      update public.submission_answers set is_correct = ok where id = r.ans_id;
    end if;

    if ok then
      v_score := v_score + r.points;
    elsif r.lexeme_id is not null then
      -- SAI ⇒ từ đó vào hàng đợi ôn tập ngay hôm nay.
      -- 答錯的詞今天就進複習佇列，學生不用自己記。
      insert into public.srs_cards (user_id, lexeme_id, kind, due, stability)
      values (v_student, r.lexeme_id, 'recognize', current_date, 1.0)
      on conflict (user_id, lexeme_id, kind)
      do update set due = current_date,
                    stability = greatest(0.4, srs_cards.stability * 0.5);
    end if;
  end loop;

  update public.submissions
     set status = case when v_pending > 0 then 'submitted' else 'graded' end,
         score = v_score, max_score = v_max, submitted_at = now()
   where id = s_id;

  return query select v_score, v_max, v_pending;
end $$;


-- ════════════════════════════════════════════════════════════════════
-- RPC 3: xem lại bài đã nộp (kèm đáp án và giải thích)
--        看解析——只有交卷後才拿得到答案
-- ════════════════════════════════════════════════════════════════════
create or replace function public.submission_review(s_id bigint)
returns table (
  item_id bigint, seq int, kind exercise_kind, prompt_vi text,
  payload jsonb, response jsonb, is_correct boolean, needs_review boolean,
  answer jsonb, explain_vi text, explain_zh text
)
language plpgsql security definer set search_path = public as $$
declare v_student uuid; v_status submission_status; v_aid bigint;
begin
  select student_id, status, assignment_id
    into v_student, v_status, v_aid
    from public.submissions where id = s_id;

  if v_student is null then raise exception 'Không tìm thấy bài làm'; end if;

  -- Chủ nhân bài làm, hoặc giáo viên của lớp.
  if v_student <> auth.uid() then
    if not exists (select 1 from public.assignments a
                   where a.id = v_aid and public.owns_class(a.class_id)) then
      raise exception 'Không có quyền xem / 沒有權限';
    end if;
  elsif v_status = 'in_progress' then
    -- Chưa nộp thì không được xem đáp án.
    raise exception 'Chưa nộp bài / 尚未交卷，看不到答案';
  end if;

  return query
    select i.id, i.seq, i.kind, i.prompt_vi, i.payload,
           coalesce(sa.response, '{}'::jsonb), sa.is_correct,
           coalesce(sa.needs_review, false),
           k.answer, k.explain_vi, k.explain_zh
      from public.assignment_items i
      left join public.assignment_keys k on k.item_id = i.id
      left join public.submission_answers sa
             on sa.item_id = i.id and sa.submission_id = s_id
     where i.assignment_id = v_aid
     order by i.seq;
end $$;


-- ════════════════════════════════════════════════════════════════════
-- VIEW: tiến độ nộp bài của cả lớp / 全班繳交狀況
-- ════════════════════════════════════════════════════════════════════
create or replace view public.assignment_progress
with (security_invoker = true) as
select
  a.id            as assignment_id,
  a.class_id,
  a.title,
  a.due_at,
  p.id            as student_id,
  p.display_name,
  s.id            as submission_id,
  coalesce(s.status, 'in_progress') as status,
  s.score,
  s.max_score,
  s.submitted_at,
  (select count(*) from public.submission_answers sa
    where sa.submission_id = s.id and sa.needs_review) as pending_review
from public.assignments a
join public.enrollments e on e.class_id = a.class_id
join public.profiles    p on p.id = e.student_id
left join public.submissions s on s.assignment_id = a.id and s.student_id = p.id;


-- ════════════════════════════════════════════════════════════════════
-- RPC 4: giáo viên chấm câu viết tay / 老師批改手寫題
-- Cộng điểm vào bài làm và chuyển trạng thái sang 'graded' khi hết câu chờ.
-- ════════════════════════════════════════════════════════════════════
create or replace function public.grade_writing(
  ans_id bigint, ok boolean, note text default null
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_sub    bigint;
  v_item   bigint;
  v_points smallint;
  v_class  bigint;
  v_prev   boolean;
begin
  select sa.submission_id, sa.item_id, sa.is_correct, i.points, a.class_id
    into v_sub, v_item, v_prev, v_points, v_class
    from public.submission_answers sa
    join public.assignment_items i on i.id = sa.item_id
    join public.assignments      a on a.id = i.assignment_id
   where sa.id = ans_id;

  if v_sub is null then raise exception 'Không tìm thấy câu trả lời'; end if;
  if not public.owns_class(v_class) then
    raise exception 'Không có quyền chấm bài này / 沒有權限批改';
  end if;

  update public.submission_answers
     set is_correct = ok, needs_review = false, teacher_note = note
   where id = ans_id;

  -- Chỉ cộng điểm khi trước đó chưa được tính đúng.
  if ok and coalesce(v_prev, false) = false then
    update public.submissions set score = coalesce(score, 0) + v_points where id = v_sub;
  elsif not ok and coalesce(v_prev, false) = true then
    update public.submissions set score = greatest(0, coalesce(score, 0) - v_points) where id = v_sub;
  end if;

  update public.submissions s
     set status = 'graded'
   where s.id = v_sub
     and not exists (select 1 from public.submission_answers x
                     where x.submission_id = v_sub and x.needs_review);
end $$;
