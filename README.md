# JPUS Frontend

Persona 기반 커뮤니티의 React 클라이언트입니다. React + TypeScript + Vite, React Router, TanStack Query를 사용합니다.

## 실행

Node 24를 사용합니다. nvm을 쓰는 경우 프로젝트 루트에서 실행하세요.

```sh
nvm use
pnpm install
pnpm dev
```

프론트는 기본적으로 http://localhost:5173, 백엔드는 http://localhost:8080입니다.
Vite가 `/api` 접두사를 제거해 백엔드로 프록시합니다. 인증은 세션 쿠키를 사용합니다.

```sh
pnpm build
```

## 화면을 추가할 때

`src/components/AppLayout.tsx`가 사이드바, 상단 Persona 표시, 콘텐츠 영역과 모바일 내비게이션을 제공합니다.
새 페이지에서는 화면의 내용만 작성하면 됩니다.

| 파일 | 역할 |
| --- | --- |
| `src/components/ui.tsx` | Button, Card, PageHeader, FormField, Avatar, Notice, LoadingState, EmptyState |
| `src/components/Icon.tsx` | 동일한 크기와 선 두께를 쓰는 SVG 아이콘 |
| `src/components/AppLayout.tsx` | 앱 공통 레이아웃과 내비게이션 |
| `src/components/AuthLayout.tsx` | 로그인·회원가입 레이아웃 |
| `src/index.css` | 테마 변수, 공통 컴포넌트, 각 화면 스타일, 반응형 규칙 |
| `src/lib/format.ts` | 날짜 표시 형식 |

새 화면의 기본 구성은 아래처럼 시작할 수 있습니다.

```tsx
import { Button, Card, PageHeader } from "../components/ui";

export default function ExamplePage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="MY FEATURE"
        title="새 화면"
        description="사용자가 이 화면에서 할 수 있는 일을 설명하세요."
      />
      <Card className="example-card">
        <p>화면 내용</p>
        <Button onClick={() => { /* 실제 동작 연결 */ }}>실행</Button>
      </Card>
    </div>
  );
}
```

`Card`는 배경·테두리·모서리를 제공합니다. 내부 간격과 배치는 화면 전용 클래스에서 지정하세요.
간격은 `padding: var(--space-5)`처럼 테마 변수를 재사용할 수 있습니다.

### 스타일

- `src/index.css` 위쪽 `:root`에서 색상, 간격, 모서리 크기, 콘텐츠 너비를 바꾸면 전체 화면에 적용됩니다.
- 공통 버튼은 `primary / secondary / ghost / danger`와 `sm / md` 크기를 지원합니다.
- 이동은 `Link`, 동작은 `Button`을 사용합니다. 링크에는 `className="button button--secondary"` 같은 공통 클래스를 적용할 수 있습니다.
- 폼은 `FormField` 안에 `input.input` 또는 `textarea.textarea`를 배치하고, `htmlFor`와 입력의 `id`를 맞춥니다.
- 설명이 있는 입력에는 `aria-describedby="입력ID-hint"`를 연결합니다.
- 새 기능의 스타일은 페이지 이름을 접두사로 붙여 CSS의 해당 화면 섹션에 추가하세요.
- 조회 중에는 `LoadingState`, 실패 시 `Notice`, 데이터가 없으면 `EmptyState`로 상태를 표현합니다.

### 라우트와 API

`src/App.tsx`에 라우트를 추가합니다.

- 공개 페이지: 로그인·회원가입처럼 인증 가드 밖에 배치합니다.
- 계정만 필요한 페이지: `RequireAuth → AppLayout` 아래에 배치합니다.
- 활동할 Persona가 필요한 페이지: `RequireAuth → AppLayout → RequirePersona` 아래에 배치합니다.
- 사이드바와 모바일 메뉴를 늘리려면 `AppLayout.tsx`의 `navigation` 배열에 항목을 추가합니다.

서버 요청은 `src/api/`에 두고 기존 세션 쿠키와 쿼리 키를 유지하세요.
선택한 Persona ID는 UX를 위한 값이며, 실제 소유권 검증은 서버가 담당합니다.

게시글 목록은 `getPosts(page, size)`의 `{ content, page }` 응답을 사용하고,
상세 조회에도 제목·댓글 수·좋아요 수·내 좋아요 여부가 포함됩니다.
조회용 `PostSummaryResponse`와 생성 결과인 기본 `Post` 타입은 구분합니다.
피드의 페이지 번호는 URL의 `page`에 저장합니다.
캐시 키는 `src/api/postKeys.ts`를 사용해 사용자·페이지·게시글을 구분하세요.
댓글 변경 시 댓글 목록과 게시글 집계를 함께 갱신하고, 좋아요 변경 시 게시글 응답을 갱신합니다.
