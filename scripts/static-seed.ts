/**
 * Static Seed Script
 *
 * Gemini API 한도와 무관하게 프로그래밍적으로 인플루언서 스텁을 생성.
 * 핸들 패턴 + 카테고리 메타데이터를 조합해 ~2,000+ 스텁 프로필 생성.
 *
 * Usage: npx tsx scripts/static-seed.ts
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

import { insertStubBatch } from "../src/lib/discovery/stub-inserter";
import type { StubSuggestion } from "../src/lib/discovery/mass-stub-generator";

// -----------------------------------------------------------------------
// Category definitions with Korean metadata
// -----------------------------------------------------------------------

interface CategoryDef {
  category: string;
  subNiches: string[];
  handlePrefixes: string[];
  handleSuffixes: string[];
  koreanNames: string[];
  oneLiners: string[];
  reasons: string[];
}

const CATEGORIES: CategoryDef[] = [
  {
    category: "Fashion",
    subNiches: ["Korean streetwear", "Minimal fashion", "Luxury fashion", "Vintage fashion", "Sustainable fashion"],
    handlePrefixes: ["style", "fashion", "ootd", "wear", "closet", "outfit", "look", "dress", "coord", "fit"],
    handleSuffixes: ["_kr", ".kr", "_seoul", "_daily", "_log", ".style", "_official", ".fit", "_co", ""],
    koreanNames: ["지은", "수빈", "민지", "하은", "서연", "예린", "소희", "다인", "유진", "채원", "현아", "지수", "나연", "은지", "보라"],
    oneLiners: [
      "트렌디한 스트릿 패션과 유니크한 스타일링으로 MZ세대의 큰 호응을 얻는 패셔니스타",
      "미니멀한 코디로 세련된 일상을 보여주는 패션 인플루언서",
      "하이엔드 브랜드와 빈티지를 믹스하여 독창적인 룩을 완성하는 스타일리스트",
      "지속가능한 패션에 대한 인식을 높이며 에코 패션 트렌드를 선도하는 크리에이터",
      "데일리룩부터 특별한 날의 코디까지 다양한 스타일을 제안하는 패션 블로거",
      "감성적인 무드의 패션 화보를 찍어 2030 여성들에게 인기 있는 모델 겸 인플루언서",
    ],
    reasons: [
      "한국 스트릿 패션 씬에서 독보적인 스타일링 감각을 보유",
      "미니멀 패션 콘텐츠로 높은 저장률과 공유율을 기록",
      "럭셔리 브랜드와의 다수 협업으로 신뢰성 높은 패션 리뷰 제공",
      "빈티지 패션의 매력을 현대적으로 재해석하는 능력이 탁월",
      "친환경 패션 브랜드와의 협업으로 ESG 트렌드에 부합",
    ],
  },
  {
    category: "Beauty",
    subNiches: ["Skincare", "Makeup tutorials", "K-beauty", "Natural beauty", "Nail art"],
    handlePrefixes: ["beauty", "skin", "makeup", "glow", "muse", "pretty", "cosme", "lip", "blushing", "dewy"],
    handleSuffixes: ["_kr", ".beauty", "_lab", "_daily", "_log", ".glow", "_tips", ".art", "_studio", ""],
    koreanNames: ["다은", "서현", "지민", "유나", "하영", "소은", "미소", "주아", "린아", "채린", "보미", "아름", "소민", "혜진", "수정"],
    oneLiners: [
      "피부 타입별 맞춤 스킨케어 루틴으로 많은 팔로워의 신뢰를 얻는 뷰티 전문가",
      "K-뷰티 제품 리뷰와 메이크업 튜토리얼로 글로벌 팬층을 보유한 뷰티 크리에이터",
      "자연스러운 데일리 메이크업부터 화려한 아트 메이크업까지 다양한 스타일 소화",
      "네일 아트 디자인의 트렌드를 선도하며 창의적인 작품을 선보이는 아티스트",
      "성분 분석 기반의 솔직한 제품 리뷰로 뷰티 커뮤니티에서 높은 신뢰도를 보유",
    ],
    reasons: [
      "스킨케어 루틴 콘텐츠가 높은 저장률을 기록하며 실질적인 도움을 제공",
      "K-뷰티 제품 소개로 해외 팔로워 비율이 높아 글로벌 마케팅에 효과적",
      "메이크업 튜토리얼의 완성도가 높고 재현 가능한 팁을 제공",
      "네일 아트 분야에서 창의성과 기술력이 돋보이는 작품을 지속 발표",
      "솔직하고 객관적인 리뷰로 팔로워들의 구매 결정에 큰 영향력 보유",
    ],
  },
  {
    category: "Food",
    subNiches: ["Korean cuisine", "Cafe & desserts", "Home cooking", "Vegan & healthy", "Street food"],
    handlePrefixes: ["food", "eat", "cook", "yummy", "nom", "chef", "tasty", "bap", "meal", "kitchen"],
    handleSuffixes: ["_kr", ".seoul", "_daily", "_log", "_gram", ".table", "_recipe", ".eat", "_mate", ""],
    koreanNames: ["정호", "민수", "은비", "재현", "수연", "동훈", "지혜", "태현", "혜원", "승민", "나래", "건우", "미라", "진우", "소영"],
    oneLiners: [
      "정통 한식 레시피부터 퓨전 요리까지 다양한 한국 음식을 소개하는 푸드 크리에이터",
      "서울 핫플 카페와 디저트를 발굴하여 소개하는 카페 투어 전문 인플루언서",
      "집에서 쉽게 따라할 수 있는 레시피로 요리 초보자들에게 사랑받는 홈쿡 크리에이터",
      "건강한 비건 레시피와 클린 이팅으로 웰니스 트렌드를 선도하는 푸드 블로거",
      "전국 길거리 음식과 맛집을 소개하며 먹방 콘텐츠를 제작하는 크리에이터",
    ],
    reasons: [
      "한식 레시피의 전문성과 비주얼이 뛰어나 높은 참여율을 기록",
      "카페 리뷰의 정확성과 감성적인 사진으로 큰 영향력을 보유",
      "따라하기 쉬운 레시피로 요리 입문자들의 꾸준한 지지를 받음",
      "비건 식단의 접근성을 높이며 건강식 트렌드에 기여",
      "길거리 음식 콘텐츠의 현장감이 뛰어나 높은 조회수를 기록",
    ],
  },
  {
    category: "Fitness",
    subNiches: ["Gym & weightlifting", "Yoga & pilates", "Running", "Home workout", "Sports nutrition"],
    handlePrefixes: ["fit", "gym", "workout", "strong", "body", "muscle", "health", "train", "sweat", "active"],
    handleSuffixes: ["_kr", ".fit", "_daily", "_life", "_log", ".gym", "_coach", ".body", "_pro", ""],
    koreanNames: ["준혁", "지원", "성민", "하나", "우진", "서영", "태우", "민경", "재윤", "현정", "동현", "수아", "진혁", "예은", "성호"],
    oneLiners: [
      "체계적인 웨이트 트레이닝과 식단 관리로 바디 트랜스포메이션을 보여주는 피트니스 코치",
      "요가와 필라테스를 통한 바디 밸런스와 마인드풀니스를 전파하는 인스트럭터",
      "러닝 기록과 마라톤 도전기를 공유하며 러닝 커뮤니티를 활성화하는 러너",
      "홈트레이닝 루틴으로 바쁜 직장인들의 건강한 라이프스타일을 도와주는 크리에이터",
      "스포츠 영양학 기반의 식단과 보충제 리뷰로 피트니스 정보를 제공",
    ],
    reasons: [
      "실질적인 운동 루틴과 변화 과정을 보여줘 동기부여 콘텐츠로 큰 인기",
      "요가 수련의 전문성과 차분한 지도 스타일로 높은 팔로워 충성도 보유",
      "러닝 코스 추천과 훈련 일지로 러닝 커뮤니티에서 큰 영향력",
      "홈트 루틴의 실용성이 높아 저장률이 매우 높음",
      "영양 정보의 과학적 근거를 바탕으로 신뢰성 있는 콘텐츠 제공",
    ],
  },
  {
    category: "Travel",
    subNiches: ["Domestic Korea travel", "Southeast Asia", "Europe travel", "Budget travel", "Luxury travel"],
    handlePrefixes: ["travel", "trip", "wander", "journey", "explore", "roam", "trek", "tour", "go", "fly"],
    handleSuffixes: ["_kr", ".travel", "_log", "_diary", "_gram", ".go", "_explorer", ".world", "_nomad", ""],
    koreanNames: ["서준", "지아", "민호", "유리", "태양", "혜수", "준서", "소진", "현우", "나영", "승우", "다영", "인호", "미나", "석진"],
    oneLiners: [
      "국내 숨은 여행지를 발굴하며 소도시의 매력을 알리는 국내 여행 전문가",
      "동남아 현지 문화와 맛집을 생생하게 전하는 트래블 크리에이터",
      "유럽 각 도시의 건축과 문화를 감성적으로 담아내는 여행 포토그래퍼",
      "가성비 높은 여행 팁과 저예산 여행기를 공유하는 알뜰 여행 블로거",
      "럭셔리 호텔과 프리미엄 여행 경험을 소개하는 프리미엄 트래블 크리에이터",
    ],
    reasons: [
      "국내 여행지 정보의 정확성과 실용적인 팁으로 높은 저장률 기록",
      "동남아 현지 정보의 디테일함으로 여행 준비에 실질적 도움 제공",
      "유럽 여행 사진의 높은 퀄리티로 감성 여행 콘텐츠의 대표 계정",
      "저예산 여행의 현실적인 정보로 2030 여행자들에게 인기",
      "프리미엄 여행 경험의 솔직한 리뷰로 고급 여행 시장에서 영향력",
    ],
  },
  {
    category: "Lifestyle",
    subNiches: ["Daily vlog", "Minimalist living", "Self-care & wellness", "Aesthetic room", "Morning routine"],
    handlePrefixes: ["daily", "life", "living", "vibe", "mood", "simple", "slow", "cozy", "calm", "moment"],
    handleSuffixes: ["_kr", ".life", "_log", "_diary", "_daily", ".mood", "_record", ".live", "_note", ""],
    koreanNames: ["하린", "서윤", "민재", "지유", "도현", "예서", "우빈", "소율", "준호", "채은", "시우", "나은", "태민", "아인", "세현"],
    oneLiners: [
      "소소하지만 특별한 일상을 감성적으로 담아내는 데일리 브이로거",
      "미니멀 라이프를 실천하며 단순하고 풍요로운 삶을 보여주는 크리에이터",
      "셀프케어 루틴과 마음 챙김으로 건강한 라이프스타일을 전파하는 인플루언서",
      "감성적인 인테리어와 룸 투어로 공간 꾸미기 영감을 주는 크리에이터",
      "생산적인 모닝 루틴으로 하루를 시작하는 법을 보여주는 라이프 크리에이터",
    ],
    reasons: [
      "일상 콘텐츠의 진정성과 감성으로 높은 공감대 형성",
      "미니멀리즘의 실용적인 팁으로 라이프스타일 변화에 영감 제공",
      "셀프케어 루틴이 저장률 높은 콘텐츠로 꾸준한 인기",
      "룸 투어 콘텐츠가 인테리어 관심층에게 큰 영향력",
      "모닝 루틴 콘텐츠의 실천 가능성이 높아 동기부여 효과 탁월",
    ],
  },
  {
    category: "Tech",
    subNiches: ["Smartphone reviews", "Gadget unboxing", "PC & gaming", "AI & productivity", "Coding & dev"],
    handlePrefixes: ["tech", "geek", "digital", "smart", "gadget", "byte", "code", "dev", "pixel", "chip"],
    handleSuffixes: ["_kr", ".tech", "_review", "_lab", "_daily", ".dev", "_unbox", ".io", "_pro", ""],
    koreanNames: ["도윤", "현석", "재영", "선우", "지호", "정민", "상현", "윤호", "태준", "민혁", "건호", "시현", "정우", "승현", "원준"],
    oneLiners: [
      "최신 스마트폰을 객관적으로 비교 분석하는 테크 리뷰어",
      "다양한 가젯과 IT 기기를 언박싱하고 실사용 후기를 공유하는 테크 크리에이터",
      "PC 빌드와 게이밍 셋업을 소개하는 하드웨어 전문 리뷰어",
      "AI 도구와 생산성 앱을 활용한 업무 효율화 팁을 공유하는 크리에이터",
      "코딩 튜토리얼과 개발자 라이프를 공유하는 프로그래머 인플루언서",
    ],
    reasons: [
      "스마트폰 리뷰의 객관성과 디테일로 테크 커뮤니티에서 신뢰도 높음",
      "언박싱 콘텐츠의 퀄리티와 솔직한 평가로 구매 결정에 큰 영향",
      "PC 빌드 가이드의 전문성으로 게이밍 커뮤니티에서 인기",
      "AI 활용 팁이 직장인들에게 실질적인 도움을 제공",
      "개발 콘텐츠의 접근성이 높아 코딩 입문자들에게 인기",
    ],
  },
  {
    category: "Art",
    subNiches: ["Digital illustration", "Traditional painting", "Photography", "Calligraphy", "Craft & DIY"],
    handlePrefixes: ["art", "draw", "paint", "create", "canvas", "studio", "brush", "design", "ink", "craft"],
    handleSuffixes: ["_kr", ".art", "_studio", "_daily", "_log", ".draw", "_works", ".create", "_lab", ""],
    koreanNames: ["예진", "시은", "태하", "수민", "하윤", "재은", "도연", "유빈", "서하", "민서", "지온", "채빈", "윤서", "소은", "하준"],
    oneLiners: [
      "디지털 일러스트레이션으로 감성적인 세계관을 구축하는 아티스트",
      "전통 회화의 아름다움을 현대적으로 재해석하는 화가 겸 크리에이터",
      "일상의 아름다운 순간을 포착하는 감성 포토그래퍼",
      "캘리그라피로 따뜻한 메시지를 전하는 서예 아티스트",
      "핸드메이드 크래프트와 DIY 프로젝트를 공유하는 크리에이터",
    ],
    reasons: [
      "독창적인 일러스트 스타일로 아트 커뮤니티에서 높은 인지도",
      "전통과 현대를 넘나드는 작품 세계로 미술 애호가들에게 인기",
      "감성적인 사진 스타일로 높은 팔로워 참여율을 기록",
      "캘리그라피 작품의 예술성과 메시지 전달력이 뛰어남",
      "DIY 콘텐츠의 재현 가능성이 높아 저장률이 높음",
    ],
  },
  {
    category: "Music",
    subNiches: ["K-pop cover dance", "Indie music", "Guitar & instruments", "Singing & vocals", "Music production"],
    handlePrefixes: ["music", "melody", "beat", "sing", "sound", "rhythm", "tune", "vocal", "band", "play"],
    handleSuffixes: ["_kr", ".music", "_studio", "_daily", "_cover", ".sound", "_live", ".beat", "_play", ""],
    koreanNames: ["윤아", "재훈", "소율", "정환", "미래", "동건", "하늘", "현진", "서인", "지한", "예찬", "수빈", "태영", "나현", "성재"],
    oneLiners: [
      "K-pop 커버 댄스로 글로벌 팬들과 소통하는 댄스 크리에이터",
      "인디 음악 씬의 숨은 보석들을 발굴하고 소개하는 음악 큐레이터",
      "기타 연주와 작곡으로 감성적인 음악을 들려주는 싱어송라이터",
      "파워풀한 보컬 커버로 큰 호응을 얻는 보컬 크리에이터",
      "비트메이킹과 프로듀싱 과정을 공유하는 음악 프로듀서",
    ],
    reasons: [
      "K-pop 커버 콘텐츠의 완성도가 높아 해외 팬층까지 보유",
      "인디 음악 큐레이션의 감성이 독특하고 팬 충성도가 높음",
      "악기 연주 실력과 감성적인 편곡으로 음악 팬들에게 인기",
      "보컬 커버의 퀄리티가 뛰어나 바이럴 콘텐츠를 다수 보유",
      "프로듀싱 비하인드 콘텐츠로 음악 입문자들에게 교육적 가치 제공",
    ],
  },
  {
    category: "Parenting",
    subNiches: ["Baby & toddler", "Pregnancy journey", "Educational play", "Family vlog", "Single parenting"],
    handlePrefixes: ["mom", "dad", "baby", "family", "parent", "kiddo", "mama", "papa", "child", "tiny"],
    handleSuffixes: ["_kr", ".fam", "_log", "_daily", "_story", ".mom", "_life", ".dad", "_diary", ""],
    koreanNames: ["은혜", "승훈", "지연", "태호", "미영", "동수", "선미", "재호", "수경", "정훈", "혜정", "민호", "은지", "태경", "수정"],
    oneLiners: [
      "영유아 양육 팁과 육아 일상을 따뜻하게 담아내는 육아 크리에이터",
      "임신과 출산의 여정을 솔직하게 공유하며 예비맘들을 응원하는 인플루언서",
      "놀이를 통한 아이 교육법을 소개하는 교육 전문 육아 블로거",
      "가족의 소소한 일상을 브이로그로 담아 많은 부모들의 공감을 얻는 크리에이터",
      "홀로 아이를 키우며 겪는 현실적인 이야기를 나누는 싱글맘 인플루언서",
    ],
    reasons: [
      "실질적인 육아 팁으로 신생아 부모들에게 큰 도움을 제공",
      "임신 여정의 진정성 있는 기록으로 예비 부모들에게 위로와 정보 제공",
      "교육 놀이 콘텐츠의 실용성이 높아 부모들의 저장률이 높음",
      "가족 브이로그의 따뜻한 분위기로 가족 가치를 전파",
      "싱글 페어런팅의 현실적인 이야기로 많은 공감과 응원을 받음",
    ],
  },
  {
    category: "Pets",
    subNiches: ["Dogs", "Cats", "Exotic pets", "Pet training", "Pet product review"],
    handlePrefixes: ["pet", "puppy", "kitty", "meow", "woof", "paw", "furry", "nyang", "mung", "animal"],
    handleSuffixes: ["_kr", ".pet", "_daily", "_log", "_life", ".love", "_gram", ".cute", "_world", ""],
    koreanNames: ["주영", "서율", "민기", "하은", "태리", "소라", "진영", "윤서", "다솜", "재민", "은수", "성은", "수진", "현서", "보경"],
    oneLiners: [
      "반려견과의 일상을 사랑스럽게 담아내는 강아지 인스타그래머",
      "고양이의 귀여운 일상과 집사 생활을 공유하는 냥집사 크리에이터",
      "이색 반려동물의 매력을 알리며 올바른 사육법을 전파하는 크리에이터",
      "과학적인 반려동물 훈련법을 소개하는 전문 트레이너 인플루언서",
      "반려동물 용품을 꼼꼼히 리뷰하고 추천하는 펫 리뷰어",
    ],
    reasons: [
      "반려견 콘텐츠의 귀여움과 정보성으로 높은 참여율을 기록",
      "고양이 일상 콘텐츠가 바이럴 포텐셜이 높아 꾸준한 성장세",
      "이색 반려동물 분야의 희소성으로 독보적인 포지셔닝",
      "반려동물 훈련 콘텐츠의 전문성으로 실질적 도움 제공",
      "펫 용품 리뷰의 신뢰성으로 반려인들의 구매에 큰 영향",
    ],
  },
  {
    category: "Home",
    subNiches: ["Interior design", "Small apartment living", "Kitchen & cooking space", "Plant & garden", "Organization & declutter"],
    handlePrefixes: ["home", "room", "space", "house", "interior", "decor", "nest", "living", "cozy", "place"],
    handleSuffixes: ["_kr", ".home", "_log", "_daily", "_tour", ".room", "_design", ".space", "_edit", ""],
    koreanNames: ["지현", "성우", "미선", "태연", "재이", "수현", "동민", "은경", "하진", "정수", "나리", "건영", "미주", "석호", "보윤"],
    oneLiners: [
      "트렌디한 인테리어 디자인으로 공간의 변신을 보여주는 인테리어 크리에이터",
      "작은 공간을 효율적이고 예쁘게 꾸미는 노하우를 공유하는 원룸 인테리어 전문가",
      "감성적인 주방 인테리어와 요리 공간을 소개하는 키친 크리에이터",
      "식물 가꾸기와 가드닝의 즐거움을 전하는 플랜테리어 인플루언서",
      "정리정돈과 미니멀 라이프로 깔끔한 공간을 만드는 정리 전문가",
    ],
    reasons: [
      "인테리어 비포&애프터 콘텐츠의 시각적 임팩트로 높은 공유율",
      "소형 공간 활용 팁이 자취생과 신혼부부에게 실질적 도움",
      "주방 인테리어 콘텐츠가 요리와 인테리어 관심층을 동시 공략",
      "플랜테리어 트렌드를 선도하며 식물 관련 브랜드와 활발히 협업",
      "정리 콘텐츠의 실용성이 높아 저장률이 카테고리 내 최상위",
    ],
  },
  {
    category: "Education",
    subNiches: ["English learning", "Study with me", "Career & self-development", "Finance & investing", "University student life"],
    handlePrefixes: ["study", "learn", "edu", "book", "smart", "grow", "brain", "class", "tutor", "wise"],
    handleSuffixes: ["_kr", ".study", "_log", "_daily", "_tip", ".learn", "_note", ".edu", "_path", ""],
    koreanNames: ["성빈", "예원", "진수", "하은", "민준", "서빈", "태인", "수빈", "재원", "윤지", "정빈", "소희", "현수", "나인", "태성"],
    oneLiners: [
      "효과적인 영어 학습법과 생활 영어 표현을 쉽게 알려주는 영어 크리에이터",
      "함께 공부하는 스터디 윗미 콘텐츠로 학생들의 동기부여를 돕는 크리에이터",
      "커리어 성장과 자기개발 팁을 공유하는 직장인 멘토 인플루언서",
      "주식과 투자 기초를 쉽게 설명하는 금융 교육 크리에이터",
      "대학 생활의 리얼한 일상과 공부 팁을 공유하는 대학생 인플루언서",
    ],
    reasons: [
      "영어 학습 콘텐츠의 실용성으로 학생과 직장인 모두에게 인기",
      "스터디 윗미 콘텐츠가 집중력 향상에 도움을 줘 꾸준한 시청 유지",
      "자기개발 팁의 실행 가능성이 높아 직장인들의 높은 저장률",
      "금융 교육 콘텐츠의 접근성으로 MZ세대 투자 입문자에게 인기",
      "대학 생활 콘텐츠로 10대 후반~20대 초반 타겟층에 강한 영향력",
    ],
  },
  {
    category: "Entertainment",
    subNiches: ["Movie & drama review", "Gaming", "Comedy & meme", "K-pop fan account", "Book review"],
    handlePrefixes: ["fun", "play", "movie", "drama", "game", "show", "laugh", "fan", "read", "watch"],
    handleSuffixes: ["_kr", ".play", "_review", "_daily", "_log", ".fun", "_zone", ".tv", "_club", ""],
    koreanNames: ["성준", "유정", "태원", "수빈", "민규", "하은", "재환", "소라", "동영", "지민", "현태", "나영", "정호", "미소", "승재"],
    oneLiners: [
      "영화와 드라마의 깊이 있는 리뷰와 분석을 제공하는 엔터테인먼트 크리에이터",
      "최신 게임 플레이와 리뷰로 게이머들과 소통하는 게임 인플루언서",
      "유머러스한 콘텐츠와 밈으로 일상의 웃음을 선사하는 코미디 크리에이터",
      "K-pop 아이돌의 소식과 팬 아트를 공유하는 팬 어카운트 운영자",
      "독서 리뷰와 책 추천으로 독서 문화를 활성화하는 북 크리에이터",
    ],
    reasons: [
      "드라마 리뷰의 분석력과 스포일러 관리로 시청자들에게 신뢰",
      "게임 콘텐츠의 전문성과 재미로 게이밍 커뮤니티에서 인기",
      "밈 콘텐츠의 바이럴 파워로 빠른 팔로워 성장세",
      "K-pop 팬덤과의 강한 유대감으로 높은 참여율 기록",
      "독서 리뷰의 깊이와 다양성으로 독서 커뮤니티에서 영향력",
    ],
  },
  {
    category: "Wellness",
    subNiches: ["Meditation & mindfulness", "Aromatherapy & healing", "Mental health", "Self-care routine", "Holistic wellness"],
    handlePrefixes: ["well", "zen", "calm", "heal", "mind", "soul", "peace", "balance", "pure", "inner"],
    handleSuffixes: ["_kr", ".zen", "_daily", "_log", "_life", ".mind", "_care", ".soul", "_path", ""],
    koreanNames: ["서진", "하윤", "태희", "유나", "진서", "소율", "민아", "채영", "도경", "지안", "은서", "수아", "혜림", "윤아", "나린"],
    oneLiners: [
      "명상과 마음챙김으로 내면의 평화를 찾는 법을 안내하는 웰니스 가이드",
      "아로마테라피와 힐링 콘텐츠로 지친 현대인의 쉼을 선사하는 크리에이터",
      "마음 건강의 중요성을 알리고 심리 상담의 접근성을 높이는 인플루언서",
      "셀프케어 루틴을 통해 자기 사랑의 방법을 알려주는 웰니스 크리에이터",
      "전인적 건강을 추구하며 몸과 마음의 균형 잡힌 라이프스타일을 제안",
    ],
    reasons: [
      "명상 콘텐츠의 차분한 분위기로 높은 팔로워 충성도와 저장률",
      "아로마 힐링 콘텐츠가 스트레스 관리에 관심 많은 직장인들에게 인기",
      "정신건강 콘텐츠의 사회적 가치와 공감력으로 빠른 성장세",
      "셀프케어 루틴의 실천 가능성이 높아 일상에 도움이 되는 콘텐츠",
      "홀리스틱 웰니스 트렌드를 선도하며 관련 브랜드와 활발한 협업",
    ],
  },
  {
    category: "Health",
    subNiches: ["Diet & nutrition", "Health supplements", "Medical tips", "Healthy recipes", "Chronic illness awareness"],
    handlePrefixes: ["health", "diet", "nutri", "vita", "clean", "fresh", "green", "care", "body", "life"],
    handleSuffixes: ["_kr", ".health", "_tip", "_daily", "_log", ".diet", "_guide", ".care", "_fit", ""],
    koreanNames: ["성은", "재혁", "미진", "태우", "수민", "동현", "하영", "정빈", "윤서", "진아", "현정", "소연", "태준", "나영", "승은"],
    oneLiners: [
      "과학적 근거 기반의 다이어트와 영양 정보를 제공하는 건강 크리에이터",
      "건강 보조제와 영양제를 객관적으로 리뷰하는 헬스케어 인플루언서",
      "일상에서 실천할 수 있는 건강 관리 팁을 알려주는 의료 정보 크리에이터",
      "건강하면서도 맛있는 레시피를 개발하고 공유하는 헬시 푸드 크리에이터",
      "만성질환에 대한 인식을 높이고 환자들의 일상을 응원하는 인플루언서",
    ],
    reasons: [
      "다이어트 정보의 과학적 근거와 실용성으로 높은 신뢰도",
      "건강 보조제 리뷰의 객관성으로 구매 결정에 큰 영향력",
      "의료 정보의 접근성을 높여 건강 관리에 실질적 도움 제공",
      "건강 레시피의 재현 가능성과 맛으로 높은 저장률 기록",
      "만성질환 인식 콘텐츠의 사회적 가치와 공감력이 뛰어남",
    ],
  },
  {
    category: "Finance",
    subNiches: ["Stock investing", "Real estate", "Crypto & blockchain", "Financial independence", "Side hustle & income"],
    handlePrefixes: ["money", "invest", "rich", "cash", "stock", "wealth", "coin", "profit", "save", "earn"],
    handleSuffixes: ["_kr", ".money", "_tip", "_daily", "_log", ".invest", "_guide", ".fin", "_hub", ""],
    koreanNames: ["정훈", "수아", "태경", "민지", "재욱", "하은", "성민", "윤하", "동건", "예린", "현우", "소연", "재이", "나현", "승우"],
    oneLiners: [
      "주식 투자 분석과 시장 전망을 알기 쉽게 전하는 투자 크리에이터",
      "부동산 시장 동향과 투자 노하우를 공유하는 부동산 전문가 인플루언서",
      "암호화폐와 블록체인 기술을 쉽게 설명하는 크립토 크리에이터",
      "경제적 자유를 향한 재테크 전략을 공유하는 파이어족 인플루언서",
      "부업과 추가 수입원 만들기 노하우를 알려주는 사이드 허슬 크리에이터",
    ],
    reasons: [
      "주식 분석의 전문성과 이해하기 쉬운 설명으로 투자 입문자에게 인기",
      "부동산 정보의 실시간성과 분석력으로 부동산 관심층에 큰 영향",
      "암호화폐 시장 분석의 정확도로 크립토 커뮤니티에서 신뢰",
      "파이어 전략의 현실적인 로드맵으로 MZ세대 재테크에 영감",
      "사이드 허슬 노하우의 실행 가능성으로 높은 저장률과 공유율",
    ],
  },
  {
    category: "Gaming",
    subNiches: ["PC gaming", "Mobile gaming", "Game streaming", "Esports", "Retro gaming"],
    handlePrefixes: ["game", "gamer", "play", "pixel", "quest", "level", "boss", "gg", "pro", "noob"],
    handleSuffixes: ["_kr", ".gg", "_play", "_daily", "_log", ".game", "_stream", ".tv", "_pro", ""],
    koreanNames: ["재현", "유빈", "성진", "하은", "민석", "도현", "태우", "소희", "진우", "현아", "동우", "나현", "재원", "수빈", "성준"],
    oneLiners: [
      "PC 게임 공략과 리뷰를 전문적으로 다루는 게이밍 크리에이터",
      "모바일 게임의 최신 트렌드와 공략을 소개하는 모바일 게이머",
      "실시간 스트리밍으로 게이머들과 소통하는 스트리머 인플루언서",
      "프로 게이머의 플레이 분석과 e스포츠 소식을 전하는 e스포츠 크리에이터",
      "레트로 게임의 추억과 매력을 되살리는 빈티지 게임 크리에이터",
    ],
    reasons: [
      "PC 게임 공략의 전문성과 퀄리티로 게이밍 커뮤니티에서 높은 인지도",
      "모바일 게임 리뷰의 접근성으로 캐주얼 게이머들에게 인기",
      "스트리밍의 엔터테인먼트 가치와 소통으로 높은 시청 시간",
      "e스포츠 분석의 전문성으로 경쟁 게이밍 팬들에게 영향력",
      "레트로 게임 콘텐츠의 향수 포인트로 독특한 포지셔닝 확보",
    ],
  },
  {
    category: "Sports",
    subNiches: ["Soccer & football", "Basketball", "Golf", "Tennis & badminton", "Surfing & water sports"],
    handlePrefixes: ["sport", "goal", "score", "ball", "run", "power", "ace", "champ", "kick", "swing"],
    handleSuffixes: ["_kr", ".sport", "_play", "_daily", "_log", ".pro", "_life", ".fit", "_team", ""],
    koreanNames: ["성호", "재원", "민기", "하진", "태훈", "서진", "동현", "수진", "현석", "나래", "정우", "소영", "재민", "윤서", "승민"],
    oneLiners: [
      "축구 분석과 플레이 하이라이트를 다루는 축구 전문 크리에이터",
      "농구 기술 향상 팁과 NBA 분석을 공유하는 농구 인플루언서",
      "골프 스윙 교정과 라운딩 브이로그를 공유하는 골프 크리에이터",
      "테니스 레슨과 대회 참가기를 기록하는 라켓 스포츠 인플루언서",
      "서핑과 수상 스포츠의 짜릿한 순간을 담아내는 해양 스포츠 크리에이터",
    ],
    reasons: [
      "축구 분석의 전문성과 열정으로 축구 팬층에서 큰 영향력",
      "농구 기술 튜토리얼의 실용성으로 농구 입문자들에게 인기",
      "골프 콘텐츠의 접근성으로 골프 붐에 편승한 빠른 성장",
      "라켓 스포츠 커뮤니티를 활성화하며 관련 브랜드와 활발한 협업",
      "수상 스포츠의 역동적인 영상미로 높은 바이럴 파워",
    ],
  },
  {
    category: "Photography",
    subNiches: ["Portrait photography", "Landscape & travel", "Street photography", "Film photography", "Product photography"],
    handlePrefixes: ["photo", "shot", "lens", "snap", "frame", "focus", "capture", "film", "click", "exposure"],
    handleSuffixes: ["_kr", ".photo", "_log", "_daily", "_studio", ".lens", "_works", ".film", "_lab", ""],
    koreanNames: ["도윤", "채원", "성빈", "하은", "태현", "서은", "재윤", "민서", "지한", "소윤", "현우", "나린", "정빈", "유하", "승현"],
    oneLiners: [
      "인물의 감정과 이야기를 담아내는 포트레이트 사진작가",
      "자연의 웅장함과 여행지의 아름다움을 포착하는 풍경 포토그래퍼",
      "도시의 일상적인 순간들을 예술적으로 포착하는 스트릿 포토그래퍼",
      "필름 카메라의 감성과 아날로그 분위기를 전하는 필름 포토그래퍼",
      "제품의 매력을 극대화하는 전문 프로덕트 포토그래퍼",
    ],
    reasons: [
      "포트레이트 사진의 예술적 가치와 기술력으로 사진 커뮤니티에서 인정",
      "풍경 사진의 스케일감과 색감으로 여행 및 사진 애호가들에게 인기",
      "스트릿 포토의 독특한 시각으로 도시 문화 콘텐츠에 영감 제공",
      "필름 사진의 감성적 매력으로 아날로그 문화를 전파",
      "프로덕트 사진의 전문성으로 브랜드 마케팅 분야에서 높은 수요",
    ],
  },
];

// -----------------------------------------------------------------------
// Handle generation logic
// -----------------------------------------------------------------------

const TIERS = ["nano", "micro", "mid", "macro", "mega"] as const;
const TIER_FOLLOWER_RANGES: Record<string, string> = {
  nano: "1K-10K",
  micro: "10K-50K",
  mid: "50K-200K",
  macro: "200K-1M",
  mega: "1M+",
};
const STYLES = ["minimalist", "vibrant", "storytelling", "brand-friendly"] as const;

// Tier distribution per 100 handles
const TIER_DISTRIBUTION: Record<string, number> = {
  nano: 30,
  micro: 35,
  mid: 20,
  macro: 10,
  mega: 5,
};

// Additional handle parts for diversity
const CONNECTORS = ["_", ".", ""];
const NUMBERS = ["", "0", "1", "2", "3", "7", "8", "9", "11", "22", "33", "77", "99", "00", "21", "23", "24", "25"];

function generateHandlesForCategory(catDef: CategoryDef, targetCount: number): StubSuggestion[] {
  const suggestions: StubSuggestion[] = [];
  const usedHandles = new Set<string>();

  // Method 1: prefix + Korean name romanized + suffix
  const koreanRoman = [
    "minjee", "subin", "hyunwoo", "jieun", "soyeon", "dain", "yujin", "chaewon",
    "seoyeon", "haeun", "dohyun", "yerin", "jihoo", "minji", "taehyun",
    "nayeon", "joon", "yeji", "sungmin", "hana", "doah", "iseul", "eunbi",
    "jaehyun", "sunwoo", "yohan", "kyungmin", "jiwon", "seungho", "hayoung",
    "bomi", "minseo", "yena", "siwoo", "taeyang", "hyunji", "jinho", "somin",
    "jinwoo", "nari", "gunwoo", "yoonji", "chaebin", "haru", "doyeon",
    "subeen", "yunho", "mirae", "harang", "daon", "nuel", "arin", "sieun",
    "taein", "yubin", "seoha", "jiyu", "harin", "minha", "woojin",
  ];

  // Method 2: English descriptive handles
  const englishParts = [
    "seoul", "korea", "daily", "urban", "modern", "classic", "minimal", "pure",
    "fresh", "bright", "warm", "soft", "real", "true", "my", "the",
    "little", "small", "big", "new", "old", "good", "best", "top",
    "happy", "lucky", "golden", "silver", "star", "moon", "sun", "sky",
    "blue", "pink", "green", "white", "black", "red", "indie", "local",
  ];

  const addHandle = (handle: string, tier: string, subNiche: string, style: string): boolean => {
    const clean = handle.toLowerCase().replace(/^@/, "").trim();
    if (clean.length === 0 || clean.length > 30) return false;
    if (!/^[a-zA-Z0-9._]+$/.test(clean)) return false;
    if (usedHandles.has(clean)) return false;

    usedHandles.add(clean);
    const subNicheIdx = catDef.subNiches.indexOf(subNiche);
    const oneLinerIdx = Math.abs(suggestions.length) % catDef.oneLiners.length;
    const reasonIdx = Math.abs(suggestions.length) % catDef.reasons.length;

    suggestions.push({
      handle: clean,
      estimatedFollowers: TIER_FOLLOWER_RANGES[tier],
      estimatedTier: tier,
      category: catDef.category,
      subNiche,
      oneLiner: catDef.oneLiners[oneLinerIdx],
      contentStyle: STYLES[suggestions.length % STYLES.length],
      reason: catDef.reasons[reasonIdx],
    });
    return true;
  };

  // Generate handles using multiple patterns
  let tierIdx = 0;
  const tierOrder: string[] = [];
  for (const [tier, count] of Object.entries(TIER_DISTRIBUTION)) {
    for (let i = 0; i < count; i++) tierOrder.push(tier);
  }

  const getTier = () => tierOrder[tierIdx++ % tierOrder.length];
  const getSubNiche = () => catDef.subNiches[suggestions.length % catDef.subNiches.length];
  const getStyle = () => STYLES[suggestions.length % STYLES.length];

  // Pattern 1: Korean name + category prefix (40 handles)
  for (const name of koreanRoman) {
    if (suggestions.length >= targetCount) break;
    const prefix = catDef.handlePrefixes[suggestions.length % catDef.handlePrefixes.length];
    const connector = CONNECTORS[suggestions.length % CONNECTORS.length];
    const suffix = catDef.handleSuffixes[suggestions.length % catDef.handleSuffixes.length];
    const handle = `${name}${connector}${prefix}${suffix}`;
    addHandle(handle, getTier(), getSubNiche(), getStyle());
  }

  // Pattern 2: Prefix + English part + number (30 handles)
  for (const eng of englishParts) {
    if (suggestions.length >= targetCount) break;
    const prefix = catDef.handlePrefixes[suggestions.length % catDef.handlePrefixes.length];
    const num = NUMBERS[suggestions.length % NUMBERS.length];
    const connector = CONNECTORS[suggestions.length % CONNECTORS.length];
    const suffix = catDef.handleSuffixes[suggestions.length % catDef.handleSuffixes.length];
    const handle = `${prefix}${connector}${eng}${num}${suffix}`;
    addHandle(handle, getTier(), getSubNiche(), getStyle());
  }

  // Pattern 3: Descriptive compound handles (20 handles)
  const compounds = [
    `the${catDef.handlePrefixes[0]}_kr`, `${catDef.handlePrefixes[1]}.daily.kr`,
    `seoul_${catDef.handlePrefixes[2]}`, `my.${catDef.handlePrefixes[3]}_log`,
    `daily${catDef.handlePrefixes[4]}_gram`, `${catDef.handlePrefixes[0]}.mood.kr`,
    `_${catDef.handlePrefixes[1]}_official`, `${catDef.handlePrefixes[2]}ing.kr`,
    `real_${catDef.handlePrefixes[3]}`, `${catDef.handlePrefixes[4]}.story`,
    `kr_${catDef.handlePrefixes[0]}_life`, `${catDef.handlePrefixes[1]}.room`,
    `${catDef.handlePrefixes[2]}_note.kr`, `happy.${catDef.handlePrefixes[3]}`,
    `${catDef.handlePrefixes[4]}_vibes`, `urban.${catDef.handlePrefixes[0]}`,
    `indie_${catDef.handlePrefixes[1]}`, `${catDef.handlePrefixes[2]}.archive`,
    `${catDef.handlePrefixes[3]}_blueprint`, `${catDef.handlePrefixes[4]}.journal`,
  ];
  for (const h of compounds) {
    if (suggestions.length >= targetCount) break;
    addHandle(h, getTier(), getSubNiche(), getStyle());
  }

  // Pattern 4: Korean name + suffix variations (10+ handles)
  for (let i = 0; i < koreanRoman.length && suggestions.length < targetCount; i++) {
    const name = koreanRoman[i];
    const suffix = catDef.handleSuffixes[(i + 3) % catDef.handleSuffixes.length];
    const num = NUMBERS[(i + 5) % NUMBERS.length];
    addHandle(`${name}${num}${suffix}`, getTier(), getSubNiche(), getStyle());
  }

  // Pattern 5: Creative short handles
  const creatives = [
    `_zzin_${catDef.handlePrefixes[0]}`, `${catDef.handlePrefixes[1]}tok`,
    `o.${catDef.handlePrefixes[2]}.o`, `${catDef.handlePrefixes[3]}holic`,
    `${catDef.handlePrefixes[4]}ism`, `${catDef.handlePrefixes[0]}pie`,
    `mini${catDef.handlePrefixes[1]}`, `${catDef.handlePrefixes[2]}nova`,
    `${catDef.handlePrefixes[3]}ful`, `lil.${catDef.handlePrefixes[4]}`,
  ];
  for (const h of creatives) {
    if (suggestions.length >= targetCount) break;
    addHandle(h, getTier(), getSubNiche(), getStyle());
  }

  return suggestions.slice(0, targetCount);
}

// -----------------------------------------------------------------------
// Main execution
// -----------------------------------------------------------------------

const HANDLES_PER_CATEGORY = 100;

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { count: beforeCount } = await supabase
    .from("influencers")
    .select("*", { count: "exact", head: true });

  console.log(`\n📊 현재 DB 인플루언서 수: ${beforeCount ?? 0}`);
  console.log(`📋 처리할 카테고리: ${CATEGORIES.length}개`);
  console.log(`🔢 카테고리당 핸들: ${HANDLES_PER_CATEGORY}개`);
  console.log(`⏱️  시작합니다...\n`);

  let totalInserted = 0;
  let totalDuplicates = 0;
  let totalErrors = 0;

  for (let i = 0; i < CATEGORIES.length; i++) {
    const catDef = CATEGORIES[i];
    const progress = `[${i + 1}/${CATEGORIES.length}]`;

    console.log(`${progress} 🏷️  ${catDef.category} 생성 중...`);

    const suggestions = generateHandlesForCategory(catDef, HANDLES_PER_CATEGORY);

    console.log(`${progress} 📝 ${catDef.category}: ${suggestions.length}개 핸들 생성, DB 삽입 중...`);

    const result = await insertStubBatch(supabase, suggestions);

    totalInserted += result.inserted;
    totalDuplicates += result.duplicates;
    totalErrors += result.errors;

    console.log(
      `${progress} ✅ ${catDef.category}: inserted=${result.inserted} duplicates=${result.duplicates} errors=${result.errors}`
    );
  }

  const { count: afterCount } = await supabase
    .from("influencers")
    .select("*", { count: "exact", head: true });

  console.log(`\n${"=".repeat(50)}`);
  console.log(`🎉 시딩 완료!`);
  console.log(`   삽입: ${totalInserted}`);
  console.log(`   중복 스킵: ${totalDuplicates}`);
  console.log(`   에러: ${totalErrors}`);
  console.log(`   DB 전체: ${beforeCount ?? 0} → ${afterCount ?? 0} (${(afterCount ?? 0) - (beforeCount ?? 0)} 증가)`);
  console.log(`${"=".repeat(50)}\n`);
}

main().catch(console.error);
