-- ════════════════════════════════════════════════════════════════════
-- QNA Chinese v2 — Kiểm tra xếp lớp TOCFL + đa ngôn ngữ giao diện
--                  TOCFL 分級測驗 + 介面語言切換 + 內容分發
--
-- Chạy SAU schema.sql / exercises.sql / seed.sql.
-- 在前三個 SQL 檔之後執行。可重複執行，不會破壞既有資料。
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. Cột mới trên profiles ─────────────────────────────────────
alter table public.profiles add column if not exists ui_lang      text not null default 'vi';
alter table public.profiles add column if not exists tocfl_level  text;
alter table public.profiles add column if not exists placed_at    timestamptz;
-- Ai quyết định cấp độ này? default | test | teacher
-- 這個等級是誰定的？系統預設／測驗結果／老師手動
alter table public.profiles add column if not exists level_source text not null default 'default';

-- Lớp có khoá học viên vào đúng bài được giao không?
-- 班級是否鎖成「只能上老師指派的課」
alter table public.classes  add column if not exists lock_to_assigned boolean not null default false;


-- ─── 2. Ngân hàng câu hỏi xếp lớp ─────────────────────────────────
do $$ begin
  create type placement_kind as enum ('word_meaning', 'cloze', 'sentence');
exception when duplicate_object then null; end $$;

create table if not exists public.placement_questions (
  id          bigserial primary key,
  band        smallint not null,          -- 0 準備級 · 1 入門級 · 2 基礎級 · 3 進階級
  tocfl_band  text     not null,
  seq         int      not null,
  kind        placement_kind not null,
  prompt_vi   text     not null,
  prompt_zh   text     not null,
  stem_trad   text,                       -- phần chữ Hán hiển thị lớn (nếu có)
  stem_simp   text,
  options_vi  text[]   not null,
  correct     smallint not null,          -- chỉ số 0-based trong options_vi
  explain_vi  text,
  explain_zh  text,
  active      boolean  not null default true,
  unique (band, seq)
);

create table if not exists public.placement_attempts (
  id            bigserial primary key,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  raw_score     int,
  max_score     int,
  level_result  smallint,
  tocfl_result  text,
  band_scores   jsonb                     -- {"0":6,"1":5,"2":3,"3":1}
);
create index if not exists placement_attempts_user_idx
  on public.placement_attempts (user_id, started_at desc);

create table if not exists public.placement_answers (
  attempt_id  bigint   not null references public.placement_attempts(id) on delete cascade,
  question_id bigint   not null references public.placement_questions(id) on delete cascade,
  choice      smallint not null,
  primary key (attempt_id, question_id)
);


-- ─── 3. RLS ───────────────────────────────────────────────────────
alter table public.placement_questions enable row level security;
alter table public.placement_attempts  enable row level security;
alter table public.placement_answers   enable row level security;

-- Đề thi: học viên đọc được ĐỀ nhưng KHÔNG đọc được cột correct.
-- Vì RLS là theo dòng chứ không theo cột, ta dựng một view chỉ lộ phần đề.
-- RLS 是列層級不是欄層級，所以另開一個 view 只露出題目、不露答案。
drop policy if exists placement_questions_staff on public.placement_questions;
create policy placement_questions_staff on public.placement_questions for all
  using (public.is_staff()) with check (public.is_staff());

create or replace view public.placement_paper
with (security_invoker = false) as
select id, band, tocfl_band, seq, kind, prompt_vi, prompt_zh,
       stem_trad, stem_simp, options_vi
from public.placement_questions
where active;

grant select on public.placement_paper to authenticated;

drop policy if exists placement_attempts_own on public.placement_attempts;
create policy placement_attempts_own on public.placement_attempts for all
  using (user_id = auth.uid() or public.teaches_student(user_id))
  with check (user_id = auth.uid());

drop policy if exists placement_answers_own on public.placement_answers;
create policy placement_answers_own on public.placement_answers for all
  using (exists (select 1 from public.placement_attempts a
                 where a.id = attempt_id
                   and (a.user_id = auth.uid() or public.teaches_student(a.user_id))))
  with check (exists (select 1 from public.placement_attempts a
                      where a.id = attempt_id and a.user_id = auth.uid()));


