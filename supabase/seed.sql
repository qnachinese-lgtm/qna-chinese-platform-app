-- ════════════════════════════════════════════════════════════════════
-- QNA Chinese — dữ liệu mẫu / 種子資料
-- Chạy SAU schema.sql. / 在 schema.sql 之後執行。
--
-- Gồm: 28 từ vựng (có âm Hán-Việt + phân loại 3 nhóm) và bài học
-- "Tôi đến từ Việt Nam / 我從越南來" (Bậc 2, HSK 2).
-- ════════════════════════════════════════════════════════════════════

truncate table public.lesson_tokens restart identity cascade;
delete from public.lessons;
delete from public.lexemes;

-- ─── Từ vựng / 詞條 ────────────────────────────────────────────────
-- hv_class: 1 đồng hình đồng nghĩa · 2 cùng gốc khác cách dùng · 3 bạn giả
insert into public.lexemes
  (id, trad, simp, pinyin, zhuyin, hanviet, hv_class, hv_vi_word, hv_warning,
   gloss_vi, gloss_en, pos, hsk_level, tocfl_level, cefr) values
(1 ,'你好','你好',   '{nǐ,hǎo}',       '{ㄋㄧˇ,ㄏㄠˇ}',        '{nhĩ,hảo}',        0, null, null,
   'xin chào','hello','thán từ',1,'入門級','A1'),
(2 ,'請問','请问',   '{qǐng,wèn}',     '{ㄑㄧㄥˇ,ㄨㄣˋ}',      '{thỉnh,vấn}',      2, 'thỉnh vấn',
   'Âm Hán-Việt "thỉnh vấn" hầu như không dùng trong khẩu ngữ tiếng Việt, trong khi 請問 là câu lịch sự cơ bản nhất của tiếng Trung.',
   'cho hỏi','excuse me','động từ',1,'入門級','A1'),
(3 ,'你','你',       '{nǐ}',           '{ㄋㄧˇ}',              '{nhĩ}',            0, null, null,
   'bạn','you','đại từ',1,'入門級','A1'),
(4 ,'是','是',       '{shì}',          '{ㄕˋ}',                '{thị}',            0, null, null,
   'là','to be','động từ',1,'入門級','A1'),
(5 ,'哪國人','哪国人','{nǎ,guó,rén}',  '{ㄋㄚˇ,ㄍㄨㄛˊ,ㄖㄣˊ}','{na,quốc,nhân}',   1, 'quốc 國 · nhân 人', null,
   'người nước nào','which nationality','cụm từ',1,'入門級','A1'),
(6 ,'我','我',       '{wǒ}',           '{ㄨㄛˇ}',              '{ngã}',            0, null, null,
   'tôi','I','đại từ',1,'入門級','A1'),
(7 ,'越南','越南',   '{Yuè,nán}',      '{ㄩㄝˋ,ㄋㄢˊ}',        '{Việt,Nam}',       1, 'Việt Nam', null,
   'Việt Nam','Vietnam','danh từ',1,'入門級','A1'),
(8 ,'人','人',       '{rén}',          '{ㄖㄣˊ}',              '{nhân}',           1, 'nhân', null,
   'người','person','danh từ',1,'入門級','A1'),
(9 ,'姓','姓',       '{xìng}',         '{ㄒㄧㄥˋ}',            '{tính}',           2, 'tính',
   'Trong tiếng Việt "tính" chủ yếu nghĩa là tính chất, tính cách; nghĩa "họ" thường dùng chữ "họ".',
   'họ (tên họ)','surname','danh từ',1,'入門級','A1'),
(10,'黃','黄',       '{Huáng}',        '{ㄏㄨㄤˊ}',            '{Hoàng}',          1, 'Hoàng / Huỳnh',null,
   'họ Hoàng / Huỳnh','surname Huang','danh từ',2,'基礎級','A2'),
(11,'在','在',       '{zài}',          '{ㄗㄞˋ}',              '{tại}',            1, 'tại', null,
   'ở, tại','at, in','giới từ',1,'入門級','A1'),
(12,'大學','大学',   '{dà,xué}',       '{ㄉㄚˋ,ㄒㄩㄝˊ}',      '{đại,học}',        1, 'đại học', null,
   'đại học','university','danh từ',2,'基礎級','A2'),
(13,'讀書','读书',   '{dú,shū}',       '{ㄉㄨˊ,ㄕㄨ}',         '{độc,thư}',        2, 'độc thư',
   '"Độc thư" trong tiếng Việt là từ cổ, văn viết. Tiếng Việt hằng ngày nói "học"; tiếng Trung 讀書 là từ thông dụng.',
   'học, đi học','to study','động từ',2,'基礎級','A2'),
