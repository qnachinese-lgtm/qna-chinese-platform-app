# QNA Chinese — Tiếng Trung Quyên Huỳnh

Nền tảng học tiếng Trung dành cho người Việt.
以漢越詞為教學主軸、專為越南學習者設計的華語學習平台。

- **Âm Hán-Việt là tuyến chú âm thứ ba**，和拼音、注音並列，並把漢越詞分成三類（同形同義／用法有差／假朋友）
- **Phồn thể và giản thể song song**，不做即時字串轉換，兩套都是資料庫欄位
- **Tài khoản thật**：email 或 Google 註冊，進度存在伺服器，換裝置不會遺失
- **Lớp học cho giáo viên**：班級代碼入班，老師看得到全班進度
- **Bài tập tương tác**：六種題型（含拖曳排序、手寫、漢越假朋友辨析），自動出題、自動批改，錯題自動回流複習佇列

---

## 1. Cần gì trước khi bắt đầu / 開始前需要什麼

| Thứ cần | Chi phí | Ghi chú |
|---|---|---|
| Tài khoản [Supabase](https://supabase.com) | Miễn phí để khởi động | Cơ sở dữ liệu + đăng nhập |
| Tài khoản [Vercel](https://vercel.com) | Miễn phí để khởi động | Nơi chạy trang web |
| Node.js 18 trở lên | Miễn phí | Chỉ cần khi chạy trên máy |

兩個平台的免費方案就足以跑起一個小班級。等學生多了再升級。

---

## 2. Dựng cơ sở dữ liệu / 建立資料庫

1. Vào [supabase.com](https://supabase.com) → **New project**. Chọn region **Singapore** (gần Việt Nam và Đài Loan nhất).
2. Mở **SQL Editor** → dán toàn bộ nội dung `supabase/schema.sql` → **Run**.
3. Dán tiếp `supabase/exercises.sql` → **Run**. Đây là hệ thống bài tập: bảng đề, bảng đáp án, chấm điểm.
4. Dán tiếp `supabase/seed.sql` → **Run**. Lệnh này nạp 31 từ vựng và bài học mẫu *Tôi đến từ Việt Nam / 我從越南來*.
5. Vào **Project Settings → API**, chép lại `Project URL` và `anon public key`.

三個 SQL 檔要照順序跑：`schema.sql` → `exercises.sql` → `seed.sql`。

### Bật đăng nhập bằng Google (không bắt buộc)

**Authentication → Providers → Google** → bật, dán Client ID / Secret lấy từ Google Cloud Console.
Redirect URL điền: `https://<project>.supabase.co/auth/v1/callback`

### Tắt xác nhận email khi đang thử

**Authentication → Providers → Email** → tắt *Confirm email* để đăng ký xong vào được ngay.
Khi lên production thì bật lại.

---

## 3. Chạy trên máy / 本機執行

```bash
npm install
cp .env.example .env.local     # rồi điền URL và anon key
npm run dev                    # → http://localhost:3000
```

---

## 4. Đưa lên mạng / 部署上線

```bash
# đẩy mã nguồn lên GitHub trước
git init && git add -A && git commit -m "QNA Chinese"
git remote add origin git@github.com:<tài-khoản>/qna-chinese.git
git push -u origin main
```

Sau đó vào Vercel → **Add New Project** → chọn repo vừa đẩy → khai báo ba biến môi trường:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL      → https://<tên-miền-của-bạn>
```

Bấm **Deploy**. Xong — học viên mở đường dẫn đó là học được, bất cứ lúc nào.

> Sau khi có tên miền thật, nhớ quay lại Supabase → **Authentication → URL Configuration** và thêm tên miền đó vào *Redirect URLs*, nếu không đăng nhập bằng Google sẽ quay về sai chỗ.

### Dùng trên điện thoại / 手機怎麼用

Không có ứng dụng để tải. Học viên mở **trình duyệt trên điện thoại** (Safari, Chrome, Zalo…),
gõ đúng địa chỉ trang, đăng nhập một lần là xong — lần sau vào thẳng, không phải đăng nhập lại.

Muốn nó trông và chạy như một app thật:

- **iPhone (Safari)** → nút Chia sẻ ⬆️ → **Thêm vào MH chính** (Add to Home Screen)
- **Android (Chrome)** → menu ⋮ → **Thêm vào màn hình chính** / **Cài đặt ứng dụng**

Sau đó trên màn hình chính sẽ có biểu tượng 娟 màu chu sa, bấm vào là mở toàn màn hình,
không có thanh địa chỉ. Tiến độ vẫn nằm trên máy chủ nên đổi máy vẫn còn.

手機不用下載 App：瀏覽器開網址、登入一次就好。要像 App 一樣，就用「加到主畫面」，
會出現一個硃砂色的「娟」圖示，點開是全螢幕。專案裡的 `src/app/manifest.ts`
與 `icon.png` 就是做這件事的；導覽列在手機上會自動變成底部工具列。

---

## 5. Tạo lớp học đầu tiên / 建立第一個班級

Trong Supabase **SQL Editor**:

```sql
-- 1) Nâng tài khoản của bạn thành giáo viên
update public.profiles set role = 'teacher'
where id = (select id from auth.users where email = 'email-cua-ban@example.com');

-- 2) Tạo lớp
insert into public.classes (name, code, teacher_id)
values ('Lớp QNA 2026A', 'QNA-2026A',
        (select id from auth.users where email = 'email-cua-ban@example.com'));
```

Đưa mã `QNA-2026A` cho học viên. Khi đăng ký họ nhập mã này là vào lớp, bạn không phải thêm từng người.

---

## 6. Bài tập tương tác / 互動作業

### Giáo viên giao bài

Vào **Giao bài tập** → chọn lớp, chọn bài học, đặt hạn nộp → bấm **Tạo bài tập**.
Hệ thống tự sinh đề từ chính từ vựng và câu trong bài học đó. Bạn chỉnh được số câu mỗi loại.

老師選課 + 設截止日就好，題目由系統自動從該課的詞彙與句子生成。

### Sáu loại câu hỏi / 六種題型

| Loại | Cách làm | Chấm |
|---|---|---|
| **Chọn nghĩa** 選詞義 | 4 lựa chọn, phương án nhiễu lấy từ các từ khác cùng bài | tự động |
| **Điền vào chỗ trống** 克漏字 | Khoét một từ khỏi câu thật trong bài | tự động |
| **Sắp xếp câu** 排序組句 | Kéo thả (hoặc bấm) các ô từ vào đúng thứ tự | tự động |
| **Từ Hán-Việt** 假朋友辨析 | Phương án nhiễu **chính là âm Hán-Việt** — đúng cái bẫy | tự động |
| **Nghe hiểu** 聽力 | Nghe file ghi âm rồi chọn; chưa có file thì hiện pinyin | tự động |
| **Viết chữ** 米字格手寫 | Viết trong ô mễ tự, nộp nét bút | **giáo viên chấm tay** |

Câu bẫy Hán-Việt là loại không nền tảng nào khác ra được đề: nó lấy chính cách đọc
Hán-Việt của từ làm phương án nhiễu. Ví dụ 「方便」→ nhiễu là *phương tiện*, đáp án là
*tiện lợi*. 這種題只有針對越南學習者的產品出得出來。

### Ba điều đáng chú ý về thiết kế

**1. Đáp án không bao giờ xuống trình duyệt.**
`assignment_items` (đề bài) và `assignment_keys` (đáp án) là hai bảng khác nhau.
Học viên không có policy select nào trên bảng đáp án. Việc chấm do RPC
`grade_submission` làm ở phía máy chủ. Nghĩa là mở DevTools cũng không thấy đáp án —
đây là ràng buộc ở tầng cơ sở dữ liệu, không phải "frontend nhớ đừng hiển thị".

**2. Câu sai tự động vào hàng đợi ôn tập.**
Ngay trong lúc chấm, mỗi từ trả lời sai được `upsert` vào `srs_cards` với `due = hôm nay`
và độ ổn định bị giảm một nửa. Học viên không phải tự ghi lại từ nào mình sai.
錯題自動回流 SRS，這是作業系統與複習系統接起來的那一根管子。

**3. Trả lời đến đâu lưu đến đó.**
Mỗi câu được `upsert` vào `submission_answers` ngay khi chọn. Đóng trình duyệt giữa chừng,
mở lại vẫn còn nguyên.

---

## 7. Cấu trúc mã nguồn / 程式碼結構

```
supabase/
  schema.sql          Bảng, RLS, trigger, RPC join_class, view class_roster
  exercises.sql       Bài tập: đề/đáp án tách bảng, chấm điểm, chấm tay
  seed.sql            31 từ vựng + 1 bài học mẫu
src/
  middleware.ts       Làm mới session, chặn trang cần đăng nhập
  lib/
    supabase/         Client cho browser / server / middleware
    fsrs.ts           Lịch ôn tập FSRS rút gọn + hệ số thưởng Hán-Việt
    exercises.ts      ★ Bộ sinh đề tự động (6 loại câu hỏi)
    types.ts          Kiểu dữ liệu dùng chung
  components/
    RubyWord.tsx      ★ Bộ render chữ + chú âm (trái tim kỹ thuật)
    WordCard.tsx      Thẻ tra từ, có cảnh báo bạn giả
    PrefsProvider.tsx Lưu tùy chọn phồn/giản + chú âm vào profile
    Toolbar.tsx       Hai công tắc xuyên suốt toàn trang
    Rail.tsx          Thanh điều hướng bên trái
    exercises/
      ExerciseItem.tsx ★ Sáu giao diện làm bài (kéo thả, viết tay, nghe…)
  app/
    page.tsx                    Trang giới thiệu (chưa đăng nhập)
    login/ signup/              Đăng nhập, đăng ký, nhập mã lớp
    auth/callback/route.ts      Đích quay về sau OAuth
    (app)/layout.tsx            Khung sau khi đăng nhập
    (app)/dashboard/            Bảng điều khiển học viên
    (app)/learn/                Lộ trình + trang bài học
    (app)/review/               Phiên ôn tập SRS
    (app)/homework/             Danh sách + màn hình làm bài tập
    (app)/teacher/              Bảng theo dõi lớp
    (app)/teacher/assign/       Giao bài tập (sinh đề tự động)
    (app)/teacher/assignments/  Tiến độ nộp bài + chấm chữ viết tay
    api/assignments/generate/   Route sinh đề (chạy dưới phiên của giáo viên)
```

### Ba chỗ đáng đọc trước

**`src/components/RubyWord.tsx`** — hệ thống không bao giờ chuyển đổi chuỗi lúc chạy.
Phồn thể, giản thể, pinyin, chú âm, âm Hán-Việt đều là cột riêng trong bảng `lexemes`.
Đây là lý do việc chuyển đổi không có độ trễ và không bao giờ sai — cũng là điều mà
các ứng dụng "giản thể trước, phồn thể chỉ là công tắc hiển thị" không làm được.

**`supabase/schema.sql`, cột `hv_class`** — chỉ là một số nguyên 1/2/3, nhưng nó nuôi
bốn tính năng: lịch ôn tập nhân hệ số, bài tập bẫy từ đồng hình dị nghĩa, màu thứ ba
trong trình đọc phân cấp, và thống kê điểm yếu của cả lớp. Một cột dữ liệu, bốn tính năng.

**`supabase/exercises.sql`, hàm `grade_submission`** — chấm bài và đẩy từ sai vào hàng đợi
ôn tập diễn ra trong cùng một giao dịch, ở phía máy chủ. Đây là chỗ hệ thống bài tập nối
vào hệ thống ôn tập; nếu tách rời hai thứ này thì học viên phải tự ghi lại từ mình sai —
và họ sẽ không làm.

---

## 8. Việc còn phải làm / 尚未完成

Mã nguồn này là bộ khung chạy được, không phải sản phẩm hoàn chỉnh. Còn thiếu:

- **Nội dung** — mới có 1 bài. Đây là nút thắt thật sự, không phải kỹ thuật.
- **CMS cho biên tập viên** — hiện phải thêm bài bằng SQL. Nên làm sớm (xem lộ trình M4).
- **Sửa từng câu sau khi sinh đề** — hiện chỉ sinh và xóa được cả bài; chưa sửa được từng câu.
- **So khớp nét bút tự động** — hiện câu viết chữ do giáo viên chấm tay; nên thêm Hanzi Writer để máy kiểm tra thứ tự nét trước.
- **Âm thanh** — cần thu giọng thật, không dùng TTS khi lên production.
- **Thi thử HSK / TOCFL** — đúng dạng đề và đúng quy tắc tính giờ.
- **Tuyến văn ngôn** — giao diện "chu mặc" (chính văn mực đen, bình chú chu sa).

---

## 9. Bản quyền dữ liệu / 資料來源與版權

- Khung cấp độ HSK: *Chuẩn trình độ tiếng Trung quốc tế* (GF 0025-2021), Bộ Giáo dục Trung Quốc.
- Đối chiếu TOCFL: Ủy ban Khảo thí Năng lực Hoa ngữ Đài Loan (華測會).
- **Đối chiếu CEFR trong sản phẩm chỉ mang tính tham khảo của QNA.** HSK không có bảng
  quy đổi CEFR chính thức; giữa HSK và TOCFL cũng không có thỏa thuận công nhận lẫn nhau.
  Giao diện phải ghi rõ điều này để học viên không chọn nhầm kỳ thi.
- Nghĩa tiếng Việt và phân loại Hán-Việt trong `seed.sql` do QNA tự biên soạn.
