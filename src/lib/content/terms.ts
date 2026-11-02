import { SITE } from "@/lib/site";
import type { BilingualPage } from "./types";

export const terms: BilingualPage = {
  en: {
    title: "Terms of Use | OpenContract",
    description: "Terms of use for OpenContract, a free browser tool to interact with EVM smart contracts. Provided as is; you are responsible for your transactions.",
    heading: "Terms of Use",
    intro: "By using OpenContract you agree to these terms. If you do not agree, please do not use the app.",
    sections: [
      {
        heading: "The service",
        paragraphs: [
          "OpenContract is a free, client-side tool that builds a user interface from a smart contract ABI and sends requests to the RPC endpoints and wallet you choose. It does not hold your keys or funds.",
        ],
      },
      {
        heading: "Your responsibility",
        list: [
          "You are solely responsible for the networks, RPC endpoints, contracts and ABIs you use.",
          "Every write transaction is signed by your own wallet. Review each transaction before confirming it. Blockchain transactions are irreversible.",
          "Unverified contracts may be malicious. Only interact with contracts you trust.",
          "You are responsible for keeping your wallet, private keys and seed phrase secure.",
        ],
      },
      {
        heading: "No warranty",
        paragraphs: [
          "OpenContract is provided \"as is\" and \"as available\", without warranties of any kind. We do not guarantee that it is error-free, uninterrupted, or that decoded data and results are accurate.",
        ],
      },
      {
        heading: "Limitation of liability",
        paragraphs: [
          "To the maximum extent permitted by law, the author is not liable for any loss of funds, tokens, data or profits, failed or unintended transactions, or any other damages arising from your use of OpenContract.",
        ],
      },
      {
        heading: "Acceptable use",
        paragraphs: ["Do not use OpenContract for illegal activity or to harm other people, networks or services."],
      },
      {
        heading: "Software license",
        paragraphs: ["The OpenContract source code is released under the MIT License."],
      },
      {
        heading: "Changes",
        paragraphs: ["These terms may change. The updated version will be published on this page with a new date."],
      },
      {
        heading: "Contact",
        paragraphs: [`Questions about these terms: ${SITE.email}.`],
      },
    ],
  },
  vi: {
    title: "Điều khoản sử dụng | OpenContract",
    description: "Điều khoản sử dụng OpenContract, công cụ miễn phí trên trình duyệt để tương tác với smart contract EVM. Cung cấp nguyên trạng; bạn chịu trách nhiệm về giao dịch của mình.",
    heading: "Điều khoản sử dụng",
    intro: "Khi sử dụng OpenContract, bạn đồng ý với các điều khoản này. Nếu không đồng ý, vui lòng không sử dụng ứng dụng.",
    sections: [
      {
        heading: "Dịch vụ",
        paragraphs: [
          "OpenContract là công cụ miễn phí chạy phía client, tạo giao diện từ ABI của smart contract và gửi request tới RPC endpoint và wallet do bạn chọn. Ứng dụng không giữ khóa hay tài sản của bạn.",
        ],
      },
      {
        heading: "Trách nhiệm của bạn",
        list: [
          "Bạn hoàn toàn chịu trách nhiệm về network, RPC endpoint, contract và ABI mình sử dụng.",
          "Mọi giao dịch ghi đều do wallet của bạn ký. Hãy kiểm tra kỹ từng giao dịch trước khi xác nhận. Giao dịch blockchain không thể đảo ngược.",
          "Contract chưa verify có thể độc hại. Chỉ tương tác với contract bạn tin tưởng.",
          "Bạn chịu trách nhiệm bảo vệ wallet, private key và seed phrase của mình.",
        ],
      },
      {
        heading: "Không bảo đảm",
        paragraphs: [
          "OpenContract được cung cấp \"nguyên trạng\" và \"tùy theo khả năng sẵn có\", không kèm bất kỳ bảo đảm nào. Chúng tôi không bảo đảm ứng dụng không có lỗi, không bị gián đoạn, hay dữ liệu giải mã và kết quả luôn chính xác.",
        ],
      },
      {
        heading: "Giới hạn trách nhiệm",
        paragraphs: [
          "Trong phạm vi tối đa pháp luật cho phép, tác giả không chịu trách nhiệm cho bất kỳ tổn thất nào về tiền, token, dữ liệu hay lợi nhuận, giao dịch thất bại hoặc ngoài ý muốn, hay mọi thiệt hại khác phát sinh từ việc bạn sử dụng OpenContract.",
        ],
      },
      {
        heading: "Sử dụng hợp lệ",
        paragraphs: ["Không sử dụng OpenContract cho hoạt động bất hợp pháp hoặc gây hại cho người khác, network hay dịch vụ khác."],
      },
      {
        heading: "Giấy phép phần mềm",
        paragraphs: ["Mã nguồn OpenContract được phát hành theo giấy phép MIT."],
      },
      {
        heading: "Thay đổi",
        paragraphs: ["Các điều khoản này có thể thay đổi. Phiên bản mới sẽ được đăng trên trang này kèm ngày cập nhật."],
      },
      {
        heading: "Liên hệ",
        paragraphs: [`Câu hỏi về điều khoản: ${SITE.email}.`],
      },
    ],
  },
};
