# JPUS Frontend

Persona 기반 커뮤니티의 React 클라이언트입니다. React + TypeScript + Vite, React Router, TanStack Query를 사용합니다.

## 실행

Node 24를 사용합니다. nvm을 쓰는 경우 프로젝트 루트에서 실행하세요.

```sh
nvm use
pnpm install
pnpm dev
```

`nvm use`는 현재 터미널의 Node 버전을 바꿉니다. 새 터미널에서도 실행 전에 적용하고,
`node -v`가 `v24.x`인지 확인하세요. 프로젝트의 Node 버전 조건은 `package.json`에도 지정되어 있습니다.

프론트는 기본적으로 http://localhost:5173, 백엔드는 http://localhost:8080입니다.
Vite가 `/api` 접두사를 제거해 백엔드로 프록시합니다. 인증은 세션 쿠키를 사용합니다.

```sh
pnpm build
pnpm test:content
pnpm test:comments
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
댓글 작성·삭제 시 댓글 목록과 게시글 집계를 함께 갱신하고, 좋아요 변경 시 게시글 응답을 갱신합니다.

내 댓글에서는 수정 버튼으로 본문을 편집하고 저장하거나 취소할 수 있습니다.
수정은 `PATCH /api/posts/{postId}/comments/{commentId}`에 `{ content }`만 보내며, 소유권은 서버가 인증 계정으로 확인합니다.
수정 중 저장에 실패하면 입력을 유지하고, 성공하면 현재 계정·게시글의 댓글 캐시만 갱신합니다.
작성·삭제 시에는 댓글 수가 달라지므로 게시글 집계도 갱신합니다.
현재 댓글 컬럼 길이에 맞춰 작성·수정은 공백을 제외한 내용이 있는 255자 이하의 본문을 받습니다.
`pnpm test:comments`는 수정 요청·응답과 세션 인증, 입력 제한, 실패 응답 처리를 검증합니다.

### 본문 에디터와 이미지

`RichPostEditor.tsx`는 Tiptap으로 글·서식·이미지를 편집합니다. 작성 화면에서만 에디터 코드를 불러옵니다.
사진은 JPEG·PNG, 장당 5MB, 최대 5장까지 선택할 수 있고, 커서 위치에 삽입됩니다.
작성 중에는 브라우저의 임시 URL로 미리 보며, 실행 취소를 위해 파일을 유지하다가 화면을 떠날 때 URL을 해제합니다.

`createRichPost()`는 `POST /api/posts`에 multipart 요청을 보냅니다.

- `post`: `personaId`, `title`, `contentJson`, `imageClientIds`를 담은 JSON 부분
- `images`: `imageClientIds`와 같은 순서의 파일 부분들

`richContent.ts`에서 본문과 파일 참조를 검증하고 임시 미리보기 주소를 제거합니다.
서버는 일반 텍스트 `content`를 본문에서 추출하고, 저장된 이미지 ID로 본문의 임시 참조를 바꿔야 합니다.
이 작성 화면을 사용하려면 서버에 multipart 작성 API가 구현되어 있어야 합니다.

상세 응답은 기존 필드에 `contentJson`과 `images: [{ id, url, sortOrder }]`를 추가합니다.
`PostContent.tsx`는 문서 순서대로 본문을 표시하고, 해당 게시글의 이미지 목록에 있는 이미지 ID만 사용합니다.
이미지 URL은 서버의 `/posts/{postId}/images/{imageId}` 경로에 `/api`를 붙여 같은 출처로 요청합니다.
`contentJson`이 없는 기존 글은 일반 텍스트로 표시합니다.

`pnpm test:content`는 본문·파일 매핑, 요청 형식, 이미지 제한, 기존 글 호환성과 안전한 본문 표시를 검증합니다.
