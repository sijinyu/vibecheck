import { type ReactNode } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SideNav } from "@/components/layout/side-nav";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <SideNav />
      <div className="flex flex-1 flex-col lg:pl-56">
        <header className="flex items-center justify-end px-4 py-3 lg:px-8">
          <SignOutButton />
        </header>
        <main className="flex-1 pb-20 lg:pb-8">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