(14,'的','的',       '{de}',           '{ㄉㄜ˙}',              '{đích}',           0, null, null,
   'của','possessive particle','trợ từ',1,'入門級','A1'),
(15,'專業','专业',   '{zhuān,yè}',     '{ㄓㄨㄢ,ㄧㄝˋ}',       '{chuyên,nghiệp}',  2, 'chuyên ngành',
   'CẨN THẬN: tiếng Việt "chuyên nghiệp" nghĩa là professional. Tiếng Trung 專業 ở đây là ngành học chính (chuyên ngành).',
   'chuyên ngành','major, specialty','danh từ',4,'進階級','B1'),
(16,'國際','国际',   '{guó,jì}',       '{ㄍㄨㄛˊ,ㄐㄧˋ}',      '{quốc,tế}',        1, 'quốc tế', null,
   'quốc tế','international','tính từ',4,'進階級','B1'),
(17,'貿易','贸易',   '{mào,yì}',       '{ㄇㄠˋ,ㄧˋ}',          '{mậu,dịch}',       1, 'mậu dịch / thương mại', null,
   'mậu dịch, thương mại','trade','danh từ',5,'高階級','B2'),
(18,'中文','中文',   '{Zhōng,wén}',    '{ㄓㄨㄥ,ㄨㄣˊ}',       '{Trung,văn}',      1, 'Trung văn', null,
   'tiếng Trung','Chinese language','danh từ',1,'入門級','A1'),
(19,'說','说',       '{shuō}',         '{ㄕㄨㄛ}',             '{thuyết}',         2, 'nói',
   'Tiếng Việt "thuyết" chỉ dùng trong học thuyết, diễn thuyết. Nghĩa "nói" hằng ngày là "nói".',
   'nói','to speak','động từ',1,'入門級','A1'),
(20,'得','得',       '{de}',           '{ㄉㄜ˙}',              '{đắc}',            0, null, null,
   'trợ từ chỉ mức độ','degree particle','trợ từ',2,'基礎級','A2'),
(21,'真好','真好',   '{zhēn,hǎo}',     '{ㄓㄣ,ㄏㄠˇ}',         '{chân,hảo}',       0, null, null,
   'thật là giỏi','really good','cụm từ',1,'入門級','A1'),
(22,'謝謝','谢谢',   '{xiè,xie}',      '{ㄒㄧㄝˋ,ㄒㄧㄝ˙}',    '{tạ,tạ}',          0, null, null,
   'cảm ơn','thank you','động từ',1,'入門級','A1'),
(23,'因為','因为',   '{yīn,wèi}',      '{ㄧㄣ,ㄨㄟˋ}',         '{nhân,vi}',        0, null, null,
   'bởi vì','because','liên từ',2,'基礎級','A2'),
(24,'越南話','越南话','{Yuè,nán,huà}', '{ㄩㄝˋ,ㄋㄢˊ,ㄏㄨㄚˋ}','{Việt,Nam,thoại}', 1, 'tiếng Việt', null,
   'tiếng Việt','Vietnamese language','danh từ',2,'基礎級','A2'),
(25,'裡','里',       '{lǐ}',           '{ㄌㄧˇ}',              '{lý}',             3, 'trong',
   'BẪY PHỒN–GIẢN: bản phồn thể phân biệt 裡 (bên trong) và 里 (cây số); bản giản thể viết chung là 里.',
   'trong','inside','danh từ',1,'入門級','A1'),
(26,'有','有',       '{yǒu}',          '{ㄧㄡˇ}',              '{hữu}',            1, 'hữu', null,
   'có','to have','động từ',1,'入門級','A1'),
(27,'很多','很多',   '{hěn,duō}',      '{ㄏㄣˇ,ㄉㄨㄛ}',       '{ngận,đa}',        0, null, null,
   'rất nhiều','many','cụm từ',1,'入門級','A1'),
(28,'漢越詞','汉越词','{Hàn,Yuè,cí}',  '{ㄏㄢˋ,ㄩㄝˋ,ㄘˊ}',   '{Hán,Việt,từ}',    1, 'từ Hán-Việt', null,
   'từ Hán-Việt','Sino-Vietnamese vocabulary','danh từ',5,'高階級','B2'),
-- Ba "bạn giả" kinh điển, dùng cho phần luyện tập / 三個經典假朋友，練習題用
(29,'方便','方便',   '{fāng,biàn}',    '{ㄈㄤ,ㄅㄧㄢˋ}',       '{phương,tiện}',    3, 'tiện lợi',
   'BẠN GIẢ: tiếng Việt "phương tiện" = công cụ, phương tiện giao thông. Tiếng Trung 方便 = tiện lợi.',
   'tiện lợi','convenient','tính từ',3,'進階級','B1'),
