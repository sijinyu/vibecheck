-- 010: Campaigns + Campaign Influencers
-- Full campaign management system for brand-influencer collaboration

CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid NOT NULL REFERENCES public.brand_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  budget_krw integer,
  brief_content text,
  target_kpi jsonb DEFAULT '{}',
  actual_kpi jsonb DEFAULT '{}',
  start_date date,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.campaign_influencers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  influencer_id uuid NOT NULL REFERENCES public.influencers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'shortlisted',
  outreach_message text,
  collaboration_proposal text,
  agreed_fee_krw integer,
  actual_reach integer,
  actual_engagement integer,
  notes text,
  status_updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, influencer_id)
);

-- RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_influencers ENABLE ROW LEVEL SECURITY;

-- Users can manage their own campaigns
CREATE POLICY "users_manage_own_campaigns" ON public.campaigns
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Service role can access all campaigns
CREATE POLICY "service_role_campaigns" ON public.campaigns
  FOR ALL USING (true) WITH CHECK (true);

-- Users can manage campaign_influencers for their campaigns
CREATE POLICY "users_manage_campaign_influencers" ON public.campaign_influencers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_influencers.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = campaign_influencers.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Service role can access all campaign_influencers
CREATE POLICY "service_role_campaign_influencers" ON public.campaign_influencers
  FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_brand ON public.campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_influencers_campaign ON public.campaign_influencers(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_influencers_influencer ON public.campaign_influencers(influencer_id);
CREATE INDEX IF NOT EXISTS idx_campaign_influencers_status ON public.campaign_influencers(status);
