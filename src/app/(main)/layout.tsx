import { type ReactNode } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-end px-4 py-3">
        <SignOutButton />
      </header>
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
