/**
 * Giao diện hai ngôn ngữ / 介面雙語
 * ---------------------------------------------------------------
 * Học viên người Việt đọc tiếng Việt; giáo viên và biên tập đọc tiếng Trung.
 * Lựa chọn được lưu vào profiles.ui_lang nên đổi máy vẫn giữ nguyên.
 *
 * 學生看越南文，老師與編輯看中文。選擇存進 profiles.ui_lang，換裝置也保留。
 */

export type UiLang = "vi" | "zh";

type Dict = Record<string, { vi: string; zh: string }>;

const DICT: Dict = {
  /* ── điều hướng / 導覽 ── */
  "nav.section.student": { vi: "Học viên", zh: "學習者" },
  "nav.section.teacher": { vi: "Giáo viên", zh: "教師" },
  "nav.dashboard": { vi: "Bảng điều khiển", zh: "學習總覽" },
  "nav.learn": { vi: "Lộ trình học", zh: "課程地圖" },
  "nav.homework": { vi: "Bài tập", zh: "作業" },
  "nav.review": { vi: "Ôn tập", zh: "複習" },
  "nav.placement": { vi: "Kiểm tra xếp lớp", zh: "分級測驗" },
  "nav.class": { vi: "Lớp học", zh: "班級管理" },
  "nav.assign": { vi: "Giao bài tập", zh: "指派作業" },
  "nav.signout": { vi: "Đăng xuất", zh: "登出" },

  /* ── thanh công cụ / 工具列 ── */
  "bar.script": { vi: "Chữ", zh: "字體" },
  "bar.phonetic": { vi: "Chú âm", zh: "標音" },
  "bar.translation": { vi: "Dịch", zh: "越譯" },
  "bar.uilang": { vi: "Giao diện", zh: "介面" },
  "bar.show": { vi: "Hiện", zh: "顯示" },
  "bar.hide": { vi: "Ẩn", zh: "隱藏" },
  "bar.off": { vi: "Tắt", zh: "關閉" },

  /* ── bảng điều khiển / 總覽 ── */
  "dash.hello": { vi: "Xin chào", zh: "你好" },
  "dash.lede": {
    vi: "Tiến độ của bạn được lưu trên máy chủ. Đổi máy hay quay lại sau vài tháng, hàng đợi ôn tập vẫn còn nguyên.",
    zh: "學習進度存在伺服器上。換裝置或隔幾個月回來，複習佇列都還在。",
  },
  "dash.due": { vi: "Đến hạn ôn", zh: "今日待複習" },
  "dash.due.sub": { vi: "thẻ cần ôn hôm nay", zh: "張卡片到期" },
  "dash.cards": { vi: "Tổng số thẻ", zh: "複習卡總數" },
  "dash.cards.sub": { vi: "từ đã đưa vào ôn tập", zh: "個詞已進入複習" },
  "dash.level": { vi: "Cấp độ của bạn", zh: "你的等級" },
  "dash.streak": { vi: "Chuỗi ngày", zh: "連續學習" },
  "dash.streak.sub": { vi: "ngày học liên tiếp", zh: "天" },
  "dash.review.cta": { vi: "Ôn tập ngay", zh: "開始複習" },
  "dash.lessons": { vi: "Bài học dành cho bạn", zh: "適合你的課程" },
  "dash.nolessons": {
    vi: "Chưa có bài học nào. Chạy supabase/seed.sql để nạp dữ liệu mẫu.",
    zh: "尚無課程。請先執行 seed.sql 匯入種子資料。",
  },
  "dash.placement.cta": { vi: "Làm bài kiểm tra xếp lớp", zh: "去做分級測驗" },
  "dash.placement.why": {
    vi: "Bạn chưa làm bài kiểm tra xếp lớp, nên hệ thống đang tạm xếp bạn ở cấp thấp nhất. Làm bài (khoảng 10 phút) để nhận đúng cấp độ và đúng bài học.",
    zh: "你還沒做分級測驗，系統暫時把你放在最低級。花十分鐘做完，等級與課程才會對。",
  },

  /* ── lộ trình / 課程地圖 ── */
  "learn.title": { vi: "Từ vỡ lòng đến văn ngôn", zh: "從零基礎到文言文" },
  "learn.lede": {
    vi: "Khung cấp độ bám theo HSK 3.0 (GF 0025-2021) và có cột đối chiếu TOCFL cho người Việt đang ở Đài Loan. Bài nằm trong hoặc dưới cấp của bạn thì mở được ngay; bài cao hơn vẫn xem được nhưng có cảnh báo vượt trình độ.",
    zh: "等級架構對齊 HSK 3.0（GF 0025-2021），並附 TOCFL 對照欄給在臺灣的越南學習者。等於或低於你等級的課直接開；更高的課仍可點進去，但會標示超過程度。",
  },
  "learn.here": { vi: "Bạn ở đây", zh: "你在這裡" },
  "learn.cefrnote": {
    vi: "Cột CEFR chỉ là đối chiếu tham khảo của QNA. HSK không có bảng quy đổi CEFR chính thức, và giữa HSK với TOCFL cũng không có thỏa thuận công nhận lẫn nhau — ghi rõ để học viên không chọn nhầm kỳ thi.",
    zh: "CEFR 一欄屬本站參考對齊，非官方互認；HSK 與 TOCFL 之間也沒有互認協議。寫清楚是為了避免學生報錯考試。",
  },
  "learn.yourlevel": { vi: "Cấp độ hiện tại của bạn", zh: "你目前的等級" },
  "learn.source.default": { vi: "chưa kiểm tra xếp lớp", zh: "尚未分級測驗" },
  "learn.source.test": { vi: "theo kết quả kiểm tra", zh: "依測驗結果" },
  "learn.source.teacher": { vi: "do giáo viên đặt", zh: "老師手動設定" },
  "learn.suitable": { vi: "Phù hợp với bạn", zh: "適合你" },
  "learn.tooadvanced": { vi: "Vượt trình độ hiện tại", zh: "超過你目前程度" },
  "learn.locked": {
    vi: "Lớp của bạn đang ở chế độ chỉ học bài được giao.",
    zh: "你的班級目前設為「只能上老師指派的課」。",
  },
  "learn.editing": { vi: "đang biên soạn", zh: "編寫中" },
  "learn.col.level": { vi: "Cấp", zh: "等級" },
  "learn.col.words": { vi: "Từ vựng tích luỹ", zh: "累計詞彙" },
  "learn.col.lessons": { vi: "Bài học", zh: "課程" },

  /* ── kiểm tra xếp lớp / 分級測驗 ── */
  "pl.title": { vi: "Kiểm tra xếp lớp", zh: "分級測驗" },
  "pl.intro.h": { vi: "24 câu, khoảng 10 phút", zh: "24 題，大約十分鐘" },
  "pl.intro.body": {
    vi: "Đề đi từ dễ đến khó, chia làm bốn nhóm theo cấp TOCFL. Không giới hạn thời gian, không trừ điểm khi sai — cứ chọn đáp án bạn nghĩ là đúng, câu nào không biết thì đoán rồi đi tiếp. Kết quả sẽ quyết định bài học nào hiện ra cho bạn.",
    zh: "題目由易到難，依 TOCFL 分成四組。不計時、答錯不倒扣——不會的就猜一個往下走。結果會決定之後看到哪些課程。",
  },
  "pl.start": { vi: "Bắt đầu làm bài", zh: "開始測驗" },
  "pl.retake": { vi: "Làm lại bài kiểm tra", zh: "重新測驗" },
  "pl.question": { vi: "Câu", zh: "第" },
  "pl.of": { vi: "/", zh: "／" },
  "pl.prev": { vi: "← Câu trước", zh: "← 上一題" },
  "pl.next": { vi: "Câu sau →", zh: "下一題 →" },
  "pl.submit": { vi: "Nộp bài", zh: "交卷" },
  "pl.submitting": { vi: "Đang chấm…", zh: "批改中…" },
  "pl.unanswered": { vi: "câu chưa trả lời", zh: "題還沒作答" },
  "pl.result.h": { vi: "Kết quả xếp lớp", zh: "分級結果" },
  "pl.result.level": { vi: "Cấp độ của bạn", zh: "你的等級" },
  "pl.result.score": { vi: "Số câu đúng", zh: "答對題數" },
  "pl.result.next": { vi: "Xem bài học của tôi", zh: "看我的課程" },
  "pl.result.byband": { vi: "Đúng theo từng nhóm", zh: "各組答對數" },
  "pl.result.note": {
    vi: "Cấp độ được xác định theo nhóm cao nhất bạn đạt từ 2/3 số câu trở lên. Nếu giáo viên đã đặt cấp độ bằng tay thì kết quả này không ghi đè.",
    zh: "等級取「答對達三分之二」的最高一組。若老師已手動設定等級，測驗結果不會覆蓋。",
  },

  /* ── bài tập / 作業 ── */
  "hw.title": { vi: "Bài tập của bạn", zh: "你的作業" },
  "hw.lede": {
    vi: "Làm xong nộp là chấm ngay. Câu nào sai thì từ trong câu đó tự động vào hàng đợi ôn tập.",
    zh: "交卷立刻批改。答錯的詞會自動進入複習佇列。",
  },
  "hw.due": { vi: "Hạn nộp", zh: "截止" },
  "hw.none": { vi: "Chưa có bài tập nào.", zh: "目前沒有作業。" },
  "hw.status.done": { vi: "đã nộp", zh: "已交" },
  "hw.status.overdue": { vi: "quá hạn", zh: "逾期" },
  "hw.status.todo": { vi: "chưa làm", zh: "未做" },

  /* ── ôn tập / 複習 ── */
  "rv.title": { vi: "Ôn tập", zh: "複習" },
  "rv.empty": { vi: "Không có thẻ nào đến hạn", zh: "今天沒有到期的卡片" },
  "rv.done": { vi: "thẻ hôm nay", zh: "張卡片" },
  "rv.reveal": { vi: "Hiện đáp án", zh: "看答案" },
  "rv.again": { vi: "Quên", zh: "忘記" },
  "rv.hard": { vi: "Khó", zh: "困難" },
  "rv.good": { vi: "Được", zh: "普通" },
  "rv.easy": { vi: "Dễ", zh: "容易" },
  "rv.days": { vi: "ngày", zh: "天後" },

  /* ── giáo viên / 教師端 ── */
  "tc.roster": { vi: "Danh sách lớp", zh: "班級名冊" },
  "tc.student": { vi: "Học viên", zh: "學生" },
  "tc.level": { vi: "Cấp độ", zh: "等級" },
  "tc.setlevel": { vi: "Đổi cấp", zh: "改等級" },
  "tc.lastactive": { vi: "Hoạt động gần nhất", zh: "最近活動" },
  "tc.status": { vi: "Trạng thái", zh: "狀態" },
  "tc.ok": { vi: "Tốt", zh: "正常" },
  "tc.slow": { vi: "Chậm", zh: "落後" },
  "tc.risk": { vi: "Nguy cơ", zh: "有流失風險" },
  "tc.lockmode": { vi: "Chỉ học bài được giao", zh: "只能上指派的課" },
  "tc.lockmode.help": {
    vi: "Bật lên thì học viên trong lớp chỉ mở được bài bạn giao, không tự vào bài khác.",
    zh: "開啟後，班上學生只能開你指派的課，不能自己點其他課。",
  },

  /* ── chung / 通用 ── */
  "common.save": { vi: "Lưu", zh: "儲存" },
  "common.saved": { vi: "Đã lưu", zh: "已儲存" },
  "common.cancel": { vi: "Huỷ", zh: "取消" },
  "common.back": { vi: "Quay lại", zh: "返回" },
  "common.loading": { vi: "Đang tải…", zh: "載入中…" },
  "common.level": { vi: "Cấp", zh: "等級" },
};

export function translate(key: string, lang: UiLang): string {
  const row = DICT[key];
  if (!row) return key; // hiện key thay vì chuỗi rỗng để dễ phát hiện thiếu sót
  return row[lang];
}

/** Nhãn cấp độ hiển thị cho học viên / 給學生看的等級標籤 */
export function levelLabel(level: number, lang: UiLang): string {
  const tocfl = ["準備級", "入門級", "基礎級", "進階級", "高階級", "流利級", "精通級"];
  const name = tocfl[Math.min(Math.max(level, 0), 6)];
  if (lang === "zh") return `${name}（HSK ${Math.min(level, 6)}）`;
  return `Bậc ${level} · TOCFL ${name}`;
}
