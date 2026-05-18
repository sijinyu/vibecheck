"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Check, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { TranslationKey } from "@/lib/i18n/translations";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

const FREE_FEATURES: { key: TranslationKey; included: boolean }[] = [
  { key: "usage.freeFeature.analysis", included: true },
  { key: "usage.freeFeature.brand", included: true },
  { key: "usage.freeFeature.outreach", included: true },
  { key: "usage.freeFeature.recommendations", included: true },
  { key: "usage.freeFeature.pdf", included: true },
];

const PRO_FEATURES: { key: TranslationKey; included: boolean }[] = [
  { key: "usage.proFeature.analysis", included: true },
  { key: "usage.proFeature.brand", included: true },
  { key: "usage.proFeature.outreach", included: true },
  { key: "usage.proFeature.recommendations", included: true },
  { key: "usage.proFeature.priority", included: true },
];

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const { t } = useI18n();

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("usage.upgradeTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("usage.upgradeDesc")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {/* Free column */}
          <div className="rounded-lg border border-border/50 p-4">
            <h3 className="mb-3 text-sm font-semibold">{t("usage.free")}</h3>
            <ul className="space-y-2">
              {FREE_FEATURES.map((f) => (
                <li
                  key={f.key}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  {f.included ? (
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-green-500" />
                  ) : (
                    <X className="mt-0.5 h-3 w-3 shrink-0 text-red-400" />
                  )}
                  {t(f.key)}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro column */}
          <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
            <div className="mb-3 flex items-baseline gap-2">
              <h3 className="text-sm font-semibold text-primary">{t("usage.pro")}</h3>
              <span className="text-xs text-muted-foreground">
                {t("usage.proPrice")}
              </span>
            </div>
            <ul className="space-y-2">
              {PRO_FEATURES.map((f) => (
                <li
                  key={f.key}
                  className="flex items-start gap-2 text-xs"
                >
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                  {t(f.key)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>{t("usage.close")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              window.open("https://tally.so/r/w4jBqp", "_blank");
              onClose();
            }}
          >
            {t("usage.upgradeCta")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