-- ─── 4. RPC: bắt đầu / chấm bài xếp lớp ───────────────────────────
create or replace function public.start_placement()
returns bigint language plpgsql security definer set search_path = public as $$
declare aid bigint;
begin
  insert into public.placement_attempts (user_id) values (auth.uid())
  returning id into aid;
  return aid;
end $$;

/*
  Quy tắc xếp lớp / 定級規則
  ---------------------------------------------------------------
  Đề gồm 4 nhóm (band), mỗi nhóm 6 câu, xếp từ dễ đến khó.
  Duyệt từ nhóm thấp lên: còn đạt >= 4/6 thì lên nhóm tiếp theo;
  gặp nhóm đầu tiên KHÔNG đạt thì dừng, cấp độ = nhóm cuối cùng đã đạt.

  由低到高逐組判定：該組答對 >= 4/6 就繼續往上，遇到第一個沒過的就停，
  等級 = 最後一個通過的組別。全部沒過 = 準備級之前，仍給準備級。
*/
create or replace function public.grade_placement(a_id bigint)
returns table (raw_score int, max_score int, level_result smallint, tocfl_result text, band_scores jsonb)
language plpgsql security definer set search_path = public as $$
declare
  v_user   uuid;
  v_scores jsonb := '{}'::jsonb;
  v_raw    int := 0;
  v_max    int := 0;
  v_level  smallint := 0;
  v_tocfl  text;
  b        smallint;
  hit      int;
  tot      int;
  passed   boolean := true;
begin
  select user_id into v_user from public.placement_attempts where id = a_id;
  if v_user is null or v_user <> auth.uid() then
    raise exception 'Khong phai bai thi cua ban / 這不是你的測驗';
  end if;

  for b in 0..3 loop
    select count(*) filter (where pa.choice = q.correct), count(*)
      into hit, tot
      from public.placement_questions q
      left join public.placement_answers pa
             on pa.question_id = q.id and pa.attempt_id = a_id
     where q.band = b and q.active;

    hit := coalesce(hit, 0);
    tot := coalesce(tot, 0);
    v_raw := v_raw + hit;
    v_max := v_max + tot;
    v_scores := v_scores || jsonb_build_object(b::text, hit);

    -- chỉ nâng cấp khi các nhóm trước đó đều đã đạt
    if passed and tot > 0 and hit * 3 >= tot * 2 then   -- >= 2/3 số câu
      v_level := b;
    elsif tot > 0 then
      passed := false;
    end if;
  end loop;

  v_tocfl := case v_level
               when 0 then '準備級'
               when 1 then '入門級'
               when 2 then '基礎級'
               else        '進階級'
             end;

  update public.placement_attempts
     set finished_at = now(), raw_score = v_raw, max_score = v_max,
         level_result = v_level, tocfl_result = v_tocfl, band_scores = v_scores
   where id = a_id;

  -- Kết quả test KHÔNG ghi đè cấp độ do giáo viên đặt bằng tay.
  -- 老師手動設定的等級，測驗結果不會覆蓋掉。
  update public.profiles
     set current_level = greatest(1, v_level),
         tocfl_level   = v_tocfl,
         placed_at     = now(),
         level_source  = 'test'
   where id = v_user and level_source <> 'teacher';

  return query select v_raw, v_max, v_level, v_tocfl, v_scores;
end $$;


