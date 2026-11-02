import { SITE } from "@/lib/site";
import type { BilingualPage } from "./types";

export const privacy: BilingualPage = {
  en: {
    title: "Privacy Policy | OpenContract",
    description: "OpenContract stores no user data. Learn what stays in your browser and which third parties your requests reach.",
    heading: "Privacy Policy",
    intro: "OpenContract is designed to store nothing about you. This page explains exactly what happens to your data.",
    sections: [
      {
        heading: "What we collect",
        paragraphs: [
          "Nothing. OpenContract has no accounts, no backend database, no analytics and no tracking. We do not use localStorage, sessionStorage, IndexedDB or cookies to keep your data.",
        ],
      },
      {
        heading: "What stays in your browser",
        paragraphs: [
          "Networks, RPC URLs, contract addresses, ABIs, call inputs and results live only in the memory of the current browser tab. Reloading or closing the page clears them permanently.",
        ],
      },
      {
        heading: "Third parties your requests reach",
        paragraphs: ["Using the app sends network requests to services that are not operated by OpenContract:"],
        list: [
          "The RPC endpoints you configure receive your read calls, your IP address and anything else their operator logs.",
          "Your browser wallet (EIP-1193) handles your account and signs write transactions under its own privacy policy.",
          "Transactions you send are public on the blockchain.",
          "The hosting provider (Lovable, served through Cloudflare) receives standard request data such as your IP address and may set a short-lived security cookie to protect against bots.",
          "Fonts are loaded from Google Fonts, which receives standard request data.",
        ],
      },
      {
        heading: "Children",
        paragraphs: ["OpenContract is a developer tool and is not directed to children."],
      },
      {
        heading: "Changes",
        paragraphs: ["If this policy changes, the updated version will be published on this page with a new date."],
      },
      {
        heading: "Contact",
        paragraphs: [`Questions about privacy: ${SITE.email}.`],
      },
    ],
  },
  vi: {
    title: "Chính sách quyền riêng tư | OpenContract",
    description: "OpenContract không lưu dữ liệu người dùng. Tìm hiểu những gì nằm trong trình duyệt và bên thứ ba nào nhận request của bạn.",
    heading: "Chính sách quyền riêng tư",
    intro: "OpenContract được thiết kế để không lưu gì về bạn. Trang này giải thích chính xác dữ liệu của bạn đi đâu.",
    sections: [
      {
        heading: "Chúng tôi thu thập gì",
        paragraphs: [
          "Không gì cả. OpenContract không có tài khoản, không có database backend, không analytics và không theo dõi. Chúng tôi không dùng localStorage, sessionStorage, IndexedDB hay cookie để lưu dữ liệu của bạn.",
        ],
      },
      {
        heading: "Những gì nằm trong trình duyệt",
        paragraphs: [
          "Network, RPC URL, địa chỉ contract, ABI, tham số và kết quả gọi hàm chỉ nằm trong bộ nhớ của tab hiện tại. Tải lại hoặc đóng trang sẽ xóa vĩnh viễn.",
        ],
      },
      {
        heading: "Bên thứ ba nhận request của bạn",
        paragraphs: ["Khi dùng ứng dụng, trình duyệt gửi request tới các dịch vụ không do OpenContract vận hành:"],
        list: [
          "RPC endpoint bạn cấu hình nhận các lệnh đọc, địa chỉ IP của bạn và bất cứ thứ gì nhà vận hành ghi log.",
          "Browser wallet (EIP-1193) quản lý tài khoản và ký giao dịch ghi theo chính sách riêng của nó.",
          "Giao dịch bạn gửi là công khai trên blockchain.",
          "Nhà cung cấp hosting (Lovable, phục vụ qua Cloudflare) nhận dữ liệu request tiêu chuẩn như địa chỉ IP và có thể đặt một cookie bảo mật ngắn hạn để chống bot.",
          "Font được tải từ Google Fonts, nơi nhận dữ liệu request tiêu chuẩn.",
        ],
      },
      {
        heading: "Trẻ em",
        paragraphs: ["OpenContract là công cụ cho lập trình viên và không hướng tới trẻ em."],
      },
      {
        heading: "Thay đổi",
        paragraphs: ["Nếu chính sách này thay đổi, phiên bản mới sẽ được đăng trên trang này kèm ngày cập nhật."],
      },
      {
        heading: "Liên hệ",
        paragraphs: [`Câu hỏi về quyền riêng tư: ${SITE.email}.`],
      },
    ],
  },
};
