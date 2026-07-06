import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MainNav } from "./MainNav";
import { InstitutionalSidebar } from "./InstitutionalSidebar";
import { ApprovalNoticeModal } from "./ApprovalNoticeModal";
import { QuotesPanelProvider, useQuotesPanel } from "@/lib/quotes-panel";

function LayoutInner({ children }: { children: ReactNode }) {
  const { expanded } = useQuotesPanel();
  return (
    <div className="container mx-auto px-4 py-6 flex-1 w-full">
      <div
        className={
          expanded
            ? "grid gap-6 lg:grid-cols-[minmax(0,20rem)_1fr]"
            : "grid gap-6 lg:grid-cols-[1fr_20rem]"
        }
      >
        <main className="min-w-0 order-1">{children}</main>
        <div className="hidden lg:block order-2 min-w-0">
          <InstitutionalSidebar />
        </div>
      </div>
    </div>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <QuotesPanelProvider>
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        <MainNav />
        <LayoutInner>{children}</LayoutInner>
        <Footer />
        <ApprovalNoticeModal />
      </div>
    </QuotesPanelProvider>
  );
}