(30,'東西','东西',   '{dōng,xi}',      '{ㄉㄨㄥ,ㄒㄧ˙}',       '{đông,tây}',       3, 'đồ vật',
   'BẠN GIẢ: tiếng Việt "đông tây" chỉ có nghĩa phương hướng. Tiếng Trung 東西 nghĩa là đồ vật.',
   'đồ vật','thing','danh từ',1,'入門級','A1'),
(31,'大家','大家',   '{dà,jiā}',       '{ㄉㄚˋ,ㄐㄧㄚ}',       '{đại,gia}',        3, 'mọi người',
   'BẠN GIẢ: tiếng Việt "đại gia" = người giàu có. Tiếng Trung 大家 = mọi người.',
   'mọi người','everyone','đại từ',2,'基礎級','A2');

select setval('public.lexemes_id_seq', (select max(id) from public.lexemes));

-- ─── Bài học / 課程 ───────────────────────────────────────────────
insert into public.lessons
  (id, slug, title_vi, title_trad, title_simp, level, hsk_level, tocfl_level, summary_vi, status, sort_order)
values
(1, 'toi-den-tu-viet-nam', 'Tôi đến từ Việt Nam', '我從越南來', '我从越南来',
 2, 2, '基礎級',
 'Giới thiệu bản thân: quốc tịch, họ tên, trường và chuyên ngành. Bài này chứa 7 từ Hán-Việt đồng hình đồng nghĩa — bạn gần như đã biết chúng rồi.',
 'published', 10);

select setval('public.lessons_id_seq', (select max(id) from public.lessons));

-- ─── Token hội thoại / 課文逐詞 ───────────────────────────────────
-- line_no = số dòng, seq = thứ tự trong dòng.
insert into public.lesson_tokens (lesson_id, line_no, seq, speaker, line_vi, lexeme_id, punctuation) values
-- Dòng 1 — Giáo viên
(1,1,1,'Giáo viên','Xin chào, cho hỏi bạn là người nước nào?',1,null),
(1,1,2,'Giáo viên',null,null,'，'),
(1,1,3,'Giáo viên',null,2,null),
(1,1,4,'Giáo viên',null,3,null),
(1,1,5,'Giáo viên',null,4,null),
(1,1,6,'Giáo viên',null,5,null),
(1,1,7,'Giáo viên',null,null,'？'),
-- Dòng 2 — Học viên
(1,2,1,'Học viên','Tôi là người Việt Nam, tôi họ Huỳnh.',6,null),
(1,2,2,'Học viên',null,4,null),
(1,2,3,'Học viên',null,7,null),
(1,2,4,'Học viên',null,8,null),
(1,2,5,'Học viên',null,null,'，'),
(1,2,6,'Học viên',null,6,null),
(1,2,7,'Học viên',null,9,null),
(1,2,8,'Học viên',null,10,null),
(1,2,9,'Học viên',null,null,'。'),
-- Dòng 3 — Học viên
(1,3,1,'Học viên','Tôi học đại học, chuyên ngành là thương mại quốc tế.',6,null),
(1,3,2,'Học viên',null,11,null),
(1,3,3,'Học viên',null,12,null),
(1,3,4,'Học viên',null,13,null),
(1,3,5,'Học viên',null,null,'，'),
(1,3,6,'Học viên',null,15,null),
(1,3,7,'Học viên',null,4,null),
(1,3,8,'Học viên',null,16,null),
(1,3,9,'Học viên',null,17,null),
(1,3,10,'Học viên',null,null,'。'),
-- Dòng 4 — Giáo viên
(1,4,1,'Giáo viên','Tiếng Trung của bạn nói thật giỏi.',3,null),
(1,4,2,'Giáo viên',null,14,null),
(1,4,3,'Giáo viên',null,18,null),
(1,4,4,'Giáo viên',null,19,null),
(1,4,5,'Giáo viên',null,20,null),
(1,4,6,'Giáo viên',null,21,null),
(1,4,7,'Giáo viên',null,null,'。'),
-- Dòng 5 — Học viên
(1,5,1,'Học viên','Cảm ơn, bởi vì trong tiếng Việt có rất nhiều từ Hán-Việt.',22,null),
(1,5,2,'Học viên',null,null,'，'),
(1,5,3,'Học viên',null,23,null),
(1,5,4,'Học viên',null,24,null),
(1,5,5,'Học viên',null,25,null),
(1,5,6,'Học viên',null,26,null),
(1,5,7,'Học viên',null,27,null),
(1,5,8,'Học viên',null,28,null),
(1,5,9,'Học viên',null,null,'。');
