# 수학성장지도 (Math Path Lab)

한국 수학 교육과정 전체에서 학생의 현재 이해 위치와 선수 개념 결손을 파악하는 학습 진단 웹앱입니다. 문제 사진을 올리면 문제 유형, 단계별 풀이, 예상 혼동 지점과 연결 교육과정을 보여주며, 학원에서는 학생·반 단위 진단 화면으로 활용할 수 있습니다.

## 주요 기능

- 문제 사진 유형 판별 및 핵심 내용 인식
- 단계별 풀이와 예상 혼동 지점 안내
- 학생 풀이 추가 시 실제 오류 지점 진단을 위한 UI
- 초등학교 1학년부터 고등학교 선택과목까지 수학 교육과정 지도
- 선수 개념 → 현재 개념 → 후속 개념 연결
- 학생별 영역 이해도와 추천 학습 경로
- 학원용 학생 목록, 반 평균, 취약 개념 히트맵과 과제 배정 화면
- 모바일·데스크톱 반응형 UI

## 현재 상태

UI와 사용자 흐름을 검증하는 프로토타입입니다. 이메일/비밀번호 + 구글·카카오 로그인, 학생-로스터 자동 연동, 오답노트 제출·보관·PDF 내보내기 기능은 실제로 동작합니다. 문제 이미지 분석 결과는 아직 예시 데이터입니다.

## 실행 방법

Node.js 22.13 이상이 필요합니다.

```bash
npm install
```

`.env.local`에 아래 환경변수를 설정해야 로그인 기능이 동작합니다.

```
POSTGRES_URL=              # Vercel 프로젝트의 Postgres(Neon) 연동에서 자동 발급
BLOB_READ_WRITE_TOKEN=     # Vercel 프로젝트의 Blob 스토리지 연동에서 자동 발급
SESSION_SECRET=            # 임의의 긴 문자열
TEACHER_SIGNUP_CODE=       # 선생님 회원가입 시 필요한 비밀 코드
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
KAKAO_REST_API_KEY=
KAKAO_CLIENT_SECRET=       # 선택
```

```bash
npm run db:generate   # 스키마 변경 시 마이그레이션 생성
npm run dev
```

배포용 빌드를 확인하려면 다음 명령을 실행합니다.

```bash
npm run build
```

## 기술 구성

- React 19
- Next.js 16 App Router (표준 `next` CLI)
- Vercel Postgres(Neon) + Drizzle ORM
- Vercel Blob (파일 저장)
- TypeScript

## 배포

Vercel에 GitHub 저장소를 Import하고, Storage 탭에서 Postgres와 Blob을 추가하면 `POSTGRES_URL`/`BLOB_READ_WRITE_TOKEN`이 자동으로 주입됩니다. 나머지 환경변수(`SESSION_SECRET`, `TEACHER_SIGNUP_CODE`, 구글/카카오 키)는 프로젝트 설정에서 직접 등록해야 하며, 배포 도메인을 구글·카카오 OAuth 콘솔의 리디렉션 URI에도 등록해야 소셜 로그인이 동작합니다.
