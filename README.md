# PanelAI — Growth OS

> 초기 단계 앱을 위한 성장 운영 시스템 (0 → 1,000 유저)

## 🚀 빠른 시작

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정
```bash
cp .env.local.example .env.local
```
`.env.local` 파일을 열어 값을 입력하세요:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

> **주의**: 환경변수 없이도 Mock 데이터로 모든 기능을 확인할 수 있습니다.

### 3. 데이터베이스 설정 (선택)
Supabase 대시보드 → SQL Editor에서 `supabase/schema.sql` 내용을 실행하세요.

### 4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 http://localhost:3000 을 열면 자동으로 대시보드로 이동합니다.

---

## 📦 프로젝트 구조

```
panelai/
├── app/
│   ├── (auth)/          # 로그인, 회원가입
│   ├── (dashboard)/     # 메인 대시보드 페이지들
│   │   ├── dashboard/   # 성장 대시보드
│   │   ├── content/     # 콘텐츠 생성 엔진
│   │   ├── dm-funnel/   # DM 퍼널 시스템
│   │   ├── waitlist/    # 대기자 관리
│   │   ├── users/       # 유저 필터링
│   │   ├── strategy/    # 성장 전략 생성기
│   │   └── case-study/  # 케이스 스터디
│   ├── api/             # API 라우트
│   ├── join/            # 공개 대기자 랜딩 페이지
│   └── globals.css      # 디자인 시스템
├── components/
│   └── layout/          # Sidebar, Header
├── lib/                 # Supabase, OpenAI 클라이언트
├── types/               # TypeScript 타입 정의
└── supabase/
    └── schema.sql       # DB 스키마
```

---

## 🎯 핵심 기능

| 기능 | URL | 설명 |
|------|-----|------|
| 성장 대시보드 | `/dashboard` | 지표 차트, 전환 퍼널 |
| 콘텐츠 생성 | `/content` | AI 게시글 10개 생성 |
| DM 퍼널 | `/dm-funnel` | 3단계 DM 스크립트 |
| 대기자 관리 | `/waitlist` | 테이블 + CSV 다운로드 |
| 유저 필터링 | `/users` | 태그 + 점수 시스템 |
| 성장 전략 | `/strategy` | AI 맞춤 전략 |
| 케이스 스터디 | `/case-study` | 성장 타임라인 |
| 대기자 랜딩 | `/join` | 공개 등록 페이지 |

---

## 🛠️ 기술 스택

- **Frontend**: Next.js 14 (App Router), TypeScript
- **Styling**: Vanilla CSS (커스텀 디자인 시스템)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **AI**: OpenAI GPT-4o-mini
- **Charts**: Recharts

---

## 🎨 디자인

- 블랙 & 화이트 다크 모드
- 미니멀, 고급스러운 느낌
- Inter 폰트
- 모바일 우선 반응형

---

## 📝 환경변수 없이 사용하기

OpenAI API 키나 Supabase 없이도 모든 페이지를 확인할 수 있습니다.
Mock 데이터가 자동으로 제공됩니다.
