import type { MetadataRoute } from "next";

/**
 * Cho phép học viên "Thêm vào màn hình chính" trên điện thoại.
 * Mở ra sẽ chạy toàn màn hình như một ứng dụng, không có thanh địa chỉ.
 *
 * 讓學生把網站「加到主畫面」，開啟後全螢幕執行，看起來就像 App，
 * 不用上架 App Store，也不用學生下載任何東西。
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QNA Chinese — Tiếng Trung Quyên Huỳnh",
    short_name: "QNA Chinese",
    description:
      "Học tiếng Trung bằng lợi thế từ Hán-Việt của người Việt. Bài học, bài tập và ôn tập ở cùng một nơi.",
    lang: "vi",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#EDEDE6",
    theme_color: "#B93327",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    categories: ["education"],
  };
}
