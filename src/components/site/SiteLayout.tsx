import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MainNav } from "./MainNav";
import { InstitutionalSidebar } from "./InstitutionalSidebar";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      <MainNav />
      <div className="container mx-auto px-4 py-6 flex-1 w-full">
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <main className="min-w-0">{children}</main>
          <div className="lg:block">
            <InstitutionalSidebar />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
