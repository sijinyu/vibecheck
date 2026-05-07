"use client";

import Link from "next/link";
import { type Variants, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileCard } from "@/components/analysis/profile-card";
import { Sparkles, Eye, Palette, Search, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Eye,
    title: "Aesthetic Score",
    description: "인플루언서 피드를 AI가 분석하여 미적 감도를 0-100으로 정량화",
  },
  {
    icon: Palette,
    title: "Brand Fit Score",
    description: "브랜드 톤과 인플루언서 스타일의 매칭도를 자동 산출",
  },
  {
    icon: Search,
    title: "Vibe Search",
    description: "무드 이미지를 업로드하면 매칭되는 인플루언서를 추천",
  },
];

const demoData = {
  handle: "studio_muse",
  platform: "instagram" as const,
  displayName: "Studio Muse",
  aestheticScore: 87,
  scores: {
    color: 92,
    composition: 85,
    toneConsistency: 88,
    trend: 78,
    brandFit: 91,
  },
  category: "Fashion & Lifestyle",
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
  return (
    <motion.div
      className="flex min-h-screen flex-col"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero */}
      <section className="flex flex-col items-center px-4 pt-20 pb-12">
        <motion.div
          variants={itemVariants}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary"
        >
          <Sparkles className="h-3 w-3" />
          AI-Powered Influencer Analysis
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="mt-6 text-center text-4xl font-bold tracking-tight"
        >
          숫자가 아닌
          <br />
          <span className="text-primary">결</span>을 본다
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="mt-4 max-w-xs text-center text-sm leading-relaxed text-muted-foreground"
        >
          인플루언서의 미적 감도를 AI로 정량화하고,
          <br />
          브랜드 톤과 자동 매칭합니다
        </motion.p>

        <motion.div variants={itemVariants} className="mt-8">
          <Link href="/login">
            <Button size="lg" className="gap-2 px-6">
              시작하기
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Demo Result */}
      <section className="mx-auto w-full max-w-lg px-4 pb-12">
        <motion.div variants={itemVariants}>
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Demo Analysis Result
          </p>
          <ProfileCard {...demoData} />
        </motion.div>
      </section>

      {/* Moodboard Preview */}
      <section className="mx-auto w-full max-w-lg px-4 pb-12">
        <motion.div variants={itemVariants}>
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Representative Moodboard
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
          Key Features
        </motion.p>
        {features.map((feature) => (
          <motion.div key={feature.title} variants={itemVariants}>
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="flex items-start gap-4 py-4">
                <div className="shrink-0 rounded-lg bg-primary/10 p-2.5">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{feature.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      {/* Bottom CTA */}
      <section className="mx-auto w-full max-w-lg px-4 pb-16">
        <motion.div variants={itemVariants} className="text-center">
          <Link href="/login">
            <Button variant="outline" size="lg" className="gap-2">
              무료로 시작하기
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <p className="mt-3 text-xs text-muted-foreground/60">
            가입 없이 데모를 먼저 경험해보세요
          </p>
        </motion.div>
      </section>
    </motion.div>
  );
}
