"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  Palette,
  GitCompareArrows,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { useI18n } from "@/lib/i18n/context";
import { type TranslationKey } from "@/lib/i18n/translations";

const navItems = [
  { href: "/analyze", labelKey: "nav.discover" as TranslationKey, icon: Search },
  { href: "/brand", labelKey: "nav.brand" as TranslationKey, icon: Palette },
  { href: "/compare", labelKey: "nav.compare" as TranslationKey, icon: GitCompareArrows },
  { href: "/dashboard", labelKey: "nav.dashboard" as TranslationKey, icon: LayoutDashboard },
] as const;

export function SideNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-56 border-r border-border/50 bg-background/80 backdrop-blur-xl lg:flex lg:flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <span className="text-lg font-bold tracking-tight">
          Vibe<span className="text-primary">Check</span>
        </span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ href, labelKey, icon: Icon }) => {
          const isActive = pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-indicator"
                  className="absolute inset-0 rounded-lg bg-primary/10"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <Icon className="relative h-5 w-5" />
              <span className="relative font-medium">{t(labelKey)}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="flex items-center gap-1 border-t border-border/50 px-3 py-3">
        <ThemeToggle />
        <LocaleToggle />
      </div>
    </aside>
  );
}
