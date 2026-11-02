import { SITE } from "@/lib/site";
import type { BilingualPage } from "./types";

export const about: BilingualPage = {
  en: {
    title: "About OpenContract: Interact with Unverified Smart Contracts",
    description:
      "OpenContract turns any ABI into a UI so you can call smart contract functions without verification, on any EVM chain with a custom RPC. Free, RAM-only, a lightweight Remix alternative.",
    heading: "About OpenContract",
    intro:
      "OpenContract lets you interact with unverified smart contracts directly in your browser. Paste an ABI, enter the contract address, pick your network, and every function becomes a form you can read or write instantly.",
    sections: [
      {
        heading: "The problem",
        paragraphs: [
          "You just deployed a contract, but it is not verified yet, or the block explorer is too slow to index it. The explorer's Read and Write Contract tabs are not available, so you fall back to the CLI, ad-hoc scripts, or Remix.",
          "OpenContract removes that friction: you can call smart contract functions without verification, as soon as the contract is on chain.",
        ],
      },
      {
        heading: "How it works",
        list: [
          "Add a network: any EVM chain, with your own chain ID and custom RPC URL. The real chain ID is checked against the RPC.",
          "Add a contract: the address (proxies included) and the ABI JSON or a Hardhat/Foundry artifact.",
          "Read and write: view and pure functions run over the RPC without a wallet. Write calls go through your browser wallet and are sent only after you confirm.",
        ],
      },
      {
        heading: "Features",
        list: [
          "ABI contract UI generated automatically from your ABI.",
          "Custom RPC contract reader for any EVM network, including testnets, devnets and private chains.",
          "Works with any EIP-1193 wallet such as MetaMask or Rabby.",
          "Events panel to inspect contract events.",
          "English and Vietnamese interface.",
        ],
      },
      {
        heading: "Privacy by design",
        paragraphs: [
          "Zero user data is stored. Networks, contracts and ABIs live only in the memory of the current tab. Reload or close the page and everything is gone. There is no account, no backend and no analytics.",
        ],
      },
    ],
    author: {
      heading: "About the author",
      role: `${SITE.author.jobTitle}, Fullstack Blockchain · Da Nang, Vietnam`,
      bio: [
        "I'm a software engineer with 5 years of experience building production web and blockchain systems, from React/Next.js frontends to NestJS and Go backends and Solidity smart contracts. I currently lead a team delivering stablecoin, cross-chain bridge, token-migration and crypto-payment products across multiple EVM chains.",
        "OpenContract came out of that work: after deploying many contracts that weren't verified yet, I wanted a faster way to call them than the CLI or Remix. It started as a personal tool, my teammates started using it, and now it is free for everyone.",
      ],
    },
    faq: [
      {
        q: "Can I interact with an unverified contract?",
        a: "Yes. OpenContract only needs the contract address and its ABI. Verification on a block explorer is not required.",
      },
      {
        q: "Can I call smart contract functions without verification?",
        a: "Yes. Read functions are called directly over the RPC, and write functions are signed by your wallet. Neither depends on explorer verification or indexing.",
      },
      {
        q: "Is OpenContract a Remix alternative?",
        a: "For calling contracts that are already deployed, yes. It is lighter than Remix: no compiling, no workspace setup, just an ABI and an address.",
      },
      {
        q: "Which networks are supported?",
        a: "Any EVM-compatible chain. You add it yourself with a chain ID and a custom RPC URL.",
      },
      {
        q: "Is my data stored anywhere?",
        a: "No. Everything stays in your browser tab's memory and is cleared on reload. Nothing is sent to an OpenContract server.",
      },
      {
        q: "Is it free?",
        a: "Yes, OpenContract is free to use.",
      },
    ],
  },
  vi: {
    title: "Giới thiệu OpenContract: Tương tác với smart contract chưa verify",
    description:
      "OpenContract biến ABI thành giao diện để gọi hàm smart contract không cần verify, trên mọi chain EVM với RPC tùy chỉnh. Miễn phí, chỉ lưu trong RAM.",
    heading: "Giới thiệu OpenContract",
    intro:
      "OpenContract giúp bạn tương tác với smart contract chưa verify ngay trên trình duyệt. Dán ABI, nhập địa chỉ contract, chọn network, và mọi hàm trở thành form để đọc hoặc ghi ngay lập tức.",
    sections: [
      {
        heading: "Vấn đề",
        paragraphs: [
          "Bạn vừa deploy một contract nhưng chưa verify, hoặc block explorer index quá chậm. Tab Read và Write Contract trên explorer không dùng được, nên bạn phải quay về CLI, script tạm hoặc Remix.",
          "OpenContract xóa bỏ phiền phức đó: bạn có thể gọi hàm smart contract mà không cần verify, ngay khi contract đã lên chain.",
        ],
      },
      {
        heading: "Cách hoạt động",
        list: [
          "Thêm network: bất kỳ chain EVM nào, với chain ID và RPC URL riêng. Chain ID thực tế sẽ được kiểm tra với RPC.",
          "Thêm contract: địa chỉ (kể cả proxy) và ABI JSON hoặc artifact Hardhat/Foundry.",
          "Đọc và ghi: hàm view/pure chạy qua RPC không cần wallet. Hàm ghi dùng browser wallet và chỉ gửi khi bạn xác nhận.",
        ],
      },
      {
        heading: "Tính năng",
        list: [
          "Tự tạo giao diện contract từ ABI.",
          "Đọc contract qua RPC tùy chỉnh trên mọi network EVM, kể cả testnet, devnet và chain riêng.",
          "Hỗ trợ mọi wallet EIP-1193 như MetaMask hoặc Rabby.",
          "Panel events để xem event của contract.",
          "Giao diện tiếng Anh và tiếng Việt.",
        ],
      },
      {
        heading: "Quyền riêng tư từ thiết kế",
        paragraphs: [
          "Không lưu bất kỳ dữ liệu người dùng nào. Network, contract và ABI chỉ nằm trong bộ nhớ của tab hiện tại. Tải lại hoặc đóng trang là mọi thứ biến mất. Không tài khoản, không backend, không analytics.",
        ],
      },
    ],
    author: {
      heading: "Về tác giả",
      role: `${SITE.author.jobTitle}, Fullstack Blockchain · Đà Nẵng, Việt Nam`,
      bio: [
        "Tôi là kỹ sư phần mềm với 5 năm kinh nghiệm xây dựng hệ thống web và blockchain chạy production, từ frontend React/Next.js, backend NestJS và Go đến smart contract Solidity. Hiện tôi dẫn dắt một team phát triển các sản phẩm stablecoin, cross-chain bridge, migration token và thanh toán crypto trên nhiều chain EVM.",
        "OpenContract ra đời từ chính công việc đó: sau khi deploy rất nhiều contract chưa verify, tôi muốn có cách gọi chúng nhanh hơn CLI hay Remix. Ban đầu là công cụ cá nhân, sau đó đồng đội cùng dùng, và giờ miễn phí cho tất cả mọi người.",
      ],
    },
    faq: [
      {
        q: "Có thể tương tác với contract chưa verify không?",
        a: "Có. OpenContract chỉ cần địa chỉ contract và ABI. Không cần verify trên block explorer.",
      },
      {
        q: "Có thể gọi hàm smart contract mà không cần verify không?",
        a: "Có. Hàm đọc được gọi trực tiếp qua RPC, hàm ghi được ký bằng wallet của bạn. Cả hai không phụ thuộc vào việc verify hay index của explorer.",
      },
      {
        q: "OpenContract có thay thế được Remix không?",
        a: "Với việc gọi contract đã deploy thì có. Nó nhẹ hơn Remix: không cần compile, không cần setup workspace, chỉ cần ABI và địa chỉ.",
      },
      {
        q: "Hỗ trợ những network nào?",
        a: "Mọi chain tương thích EVM. Bạn tự thêm bằng chain ID và RPC URL tùy chỉnh.",
      },
      {
        q: "Dữ liệu của tôi có được lưu ở đâu không?",
        a: "Không. Mọi thứ chỉ nằm trong bộ nhớ của tab trình duyệt và bị xóa khi tải lại. Không có gì được gửi tới server của OpenContract.",
      },
      {
        q: "Có miễn phí không?",
        a: "Có, OpenContract miễn phí.",
      },
    ],
  },
};
