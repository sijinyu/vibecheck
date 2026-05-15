"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/layout/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Palette, Plus, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

interface BrandItem {
  id: string;
  name: string;
  handle: string | null;
  platform: string | null;
  description: string | null;
  preferred_tiers: string[];
  target_categories: string[];
  brand_keywords: string[];
  brand_positioning: string | null;
  created_at: string;
}

export default function BrandsPage() {
  const { t, locale } = useI18n();
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/brand");
      const json = await res.json();
      if (res.ok && json.data) {
        setBrands(json.data);
      }
    } catch {
      toast.error(t("common.error.network"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  return (
    <PageTransition className="mx-auto w-full max-w-lg px-4 pt-12 pb-24 lg:max-w-4xl lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{t("brands.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("brands.subtitle")}
          </p>
        </div>
        <Link href="/brands/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            {t("brands.addBrand")}
          </Button>
        </Link>
      </div>

      {loading && (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {!loading && brands.length === 0 && (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <div className="rounded-xl bg-primary/10 p-4">
              <Palette className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{t("brands.empty")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("brands.emptyDesc")}
              </p>
            </div>
            <Link href="/brands/new">
              <Button size="sm" className="gap-2">
                <Plus className="h-3.5 w-3.5" />
                {t("brands.addBrand")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {!loading && brands.length > 0 && (
        <div className="grid gap-3 lg:grid-cols-2">
          {brands.map((brand, i) => (
            <motion.div
              key={brand.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/brands/${brand.id}`}>
                <Card className="group cursor-pointer border-border/50 bg-card/50 transition-all hover:bg-card/80 hover:border-border/80 hover:shadow-sm">
                  <CardContent className="p-4">
                    {/* Header row */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                        {brand.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate">{brand.name}</p>
                          {brand.platform && (
                            <span className="shrink-0 rounded border border-border/40 bg-muted/30 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {brand.platform === "instagram" ? "IG" : "TT"}
                            </span>
                          )}
                        </div>
                        {brand.handle && (
                          <p className="text-xs text-muted-foreground">@{brand.handle}</p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/30 transition-all group-hover:text-foreground/60 group-hover:translate-x-0.5" />
                    </div>

                    {/* Description */}
                    {brand.description && (
                      <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                        {brand.description}
                      </p>
                    )}
                    {!brand.description && brand.brand_positioning && (
                      <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                        {brand.brand_positioning}
                      </p>
                    )}

                    {/* Tags row */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {brand.target_categories.slice(0, 3).map((cat) => (
                        <span
                          key={cat}
                          className="rounded-md bg-primary/8 px-1.5 py-0.5 text-[10px] font-medium text-primary/70"
                        >
                          {cat}
                        </span>
                      ))}
                      {brand.preferred_tiers.slice(0, 2).map((tier) => (
                        <span
                          key={tier}
                          className="rounded-md border border-border/40 bg-muted/30 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                          {tier}
                        </span>
                      ))}
                      {brand.brand_keywords && brand.brand_keywords.length > 0 && (
                        <span className="text-[10px] text-muted-foreground/50">
                          +{brand.brand_keywords.length} {t("brands.keywords")}
                        </span>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="mt-2.5 flex items-center justify-between">
                      <p className="text-[10px] text-muted-foreground/60">
                        {new Date(brand.created_at).toLocaleDateString(
                          locale === "ko" ? "ko-KR" : "en-US"
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
