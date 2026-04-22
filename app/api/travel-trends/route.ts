import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getOpenAI() {
  const { OpenAI } = require('openai');
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ─── Google News RSS 파싱 ────────────────────────────────────────────────────
async function fetchGoogleNewsTitles(query: string): Promise<string[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=ko&gl=KR&ceid=KR:ko`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
      next: { revalidate: 0 },
    });
    const xml = await res.text();
    // <title> 태그에서 뉴스 제목 추출
    const titles: string[] = [];
    const regex = /<item>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>/g;
    let match;
    while ((match = regex.exec(xml)) !== null && titles.length < 20) {
      titles.push(match[1].trim());
    }
    // CDATA 없는 경우도 처리
    if (titles.length === 0) {
      const regex2 = /<title>(.*?)<\/title>/g;
      let m2;
      let skip = 0;
      while ((m2 = regex2.exec(xml)) !== null && titles.length < 20) {
        if (skip++ < 1) continue; // 첫 번째 <title>은 채널 제목
        titles.push(m2[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim());
      }
    }
    return titles;
  } catch (err) {
    console.warn('[travel-trends] Google News fetch failed:', err);
    return [];
  }
}

// ─── Google Trends RSS (한국) ────────────────────────────────────────────────
async function fetchGoogleTrendsTitles(): Promise<string[]> {
  try {
    const url = 'https://trends.google.com/trends/hottrends/atom/feed?pn=p73';
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
      next: { revalidate: 0 },
    });
    const xml = await res.text();
    const titles: string[] = [];
    const regex = /<title>(.*?)<\/title>/g;
    let match;
    let skip = 0;
    while ((match = regex.exec(xml)) !== null && titles.length < 15) {
      if (skip++ < 1) continue; // 채널 제목 스킵
      titles.push(match[1].replace(/&amp;/g, '&').trim());
    }
    return titles;
  } catch (err) {
    console.warn('[travel-trends] Google Trends fetch failed:', err);
    return [];
  }
}

// ─── Route Handler ───────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const destination = req.nextUrl.searchParams.get('destination') || '여행';

  // 진짜 최신(24시간, 7일) 트렌드를 검색어에 맞게 수집
  const [newsTitles1, newsTitles2, trendsTitles] = await Promise.all([
    fetchGoogleNewsTitles(`${destination} 트렌드 when:1d`),
    fetchGoogleNewsTitles(`${destination} 인기 추천 when:7d`),
    fetchGoogleTrendsTitles(),
  ]);

  const allTitles = [...newsTitles1, ...newsTitles2, ...trendsTitles]
    .filter(Boolean)
    .slice(0, 30);

  const fetchedData = allTitles.length > 0
    ? `[실시간 수집된 뉴스/트렌드 데이터]\n${allTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
    : '[실시간 데이터 수집 실패 - AI 자체 분석으로 대체]';

  // API 키 없으면 샘플 반환
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key') {
    return NextResponse.json({ trends: getSampleTrends(destination), destination, realtime: false });
  }

  try {
    const today = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    const gptRes = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `당신은 인스타그램 및 SNS 콘텐츠 트렌드 분석 전문가입니다.
오늘 날짜: ${today}
실시간 웹에서 수집한 가장 최신(24시간~7일 이내) 뉴스와 트렌드 데이터를 분석해서, 현재 사람들의 관심도가 가장 높고 조회수·저장수가 폭발할 카드뉴스/게시글 주제를 선별합니다.`,
        },
        {
          role: 'user',
          content: `대상 키워드/주제: "${destination}"
오늘(${today}) 기준 실시간 수집 최신 데이터:
${fetchedData}

위 실시간 데이터를 분석해서, 지금 이 순간 SNS에서 가장 인기 있을 "${destination}" 관련 최신 트렌드 주제 7개를 추천해줘.

조건:
- 수집된 최신 뉴스/트렌드를 적극 반영하여 "지금 가장 핫한" 구체적 주제 도출 (단순 뻔한 내용 절대 금지)
- 실제 이슈, 장소, 아이템, 구체적 키워드 포함
- 지금 인스타/SNS에서 저장/공유가 많이 될 만한 주제
- 제목으로 바로 쓸 수 있게 15자 이내로 구체적이고 자극적으로

JSON 배열로만 응답 (설명 없이):
[
  {
    "topic": "주제 제목 (15자 이내, 구체적)",
    "reason": "왜 지금 인기인지 한 줄 (수집된 데이터 근거 포함)",
    "hashtags": ["#해시태그1", "#해시태그2", "#해시태그3"],
    "hotScore": 85,
    "estimatedViews": "5만~15만",
    "viewReason": "포토스팟+저장률 높은 유형, 주말 업로드 시 도달 극대화",
    "source": "구글뉴스" 또는 "구글트렌드" 또는 "AI분석",
    "imageKeywords": "연관된 실제 관광지 영어 키워드 2개 (Unsplash 검색용, 예: japan,kyoto 또는 santorini,greece)"
  }
]

estimatedViews: 인스타그램 카드뉴스 게시 시 예상 노출·조회수 범위 (예: "2만~8만", "10만~30만")
viewReason: 그 조회수가 예상되는 구체적 근거 (콘텐츠 특성, 시즌성, 저장/공유율 등 15자 이내)`,
        },
      ],
      temperature: 0.75,
      max_tokens: 1000,
    });

    const text = gptRes.choices[0].message.content || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON found');

    const trends = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      trends,
      destination,
      realtime: allTitles.length > 0,
      fetchedCount: allTitles.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[travel-trends] GPT error:', err?.message?.slice(0, 80));
    return NextResponse.json({
      trends: getSampleTrends(destination),
      destination,
      realtime: false,
    });
  }
}

