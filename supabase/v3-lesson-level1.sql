-- ════════════════════════════════════════════════════════════════════
-- QNA Chinese v3 — Bài học Bậc 1 (TOCFL 準備級 / HSK 1)
--                  第一級課程：零基礎入門
--
-- Lý do: sau khi bật lọc theo cấp độ, học viên Bậc 1 sẽ không thấy bài
-- nào vì bài duy nhất trong hệ thống là Bậc 2. Bài này lấp chỗ đó.
-- 開了等級分發之後，第一級的學生會看不到任何課（原本只有第二級一課）。
-- 這個檔補上真正的零基礎第一課。
--
-- Chạy SAU seed.sql. Chạy lại nhiều lần cũng không sao.
-- 在 seed.sql 之後執行，可重複執行。
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. Từ vựng mới / 新詞條 ──────────────────────────────────────
-- hv_class: 0 không phải Hán-Việt · 1 đồng hình đồng nghĩa
--           2 cùng gốc khác cách dùng · 3 bạn giả
insert into public.lexemes
  (id, trad, simp, pinyin, zhuyin, hanviet, hv_class, hv_vi_word, hv_warning,
   gloss_vi, gloss_en, pos, hsk_level, tocfl_level, cefr) values
(32,'老師','老师',   '{lǎo,shī}',      '{ㄌㄠˇ,ㄕ}',           '{lão,sư}',        2, 'thầy / cô, giáo viên',
   'Âm Hán-Việt "lão sư" không dùng trong tiếng Việt hiện đại. Tiếng Việt nói "thầy", "cô", "giáo viên". Nhưng nhớ được "lão sư" thì nhớ luôn mặt chữ 老師.',
   'thầy, cô, giáo viên','teacher','danh từ',1,'準備級','A1'),
(33,'學生','学生',   '{xué,sheng}',    '{ㄒㄩㄝˊ,ㄕㄥ˙}',      '{học,sinh}',      1, 'học sinh', null,
   'học sinh, sinh viên','student','danh từ',1,'準備級','A1'),
(34,'叫','叫',       '{jiào}',         '{ㄐㄧㄠˋ}',            '{khiếu}',         2, 'tên là, gọi là',
   '"Khiếu" trong tiếng Việt gần như không dùng một mình. Trong tiếng Trung 叫 cực kỳ thông dụng: 我叫… = tôi tên là…',
   'tên là, gọi là','to be called','động từ',1,'準備級','A1'),
(35,'什麼','什么',   '{shén,me}',      '{ㄕㄣˊ,ㄇㄜ˙}',        '{thập,ma}',       0, null, null,
   'cái gì, gì','what','đại từ',1,'準備級','A1'),
(36,'名字','名字',   '{míng,zi}',      '{ㄇㄧㄥˊ,ㄗ˙}',        '{danh,tự}',       2, 'tên',
   'Tiếng Việt hằng ngày nói "tên"; "danh tự" là từ cổ. Nhưng 名 = danh (danh sách, danh tiếng) giúp bạn nhớ mặt chữ.',
   'tên','name','danh từ',1,'準備級','A1'),
(37,'再見','再见',   '{zài,jiàn}',     '{ㄗㄞˋ,ㄐㄧㄢˋ}',      '{tái,kiến}',      2, 'tạm biệt',
   '"Tái kiến" = gặp lại, không dùng làm lời chào trong tiếng Việt. 再見 là câu tạm biệt cơ bản nhất của tiếng Trung.',
   'tạm biệt','goodbye','thán từ',1,'準備級','A1'),
(38,'對不起','对不起','{duì,bu,qǐ}',   '{ㄉㄨㄟˋ,ㄅㄨ˙,ㄑㄧˇ}','{đối,bất,khởi}',  0, null, null,
   'xin lỗi','sorry','thán từ',1,'準備級','A1'),
(39,'沒關係','没关系','{méi,guān,xi}', '{ㄇㄟˊ,ㄍㄨㄢ,ㄒㄧ˙}', '{một,quan,hệ}',   3, 'không sao đâu',
   'BẠN GIẢ: tiếng Việt "quan hệ" = relationship. 沒關係 tiếng Trung nghĩa là "không sao đâu, đừng bận tâm".',
   'không sao đâu','it does not matter','cụm từ',1,'準備級','A1'),
(40,'不','不',       '{bù}',           '{ㄅㄨˋ}',              '{bất}',           1, 'bất (bất tiện, bất ngờ)', null,
   'không (phủ định)','not','phó từ',1,'準備級','A1'),
(41,'很','很',       '{hěn}',          '{ㄏㄣˇ}',              '{ngận}',          0, null, null,
   'rất','very','phó từ',1,'準備級','A1'),
(42,'高興','高兴',   '{gāo,xìng}',     '{ㄍㄠ,ㄒㄧㄥˋ}',       '{cao,hứng}',      2, 'vui, vui mừng',
   'Tiếng Việt "cao hứng" nghĩa là nổi hứng bất chợt. Tiếng Trung 高興 chỉ đơn giản là "vui".',
   'vui, vui mừng','happy','tính từ',1,'準備級','A1'),
