"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleSignOut}
      className="h-8 w-8 text-muted-foreground hover:text-foreground"
      aria-label="로그아웃"
    >
      <LogOut className="h-4 w-4" />
    </Button>
  );
}