function getSampleTrends(dest: string) {
  return [
    { topic: `${dest} 숙소 꿀팁 모음`, reason: '가성비 숙소 수요 급증', hashtags: ['#여행숙소', '#호텔추천', '#에어비앤비'], hotScore: 94, estimatedViews: '8만~25만', viewReason: '저장률 최상위 유형·팔로워 무관 확산', source: 'AI분석', imageKeywords: `${dest},hotel,travel` },
    { topic: `${dest} 항공권 특가 공략`, reason: '저비용 여행 트렌드', hashtags: ['#저가항공', '#항공권할인', '#여행준비'], hotScore: 91, estimatedViews: '6만~18만', viewReason: '정보성·공유율 높음·시즌 성수기 검색 급증', source: 'AI분석', imageKeywords: `${dest},airport,airplane` },
    { topic: `${dest} 숨은 현지 맛집`, reason: '현지 맛집 콘텐츠 저장률 높음', hashtags: ['#여행맛집', '#현지맛집', '#맛집투어'], hotScore: 89, estimatedViews: '5만~15만', viewReason: '저장·댓글 유발 콘텐츠·재방문율 높음', source: 'AI분석', imageKeywords: `${dest},food,restaurant` },
    { topic: `${dest} 인생사진 명소`, reason: '포토스팟 콘텐츠 공유율 폭발', hashtags: ['#인생사진', '#여행사진', '#포토스팟'], hotScore: 87, estimatedViews: '4만~12만', viewReason: '공유·저장 모두 높음·해시태그 유입 강함', source: 'AI분석', imageKeywords: `${dest},landmark,photography` },
    { topic: `${dest} 여행 경비 총정리`, reason: '실비용 정보 저장 많음', hashtags: ['#여행경비', '#여행예산', '#가성비여행'], hotScore: 85, estimatedViews: '3만~10만', viewReason: '정보성 저장 다수·계획 단계 유저 유입', source: 'AI분석', imageKeywords: `${dest},travel,budget` },
    { topic: `${dest} 3박4일 추천 코스`, reason: '일정 계획 콘텐츠 저장 급증', hashtags: ['#여행코스', '#여행일정', '#여행계획'], hotScore: 82, estimatedViews: '2만~8만', viewReason: '일정형 콘텐츠·슬라이드 완독률 최상', source: 'AI분석', imageKeywords: `${dest},travel,scenic` },
    { topic: `${dest} 처음 여행 필독`, reason: '입문자 콘텐츠 도달률 높음', hashtags: ['#여행초보', '#여행팁', '#여행준비물'], hotScore: 79, estimatedViews: '2만~6만', viewReason: '입문자 검색 유입·초보 타겟 광고 연동', source: 'AI분석', imageKeywords: `${dest},sightseeing,tourism` },
  ];
}
