import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { after, test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const cache = path.join(root, "node_modules/.tmp");
await mkdir(cache, { recursive: true });
const temporary = await mkdtemp(path.join(cache, "rich-content-"));
after(() => rm(temporary, { recursive: true, force: true }));
const entry = path.join(temporary, "entry.ts");
await writeFile(entry, [
  `export * from ${JSON.stringify(path.join(root, "src/feed/richContent.ts"))};`,
  `export { default as PostContent } from ${JSON.stringify(path.join(root, "src/feed/PostContent.tsx"))};`,
  `export { createRichPost, updateRichPost } from ${JSON.stringify(path.join(root, "src/api/post.ts"))};`,
].join("\n"));
await build({
  root,
  logLevel: "error",
  build: {
    ssr: entry,
    outDir: path.join(temporary, "build"),
    rollupOptions: { output: { entryFileNames: "entry.mjs" } },
  },
});
const { prepareRichPost, prepareRichPostUpdate, createPostEditDraft, PostContent, createRichPost, updateRichPost } = await import(
  pathToFileURL(path.join(temporary, "build/entry.mjs")).href
);

const paragraph = (text) => ({
  type: "paragraph",
  content: text ? [{ type: "text", text }] : [],
});
const image = (clientId) => ({
  type: "image",
  attrs: { clientId, src: `blob:preview-${clientId}`, alt: "사진" },
});
const attachment = (clientId, file = new File(["test"], "photo.png", { type: "image/png" })) => ({ clientId, file });
const draft = (nodes, images = []) => ({
  contentJson: { type: "doc", content: nodes },
  text: "이야기",
  images,
});
const render = (props) => renderToStaticMarkup(createElement(PostContent, {
  postId: 42,
  content: "이전 본문",
  ...props,
}));

test("본문 순서로 파일을 연결하고 미리보기 주소를 전송에서 제거한다", () => {
  const a = attachment("photo-a");
  const b = attachment("photo-b");
  const input = draft([paragraph("앞"), image("photo-a"), paragraph("사이"), image("photo-b")], [b, a]);
  const before = JSON.stringify(input.contentJson);
  const prepared = prepareRichPost(input);
  assert.deepEqual(prepared.imageClientIds, ["photo-a", "photo-b"]);
  assert.deepEqual(prepared.images, [a.file, b.file]);
  assert.ok(!JSON.stringify(prepared.contentJson).includes("blob:"));
  assert.equal(JSON.stringify(input.contentJson), before);
});

test("사진만 있는 글은 허용하고 빈 글은 거절한다", () => {
  assert.equal(prepareRichPost({ ...draft([image("photo-a")], [attachment("photo-a")]), text: "" }).images.length, 1);
  assert.throws(() => prepareRichPost({ ...draft([paragraph("   ")]), text: "   " }));
});

test("본문과 첨부 파일의 참조가 어긋나거나 기존 이미지 ID를 보내면 거절한다", () => {
  assert.throws(() => prepareRichPost(draft([image("missing")])));
  assert.throws(() => prepareRichPost(draft([paragraph("글")], [attachment("unused")])));
  assert.throws(() => prepareRichPost(draft([image("a")], [attachment("a"), attachment("a")])));
  assert.throws(() => prepareRichPost(draft([{ type: "image", attrs: { imageId: 123, src: "/posts/1/images/123" } }])));
});

test("이미지 개수·용량·종류 제한을 검사한다", () => {
  const attachments = Array.from({ length: 6 }, (_, index) => attachment(`photo-${index}`));
  assert.throws(() => prepareRichPost(draft(attachments.map(({ clientId }) => image(clientId)), attachments)));
  assert.throws(() => prepareRichPost(draft([image("a")], [attachment("a", new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", { type: "image/png" }))])));
  assert.throws(() => prepareRichPost(draft([image("a")], [attachment("a", new File(["<svg/>"], "drawing.svg", { type: "image/svg+xml" }))])));
});

test("숫자 목록의 시작 번호를 서버가 지원하는 범위로 제한한다", () => {
  const list = (start) => ({
    type: "orderedList",
    attrs: { start },
    content: [{ type: "listItem", content: [paragraph("목록")] }],
  });
  assert.doesNotThrow(() => prepareRichPost(draft([list(2_147_483_647)])));
  assert.throws(() => prepareRichPost(draft([list(2_147_483_648)])));
});

test("일반 텍스트와 에디터 문서를 안전하게 표시하고 본문 이미지 위치를 유지한다", () => {
  const legacy = render({ content: "<script>실행하지 않기</script>" });
  assert.ok(legacy.includes("&lt;script&gt;"));
  assert.ok(!legacy.includes("<script>"));
  const html = render({
    contentJson: {
      type: "doc",
      content: [paragraph("사진 앞"), { type: "image", attrs: { imageId: 7, src: "https://evil.example/track" } }, paragraph("사진 뒤")],
    },
    images: [{ id: 7, url: "/posts/42/images/7", sortOrder: 0 }],
  });
  assert.ok(html.includes('src="/api/posts/42/images/7"'));
  assert.ok(!html.includes("evil.example"));
  assert.ok(html.indexOf("사진 앞") < html.indexOf("<img"));
  assert.ok(html.indexOf("<img") < html.indexOf("사진 뒤"));
});

test("다른 글 이미지와 임의 주소는 표시하지 않는다", () => {
  for (const url of ["/posts/99/images/7", "https://evil.example/7", "javascript:alert(1)"]) {
    const html = render({
      contentJson: { type: "doc", content: [{ type: "image", attrs: { imageId: 7, src: url } }] },
      images: [{ id: 7, url, sortOrder: 0 }],
    });
    assert.ok(!html.includes("<img"));
  }
});

test("게시 요청은 JSON 부분과 파일들을 multipart로 보내고 쿠키 인증을 유지한다", async (t) => {
  const originalFetch = globalThis.fetch;
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  t.after(() => {
    globalThis.fetch = originalFetch;
    if (originalStorage) Object.defineProperty(globalThis, "localStorage", originalStorage);
    else delete globalThis.localStorage;
  });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: () => "3" } });
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, ...options };
    return Response.json({ id: 42 }, { status: 201 });
  };
  const photo = attachment("photo-a");
  const response = await createRichPost({ title: " 제목 ", draft: draft([paragraph("본문"), image("photo-a")], [photo]) });
  assert.equal(response.id, 42);
  assert.equal(request.url, "/api/posts");
  assert.equal(request.credentials, "include");
  assert.equal(request.method, "POST");
  assert.equal(request.headers, undefined);
  assert.ok(request.body instanceof FormData);
  const post = request.body.get("post");
  assert.equal(post.type, "application/json");
  const json = JSON.parse(await post.text());
  assert.equal(json.personaId, 3);
  assert.equal(json.title, "제목");
  assert.deepEqual(json.imageClientIds, ["photo-a"]);
  assert.ok(!JSON.stringify(json).includes("blob:"));
  assert.equal(request.body.getAll("images").length, 1);
  assert.equal(request.body.get("images").name, "photo.png");
});

const storedImage = (imageId) => ({ type: "image", attrs: { imageId, clientId: null, src: `https://untrusted.example/${imageId}` } });

test("기존 사진만 있는 수정은 파일 없이 ID를 유지하고 미리보기 속성을 제거한다", () => {
  const input = { ...draft([storedImage(7)]), text: "" };
  const prepared = prepareRichPostUpdate(input, [7]);
  assert.deepEqual(prepared.imageClientIds, []);
  assert.deepEqual(prepared.images, []);
  assert.deepEqual(prepared.contentJson.content[0].attrs, { imageId: 7 });
  assert.equal(input.contentJson.content[0].attrs.clientId, null);
});

test("수정 본문의 기존·신규 사진 위치를 유지하고 새 파일만 본문 순서로 보낸다", () => {
  const a = attachment("new-a");
  const b = attachment("new-b");
  const prepared = prepareRichPostUpdate(draft([
    storedImage(8), image("new-b"), paragraph("사진 사이"), storedImage(7), image("new-a"),
  ], [a, b]), [7, 8]);
  assert.deepEqual(prepared.imageClientIds, ["new-b", "new-a"]);
  assert.deepEqual(prepared.images, [b.file, a.file]);
  assert.deepEqual(prepared.contentJson.content.filter((node) => node.type === "image").map((node) => node.attrs.imageId ?? node.attrs.clientId), [8, "new-b", 7, "new-a"]);
});

test("기존 사진 제거와 반복 사용을 처리하고 고유 사진 개수로 제한한다", () => {
  const repeated = Array.from({ length: 6 }, () => storedImage(7));
  assert.doesNotThrow(() => prepareRichPostUpdate({ ...draft(repeated), text: "" }, [7]));
  assert.deepEqual(prepareRichPostUpdate(draft([paragraph("사진 제거")]), [7, 8]).contentJson.content, [paragraph("사진 제거")]);
  const photo = attachment("new-a");
  assert.doesNotThrow(() => prepareRichPostUpdate(draft([1, 2, 3, 4].map(storedImage).concat(image("new-a")), [photo]), [1, 2, 3, 4]));
  assert.throws(() => prepareRichPostUpdate(draft([1, 2, 3, 4, 5].map(storedImage).concat(image("new-a")), [photo]), [1, 2, 3, 4, 5]));
});

test("수정 시 다른 사진 ID·모호한 참조·잘못된 파일 목록을 거절한다", () => {
  assert.throws(() => prepareRichPostUpdate(draft([storedImage(99)]), [7]));
  assert.throws(() => prepareRichPostUpdate(draft([{ type: "image", attrs: { imageId: 7, clientId: "new-a" } }], [attachment("new-a")]), [7]));
  assert.throws(() => prepareRichPostUpdate(draft([image("missing")]), []));
  assert.throws(() => prepareRichPostUpdate(draft([storedImage(7)], [attachment("unused")]), [7]));
  assert.throws(() => prepareRichPostUpdate({ ...draft([paragraph(" ")]), text: " " }, [7]));
});

test("수정 초기화는 서버 사진 경로만 사용하고 원본을 변경하지 않는다", () => {
  const input = {
    id: 42,
    content: "본문",
    contentJson: { type: "doc", content: [paragraph("앞"), storedImage(7), paragraph("뒤")] },
    images: [{ id: 7, url: "/posts/42/images/7", sortOrder: 0 }],
  };
  const original = JSON.stringify(input);
  const initialized = createPostEditDraft(input);
  assert.equal(initialized.contentJson.content[1].attrs.src, "/api/posts/42/images/7");
  assert.equal(initialized.contentJson.content[1].attrs.imageId, 7);
  assert.deepEqual(initialized.images, []);
  assert.equal(JSON.stringify(input), original);
  assert.throws(() => createPostEditDraft({ ...input, images: [] }));
  assert.throws(() => createPostEditDraft({ ...input, images: [{ id: 7, url: "/posts/99/images/7", sortOrder: 0 }] }));
  assert.throws(() => createPostEditDraft({ ...input, contentJson: { type: "doc", content: [{ type: "unknown" }] } }));
});

test("기존 일반 텍스트 글의 줄바꿈과 빈 줄도 수정 에디터에서 유지한다", () => {
  const initialized = createPostEditDraft({ id: 42, content: "첫 줄\n\n마지막 줄", contentJson: null });
  assert.deepEqual(initialized.contentJson.content, [paragraph("첫 줄"), { type: "paragraph" }, paragraph("마지막 줄")]);
  assert.equal(initialized.text, "첫 줄\n\n마지막 줄");
  assert.doesNotThrow(() => prepareRichPostUpdate(initialized, []));
});

test("수정 요청은 기존 사진 재전송·personaId 없이 신규 파일만 multipart로 보낸다", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const photo = attachment("new-a");
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, ...options };
    return Response.json({ id: 42, title: "수정 제목" });
  };
  await updateRichPost({ postId: 42, title: " 수정 제목 ", draft: draft([storedImage(7), image("new-a")], [photo]), existingImageIds: [7] });
  assert.equal(request.url, "/api/posts/42");
  assert.equal(request.method, "PATCH");
  assert.equal(request.credentials, "include");
  assert.equal(request.headers, undefined);
  assert.equal(request.body.get("post").type, "application/json");
  const json = JSON.parse(await request.body.get("post").text());
  assert.equal(json.title, "수정 제목");
  assert.equal(json.personaId, undefined);
  assert.deepEqual(json.imageClientIds, ["new-a"]);
  assert.deepEqual(json.contentJson.content[0].attrs, { imageId: 7 });
  assert.deepEqual(request.body.getAll("images").map((file) => file.name), [photo.file.name]);
});

test("사진 유지·삭제만 하는 수정은 파일 부분을 보내지 않고 실패를 전달한다", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  let body;
  globalThis.fetch = async (_url, options) => {
    body = options.body;
    return Response.json({ id: 42 });
  };
  await updateRichPost({ postId: 42, title: "제목", draft: { ...draft([storedImage(7)]), text: "" }, existingImageIds: [7] });
  assert.equal(body.getAll("images").length, 0);
  assert.deepEqual(JSON.parse(await body.get("post").text()).imageClientIds, []);
  for (const status of [400, 401, 403, 404, 413, 500]) {
    globalThis.fetch = async () => new Response(null, { status });
    await assert.rejects(updateRichPost({ postId: 42, title: "제목", draft: draft([paragraph("본문")]), existingImageIds: [] }));
  }
});