-- ─── 5. RPC: giáo viên chỉnh cấp độ học viên ──────────────────────
create or replace function public.teacher_set_level(student uuid, new_level int, new_tocfl text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.teaches_student(student) then
    raise exception 'Khong phai hoc vien cua ban / 這不是你的學生';
  end if;
  if new_level < 1 or new_level > 9 then
    raise exception 'Cap do phai tu 1 den 9';
  end if;
  update public.profiles
     set current_level = new_level,
         tocfl_level   = coalesce(new_tocfl, tocfl_level),
         level_source  = 'teacher'
   where id = student;
end $$;


-- ════════════════════════════════════════════════════════════════════
-- 6. Ngân hàng đề: 24 câu, 4 nhóm × 6 câu
--    24 題題庫，四組各 6 題，由易到難
-- ════════════════════════════════════════════════════════════════════
delete from public.placement_questions;

insert into public.placement_questions
  (band, tocfl_band, seq, kind, prompt_vi, prompt_zh, stem_trad, stem_simp, options_vi, correct, explain_vi, explain_zh) values

-- ── Nhóm 0 · 準備級 (Pre-A1) ──────────────────────────────────────
(0,'準備級',1,'word_meaning','「你好」nghĩa là gì?','「你好」是什麼意思？','你好','你好',
 '{"Xin chào","Tạm biệt","Cảm ơn","Xin lỗi"}',0,
 'Ni hao = xin chào, câu chào cơ bản nhất.','最基本的招呼語。'),
(0,'準備級',2,'word_meaning','「謝謝」nghĩa là gì?','「謝謝」是什麼意思？','謝謝','谢谢',
 '{"Xin chào","Cảm ơn","Không có gì","Xin lỗi"}',1,
 'Xie xie = cảm ơn.','道謝用語。'),
(0,'準備級',3,'word_meaning','Chữ「三」là số mấy?','「三」是哪個數字？','三','三',
 '{"2","3","5","8"}',1,
 'Ba nét ngang = số 3.','三橫即為 3。'),
(0,'準備級',4,'sentence','「我是學生。」nghĩa là gì?','「我是學生。」是什麼意思？','我是學生。','我是学生。',
 '{"Tôi là học sinh","Tôi là giáo viên","Anh ấy là học sinh","Tôi đi học"}',0,
 'Wo = tôi, shi = là, xue sheng = học sinh (âm Hán-Việt: học sinh).','學生的漢越音就是 học sinh，同形同義。'),
(0,'準備級',5,'word_meaning','Chữ nào đọc là "shuǐ" (nước)?','哪個字唸 shuǐ（水）？',null,null,
 '{"木","水","火","土"}',1,
 '水 = nước, âm Hán-Việt là "thuỷ".','水，漢越音 thuỷ。'),
(0,'準備級',6,'word_meaning','「再見」dùng khi nào?','「再見」什麼時候用？','再見','再见',
 '{"Khi gặp mặt","Khi chia tay","Khi cảm ơn","Khi xin lỗi"}',1,
 'Zai jian = tạm biệt.','道別用語。'),

-- ── Nhóm 1 · 入門級 (A1) ──────────────────────────────────────────
(1,'入門級',1,'sentence','「這是什麼？」nghĩa là gì?','「這是什麼？」是什麼意思？','這是什麼？','这是什么？',
 '{"Đây là cái gì?","Kia là ai?","Cái này bao nhiêu tiền?","Bạn ở đâu?"}',0,
 'Zhe = đây, shen me = cái gì.','最常用的疑問句。'),
(1,'入門級',2,'sentence','「多少錢？」dùng để hỏi gì?','「多少錢？」是問什麼？','多少錢？','多少钱？',
 '{"Mấy giờ","Bao nhiêu tiền","Ở đâu","Tại sao"}',1,
 'Duo shao qian = bao nhiêu tiền.','問價格。'),
(1,'入門級',3,'cloze','Chọn từ đúng: 我 ___ 越南人。','選出正確的字：我 ___ 越南人。','我 ___ 越南人。','我 ___ 越南人。',
 '{"有","是","在","很"}',1,
 '是 (shi) = là. Dùng để nối hai danh từ.','判斷句用「是」。'),
(1,'入門級',4,'sentence','「他有兩個妹妹。」nghĩa là gì?','「他有兩個妹妹。」是什麼意思？','他有兩個妹妹。','他有两个妹妹。',
 '{"Anh ấy có hai chị gái","Anh ấy có hai em gái","Anh ấy có hai em trai","Anh ấy có hai người bạn"}',1,
 '妹妹 = em gái. 姐姐 mới là chị gái.','妹妹是 em gái，姊姊才是 chị gái。'),
(1,'入門級',5,'sentence','「現在幾點？」hỏi về điều gì?','「現在幾點？」在問什麼？','現在幾點？','现在几点？',
 '{"Hôm nay thứ mấy","Bây giờ mấy giờ","Bao nhiêu tuổi","Bao nhiêu tiền"}',1,
 '幾點 = mấy giờ.','問時間。'),
(1,'入門級',6,'sentence','「請問，廁所在哪裡？」người nói muốn gì?','「請問，廁所在哪裡？」說話者想做什麼？','請問，廁所在哪裡？','请问，厕所在哪里？',
 '{"Hỏi nhà vệ sinh ở đâu","Hỏi giá tiền","Xin phép ra ngoài","Hỏi tên"}',0,
 '廁所 = nhà vệ sinh, 在哪裡 = ở đâu.','問廁所位置。'),

-- ── Nhóm 2 · 基礎級 (A2) ──────────────────────────────────────────
(2,'基礎級',1,'cloze','Chọn từ đúng: 我昨天 ___ 了一件衣服。','選出正確的字：我昨天 ___ 了一件衣服。','我昨天 ___ 了一件衣服。','我昨天 ___ 了一件衣服。',
 '{"買","賣","穿","洗"}',0,
 '買 (mai, thanh 3) = mua. 賣 (mai, thanh 4) = bán — hai chữ rất dễ nhầm.','買（三聲）是買進，賣（四聲）是賣出，聲調不同。'),
(2,'基礎級',2,'sentence','「他比我高。」nghĩa là gì?','「他比我高。」是什麼意思？','他比我高。','他比我高。',
 '{"Tôi cao hơn anh ấy","Anh ấy cao hơn tôi","Hai người cao bằng nhau","Anh ấy thấp hơn tôi"}',1,
 'Cấu trúc A 比 B + tính từ = A hơn B.','「A 比 B 高」＝ A 比較高。'),
(2,'基礎級',3,'sentence','Ở quán ăn Đài Loan,「內用還是外帶？」nghĩa là gì?','在台灣的小吃店，「內用還是外帶？」是什麼意思？','內用還是外帶？','内用还是外带？',
 '{"Ăn ở đây hay mang đi","Ăn món gì","Bao nhiêu tiền","Đợi bao lâu"}',0,
 '內用 = ăn tại chỗ, 外帶 = mang đi. Đây là cách nói của Đài Loan.','台灣用「內用／外帶」，大陸說「堂食／打包」。'),
(2,'基礎級',4,'cloze','Chọn từ đúng: 我 ___ 過日本。','選出正確的字：我 ___ 過日本。','我 ___ 過日本。','我 ___ 过日本。',
 '{"到","去","走","來"}',1,
 '去過 = đã từng đi. 過 chỉ kinh nghiệm đã trải qua.','「去過」表經驗，「過」是經驗助詞。'),
(2,'基礎級',5,'sentence','「雖然很累，但是很開心。」nghĩa là gì?','「雖然很累，但是很開心。」是什麼意思？','雖然很累，但是很開心。','虽然很累，但是很开心。',
 '{"Vì mệt nên không vui","Tuy mệt nhưng rất vui","Vừa mệt vừa buồn","Không mệt cũng không vui"}',1,
 'Cặp 雖然…但是… = tuy… nhưng…','「雖然…但是…」轉折句型。'),
(2,'基礎級',6,'sentence','「這附近有沒有捷運站？」người nói đang hỏi gì?','「這附近有沒有捷運站？」在問什麼？','這附近有沒有捷運站？','这附近有没有捷运站？',
 '{"Gần đây có ga tàu điện ngầm không","Đi taxi mất bao lâu","Trạm xe buýt ở đâu","Đây là đường gì"}',0,
 '捷運 là cách gọi tàu điện ngầm ở Đài Loan (大陸 gọi 地鐵).','捷運是台灣說法，大陸稱地鐵。'),

-- ── Nhóm 3 · 進階級 (B1) ──────────────────────────────────────────
(3,'進階級',1,'sentence','「我覺得這個辦法行不通。」nghĩa là gì?','「我覺得這個辦法行不通。」是什麼意思？','我覺得這個辦法行不通。','我觉得这个办法行不通。',
 '{"Tôi thấy cách này không khả thi","Tôi thấy cách này rất hiệu quả","Tôi thấy cách này đáng thử","Tôi thấy đây là cách duy nhất"}',0,
 '行不通 = không thể thực hiện được.','「行不通」即不可行。'),
(3,'進階級',2,'cloze','Chọn từ đúng: 因為下雨，___ 比賽取消了。','選出正確的字：因為下雨，___ 比賽取消了。','因為下雨，___ 比賽取消了。','因为下雨，___ 比赛取消了。',
 '{"但是","所以","雖然","如果"}',1,
 'Cặp 因為…所以… = vì… nên…','「因為…所以…」因果句型。'),
(3,'進階級',3,'sentence','「他的中文進步得很快。」nghĩa là gì?','「他的中文進步得很快。」是什麼意思？','他的中文進步得很快。','他的中文进步得很快。',
 '{"Tiếng Trung của anh ấy tiến bộ rất chậm","Tiếng Trung của anh ấy tiến bộ rất nhanh","Tiếng Trung của anh ấy không tiến bộ","Tiếng Trung rất khó với anh ấy"}',1,
 '進步 (tiến bộ) + 得很快 = tiến bộ rất nhanh. 得 là bổ ngữ trạng thái.','「動詞 + 得 + 程度」的補語結構。'),
(3,'進階級',4,'sentence','「這件事跟我沒有關係。」nghĩa là gì?','「這件事跟我沒有關係。」是什麼意思？','這件事跟我沒有關係。','这件事跟我没有关系。',
 '{"Việc này rất quan trọng với tôi","Việc này do tôi làm","Việc này không liên quan đến tôi","Việc này tôi sẽ xử lý"}',2,
 '跟…沒有關係 = không liên quan đến…','「跟…沒有關係」表無關。'),
(3,'進階級',5,'cloze','Chọn từ đúng: 他不但會說中文，___ 會說日文。','選出正確的字：他不但會說中文，___ 會說日文。','他不但會說中文，___ 會說日文。','他不但会说中文，___ 会说日文。',
 '{"就","才","還","都"}',2,
 'Cặp 不但…還… = không những… mà còn…','「不但…還／也…」遞進句型。'),
(3,'進階級',6,'sentence','「臺灣的颱風假是由地方政府宣布的。」ai là người công bố?','「臺灣的颱風假是由地方政府宣布的。」誰宣布？','由地方政府宣布','由地方政府宣布',
 '{"Chính quyền địa phương","Chính quyền trung ương","Nhà trường","Công ty"}',0,
 'Cấu trúc 由 A 宣布 = do A công bố. 地方政府 = chính quyền địa phương.','「由…宣布」被動／施事結構，地方政府即縣市政府。');


-- ════════════════════════════════════════════════════════════════════
-- 7. Cập nhật view class_roster: thêm cột cấp TOCFL và nguồn cấp độ
--    更新 class_roster 檢視表：加上 TOCFL 級別與等級來源兩欄
--    Giáo viên cần thấy cấp độ đến từ đâu (mặc định / bài kiểm tra / tay)
--    老師要看得出等級是「預設」「測驗」還是「自己設的」。
-- ════════════════════════════════════════════════════════════════════
drop view if exists public.class_roster;

create view public.class_roster
with (security_invoker = true) as
select
  c.id            as class_id,
  c.code          as class_code,
  c.lock_to_assigned,
  p.id            as student_id,
  p.display_name,
  p.current_level,
  p.tocfl_level,
  p.level_source,
  p.placed_at,
  p.streak_days,
  p.last_active,
  (select count(*) from public.progress pr
     where pr.user_id = p.id and pr.completed_at is not null) as lessons_done,
  (select count(*) from public.srs_cards s
     where s.user_id = p.id and s.due <= current_date)        as cards_due
from public.classes c
join public.enrollments e on e.class_id = c.id
join public.profiles    p on p.id = e.student_id;

grant select on public.class_roster to authenticated;
