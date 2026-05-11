"use client";

import Link from "next/link";
import { type Variants, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileCard } from "@/components/analysis/profile-card";
import { Sparkles, Eye, Palette, Search, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { useI18n } from "@/lib/i18n/context";

const featureIcons = [Eye, Palette, Search] as const;
const featureKeys = [
  { title: "landing.feature.vibeScore.title", desc: "landing.feature.vibeScore.desc" },
  { title: "landing.feature.brandMatching.title", desc: "landing.feature.brandMatching.desc" },
  { title: "landing.feature.vibeSearch.title", desc: "landing.feature.vibeSearch.desc" },
] as const;

const demoData = {
  handle: "studio_muse",
  platform: "instagram" as const,
  displayName: "Studio Muse",
  aestheticScore: 85,
  vibeScore: 87,
  tier: "micro",
  engagementRate: 0.042,
  scores: {
    color: 92,
    composition: 85,
    toneConsistency: 88,
    trend: 78,
    brandFit: 91,
  },
  category: "Fashion & Lifestyle",
  linkable: false,
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export default function LandingPage() {
  const { t } = useI18n();

  return (
    <motion.div
      className="flex min-h-screen flex-col"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Top bar */}
      <div className="fixed right-4 top-4 z-50 flex items-center gap-1">
        <LocaleToggle />
        <ThemeToggle />
      </div>

      {/* Hero */}
      <section className="flex flex-col items-center px-4 pt-20 pb-12">
        <motion.div
          variants={itemVariants}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary"
        >
          <Sparkles className="h-3 w-3" />
          {t("landing.badge")}
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="mt-6 text-center text-4xl font-bold tracking-tight"
        >
          {t("landing.hero.line1")}
          <br />
          <span className="text-primary">{t("landing.hero.accent")}</span>
          {t("landing.hero.line1end")}
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="mt-4 max-w-xs text-center text-sm leading-relaxed text-muted-foreground"
        >
          {t("landing.hero.desc")}
        </motion.p>

        <motion.div variants={itemVariants} className="mt-8">
          <Link href="/login">
            <Button size="lg" className="gap-2 px-6">
              {t("landing.cta")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Demo Result */}
      <section className="mx-auto w-full max-w-lg px-4 pb-12">
        <motion.div variants={itemVariants}>
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("landing.demoLabel")}
          </p>
          <ProfileCard {...demoData} />
        </motion.div>
      </section>

      {/* Moodboard Preview */}
      <section className="mx-auto w-full max-w-lg px-4 pb-12">
        <motion.div variants={itemVariants}>
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("landing.moodboardLabel")}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              "bg-gradient-to-br from-rose-900/40 to-pink-800/30",
              "bg-gradient-to-br from-violet-900/40 to-purple-800/30",
              "bg-gradient-to-br from-amber-900/40 to-orange-800/30",
              "bg-gradient-to-br from-emerald-900/40 to-teal-800/30",
              "bg-gradient-to-br from-sky-900/40 to-blue-800/30",
              "bg-gradient-to-br from-fuchsia-900/40 to-pink-800/30",
            ].map((gradient, i) => (
              <motion.div
                key={i}
                className={`aspect-square rounded-xl border border-border/30 ${gradient}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + i * 0.08, duration: 0.4 }}
              />
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-lg space-y-3 px-4 pb-20">
        <motion.p
          variants={itemVariants}
          className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          {t("landing.featuresLabel")}
        </motion.p>
        {featureKeys.map((feature, idx) => {
          const Icon = featureIcons[idx];
          return (
            <motion.div key={feature.title} variants={itemVariants}>
              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardContent className="flex items-start gap-4 py-4">
                  <div className="shrink-0 rounded-lg bg-primary/10 p-2.5">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t(feature.title)}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {t(feature.desc)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto w-full max-w-lg px-4 pb-16">
        <motion.div variants={itemVariants} className="text-center">
          <Link href="/login">
            <Button variant="outline" size="lg" className="gap-2">
              {t("landing.ctaFree")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <p className="mt-3 text-xs text-muted-foreground/60">
            {t("landing.ctaDemo")}
          </p>
        </motion.div>
      </section>
    </motion.div>
  );
}
