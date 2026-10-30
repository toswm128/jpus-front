import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { after, test } from "node:test";
import { build } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const cache = path.join(root, "node_modules/.tmp");
await mkdir(cache, { recursive: true });
const temporary = await mkdtemp(path.join(cache, "comment-api-"));
after(() => rm(temporary, { recursive: true, force: true }));
const entry = path.join(temporary, "entry.ts");
await writeFile(entry, `export { updateComment, createComment, MAX_COMMENT_LENGTH } from ${JSON.stringify(path.join(root, "src/api/post.ts"))};`);
await build({
  root,
  logLevel: "error",
  build: {
    ssr: entry,
    outDir: path.join(temporary, "build"),
    rollupOptions: { output: { entryFileNames: "entry.mjs" } },
  },
});
const { updateComment, createComment, MAX_COMMENT_LENGTH } = await import(
  pathToFileURL(path.join(temporary, "build/entry.mjs")).href
);

function replaceFetch(t, fetch) {
  const original = globalThis.fetch;
  globalThis.fetch = fetch;
  t.after(() => { globalThis.fetch = original; });
}

test("댓글 수정은 선택한 페르소나 없이 본문과 세션 쿠키만 전송한다", async (t) => {
  const content = "첫 줄\n  들여쓴 두 번째 줄";
  const updated = {
    id: 9, postId: 42, personaId: 1, content,
    authorNameSnapshot: "작성자", createdAt: "2026-10-30T12:00:00",
    updatedAt: "2026-10-30T12:01:00", isMine: true,
  };
  let request;
  replaceFetch(t, async (url, options) => {
    request = { url, ...options };
    return Response.json(updated);
  });
  assert.deepEqual(await updateComment({ postId: 42, commentId: 9, content }), updated);
  assert.equal(request.url, "/api/posts/42/comments/9");
  assert.equal(request.method, "PATCH");
  assert.equal(request.credentials, "include");
  assert.equal(request.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(request.body), { content });
});

test("공백·길이 초과·잘못된 댓글 주소는 요청 전에 거절한다", async (t) => {
  let calls = 0;
  replaceFetch(t, async () => {
    calls += 1;
    return Response.json({ id: 9 });
  });
  for (const content of ["", " \n\t ", "가".repeat(MAX_COMMENT_LENGTH + 1)]) {
    await assert.rejects(updateComment({ postId: 42, commentId: 9, content }));
  }
  await assert.rejects(updateComment({ postId: 0, commentId: 9, content: "내용" }));
  await assert.rejects(updateComment({ postId: 42, commentId: Number.NaN, content: "내용" }));
  assert.equal(calls, 0);
  await updateComment({ postId: 42, commentId: 9, content: "가".repeat(MAX_COMMENT_LENGTH) });
  assert.equal(calls, 1);
});

test("수정할 수 없는 댓글·만료된 로그인·서버 오류를 실패로 전달한다", async (t) => {
  const statuses = [404, 401, 500];
  replaceFetch(t, async () => new Response(null, { status: statuses.shift() }));
  const input = { postId: 42, commentId: 9, content: "수정 내용" };
  await assert.rejects(updateComment(input), /삭제|수정할 수 없/);
  await assert.rejects(updateComment(input), /로그인/);
  await assert.rejects(updateComment(input), /다시 시도/);
});

test("새 댓글에도 같은 공백·길이 제한을 적용한다", async (t) => {
  let calls = 0;
  replaceFetch(t, async () => { calls += 1; return Response.json({ id: 9 }); });
  await assert.rejects(createComment({ id: 42, content: "   " }));
  await assert.rejects(createComment({ id: 42, content: "가".repeat(MAX_COMMENT_LENGTH + 1) }));
  assert.equal(calls, 0);
});
