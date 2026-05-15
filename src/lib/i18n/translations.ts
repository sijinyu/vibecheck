export type Locale = "ko" | "en";

const translations = {
  // Navigation
  "nav.discover": { ko: "Discover", en: "Discover" },
  "nav.brand": { ko: "Brand", en: "Brand" },
  "nav.compare": { ko: "Compare", en: "Compare" },
  "nav.dashboard": { ko: "Dashboard", en: "Dashboard" },

  // Landing
  "landing.badge": { ko: "AI 인플루언서 분석 플랫폼", en: "AI Influencer Analytics Platform" },
  "landing.hero.line1": { ko: "숫자가 아닌", en: "See the" },
  "landing.hero.accent": { ko: "결", en: "vibe" },
  "landing.hero.line1end": { ko: "을 본다", en: ", not numbers" },
  "landing.hero.desc": {
    ko: "인플루언서의 5차원 VibeScore를 AI로 산출하고, 브랜드 톤과 자동 매칭합니다",
    en: "Calculate 5-dimensional VibeScore with AI and auto-match with brand tone",
  },
  "landing.cta": { ko: "시작하기", en: "Get Started" },
  "landing.ctaFree": { ko: "무료로 시작하기", en: "Start for Free" },
  "landing.ctaDemo": { ko: "가입 없이 데모를 먼저 경험해보세요", en: "Try the demo without signing up" },
  "landing.demoLabel": { ko: "데모 분석 결과", en: "Demo Analysis Result" },
  "landing.moodboardLabel": { ko: "대표 무드보드", en: "Representative Moodboard" },
  "landing.featuresLabel": { ko: "주요 기능", en: "Key Features" },
  "landing.feature.vibeScore.title": { ko: "VibeScore", en: "VibeScore" },
  "landing.feature.vibeScore.desc": {
    ko: "미적 감도·참여율·일관성·성장성·진정성 5차원 AI 분석으로 0-100 복합 점수 산출",
    en: "5-dimensional AI analysis (aesthetics, engagement, consistency, growth, authenticity) for composite 0-100 score",
  },
  "landing.feature.brandMatching.title": { ko: "Brand Matching", en: "Brand Matching" },
  "landing.feature.brandMatching.desc": {
    ko: "브랜드 톤 벡터와 인플루언서 스타일을 자동 매칭하여 최적 후보 추천",
    en: "Auto-match brand tone vectors with influencer styles to recommend best candidates",
  },
  "landing.feature.vibeSearch.title": { ko: "Vibe Search", en: "Vibe Search" },
  "landing.feature.vibeSearch.desc": {
    ko: "무드 이미지를 업로드하면 매칭되는 인플루언서를 추천",
    en: "Upload mood images to get matching influencer recommendations",
  },

  // Analyze
  "analyze.title": { ko: "숫자가 아닌 결을 본다", en: "See vibes, not just numbers" },
  "analyze.placeholder.instagram": {
    ko: "인스타그램 핸들 입력 (예: studio_muse)",
    en: "Instagram handle (e.g., studio_muse)",
  },
  "analyze.placeholder.tiktok": {
    ko: "틱톡 핸들 입력 (예: vibe_creator)",
    en: "TikTok handle (e.g., vibe_creator)",
  },
  "analyze.submit": { ko: "분석하기", en: "Analyze" },
  "analyze.loading": { ko: "분석 중...", en: "Analyzing..." },
  "analyze.loadingHandle": { ko: "분석 중", en: "Analyzing" },
  "analyze.loading.desc": {
    ko: "피드 데이터를 수집하고 AI가 분석하고 있어요",
    en: "Collecting feed data and running AI analysis",
  },
  "analyze.retry": { ko: "다시 시도", en: "Retry" },
  "analyze.newHandle": { ko: "새로운 핸들 분석", en: "Analyze New Handle" },
  "analyze.recentTitle": { ko: "최근 분석", en: "Recent Analyses" },
  "analyze.or": { ko: "또는", en: "or" },
  "analyze.success": { ko: "분석이 완료되었습니다", en: "Analysis complete" },
  "analyze.error.default": { ko: "분석에 실패했습니다", en: "Analysis failed" },
  "analyze.representativeFeed": { ko: "대표 피드", en: "Representative Feed" },

  // Compare
  "compare.title": { ko: "Compare", en: "Compare" },
  "compare.desc": { ko: "인플루언서 2-3명을 나란히 비교해보세요", en: "Compare 2-3 influencers side by side" },
  "compare.descSub": { ko: "VibeScore 기반 다차원 비교 분석", en: "Multi-dimensional comparison based on VibeScore" },
  "compare.submit": { ko: "비교하기", en: "Compare" },
  "compare.3way": { ko: "3명 비교", en: "Compare 3" },
  "compare.placeholder": { ko: "인플루언서 {n} 핸들", en: "Influencer {n} handle" },
  "compare.loading": { ko: "비교 분석 중", en: "Comparing" },
  "compare.loading.desc": {
    ko: "각 인플루언서의 피드를 수집하고 AI가 비교 분석하고 있어요",
    en: "Collecting each influencer's feed and running AI comparison",
  },
  "compare.success": { ko: "비교 분석이 완료되었습니다", en: "Comparison complete" },
  "compare.error.default": { ko: "비교 분석에 실패했습니다", en: "Comparison failed" },
  "compare.aiAnalysis": { ko: "AI 비교 분석", en: "AI Comparison" },
  "compare.newCompare": { ko: "새로운 비교 분석", en: "New Comparison" },

  // Brand
  "brand.title": { ko: "Brand Setup", en: "Brand Setup" },
  "brand.desc": {
    ko: "브랜드 톤을 등록하면 인플루언서 매칭 추천을 받을 수 있어요",
    en: "Register your brand tone to receive influencer matching recommendations",
  },
  "brand.nameLabel": { ko: "브랜드 이름", en: "Brand Name" },
  "brand.namePlaceholder": { ko: "예: Studio Muse", en: "e.g., Studio Muse" },
  "brand.handleLabel": { ko: "인스타그램 핸들", en: "Instagram Handle" },
  "brand.handlePlaceholder": { ko: "예: @your_brand", en: "e.g., @your_brand" },
  "brand.tierLabel": { ko: "선호 인플루언서 티어 (선택)", en: "Preferred Influencer Tier (optional)" },
  "brand.categoryLabel": { ko: "타겟 카테고리 (선택)", en: "Target Categories (optional)" },
  "brand.analyzeHandle": { ko: "브랜드 톤 분석하기", en: "Analyze Brand Tone" },
  "brand.analyzingHandle": { ko: "브랜드 톤 분석 중...", en: "Analyzing brand tone..." },
  "brand.or": { ko: "또는", en: "or" },
  "brand.moodboardUpload": { ko: "무드보드 업로드", en: "Upload Moodboard" },
  "brand.moodboardUploadDesc": {
    ko: "브랜드 무드보드 이미지를 드래그하거나 클릭하여 업로드 (최대 5장)",
    en: "Drag or click to upload brand moodboard images (max 5)",
  },
  "brand.moodboardImagesCount": { ko: "이미지 · 클릭하여 추가", en: "images · Click to add more" },
  "brand.analyzeMoodboard": { ko: "무드보드로 분석하기", en: "Analyze with Moodboard" },
  "brand.analyzingMoodboard": { ko: "무드보드 분석 중...", en: "Analyzing moodboard..." },
  "brand.moodboardError": { ko: "브랜드 이름과 무드보드 이미지를 입력해주세요", en: "Please enter brand name and moodboard images" },
  "brand.registered": { ko: "브랜드 톤 등록 완료", en: "Brand tone registered" },
  "brand.registeredDesc": { ko: "이제 인플루언서 분석 시 Brand Fit Score가 표시됩니다", en: "Brand Fit Score will now appear in influencer analyses" },
  "brand.registeredSuccess": { ko: "브랜드 톤 등록이 완료되었습니다", en: "Brand tone registration complete" },
  "brand.moodboardSuccess": { ko: "무드보드 분석이 완료되었습니다", en: "Moodboard analysis complete" },
  "brand.recommendedInfluencers": { ko: "추천 인플루언서", en: "Recommended Influencers" },
  "brand.matching": { ko: "매칭 중...", en: "Matching..." },
  "brand.noMatches": { ko: "매칭할 수 있는 인플루언서가 아직 없습니다", en: "No matching influencers found yet" },
  "brand.noMatchesDesc": {
    ko: "인플루언서를 분석하면 자동으로 매칭 후보에 포함됩니다",
    en: "Analyzed influencers will be automatically included as matching candidates",
  },

  // Dashboard
  "dashboard.title": { ko: "Dashboard", en: "Dashboard" },
  "dashboard.subtitle": { ko: "분석 현황과 인사이트", en: "Analysis overview and insights" },
  "dashboard.history": { ko: "히스토리", en: "History" },
  "dashboard.saved": { ko: "저장됨", en: "Saved" },
  "dashboard.sortRecent": { ko: "최신순", en: "Recent" },
  "dashboard.sortScore": { ko: "점수순", en: "By Score" },
  "dashboard.emptyHistory": { ko: "아직 분석한 인플루언서가 없습니다", en: "No influencers analyzed yet" },
  "dashboard.goAnalyze": { ko: "분석하러 가기", en: "Go to Analyze" },
  "dashboard.emptySaved": { ko: "저장한 인플루언서가 없습니다", en: "No saved influencers" },
  "dashboard.emptySavedDesc": { ko: "분석 결과에서 하트를 눌러 저장해보세요", en: "Save influencers by tapping the heart in analysis results" },

  // Profile
  "profile.followers": { ko: "팔로워", en: "Followers" },
  "profile.engagementRate": { ko: "참여율", en: "Engagement Rate" },
  "profile.postFrequency": { ko: "포스팅/주기", en: "Post Frequency" },
  "profile.back": { ko: "돌아가기", en: "Back" },
  "profile.goToAnalyze": { ko: "분석 페이지로 이동", en: "Go to Analyze" },
  "profile.registerBrand": { ko: "브랜드 등록하기", en: "Register Brand" },
  "profile.brandFitDesc": {
    ko: "브랜드 프로필을 등록하면 이 인플루언서와의 매칭 점수를 확인할 수 있습니다.",
    en: "Register your brand profile to see the match score with this influencer.",
  },
  "profile.recommendedCategories": { ko: "추천 브랜드 카테고리", en: "Recommended Brand Categories" },
  "profile.notFound": { ko: "인플루언서 정보를 찾을 수 없습니다", en: "Influencer info not found" },
  "profile.tab.overview": { ko: "Overview", en: "Overview" },
  "profile.tab.content": { ko: "Content", en: "Content" },
  "profile.tab.engagement": { ko: "Engagement", en: "Engagement" },
  "profile.tab.brandfit": { ko: "Brand Fit", en: "Brand Fit" },
  "profile.tab.coaching": { ko: "Coaching", en: "Coaching" },
  "profile.engagementTrend": { ko: "인게이지먼트 트렌드", en: "Engagement Trend" },
  "profile.engagementMomentum": { ko: "인게이지먼트 추이", en: "Engagement Momentum" },
  "profile.dayUnit": { ko: "일", en: "d" },

  // Coaching
  "coaching.title": { ko: "AI 퍼스널 브랜딩 코치", en: "AI Personal Branding Coach" },
  "coaching.desc": {
    ko: "AI가 VibeScore 데이터를 기반으로 맞춤형 브랜딩 전략, 콘텐츠 전략, 성장 로드맵을 제안합니다.",
    en: "AI suggests customized branding strategy, content strategy, and growth roadmap based on VibeScore data.",
  },
  "coaching.start": { ko: "코칭 시작하기", en: "Start Coaching" },
  "coaching.loading": { ko: "AI 코칭 생성 중", en: "Generating AI Coaching" },
  "coaching.loadingDesc": {
    ko: "VibeScore 데이터를 분석하고 맞춤 전략을 수립하고 있어요",
    en: "Analyzing VibeScore data and building custom strategies",
  },
  "coaching.error": { ko: "코칭 데이터를 불러올 수 없습니다", en: "Could not load coaching data" },
  "coaching.overallAssessment": { ko: "종합 평가", en: "Overall Assessment" },
  "coaching.strengths": { ko: "강점 분석", en: "Strength Analysis" },
  "coaching.improvementPlan": { ko: "개선 계획", en: "Improvement Plan" },
  "coaching.contentStrategy": { ko: "콘텐츠 전략", en: "Content Strategy" },
  "coaching.postingSchedule": { ko: "포스팅 스케줄", en: "Posting Schedule" },
  "coaching.contentMix": { ko: "콘텐츠 믹스", en: "Content Mix" },
  "coaching.hashtagStrategy": { ko: "해시태그 전략", en: "Hashtag Strategy" },
  "coaching.engagementTips": { ko: "참여율 높이는 팁", en: "Engagement Tips" },
  "coaching.growthRoadmap": { ko: "성장 로드맵", en: "Growth Roadmap" },
  "coaching.shortTerm": { ko: "1개월", en: "1 Month" },
  "coaching.midTerm": { ko: "3개월", en: "3 Months" },
  "coaching.longTerm": { ko: "6개월", en: "6 Months" },
  "coaching.brandPositioning": { ko: "브랜드 포지셔닝", en: "Brand Positioning" },

  // Vibe Search
  "vibeSearch.title": { ko: "Vibe Search", en: "Vibe Search" },
  "vibeSearch.desc": { ko: "무드 이미지를 드래그하거나 클릭하여 업로드", en: "Drag or click to upload mood images" },
  "vibeSearch.imageCount": { ko: "이미지 · 클릭하여 추가", en: "images · Click to add more" },
  "vibeSearch.searching": { ko: "매칭 중...", en: "Matching..." },
  "vibeSearch.search": { ko: "매칭 인플루언서 찾기", en: "Find Matching Influencers" },
  "vibeSearch.results": { ko: "매칭 인플루언서", en: "Matching Influencers" },
  "vibeSearch.match": { ko: "매칭", en: "Match" },
  "vibeSearch.error": { ko: "검색에 실패했습니다", en: "Search failed" },

  // Profile Card
  "profileCard.engagementRate": { ko: "참여율", en: "ER" },
  "profileCard.engagementRateTip": {
    ko: "(좋아요 + 댓글×2) ÷ 팔로워 수. 티어별 평균: nano 4.5%, micro 2.8%, mid 1.8%, macro 1.3%, mega 0.8%",
    en: "(Likes + Comments×2) ÷ Followers. Tier avg: nano 4.5%, micro 2.8%, mid 1.8%, macro 1.3%, mega 0.8%",
  },
  "profileCard.color": { ko: "색감", en: "Color" },
  "profileCard.composition": { ko: "구도", en: "Comp." },
  "profileCard.tone": { ko: "톤", en: "Tone" },
  "profileCard.trend": { ko: "트렌드", en: "Trend" },
  "profileCard.brand": { ko: "브랜드", en: "Brand" },
  "profileCard.colorTip": { ko: "컬러 팔레트의 조화와 일관성", en: "Color palette harmony and consistency" },
  "profileCard.compositionTip": { ko: "시각적 균형감과 프레이밍", en: "Visual balance and framing" },
  "profileCard.toneTip": { ko: "피드 전반의 톤 통일성", en: "Overall tone consistency across feed" },
  "profileCard.trendTip": { ko: "현재 비주얼 트렌드 부합도", en: "Current visual trend alignment" },
  "profileCard.brandTip": { ko: "스타일 독창성과 브랜드 적합도", en: "Style originality and brand suitability" },

  // Brands (multi-brand)
  "brands.title": { ko: "내 브랜드", en: "My Brands" },
  "brands.subtitle": { ko: "브랜드를 관리하고 인플루언서 매칭을 받아보세요", en: "Manage brands and get influencer matching" },
  "brands.addBrand": { ko: "브랜드 추가", en: "Add Brand" },
  "brands.notFound": { ko: "브랜드를 찾을 수 없습니다", en: "Brand not found" },
  "brands.empty": { ko: "등록된 브랜드가 없습니다", en: "No brands registered yet" },
  "brands.emptyDesc": { ko: "첫 번째 브랜드를 등록하고 인플루언서 매칭을 시작하세요", en: "Register your first brand to start influencer matching" },
  "brands.savedInfluencers": { ko: "저장된 인플루언서", en: "Saved Influencers" },
  "brands.detail.recommendations": { ko: "추천 인플루언서", en: "Recommended Influencers" },
  "brands.detail.saved": { ko: "저장된 인플루언서", en: "Saved Influencers" },
  "brands.detail.settings": { ko: "설정", en: "Settings" },
  "brands.detail.edit": { ko: "편집", en: "Edit" },
  "brands.detail.delete": { ko: "브랜드 삭제", en: "Delete Brand" },
  "brands.detail.deleteConfirm": { ko: "정말 이 브랜드를 삭제하시겠습니까?", en: "Are you sure you want to delete this brand?" },
  "brands.detail.deleted": { ko: "브랜드가 삭제되었습니다", en: "Brand deleted" },
  "brands.detail.updated": { ko: "브랜드가 업데이트되었습니다", en: "Brand updated" },
  "brands.new.title": { ko: "새 브랜드 등록", en: "Register New Brand" },
  "brands.keywords": { ko: "키워드", en: "keywords" },

  // Brand tabs
  "brands.tab.overview": { ko: "개요", en: "Overview" },
  "brands.tab.recommendations": { ko: "AI 추천", en: "AI Match" },
  "brands.tab.coaching": { ko: "코칭", en: "Coaching" },
  "brands.tab.campaigns": { ko: "캠페인", en: "Campaigns" },
  "brands.tab.settings": { ko: "설정", en: "Settings" },

  // Brand overview section
  "brands.overview.aiSummary": { ko: "AI 요약", en: "AI Summary" },
  "brands.overview.positioning": { ko: "브랜드 포지셔닝", en: "Brand Positioning" },
  "brands.overview.contentStrategy": { ko: "콘텐츠 전략", en: "Content Strategy" },
  "brands.overview.idealProfile": { ko: "이상적 인플루언서 프로필", en: "Ideal Influencer Profile" },
  "brands.overview.competitors": { ko: "추정 경쟁 브랜드", en: "Estimated Competitors" },

  // Brand content strategy keys
  "brands.strategy.postingPattern": { ko: "포스팅 패턴", en: "Posting Pattern" },
  "brands.strategy.primaryMessage": { ko: "주요 메시지", en: "Primary Message" },
  "brands.strategy.hashtagStrategy": { ko: "해시태그 전략", en: "Hashtag Strategy" },
  "brands.strategy.storytellingStyle": { ko: "스토리텔링", en: "Storytelling" },

  // Brand ideal influencer profile keys
  "brands.profile.tone": { ko: "톤 & 무드", en: "Tone & Mood" },
  "brands.profile.followerRange": { ko: "팔로워 규모", en: "Follower Range" },
  "brands.profile.contentStyle": { ko: "콘텐츠 스타일", en: "Content Style" },
  "brands.profile.audienceTraits": { ko: "오디언스 특성", en: "Audience Traits" },
  "brands.profile.platformFit": { ko: "플랫폼", en: "Platform" },

  // Brand recommendations
  "brands.rec.avgMatch": { ko: "평균 매칭 점수", en: "Avg Match Score" },
  "brands.rec.tierDist": { ko: "티어 분포", en: "Tier Distribution" },
  "brands.rec.total": { ko: "추천 인플루언서", en: "Recommended" },
  "brands.rec.count": { ko: "명", en: "" },
  "brands.rec.avgVibe": { ko: "평균 VibeScore", en: "Avg VibeScore" },
  "brands.rec.outreach": { ko: "아웃리치", en: "Outreach" },
  "brands.rec.discovering": { ko: "인플루언서를 탐색하고 있어요", en: "Discovering influencers..." },
  "brands.rec.discoveringDesc": { ko: "AI가 브랜드에 어울리는 인플루언서를 찾고 있습니다. 보통 1~2분 정도 소요됩니다.", en: "AI is finding influencers that match your brand. This usually takes 1-2 minutes." },
  "brands.rec.refresh": { ko: "새로고침", en: "Refresh" },

  // Brand campaigns
  "brands.campaigns.title": { ko: "캠페인 관리", en: "Campaign Management" },
  "brands.campaigns.manage": { ko: "캠페인 관리 페이지", en: "Campaign Page" },
  "brands.campaigns.desc": { ko: "캠페인을 생성하고 인플루언서를 추가하여 협업을 관리하세요. AI가 아웃리치 메시지, 캠페인 브리프, 예산 최적화를 도와드립니다.", en: "Create campaigns and add influencers to manage collaborations. AI helps with outreach messages, campaign briefs, and budget optimization." },
  "brands.campaigns.create": { ko: "새 캠페인 만들기", en: "Create Campaign" },

  // Brand coaching
  "brands.coaching.loading": { ko: "AI 코칭 생성 중...", en: "Generating AI coaching..." },
  "brands.coaching.error": { ko: "AI 코칭을 불러올 수 없습니다", en: "Could not load AI coaching" },
  "brands.coaching.overall": { ko: "종합 평가", en: "Overall Assessment" },
  "brands.coaching.strengths": { ko: "강점", en: "Strengths" },
  "brands.coaching.improvements": { ko: "개선 영역", en: "Improvement Areas" },
  "brands.coaching.collabStrategy": { ko: "인플루언서 협업 전략", en: "Influencer Collaboration Strategy" },
  "brands.coaching.collabType": { ko: "협업 유형", en: "Collaboration Type" },
  "brands.coaching.campaignIdeas": { ko: "캠페인 아이디어", en: "Campaign Ideas" },
  "brands.coaching.budget": { ko: "예산 배분", en: "Budget Allocation" },
  "brands.coaching.timing": { ko: "타이밍", en: "Timing" },
  "brands.coaching.roadmap": { ko: "성장 로드맵", en: "Growth Roadmap" },
  "brands.coaching.1month": { ko: "1개월", en: "1 Month" },
  "brands.coaching.3month": { ko: "3개월", en: "3 Months" },
  "brands.coaching.6month": { ko: "6개월", en: "6 Months" },
  "brands.coaching.competitive": { ko: "경쟁 포지셔닝", en: "Competitive Positioning" },

  // Brand settings
  "brands.settings.save": { ko: "설정 저장", en: "Save Settings" },
  "brands.settings.saving": { ko: "저장 중...", en: "Saving..." },
  "brands.settings.dangerZone": { ko: "위험 영역", en: "Danger Zone" },
  "brands.settings.deleting": { ko: "삭제 중...", en: "Deleting..." },

  // Recommendation card
  "recCard.match": { ko: "매칭", en: "Match" },
  "recCard.addToCampaign": { ko: "캠페인에 추가", en: "Add to Campaign" },
  "recCard.campaign": { ko: "캠페인", en: "Campaign" },
  "recCard.saved": { ko: "저장됨", en: "Saved" },
  "recCard.save": { ko: "저장", en: "Save" },
  "recCard.detail": { ko: "상세보기", en: "Detail" },

  // Discovery
  "discover.browseTitle": { ko: "인플루언서 브라우징", en: "Browse Influencers" },
  "discover.trending": { ko: "트렌딩", en: "Trending" },
  "discover.trendingDesc": { ko: "최근 30일 인기 분석 인플루언서", en: "Most analyzed influencers in the last 30 days" },
  "discover.filterTier": { ko: "티어", en: "Tier" },
  "discover.filterCategory": { ko: "카테고리", en: "Category" },
  "discover.filterPlatform": { ko: "플랫폼", en: "Platform" },
  "discover.filterMinVibe": { ko: "최소 VibeScore", en: "Min VibeScore" },
  "discover.sortLabel": { ko: "정렬", en: "Sort" },
  "discover.sortVibeScore": { ko: "VibeScore", en: "VibeScore" },
  "discover.sortFollowers": { ko: "팔로워", en: "Followers" },
  "discover.sortEngagement": { ko: "참여율", en: "Engagement" },
  "discover.sortNewest": { ko: "최신 분석", en: "Newest" },
  "discover.noResults": { ko: "조건에 맞는 인플루언서가 없습니다", en: "No influencers match your filters" },
  "discover.noResultsDesc": { ko: "필터를 조정하거나 인플루언서를 분석해보세요", en: "Adjust filters or analyze more influencers" },
  "discover.loadMore": { ko: "더 보기", en: "Load More" },
  "discover.allTiers": { ko: "전체", en: "All" },
  "discover.allPlatforms": { ko: "전체", en: "All" },
  "discover.allCategories": { ko: "전체", en: "All" },

  // Discover v2 sections
  "discover.trendingBrands": { ko: "뜨는 브랜드", en: "Trending Brands" },
  "discover.trendingBrandsDesc": { ko: "최근 등록된 높은 점수의 브랜드", en: "Recently registered high-scoring brands" },
  "discover.trendingContent": { ko: "뜨는 콘텐츠", en: "Trending Content" },
  "discover.trendingContentDesc": { ko: "인기 인플루언서의 높은 참여율 포스트", en: "High engagement posts from top influencers" },
  "discover.trendingHashtags": { ko: "뜨는 해시태그", en: "Trending Hashtags" },
  "discover.trendingHashtagsDesc": { ko: "가장 많이 사용되는 해시태그", en: "Most used hashtags across influencers" },
  "discover.hiddenGems": { ko: "Hidden Gems", en: "Hidden Gems" },
  "discover.hiddenGemsDesc": { ko: "가성비 최고의 소규모 인플루언서", en: "Best value nano/micro influencers" },
  "discover.risingStars": { ko: "Rising Stars", en: "Rising Stars" },
  "discover.risingStarsDesc": { ko: "급성장 중인 인플루언서", en: "Fast-growing influencers" },
  "discover.engagementLeaders": { ko: "참여율 리더", en: "Engagement Leaders" },
  "discover.engagementLeadersDesc": { ko: "참여율 상위 인플루언서", en: "Top engagement rate influencers" },
  "discover.categoryTop": { ko: "카테고리 TOP", en: "Category TOP" },
  "discover.categoryTopDesc": { ko: "각 분야 최고의 인플루언서", en: "Best influencer in each category" },
  "discover.nInfluencers": { ko: "명의 인플루언서", en: " influencers" },
  "discover.likes": { ko: "좋아요", en: "Likes" },
  "discover.comments": { ko: "댓글", en: "Comments" },

  // Nav updated
  "nav.brands": { ko: "Brands", en: "Brands" },

  // Dashboard filters
  "dashboard.dateRange": { ko: "기간", en: "Period" },
  "dashboard.dateRange.7d": { ko: "7일", en: "7 Days" },
  "dashboard.dateRange.30d": { ko: "30일", en: "30 Days" },
  "dashboard.dateRange.90d": { ko: "90일", en: "90 Days" },
  "dashboard.dateRange.all": { ko: "전체", en: "All" },
  "dashboard.csvDownload": { ko: "CSV 다운로드", en: "Download CSV" },
  "dashboard.csvSuccess": { ko: "CSV 파일이 다운로드되었습니다", en: "CSV file downloaded" },
  "dashboard.deleted": { ko: "분석 기록이 삭제되었습니다", en: "Analysis deleted" },
  "dashboard.allDeleted": { ko: "모든 분석 기록이 삭제되었습니다", en: "All analyses deleted" },
  "dashboard.deleteFailed": { ko: "삭제에 실패했습니다", en: "Failed to delete" },
  "dashboard.unsaved": { ko: "즐겨찾기가 해제되었습니다", en: "Removed from favorites" },
  "dashboard.unsaveFailed": { ko: "해제에 실패했습니다", en: "Failed to remove" },
  "dashboard.unsaveLabel": { ko: "즐겨찾기 해제", en: "Remove from favorites" },
  "dashboard.clearAll": { ko: "전체 삭제", en: "Clear all" },
  "dashboard.emptyHistoryDesc": { ko: "첫 인플루언서를 분석해보세요", en: "Analyze your first influencer" },

  // Onboarding
  "onboarding.welcome": { ko: "VibeCheck에 오신 것을 환영합니다", en: "Welcome to VibeCheck" },
  "onboarding.welcomeDesc": { ko: "AI가 인플루언서의 피드를 분석하고, 브랜드에 딱 맞는 크리에이터를 추천해드립니다. 아래 단계를 따라 시작하세요.", en: "AI analyzes influencer feeds and recommends creators that match your brand. Follow the steps below to get started." },
  "onboarding.step1Title": { ko: "브랜드 등록하기", en: "Register Your Brand" },
  "onboarding.step1Desc": { ko: "브랜드 이름과 인스타그램 핸들만 입력하면 AI가 자동으로 분석하고 맞춤 인플루언서를 추천합니다.", en: "Just enter your brand name and Instagram handle — AI will analyze and recommend matching influencers." },
  "onboarding.step2Title": { ko: "인플루언서 검색하기", en: "Search Influencers" },
  "onboarding.step2Desc": { ko: "인플루언서 핸들을 검색하면 VibeScore 5차원 분석, 콘텐츠 인사이트, 브랜드 핏을 확인할 수 있습니다.", en: "Search any influencer handle to see their 5-dimensional VibeScore, content insights, and brand fit." },

  // Common
  "common.delete": { ko: "삭제", en: "Delete" },
  "common.share": { ko: "공유", en: "Share" },
  "common.linkCopied": { ko: "링크 복사됨", en: "Link Copied" },
  "common.pdfReport": { ko: "PDF 리포트", en: "PDF Report" },
  "common.downloadDone": { ko: "다운로드 완료", en: "Downloaded" },
  "common.error.network": { ko: "네트워크 오류가 발생했습니다", en: "A network error occurred" },
  "common.retry": { ko: "다시 시도", en: "Retry" },
  "common.shareLinkCopied": { ko: "공유 링크가 클립보드에 복사되었습니다", en: "Share link copied to clipboard" },
  "common.shareLinkError": { ko: "공유 링크 생성에 실패했습니다", en: "Failed to create share link" },
  "common.pdfSuccess": { ko: "PDF 리포트가 다운로드되었습니다", en: "PDF report downloaded" },
  "common.pdfError": { ko: "PDF 생성에 실패했습니다", en: "PDF generation failed" },
  "common.sortByRecent": { ko: "점수순 정렬", en: "Sort by score" },
  "common.sortByScore": { ko: "최신순 정렬", en: "Sort by recent" },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, locale: Locale): string {
  return translations[key]?.[locale] ?? key;
}

export default translations;
