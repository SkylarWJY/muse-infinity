import assert from "node:assert/strict";

process.env.WORLDLABS_API_KEY = "test-worldlabs-key";
process.env.TRIPO_API_KEY = "test-tripo-key";

const calls = [];
globalThis.fetch = async (url, options = {}) => {
  calls.push({ url: String(url), options });
  return new Response(JSON.stringify({ code: 0, data: { task_id: "task_test123", file_token: "file_token123" }, operation_id: "operation_test123" }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};

const { generateWorld, getWorldOperation } = await import("../services/worldLabsApi.js");
const { animateTripoModel, buildTripoMultiviewRequest, checkTripoRig, generateTripoModel, generateTripoMultiviewModel, getTripoTask, rigTripoModel, uploadTripoImage } = await import("../services/tripoApi.js");

await generateWorld({ prompt: "A bright romantic museum conservatory", displayName: "MUSE Garden" });
assert.equal(calls.at(-1).url, "https://api.worldlabs.ai/marble/v1/worlds:generate");
assert.equal(calls.at(-1).options.headers["WLT-Api-Key"], "test-worldlabs-key");
assert.equal(JSON.parse(calls.at(-1).options.body).world_prompt.type, "text");

await getWorldOperation("operation_test123");
assert.equal(calls.at(-1).url, "https://api.worldlabs.ai/marble/v1/operations/operation_test123");

await generateTripoModel({ imageUrl: "https://example.com/turnaround.png", prompt: "Museum companion bust", faceLimit: 8000 });
assert.equal(calls.at(-1).url, "https://openapi.tripo3d.ai/v3/generation/image-to-model");
assert.equal(calls.at(-1).options.headers.authorization, "Bearer test-tripo-key");
assert.equal(JSON.parse(calls.at(-1).options.body).input, "https://example.com/turnaround.png");

await generateTripoMultiviewModel({
  imageUrls: ["https://example.com/front.png", "https://example.com/left.png", "https://example.com/back.png", "https://example.com/right.png"],
  faceLimit: 12_000
});
assert.equal(calls.at(-1).url, "https://openapi.tripo3d.ai/v3/generation/multiview-to-model");
assert.equal(JSON.parse(calls.at(-1).options.body).model, "tripo-p1");
assert.deepEqual(JSON.parse(calls.at(-1).options.body).inputs, [
  { front: "https://example.com/front.png" },
  { left: "https://example.com/left.png" },
  { back: "https://example.com/back.png" },
  { right: "https://example.com/right.png" }
]);

const requestPreview = buildTripoMultiviewRequest({
  fileTokens: ["token_front01", "token_left001", "token_back001", "token_right01"],
  fileType: "png",
  faceLimit: 12_000,
  texture: true,
  pbr: true,
  textureAlignment: "original_image",
  orientation: "align_image"
});
assert.deepEqual(requestPreview.inputs, [
  { front: "token_front01" },
  { left: "token_left001" },
  { back: "token_back001" },
  { right: "token_right01" }
]);
assert.equal(requestPreview.face_limit, 12_000);
assert.equal(requestPreview.texture_alignment, "original_image");
assert.equal(requestPreview.orientation, "align_image");

await uploadTripoImage({ bytes: new Uint8Array([1, 2, 3]), filename: "front.png" });
assert.equal(calls.at(-1).url, "https://openapi.tripo3d.ai/v3/files");
assert.ok(calls.at(-1).options.body instanceof FormData);
await assert.rejects(() => uploadTripoImage({ bytes: new Uint8Array(20 * 1024 * 1024 + 1), filename: "oversized.png" }), /20MB/);

await getTripoTask("task_test123");
assert.equal(calls.at(-1).url, "https://openapi.tripo3d.ai/v3/tasks/task_test123");

await checkTripoRig("task_test123");
assert.equal(calls.at(-1).url, "https://openapi.tripo3d.ai/v3/animations/rig-check");
assert.equal(JSON.parse(calls.at(-1).options.body).input, "task_test123");

await rigTripoModel({ input: "task_test123" });
assert.equal(calls.at(-1).url, "https://openapi.tripo3d.ai/v3/animations/rig");
assert.equal(JSON.parse(calls.at(-1).options.body).input, "task_test123");

await animateTripoModel({ input: "task_test123" });
assert.equal(calls.at(-1).url, "https://openapi.tripo3d.ai/v3/animations/retarget");
assert.equal(JSON.parse(calls.at(-1).options.body).input, "task_test123");

await assert.rejects(() => generateWorld({ imageUrl: "http://insecure.example/world.jpg" }), /public HTTPS URL/);
await assert.rejects(() => generateTripoModel({ imageUrl: "http://insecure.example/person.png" }), /public HTTPS URL/);
await assert.rejects(() => generateTripoMultiviewModel({ imageUrls: ["https://example.com/front.png"] }), /exactly four views/);

console.log(`integration-contracts: ${calls.length} requests validated`);
