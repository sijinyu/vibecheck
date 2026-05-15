/**
 * Static Seed Script v2 — 추가 배치
 *
 * v1과 다른 핸들 패턴을 사용하여 추가 2,000+ 스텁 생성.
 *
 * Usage: npx tsx scripts/static-seed-v2.ts
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

const TIERS = ["nano", "micro", "mid", "macro", "mega"] as const;
const TIER_FOLLOWER_RANGES: Record<string, string> = {
  nano: "1K-10K", micro: "10K-50K", mid: "50K-200K", macro: "200K-1M", mega: "1M+",
};
const STYLES = ["minimalist", "vibrant", "storytelling", "brand-friendly"] as const;

interface CatMeta {
  category: string;
  subNiches: string[];
  oneLiners: string[];
  reasons: string[];
}

const CATS: CatMeta[] = [
  { category: "Fashion", subNiches: ["Korean streetwear", "Minimal fashion", "Luxury fashion", "Vintage fashion", "Sustainable fashion"],
    oneLiners: ["세련된 데일리룩으로 MZ세대 여성들에게 영감을 주는 스타일리스트", "하이엔드 브랜드 믹스매치의 달인으로 패션 업계에서 인정받는 인플루언서", "지속가능한 패션의 가치를 전파하는 에코 패셔니스타", "빈티지 아이템으로 유니크한 스타일을 완성하는 크리에이터", "스트릿 패션의 트렌드를 리드하는 패션 아이콘"],
    reasons: ["높은 패션 감각과 브랜드 협업 경험으로 신뢰도 있는 스타일 제안", "SNS 저장률이 높은 코디 콘텐츠를 꾸준히 발행", "친환경 패션에 대한 진정성 있는 메시지 전달", "독특한 빈티지 스타일로 차별화된 포지셔닝", "스트릿 패션 씬의 핵심 인플루언서로 브랜드 가치 제고"] },
  { category: "Beauty", subNiches: ["Skincare", "Makeup tutorials", "K-beauty", "Natural beauty", "Nail art"],
    oneLiners: ["피부 고민별 맞춤 솔루션을 제공하는 스킨케어 전문가", "트렌디한 메이크업 룩을 쉽게 따라할 수 있도록 안내하는 뷰티 튜터", "글로벌 K-뷰티 트렌드를 선도하는 뷰티 인플루언서", "자연스러운 아름다움을 추구하는 클린 뷰티 크리에이터", "섬세한 네일 아트로 손끝의 예술을 보여주는 네일리스트"],
    reasons: ["성분 분석 기반의 리뷰로 뷰티 커뮤니티에서 높은 신뢰", "메이크업 테크닉의 전문성으로 교육적 가치가 높은 콘텐츠", "해외 팔로워 비율이 높아 글로벌 브랜드 마케팅에 적합", "클린 뷰티 트렌드에 맞는 진정성 있는 콘텐츠 제작", "창의적인 네일 디자인으로 아트 커뮤니티에서도 주목"] },
  { category: "Food", subNiches: ["Korean cuisine", "Cafe & desserts", "Home cooking", "Vegan & healthy", "Street food"],
    oneLiners: ["전통 한식의 깊은 맛을 현대적으로 재해석하는 요리 크리에이터", "감성적인 카페 투어와 디저트 리뷰로 팔로워들의 입맛을 사로잡는 푸디", "누구나 따라할 수 있는 간편 레시피를 공유하는 홈쿡 마스터", "건강한 비건 식단으로 웰빙 라이프를 제안하는 푸드 블로거", "전국 숨은 맛집과 길거리 음식의 매력을 전하는 먹방 크리에이터"],
    reasons: ["한식 레시피의 전문성과 비주얼로 높은 저장률", "카페 리뷰의 감성과 정확성으로 큰 영향력", "간편 레시피의 접근성으로 폭넓은 팬층 확보", "비건 식단의 맛과 영양을 동시에 잡는 콘텐츠", "현장감 넘치는 먹방으로 높은 조회수 기록"] },
  { category: "Fitness", subNiches: ["Gym & weightlifting", "Yoga & pilates", "Running", "Home workout", "Sports nutrition"],
    oneLiners: ["체계적인 웨이트 루틴과 바디 변화를 보여주는 피트니스 인플루언서", "우아한 요가 시퀀스로 몸과 마음의 균형을 안내하는 요가 강사", "러닝의 즐거움과 성취를 공유하는 아마추어 마라토너", "집에서 할 수 있는 효과적인 운동 프로그램을 설계하는 홈트 코치", "운동 전후 영양 섭취와 보충제 활용법을 알려주는 영양 컨설턴트"],
    reasons: ["실질적인 변화를 보여줘 동기부여 효과 극대화", "차분하고 전문적인 지도로 높은 팔로워 충성도", "러닝 커뮤니티 활성화에 기여하며 스포츠 브랜드와 협업", "바쁜 직장인을 위한 실용적 홈트로 높은 저장률", "과학적 영양 정보로 피트니스 커뮤니티에서 신뢰"] },
  { category: "Travel", subNiches: ["Domestic Korea travel", "Southeast Asia", "Europe travel", "Budget travel", "Luxury travel"],
    oneLiners: ["한국 소도시의 숨겨진 매력을 발굴하는 국내 여행 전문가", "동남아의 현지 문화와 맛을 생생하게 전하는 배낭여행자", "유럽의 건축과 예술을 감성적으로 기록하는 여행 포토그래퍼", "알뜰하게 세계를 누비는 예산 여행의 달인", "럭셔리 리조트와 프리미엄 경험을 소개하는 하이엔드 트래블러"],
    reasons: ["국내 여행 정보의 실용성으로 높은 저장률", "동남아 현지 팁의 디테일함으로 여행 준비에 도움", "유럽 사진의 높은 퀄리티로 감성 여행 대표 계정", "저예산 여행 팁으로 2030세대에 인기", "프리미엄 여행 리뷰로 고급 시장에서 영향력"] },
  { category: "Lifestyle", subNiches: ["Daily vlog", "Minimalist living", "Self-care & wellness", "Aesthetic room", "Morning routine"],
    oneLiners: ["소소한 일상 속 행복을 감성적으로 담는 라이프 브이로거", "덜어냄의 미학으로 풍요로운 삶을 보여주는 미니멀리스트", "자기 관리 루틴으로 건강한 하루를 디자인하는 웰니스 크리에이터", "감각적인 공간 꾸미기로 인테리어 영감을 주는 룸 스타일리스트", "생산적인 아침 루틴으로 하루를 리드하는 모닝 크리에이터"],
    reasons: ["일상 콘텐츠의 진정성으로 높은 공감대", "미니멀 라이프 팁의 실용성으로 라이프스타일 변화 영감", "셀프케어 루틴의 저장률이 카테고리 내 상위", "룸 투어 콘텐츠로 인테리어 관심층에 영향력", "모닝 루틴의 실천 가능성으로 동기부여 효과"] },
  { category: "Tech", subNiches: ["Smartphone reviews", "Gadget unboxing", "PC & gaming", "AI & productivity", "Coding & dev"],
    oneLiners: ["최신 디바이스를 냉정하게 비교 분석하는 테크 리뷰어", "신기한 가젯의 실사용기를 공유하는 언박싱 크리에이터", "고사양 PC 빌드와 게이밍 환경을 세팅하는 하드웨어 마니아", "AI 도구로 업무 효율을 극대화하는 프로덕티비티 크리에이터", "현업 개발자의 코딩 라이프와 기술 트렌드를 공유하는 데브 인플루언서"],
    reasons: ["리뷰의 객관성으로 테크 커뮤니티에서 높은 신뢰도", "언박싱 콘텐츠의 퀄리티로 구매 결정에 영향", "PC 빌드 가이드의 전문성으로 게이밍 커뮤니티에서 인기", "AI 활용 팁이 직장인들에게 실질적 도움", "개발 콘텐츠의 접근성으로 코딩 입문자에게 인기"] },
  { category: "Art", subNiches: ["Digital illustration", "Traditional painting", "Photography", "Calligraphy", "Craft & DIY"],
    oneLiners: ["독창적인 세계관을 디지털 캔버스에 펼치는 일러스트레이터", "붓의 터치로 감동을 전하는 전통 화가 겸 아티스트", "렌즈를 통해 세상의 아름다움을 재발견하는 감성 포토그래퍼", "글씨의 예술로 마음을 전하는 캘리그라피 아티스트", "손으로 만드는 즐거움을 나누는 핸드메이드 크리에이터"],
    reasons: ["독창적인 화풍으로 아트 커뮤니티에서 높은 인지도", "전통과 현대를 넘나드는 작품 세계로 미술 팬들에게 인기", "감성적인 사진으로 높은 참여율 기록", "캘리그라피의 예술성과 메시지 전달력이 탁월", "DIY 콘텐츠의 재현성이 높아 저장률 상위"] },
  { category: "Music", subNiches: ["K-pop cover dance", "Indie music", "Guitar & instruments", "Singing & vocals", "Music production"],
    oneLiners: ["완벽한 안무 재현으로 글로벌 K-pop 팬을 사로잡는 커버 댄서", "인디 씬의 보석같은 음악을 큐레이션하는 음악 탐험가", "기타 선율로 감성을 노래하는 싱어송라이터", "압도적인 보컬 실력으로 커버곡에 새 생명을 불어넣는 보컬리스트", "비트에서 곡 완성까지 프로듀싱 과정을 보여주는 뮤직 프로듀서"],
    reasons: ["K-pop 커버의 완성도로 해외 팬 확보", "인디 큐레이션의 감성으로 높은 팬 충성도", "연주 실력과 감성 편곡으로 음악 팬에게 인기", "보컬 커버의 퀄리티로 바이럴 콘텐츠 다수", "프로듀싱 비하인드로 음악 입문자에게 교육적 가치"] },
  { category: "Parenting", subNiches: ["Baby & toddler", "Pregnancy journey", "Educational play", "Family vlog", "Single parenting"],
    oneLiners: ["육아의 현실과 기쁨을 솔직하게 기록하는 워킹맘 크리에이터", "임신부터 출산까지의 여정을 따뜻하게 나누는 예비맘 인플루언서", "놀면서 배우는 교육법으로 아이 성장을 돕는 에듀 크리에이터", "가족의 일상을 영상으로 담아 공감을 이끌어내는 패밀리 브이로거", "혼자서도 빛나는 육아 이야기를 전하는 싱글맘 블로거"],
    reasons: ["현실적인 육아 팁으로 신생아 부모에게 큰 도움", "임신 기록의 진정성으로 예비맘들에게 위로 제공", "교육 놀이의 실용성으로 높은 저장률", "가족 브이로그의 따뜻한 분위기로 공감 형성", "싱글 페어런팅의 진솔한 이야기로 응원과 공감"] },
  { category: "Pets", subNiches: ["Dogs", "Cats", "Exotic pets", "Pet training", "Pet product review"],
    oneLiners: ["사랑스러운 반려견과의 행복한 일상을 공유하는 멍집사", "도도한 냥이의 귀여운 순간들을 포착하는 고양이 전문 크리에이터", "이색 반려동물의 매력과 올바른 사육법을 알리는 크리에이터", "보상 기반 훈련으로 반려동물과 소통하는 트레이너 인플루언서", "반려용품을 꼼꼼히 비교 리뷰하는 펫 전문 리뷰어"],
    reasons: ["반려견 콘텐츠의 귀여움과 정보로 높은 참여율", "고양이 일상의 바이럴 포텐셜로 꾸준한 성장", "이색 반려동물의 희소성으로 독보적 포지셔닝", "훈련 콘텐츠의 전문성으로 실질적 도움", "펫 리뷰의 신뢰성으로 구매에 큰 영향"] },
  { category: "Home", subNiches: ["Interior design", "Small apartment living", "Kitchen & cooking space", "Plant & garden", "Organization & declutter"],
    oneLiners: ["공간을 작품으로 탈바꿈시키는 인테리어 전문 크리에이터", "좁은 공간을 넓게 쓰는 수납 달인 원룸 인테리어리스트", "감성 주방에서 펼쳐지는 요리와 공간의 이야기", "식물과 함께 살아가는 플랜테리어 라이프를 보여주는 크리에이터", "미니멀한 정리로 공간과 마음을 정돈하는 정리 컨설턴트"],
    reasons: ["비포&애프터의 시각적 임팩트로 높은 공유율", "소형 공간 활용 팁으로 자취생과 신혼부부에게 도움", "주방 인테리어가 요리와 인테리어 관심층 동시 공략", "플랜테리어 트렌드 선도로 식물 브랜드와 협업", "정리 콘텐츠의 실용성으로 저장률 카테고리 최상위"] },
  { category: "Education", subNiches: ["English learning", "Study with me", "Career & self-development", "Finance & investing", "University student life"],
    oneLiners: ["원어민 표현을 재미있게 알려주는 영어 학습 크리에이터", "함께 공부하는 분위기를 만들어 집중력을 높여주는 스터디 메이트", "직장인의 성장을 돕는 커리어 멘토 인플루언서", "쉽고 재미있게 투자를 배울 수 있는 금융 에듀 크리에이터", "캠퍼스 라이프의 리얼함을 담아내는 대학생 브이로거"],
    reasons: ["영어 콘텐츠의 실용성으로 학생과 직장인 모두에게 인기", "스터디 콘텐츠로 집중력 향상에 도움", "자기개발 팁의 실행력으로 높은 저장률", "금융 교육의 접근성으로 MZ세대에 인기", "캠퍼스 콘텐츠로 10대 후반~20대 초반 타겟에 강함"] },
  { category: "Entertainment", subNiches: ["Movie & drama review", "Gaming", "Comedy & meme", "K-pop fan account", "Book review"],
    oneLiners: ["스포 없는 깊이 있는 리뷰로 다음 볼 콘텐츠를 추천하는 리뷰어", "게임의 재미를 극대화하는 플레이와 공략을 공유하는 게이머", "일상 속 웃음을 선사하는 유쾌한 코미디 크리에이터", "최애 아이돌의 모든 것을 기록하는 열정 팬 어카운트", "책 한 권의 가치를 전하는 독서 인플루언서"],
    reasons: ["리뷰의 분석력으로 시청자들에게 신뢰", "게임 콘텐츠의 재미로 게이밍 커뮤니티에서 인기", "밈 콘텐츠의 바이럴로 빠른 팔로워 성장", "K-pop 팬덤과의 유대감으로 높은 참여율", "독서 리뷰의 깊이로 독서 커뮤니티에서 영향력"] },
  { category: "Wellness", subNiches: ["Meditation & mindfulness", "Aromatherapy & healing", "Mental health", "Self-care routine", "Holistic wellness"],
    oneLiners: ["호흡과 명상으로 마음의 안정을 찾아주는 마인드풀니스 가이드", "향기로 치유하는 아로마테라피 전문 힐러", "마음 건강의 소중함을 일상적 언어로 전하는 심리 크리에이터", "나를 위한 시간의 가치를 알려주는 셀프케어 전문가", "몸과 마음의 통합적 건강을 추구하는 홀리스틱 웰니스 코치"],
    reasons: ["명상 콘텐츠의 차분한 분위기로 높은 충성도와 저장률", "아로마 힐링이 스트레스 관리 관심층에 인기", "정신건강 콘텐츠의 사회적 가치로 빠른 성장", "셀프케어의 실천성으로 일상에 도움", "홀리스틱 트렌드 선도로 관련 브랜드와 협업"] },
  { category: "Health", subNiches: ["Diet & nutrition", "Health supplements", "Medical tips", "Healthy recipes", "Chronic illness awareness"],
    oneLiners: ["과학적 다이어트 정보와 식단 관리법을 전하는 영양 전문가", "건강 보조제의 효능을 객관적으로 분석하는 헬스케어 리뷰어", "알아두면 좋은 건강 상식을 쉽게 전달하는 의료 정보 크리에이터", "맛과 건강을 동시에 잡는 헬시 레시피 개발자", "만성질환과 함께 살아가는 이야기로 공감과 용기를 전하는 크리에이터"],
    reasons: ["다이어트 정보의 근거와 실용성으로 높은 신뢰도", "보조제 리뷰의 객관성으로 구매에 영향", "의료 정보 접근성 향상으로 실질적 도움", "건강 레시피의 재현성과 맛으로 높은 저장률", "만성질환 인식 콘텐츠의 사회적 가치와 공감력"] },
  { category: "Finance", subNiches: ["Stock investing", "Real estate", "Crypto & blockchain", "Financial independence", "Side hustle & income"],
    oneLiners: ["시장 분석과 종목 추천으로 투자자를 돕는 주식 크리에이터", "부동산 시세와 투자 전략을 명쾌하게 분석하는 부동산 전문가", "블록체인 기술과 코인 시장을 알기 쉽게 설명하는 크립토 전문가", "재테크 전략으로 경제적 자유를 향한 로드맵을 제시하는 인플루언서", "다양한 부수입 만들기 노하우를 실전으로 보여주는 사이드잡 크리에이터"],
    reasons: ["투자 분석의 전문성으로 입문자에게 인기", "부동산 정보의 실시간성으로 관심층에 큰 영향", "크립토 시장 분석의 정확도로 커뮤니티에서 신뢰", "파이어 전략의 현실적 로드맵으로 MZ재테크에 영감", "사이드잡 실행력으로 높은 저장률과 공유율"] },
  { category: "Gaming", subNiches: ["PC gaming", "Mobile gaming", "Game streaming", "Esports", "Retro gaming"],
    oneLiners: ["하드코어 PC 게이머의 깊이 있는 공략과 리뷰", "인기 모바일 게임의 최신 메타와 팁을 전하는 모바일 게이머", "재치 있는 입담과 실력으로 팬과 소통하는 라이브 스트리머", "프로 씬의 분석과 하이라이트를 전하는 e스포츠 캐스터", "추억의 게임에 새 생명을 불어넣는 레트로 게임 수집가"],
    reasons: ["PC 게임 공략의 전문성으로 게이밍 커뮤니티에서 인지도", "모바일 게임 리뷰로 캐주얼 게이머에게 인기", "스트리밍의 엔터테인먼트와 소통으로 높은 시청 시간", "e스포츠 분석으로 경쟁 게이밍 팬에게 영향력", "레트로 게임의 향수로 독특한 포지셔닝"] },
  { category: "Sports", subNiches: ["Soccer & football", "Basketball", "Golf", "Tennis & badminton", "Surfing & water sports"],
    oneLiners: ["축구 전술 분석과 하이라이트를 다루는 풋볼 크리에이터", "농구 기술과 NBA 소식을 전하는 바스켓볼 인플루언서", "골프 라운딩 브이로그와 스윙 팁을 공유하는 골퍼", "라켓 스포츠의 재미와 기술을 알려주는 테니스 크리에이터", "파도와 함께하는 자유로운 삶을 보여주는 서퍼 인플루언서"],
    reasons: ["축구 분석의 전문성으로 팬층에서 큰 영향력", "농구 튜토리얼의 실용성으로 입문자에게 인기", "골프 콘텐츠의 접근성으로 골프 붐과 함께 성장", "라켓 스포츠 커뮤니티 활성화로 브랜드와 협업", "수상 스포츠의 역동적 영상으로 높은 바이럴"] },
  { category: "Photography", subNiches: ["Portrait photography", "Landscape & travel", "Street photography", "Film photography", "Product photography"],
    oneLiners: ["인물의 순간을 영원히 담아내는 포트레이트 마스터", "대자연의 경이로움을 렌즈에 담는 풍경 사진작가", "도시의 리듬을 포착하는 스트릿 포토그래퍼", "필름의 따뜻한 감성을 지키는 아날로그 포토그래퍼", "제품의 가치를 극대화하는 커머셜 포토그래퍼"],
    reasons: ["포트레이트의 예술성으로 사진 커뮤니티에서 인정", "풍경 사진의 색감으로 여행 및 사진 애호가에게 인기", "스트릿 포토의 독특한 시각으로 도시 문화 콘텐츠에 영감", "필름 감성으로 아날로그 문화 전파", "프로덕트 사진의 전문성으로 브랜드 마케팅에 수요"] },
];

// -----------------------------------------------------------------------
// V2 Handle Patterns — completely different from v1
// -----------------------------------------------------------------------

const FIRST_PARTS = [
  // Korean romanization v2
  "yeonwoo", "sihyun", "junghwa", "taeri", "minjun", "hayul", "doah", "seungri",
  "woojoo", "nakyung", "jieun", "sungjae", "dahee", "kangmin", "yoonseo",
  "jihwan", "sooah", "dongjin", "harin", "byeol", "rina", "hyunbin", "choa",
  "baekhyun", "eunji", "sangwoo", "minah", "taejun", "soyul", "dongha",
  "yejun", "siha", "yunah", "seonho", "jiho", "chaemin", "nayul", "wonbin",
  "arin", "junghoon", "minju", "sungwoo", "haeri", "dongyeon", "yebin",
  "siwan", "nari", "gyumin", "taesun", "jimin", "suhyun", "daon", "hyunsoo",
  "eunha", "kyungsoo", "mirae", "taewon", "yesol", "sungbin", "hajin",
];

const SECOND_PARTS_BY_CAT: Record<string, string[]> = {
  Fashion: ["lookbook", "wardrobe", "attire", "drape", "stitch", "couture", "garment", "apparel", "slay", "chic"],
  Beauty: ["complexion", "radiance", "flawless", "glam", "lash", "palette", "contour", "highlight", "primer", "serum"],
  Food: ["bistro", "platter", "savor", "brunch", "pantry", "spice", "flavor", "morsel", "feast", "aroma"],
  Fitness: ["grind", "reps", "stamina", "flex", "cardio", "tone", "endure", "bench", "lift", "stride"],
  Travel: ["wanderlust", "passport", "detour", "horizon", "vista", "atlas", "compass", "transit", "route", "escape"],
  Lifestyle: ["curate", "ritual", "haven", "retreat", "dwell", "bloom", "thrive", "essence", "aura", "serene"],
  Tech: ["circuitry", "kernel", "binary", "render", "compile", "debug", "cache", "deploy", "stack", "module"],
  Art: ["palette", "mural", "sketch", "mosaic", "gallery", "pigment", "sculpt", "fresco", "collage", "atelier"],
  Music: ["chord", "verse", "tempo", "harmony", "octave", "riff", "crescendo", "cadence", "lyric", "encore"],
  Parenting: ["cradle", "nurture", "bloom", "sprout", "giggle", "cuddle", "wonder", "milestone", "bond", "nest"],
  Pets: ["whiskers", "snuggle", "fetch", "chirp", "burrow", "purring", "wagging", "fluffy", "scamper", "pounce"],
  Home: ["alcove", "mantle", "hearth", "nook", "shelve", "tile", "drape", "planter", "loft", "studio"],
  Education: ["thesis", "syllabus", "mentor", "campus", "lecture", "chapter", "primer", "module", "thesis", "index"],
  Entertainment: ["premiere", "encore", "sequel", "rewind", "spotlight", "encore", "trailer", "cameo", "debut", "finale"],
  Wellness: ["serenity", "chakra", "mantra", "detox", "zenith", "oasis", "harmony", "tranquil", "bliss", "aura"],
  Health: ["remedy", "tonic", "vitality", "probiotic", "enzyme", "nutrient", "fiber", "antioxidant", "metabolism", "holistic"],
  Finance: ["dividend", "portfolio", "equity", "margin", "yield", "compound", "leverage", "asset", "capital", "hedge"],
  Gaming: ["spawn", "loot", "combo", "dungeon", "raid", "joystick", "console", "arcade", "checkpoint", "respawn"],
  Sports: ["rally", "sprint", "dribble", "volley", "tackle", "penalty", "champion", "whistle", "playoff", "tournament"],
  Photography: ["aperture", "shutter", "bokeh", "macro", "grain", "contrast", "vivid", "negative", "developer", "viewfinder"],
};

const V2_SUFFIXES = ["_official", ".co.kr", "_studio", ".archive", "_page", ".log", "_crew", "", "_spot", ".note"];

function generateHandlesV2(catMeta: CatMeta, targetCount: number): StubSuggestion[] {
  const suggestions: StubSuggestion[] = [];
  const usedHandles = new Set<string>();
  const secondParts = SECOND_PARTS_BY_CAT[catMeta.category] || SECOND_PARTS_BY_CAT["Lifestyle"];

  const tierOrder: string[] = [];
  const dist: Record<string, number> = { nano: 30, micro: 35, mid: 20, macro: 10, mega: 5 };
  for (const [tier, count] of Object.entries(dist)) {
    for (let i = 0; i < count; i++) tierOrder.push(tier);
  }

  let idx = 0;
  const getTier = () => tierOrder[idx++ % tierOrder.length];

  const tryAdd = (handle: string): boolean => {
    const clean = handle.toLowerCase().replace(/[^a-z0-9._]/g, "");
    if (clean.length < 3 || clean.length > 30 || usedHandles.has(clean)) return false;
    if (!/^[a-zA-Z0-9._]+$/.test(clean)) return false;

    usedHandles.add(clean);
    const tier = getTier();
    suggestions.push({
      handle: clean,
      estimatedFollowers: TIER_FOLLOWER_RANGES[tier],
      estimatedTier: tier,
      category: catMeta.category,
      subNiche: catMeta.subNiches[suggestions.length % catMeta.subNiches.length],
      oneLiner: catMeta.oneLiners[suggestions.length % catMeta.oneLiners.length],
      contentStyle: STYLES[suggestions.length % STYLES.length],
      reason: catMeta.reasons[suggestions.length % catMeta.reasons.length],
    });
    return true;
  };

  // Pattern A: first_part + second_part
  for (const first of FIRST_PARTS) {
    if (suggestions.length >= targetCount) break;
    const second = secondParts[suggestions.length % secondParts.length];
    const connector = ["_", ".", ""][suggestions.length % 3];
    tryAdd(`${first}${connector}${second}`);
  }

  // Pattern B: second_part + number + suffix
  for (const second of secondParts) {
    if (suggestions.length >= targetCount) break;
    const num = ["", "2", "7", "22", "99", "01", "kr"][suggestions.length % 7];
    const suffix = V2_SUFFIXES[suggestions.length % V2_SUFFIXES.length];
    tryAdd(`${second}${num}${suffix}`);
  }

  // Pattern C: Korean name + number + suffix
  for (const name of FIRST_PARTS) {
    if (suggestions.length >= targetCount) break;
    const suffix = V2_SUFFIXES[(suggestions.length + 3) % V2_SUFFIXES.length];
    const num = ["_0", ".1", "_22", ".kr", "_99", ""][suggestions.length % 6];
    tryAdd(`${name}${num}${suffix}`);
  }

  return suggestions.slice(0, targetCount);
}

// -----------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { count: beforeCount } = await supabase
    .from("influencers")
    .select("*", { count: "exact", head: true });

  console.log(`\n📊 현재 DB: ${beforeCount ?? 0}`);
  console.log(`📋 카테고리: ${CATS.length}개, 각 100핸들`);
  console.log(`⏱️  v2 시작...\n`);

  let totalInserted = 0;
  let totalDuplicates = 0;
  let totalErrors = 0;

  for (let i = 0; i < CATS.length; i++) {
    const cat = CATS[i];
    const p = `[${i + 1}/${CATS.length}]`;
    const suggestions = generateHandlesV2(cat, 100);

    console.log(`${p} 📝 ${cat.category}: ${suggestions.length}개 생성, 삽입 중...`);
    const result = await insertStubBatch(supabase, suggestions);
    totalInserted += result.inserted;
    totalDuplicates += result.duplicates;
    totalErrors += result.errors;
    console.log(`${p} ✅ ${cat.category}: +${result.inserted} dup=${result.duplicates} err=${result.errors}`);
  }

  const { count: afterCount } = await supabase
    .from("influencers")
    .select("*", { count: "exact", head: true });

  console.log(`\n${"=".repeat(50)}`);
  console.log(`🎉 v2 완료! 삽입=${totalInserted} 중복=${totalDuplicates} 에러=${totalErrors}`);
  console.log(`   DB: ${beforeCount ?? 0} → ${afterCount ?? 0} (+${(afterCount ?? 0) - (beforeCount ?? 0)})`);
  console.log(`${"=".repeat(50)}\n`);
}

main().catch(console.error);
