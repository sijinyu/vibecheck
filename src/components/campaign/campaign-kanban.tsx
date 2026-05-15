"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InfluencerTierBadge } from "@/components/analysis/influencer-tier-badge";

// ─── Types ───────────────────────────────────────────────────

export type CampaignInfluencerStatus =
  | "shortlisted"
  | "contacted"
  | "negotiating"
  | "confirmed"
  | "active"
  | "completed"
  | "declined";

export interface Influencer {
  id: string;
  handle: string;
  display_name: string | null;
  tier: string | null;
  follower_count: number | null;
  profile_image_url: string | null;
}

export interface CampaignInfluencer {
  id: string;
  influencer_id: string;
  status: CampaignInfluencerStatus;
  notes: string | null;
  agreed_fee_krw: number | null;
  outreach_message: string | null;
  influencer: Influencer;
}

interface CampaignKanbanProps {
  campaignInfluencers: CampaignInfluencer[];
  onStatusChange: (id: string, newStatus: CampaignInfluencerStatus) => void;
  onCardClick: (item: CampaignInfluencer) => void;
}

// ─── Constants ───────────────────────────────────────────────

const STATUS_COLUMNS: Array<{
  key: CampaignInfluencerStatus;
  label: string;
  color: string;
  dotColor: string;
}> = [
  { key: "shortlisted", label: "후보", color: "text-muted-foreground", dotColor: "bg-muted-foreground" },
  { key: "contacted", label: "연락함", color: "text-blue-400", dotColor: "bg-blue-400" },
  { key: "negotiating", label: "협의중", color: "text-amber-400", dotColor: "bg-amber-400" },
  { key: "confirmed", label: "확정", color: "text-emerald-400", dotColor: "bg-emerald-400" },
  { key: "active", label: "진행중", color: "text-violet-400", dotColor: "bg-violet-400" },
  { key: "completed", label: "완료", color: "text-primary", dotColor: "bg-primary" },
  { key: "declined", label: "거절", color: "text-rose-400", dotColor: "bg-rose-400" },
];

const NEXT_STATUS_OPTIONS: Record<CampaignInfluencerStatus, CampaignInfluencerStatus[]> = {
  shortlisted: ["contacted", "declined"],
  contacted: ["negotiating", "declined"],
  negotiating: ["confirmed", "declined"],
  confirmed: ["active", "declined"],
  active: ["completed"],
  completed: [],
  declined: ["shortlisted"],
};

// ─── Helpers ─────────────────────────────────────────────────

function formatFollowerCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function getStatusLabel(status: CampaignInfluencerStatus): string {
  return STATUS_COLUMNS.find((c) => c.key === status)?.label ?? status;
}

// ─── Kanban Card ─────────────────────────────────────────────

interface KanbanCardProps {
  item: CampaignInfluencer;
  onStatusChange: (id: string, newStatus: CampaignInfluencerStatus) => void;
  onCardClick: (item: CampaignInfluencer) => void;
}

function KanbanCard({ item, onStatusChange, onCardClick }: KanbanCardProps) {
  const [expanded, setExpanded] = useState(false);
  const nextStatuses = NEXT_STATUS_OPTIONS[item.status];
  const { influencer } = item;

  function handleCardClick() {
    setExpanded((prev) => !prev);
    onCardClick(item);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-border/50 bg-card/60 p-3 hover:border-border/80 hover:bg-card/80 cursor-pointer transition-colors"
      onClick={handleCardClick}
    >
      {/* Handle + Tier */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">@{influencer.handle}</p>
          {influencer.display_name && (
            <p className="truncate text-[11px] text-muted-foreground">{influencer.display_name}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {influencer.tier && <InfluencerTierBadge tier={influencer.tier} />}
          {item.agreed_fee_krw !== null && (
            <span className="text-[10px] font-semibold tabular-nums text-primary">
              {Math.round(item.agreed_fee_krw / 10000)}만원
            </span>
          )}
        </div>
      </div>

      {/* Follower count */}
      {influencer.follower_count !== null && influencer.follower_count > 0 && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          {formatFollowerCount(influencer.follower_count)} 팔로워
        </p>
      )}

      {/* Notes preview */}
      {item.notes && (
        <p className="mt-1.5 line-clamp-1 text-[11px] italic text-muted-foreground/80">
          &ldquo;{item.notes}&rdquo;
        </p>
      )}

      {/* Fee info */}
      {item.agreed_fee_krw !== null && (
        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="text-emerald-400">확정: {Math.round(item.agreed_fee_krw / 10000).toLocaleString()}만원</span>
        </div>
      )}

      {/* Expanded: status change actions */}
      <AnimatePresence>
        {expanded && nextStatuses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="mt-2.5 overflow-hidden"
          >
            <div className="flex flex-wrap gap-1 border-t border-border/40 pt-2.5">
              <p className="mb-1 w-full text-[10px] text-muted-foreground">상태 변경:</p>
              {nextStatuses.map((status) => (
                <button
                  key={status}
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(item.id, status);
                    setExpanded(false);
                  }}
                  className="rounded-md bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  {getStatusLabel(status)}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expand indicator */}
      <div className="mt-2 flex justify-center">
        {expanded
          ? <ChevronDown className="h-3 w-3 text-muted-foreground/40" />
          : <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
        }
      </div>
    </motion.div>
  );
}

// ─── Column ──────────────────────────────────────────────────

interface KanbanColumnProps {
  status: (typeof STATUS_COLUMNS)[number];
  items: CampaignInfluencer[];
  onStatusChange: (id: string, newStatus: CampaignInfluencerStatus) => void;
  onCardClick: (item: CampaignInfluencer) => void;
}

function KanbanColumn({ status, items, onStatusChange, onCardClick }: KanbanColumnProps) {
  return (
    <div className="flex min-w-[200px] max-w-[220px] shrink-0 flex-col gap-2">
      {/* Column header */}
      <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${status.dotColor}`} />
          <span className={`text-xs font-semibold ${status.color}`}>{status.label}</span>
        </div>
        <Badge
          variant="outline"
          className="h-5 min-w-[20px] border-border/50 bg-transparent px-1.5 text-[10px] text-muted-foreground"
        >
          {items.length}
        </Badge>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <KanbanCard
              key={item.id}
              item={item}
              onStatusChange={onStatusChange}
              onCardClick={onCardClick}
            />
          ))}
        </AnimatePresence>
        {items.length === 0 && (
          <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-border/40 py-6 text-center">
            <Users className="h-4 w-4 text-muted-foreground/30" />
            <p className="text-[11px] text-muted-foreground/40">없음</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────

export function CampaignKanban({ campaignInfluencers, onStatusChange, onCardClick }: CampaignKanbanProps) {
  const grouped = STATUS_COLUMNS.reduce<Record<CampaignInfluencerStatus, CampaignInfluencer[]>>(
    (acc, col) => {
      return { ...acc, [col.key]: campaignInfluencers.filter((ci) => ci.status === col.key) };
    },
    {} as Record<CampaignInfluencerStatus, CampaignInfluencer[]>
  );

  if (campaignInfluencers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card/50 py-14 text-center">
        <div className="rounded-xl bg-muted/50 p-4">
          <Users className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">아직 추가된 인플루언서가 없습니다</p>
        <p className="text-xs text-muted-foreground">추천 탭에서 인플루언서를 캠페인에 추가하세요</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3" style={{ minWidth: "max-content" }}>
        {STATUS_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.key}
            status={col}
            items={grouped[col.key] ?? []}
            onStatusChange={onStatusChange}
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </div>
  );
}
