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

  // Common
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
