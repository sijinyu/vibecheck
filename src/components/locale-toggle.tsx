"use client";

import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export function LocaleToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() => setLocale(locale === "ko" ? "en" : "ko")}
      title={locale === "ko" ? "English" : "한국어"}
    >
      <Languages className="h-4 w-4" />
      <span className="sr-only">{locale === "ko" ? "English" : "한국어"}</span>
    </Button>
  );
}
