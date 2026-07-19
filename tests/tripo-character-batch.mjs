import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  CHARACTERS,
  TRIPO_WEB_OPTIONS,
  VIEW_ORDER,
  buildRequestPreview,
  cropTurnaroundSheet,
  runCharacterBatchItem,
  selectCharacters,
  validateGlb
} from "../lib/tripoCharacters.js";

function createMinimalGlb() {
  const json = Buffer.from(JSON.stringify({ asset: { version: "2.0" }, scenes: [{}], scene: 0, meshes: [{ primitives: [] }] }));
  const padding = (4 - (json.length % 4)) % 4;
  const jsonChunk = Buffer.concat([json, Buffer.alloc(padding, 0x20)]);
  const buffer = Buffer.alloc(20 + jsonChunk.length);
  buffer.write("glTF", 0, "ascii");
  buffer.writeUInt32LE(2, 4);
  buffer.writeUInt32LE(buffer.length, 8);
  buffer.writeUInt32LE(jsonChunk.length, 12);
  buffer.write("JSON", 16, "ascii");
  jsonChunk.copy(buffer, 20);
  return buffer;
}

assert.deepEqual(VIEW_ORDER, ["front", "left", "back", "right"]);
assert.equal(selectCharacters({ character: "Claude Monet" })[0].slug, "claude-monet");
assert.equal(selectCharacters({ all: true })[0].name, "Claude Monet");
assert.throws(() => selectCharacters({ all: true, character: "Claude Monet" }), /exactly one/);
assert.throws(() => selectCharacters({ character: "monet" }), /Unknown character/);

const cropRoot = await mkdtemp(join(tmpdir(), "muse-tripo-crops-"));
for (const character of CHARACTERS) {
  const crop = await cropTurnaroundSheet(character.sourceSheet, join(cropRoot, character.slug));
  assert.deepEqual(crop.views.map(view => view.name), VIEW_ORDER);
  assert.equal(crop.views.length, 4);
  for (const view of crop.views) {
    assert.equal(view.width, 768);
    assert.equal(view.height, 1024);
    assert.ok(view.subjectCoverage.height >= 0.65 && view.subjectCoverage.height <= 0.98, `${character.name} ${view.name} height coverage`);
    assert.ok(view.subjectCoverage.width >= 0.18 && view.subjectCoverage.width <= 0.96, `${character.name} ${view.name} width coverage`);
    assert.ok(view.sourceBox.left >= 0 && view.sourceBox.top >= 0);
    assert.ok(view.sourceBox.left + view.sourceBox.width <= crop.source.width);
    assert.ok(view.sourceBox.top + view.sourceBox.height <= crop.source.height);
  }
}

const preview = buildRequestPreview(["front.png", "left.png", "back.png", "right.png"]);
assert.deepEqual(preview.inputs.map(input => Object.keys(input)[0]), VIEW_ORDER);
assert.equal(preview.face_limit, TRIPO_WEB_OPTIONS.faceLimit);
assert.equal(preview.texture, true);
assert.equal(preview.pbr, true);
assert.equal(preview.texture_alignment, "original_image");
assert.equal(preview.orientation, "align_image");

assert.equal(validateGlb(createMinimalGlb()).meshes, 1);
assert.throws(() => validateGlb(Buffer.from("not-a-glb")), /too small|header/);

const dryRunRoot = await mkdtemp(join(tmpdir(), "muse-tripo-dry-run-"));
let networkCalls = 0;
const forbiddenApi = {
  uploadTripoImage: async () => { networkCalls += 1; throw new Error("unexpected upload"); },
  generateTripoMultiviewModel: async () => { networkCalls += 1; throw new Error("unexpected submit"); },
  getTripoTask: async () => { networkCalls += 1; throw new Error("unexpected poll"); }
};
const monet = CHARACTERS.find(item => item.name === "Claude Monet");
const dryRunManifest = await runCharacterBatchItem(monet, {
  outputRoot: dryRunRoot,
  dryRun: true,
  api: forbiddenApi
});
assert.equal(networkCalls, 0);
assert.equal(dryRunManifest.status, "dry-run");
assert.equal(dryRunManifest.taskId, null);

const failureRoot = await mkdtemp(join(tmpdir(), "muse-tripo-failure-"));
const calls = [];
const failureApi = {
  uploadTripoImage: async ({ filename }) => {
    calls.push(["upload", filename]);
    return { fileToken: `file_${calls.length.toString().padStart(7, "0")}` };
  },
  generateTripoMultiviewModel: async input => {
    calls.push(["submit", input]);
    return { data: { task_id: "task_failure01" } };
  },
  getTripoTask: async taskId => {
    calls.push(["poll", taskId]);
    return { data: { task_id: taskId, status: "failed", progress: 100, error_msg: "synthetic failure" } };
  }
};
await assert.rejects(() => runCharacterBatchItem(monet, {
  outputRoot: failureRoot,
  dryRun: false,
  submit: true,
  confirmUpload: true,
  pollIntervalMs: 1,
  api: failureApi
}), /synthetic failure/);
assert.equal(calls.filter(([kind]) => kind === "upload").length, 4);
assert.equal(calls.filter(([kind]) => kind === "submit").length, 1);
assert.deepEqual(calls.find(([kind]) => kind === "submit")[1].fileTokens, ["file_0000001", "file_0000002", "file_0000003", "file_0000004"]);

const failedManifest = JSON.parse(await readFile(join(failureRoot, "claude-monet", "manifest.json"), "utf8"));
assert.equal(failedManifest.status, "failed");
assert.equal(failedManifest.taskId, "task_failure01");
const callsBeforeResume = calls.length;
await assert.rejects(() => runCharacterBatchItem(monet, {
  outputRoot: failureRoot,
  dryRun: false,
  submit: true,
  confirmUpload: true,
  api: failureApi
}), /--retry-failed/);
assert.equal(calls.length, callsBeforeResume);

console.log(`tripo-character-batch: ${CHARACTERS.length * 4} real sheet crops, request contract, GLB validation, dry-run, and failure recovery validated`);