(43,'認識','认识',   '{rèn,shi}',      '{ㄖㄣˋ,ㄕˋ}',          '{nhận,thức}',     3, 'quen biết',
   'BẠN GIẢ: tiếng Việt "nhận thức" = perception, awareness. Tiếng Trung 認識 = quen biết một người, biết mặt chữ.',
   'quen biết','to know someone','động từ',1,'準備級','A1'),
(44,'嗎','吗',       '{ma}',           '{ㄇㄚ˙}',              '{ma}',            0, null, null,
   'trợ từ nghi vấn (đặt cuối câu hỏi có/không)','question particle','trợ từ',1,'準備級','A1'),
(45,'呢','呢',       '{ne}',           '{ㄋㄜ˙}',              '{ni}',            0, null, null,
   'còn… thì sao?','and what about','trợ từ',1,'準備級','A1')
on conflict (id) do nothing;

select setval('public.lexemes_id_seq', (select max(id) from public.lexemes));


-- ─── 2. Bài học Bậc 1 / 第一級課程 ────────────────────────────────
delete from public.lessons where slug = 'chao-hoi-va-ten-goi';

insert into public.lessons
  (id, slug, title_vi, title_trad, title_simp, level, hsk_level, tocfl_level, summary_vi, status, sort_order)
values
(2, 'chao-hoi-va-ten-goi', 'Chào hỏi và tên gọi', '你好！我姓黃', '你好！我姓黄',
 1, 1, '準備級',
 'Bài đầu tiên: chào hỏi, hỏi tên, nói mình là ai. Bạn sẽ gặp ngay ba từ Hán-Việt dễ nhầm — 老師 (không phải "lão sư"), 高興 (không phải "cao hứng"), 認識 (không phải "nhận thức").',
 'published', 5)
on conflict (id) do update set
  slug = excluded.slug, title_vi = excluded.title_vi,
  title_trad = excluded.title_trad, title_simp = excluded.title_simp,
  level = excluded.level, hsk_level = excluded.hsk_level,
  tocfl_level = excluded.tocfl_level, summary_vi = excluded.summary_vi,
  status = excluded.status, sort_order = excluded.sort_order;

select setval('public.lessons_id_seq', (select max(id) from public.lessons));


-- ─── 3. Hội thoại từng chữ / 課文逐詞 ─────────────────────────────
delete from public.lesson_tokens where lesson_id = 2;

insert into public.lesson_tokens (lesson_id, line_no, seq, speaker, line_vi, lexeme_id, punctuation) values
-- Dòng 1 — Giáo viên: 你好！我姓黃。
(2,1,1,'Giáo viên','Xin chào! Cô họ Huỳnh.',1,null),
(2,1,2,'Giáo viên',null,null,'！'),
(2,1,3,'Giáo viên',null,6,null),
(2,1,4,'Giáo viên',null,9,null),
(2,1,5,'Giáo viên',null,10,null),
(2,1,6,'Giáo viên',null,null,'。'),

-- Dòng 2 — Học viên: 老師，你好！我是學生。
(2,2,1,'Học viên','Cô ơi, em chào cô! Em là học sinh.',32,null),
(2,2,2,'Học viên',null,null,'，'),
(2,2,3,'Học viên',null,1,null),
(2,2,4,'Học viên',null,null,'！'),
(2,2,5,'Học viên',null,6,null),
(2,2,6,'Học viên',null,4,null),
(2,2,7,'Học viên',null,33,null),
(2,2,8,'Học viên',null,null,'。'),

-- Dòng 3 — Giáo viên: 你叫什麼名字？
(2,3,1,'Giáo viên','Em tên là gì?',3,null),
(2,3,2,'Giáo viên',null,34,null),
(2,3,3,'Giáo viên',null,35,null),
(2,3,4,'Giáo viên',null,36,null),
(2,3,5,'Giáo viên',null,null,'？'),

-- Dòng 4 — Học viên: 我是越南人。認識你很高興！
(2,4,1,'Học viên','Em là người Việt Nam. Rất vui được quen cô!',6,null),
(2,4,2,'Học viên',null,4,null),
(2,4,3,'Học viên',null,7,null),
(2,4,4,'Học viên',null,8,null),
(2,4,5,'Học viên',null,null,'。'),
(2,4,6,'Học viên',null,43,null),
(2,4,7,'Học viên',null,3,null),
(2,4,8,'Học viên',null,41,null),
(2,4,9,'Học viên',null,42,null),
(2,4,10,'Học viên',null,null,'！'),

-- Dòng 5 — Giáo viên: 謝謝你。再見！
(2,5,1,'Giáo viên','Cảm ơn em. Tạm biệt!',22,null),
(2,5,2,'Giáo viên',null,3,null),
(2,5,3,'Giáo viên',null,null,'。'),
(2,5,4,'Giáo viên',null,37,null),
(2,5,5,'Giáo viên',null,null,'！');


-- ─── 4. Bài Bậc 2 cũ lùi xuống sau bài Bậc 1 ─────────────────────
update public.lessons set sort_order = 10 where slug = 'toi-den-tu-viet-nam';
