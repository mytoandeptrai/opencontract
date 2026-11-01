import { createFileRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { WorkspaceProvider } from "@/hooks/use-workspace";
import { WalletProvider } from "@/hooks/use-wallet";
import { AppShell } from "@/components/oc/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OpenContract — Tương tác smart contract EVM" },
      { name: "description", content: "Gọi hàm smart contract trên mọi chain EVM bằng ABI và RPC của bạn, không cần verify. Dữ liệu chỉ trong RAM." },
      { property: "og:title", content: "OpenContract — Tương tác smart contract EVM" },
      { property: "og:description", content: "Đọc và ghi smart contract chưa verify với ABI, RPC riêng và browser wallet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <WorkspaceProvider>
      <WalletProvider>
        <AppShell />
        <Toaster theme="dark" position="bottom-right" />
      </WalletProvider>
    </WorkspaceProvider>
  );
}
