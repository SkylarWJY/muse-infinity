import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import sharp from "sharp";
import {
  buildTripoMultiviewRequest,
  generateTripoMultiviewModel,
  getTripoTask,
  uploadTripoImage
} from "../services/tripoApi.js";

export const VIEW_ORDER = ["front", "left", "back", "right"];
export const DEFAULT_OUTPUT_ROOT = resolve("outputs/tripo-characters");
export const TRIPO_WEB_OPTIONS = Object.freeze({
  faceLimit: 12_000,
  texture: true,
  pbr: true,
  textureAlignment: "original_image",
  orientation: "align_image"
});
const MAX_DOWNLOAD_BYTES = 250 * 1024 * 1024;

const SOURCE_ROOT = "/Users/jiayiwang/.codex/generated_images/019f73d4-d7f7-7110-b0fc-cf86db9da0db/人物";

export const CHARACTERS = Object.freeze([
  { name: "Yayoi Kusama", slug: "yayoi-kusama", sourceSheet: join(SOURCE_ROOT, "Yayoi Kusama.png"), rightsNote: "AI-generated interpretive guide, not an authentic digital clone" },
  { name: "Sigmund Freud", slug: "sigmund-freud", sourceSheet: join(SOURCE_ROOT, "Sigmund Freud.png"), rightsNote: "AI-generated interpretive historical guide; not an authentic quotation, endorsement, or digital clone" },
  { name: "Pablo Picasso", slug: "pablo-picasso", sourceSheet: join(SOURCE_ROOT, "Pablo Picasso.png"), rightsNote: "AI-generated interpretive historical guide; not an authentic quotation, endorsement, or digital clone" },
  { name: "Frida Kahlo", slug: "frida-kahlo", sourceSheet: join(SOURCE_ROOT, "Frida Kahlo.png"), rightsNote: "AI-generated interpretive historical guide; not an authentic quotation, endorsement, or digital clone" },
  { name: "Socrates", slug: "socrates", sourceSheet: join(SOURCE_ROOT, "Socrates.png"), rightsNote: "AI-generated interpretive historical guide; not an authentic quotation, endorsement, or digital clone" },
  { name: "Qi Baishi", slug: "qi-baishi", sourceSheet: join(SOURCE_ROOT, "Qi Baishi.png"), rightsNote: "AI-generated interpretive historical guide; not an authentic quotation, endorsement, or digital clone" },
  { name: "Claude Monet", slug: "claude-monet", sourceSheet: join(SOURCE_ROOT, "Claude Monet.png"), rightsNote: "AI-generated interpretive historical guide; not an authentic quotation, endorsement, or digital clone" },
  { name: "Vincent van Gogh", slug: "vincent-van-gogh", sourceSheet: join(SOURCE_ROOT, "Vincent van Gogh.png"), rightsNote: "AI-generated interpretive historical guide; not an authentic quotation, endorsement, or digital clone" }
]);

function foregroundPredicate(red, green, blue, alpha, background) {
  if (alpha < 16) return false;
  const distance = Math.abs(red - background.red) + Math.abs(green - background.green) + Math.abs(blue - background.blue);
  return distance > 34 || Math.min(red, green, blue) < 238;
}

function estimateBackground(data, width, height, channels) {
  const samples = [];
  const sampleSize = Math.max(4, Math.min(24, Math.floor(Math.min(width, height) / 20)));
  const origins = [[0, 0], [width - sampleSize, 0], [0, height - sampleSize], [width - sampleSize, height - sampleSize]];
  for (const [originX, originY] of origins) {
    for (let y = originY; y < originY + sampleSize; y += 2) {
      for (let x = originX; x < originX + sampleSize; x += 2) {
        const offset = (y * width + x) * channels;
        samples.push([data[offset], data[offset + 1], data[offset + 2]]);
      }
    }
  }
  const average = channel => Math.round(samples.reduce((sum, sample) => sum + sample[channel], 0) / samples.length);
  return { red: average(0), green: average(1), blue: average(2) };
}

function foregroundBounds(data, width, height, channels, background, range = { left: 0, right: width }) {
  let left = range.right;
  let right = range.left - 1;
  let top = height;
  let bottom = -1;
  let foregroundPixels = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = range.left; x < range.right; x += 1) {
      const offset = (y * width + x) * channels;
      const alpha = channels > 3 ? data[offset + 3] : 255;
      if (!foregroundPredicate(data[offset], data[offset + 1], data[offset + 2], alpha, background)) continue;
      foregroundPixels += 1;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < left || bottom < top) throw new Error("No character subject was detected in one of the turnaround panels.");
  return { left, top, width: right - left + 1, height: bottom - top + 1, foregroundPixels };
}

function findPanelBoundaries(data, width, height, channels, background) {
  const occupancy = new Array(width).fill(0);
  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 2) {
      const offset = (y * width + x) * channels;
      const alpha = channels > 3 ? data[offset + 3] : 255;
      if (foregroundPredicate(data[offset], data[offset + 1], data[offset + 2], alpha, background)) occupancy[x] += 1;
    }
  }
  const smoothed = occupancy.map((_, x) => {
    let total = 0;
    for (let scan = Math.max(0, x - 5); scan <= Math.min(width - 1, x + 5); scan += 1) total += occupancy[scan];
    return total;
  });
  const boundaries = [0];
  for (let index = 1; index < 4; index += 1) {
    const target = Math.round((width * index) / 4);
    const radius = Math.round(width * 0.085);
    let best = target;
    for (let x = target - radius; x <= target + radius; x += 1) {
      if (smoothed[x] < smoothed[best] || (smoothed[x] === smoothed[best] && Math.abs(x - target) < Math.abs(best - target))) best = x;
    }
    boundaries.push(best);
  }
  boundaries.push(width);
  return boundaries;
}

function paddedBox(bounds, panel, sheetWidth, sheetHeight) {
  const horizontalPad = Math.max(18, Math.round(bounds.width * 0.08));
  const verticalPad = Math.max(18, Math.round(bounds.height * 0.035));
  const left = Math.max(panel.left, bounds.left - horizontalPad);
  const top = Math.max(0, bounds.top - verticalPad);
  const right = Math.min(panel.right, bounds.left + bounds.width + horizontalPad);
  const bottom = Math.min(sheetHeight, bounds.top + bounds.height + verticalPad);
  return { left, top, width: right - left, height: bottom - top };
}

async function inspectForeground(imagePath) {
  const { data, info } = await sharp(imagePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const background = estimateBackground(data, info.width, info.height, info.channels);
  const bounds = foregroundBounds(data, info.width, info.height, info.channels, background);
  return {
    width: info.width,
    height: info.height,
    subjectBounds: bounds,
    subjectCoverage: {
      width: Number((bounds.width / info.width).toFixed(4)),
      height: Number((bounds.height / info.height).toFixed(4)),
      pixels: Number((bounds.foregroundPixels / (info.width * info.height)).toFixed(4))
    }
  };
}

export async function cropTurnaroundSheet(sourceSheet, outputDirectory, { width = 768, height = 1024 } = {}) {
  await mkdir(outputDirectory, { recursive: true });
  const { data, info } = await sharp(sourceSheet).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const background = estimateBackground(data, info.width, info.height, info.channels);
  const boundaries = findPanelBoundaries(data, info.width, info.height, info.channels, background);
  const views = [];

  for (let index = 0; index < VIEW_ORDER.length; index += 1) {
    const panel = { left: boundaries[index], right: boundaries[index + 1] };
    const bounds = foregroundBounds(data, info.width, info.height, info.channels, background, panel);
    const sourceBox = paddedBox(bounds, panel, info.width, info.height);
    const name = VIEW_ORDER[index];
    const path = join(outputDirectory, `${name}.png`);
    await sharp(sourceSheet)
      .extract(sourceBox)
      .resize({ width, height, fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png({ compressionLevel: 9 })
      .toFile(path);
    const inspection = await inspectForeground(path);
    if (inspection.subjectCoverage.height < 0.65 || inspection.subjectCoverage.height > 0.98) {
      throw new Error(`${name} crop has unsafe subject height coverage ${inspection.subjectCoverage.height}.`);
    }
    if (inspection.subjectCoverage.width < 0.18 || inspection.subjectCoverage.width > 0.96) {
      throw new Error(`${name} crop has unsafe subject width coverage ${inspection.subjectCoverage.width}.`);
    }
    views.push({ name, path, sourceBox, ...inspection });
  }

  return { source: { path: sourceSheet, width: info.width, height: info.height }, boundaries, views };
}

export function buildRequestPreview(viewPaths, options = TRIPO_WEB_OPTIONS) {
  if (viewPaths.length !== 4) throw new Error("Request preview requires four views.");
  return buildTripoMultiviewRequest({
    files: viewPaths.map(path => ({ fileToken: `preview_${basename(path, extname(path)).padEnd(6, "_")}`, type: "png" })),
    ...options
  });
}

export function validateGlb(buffer) {
  if (!(buffer instanceof Uint8Array) || buffer.byteLength < 20) throw new Error("Downloaded model is too small to be a GLB.");
  const bytes = Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  if (bytes.toString("ascii", 0, 4) !== "glTF") throw new Error("Downloaded model does not have a GLB header.");
  const version = bytes.readUInt32LE(4);
  const declaredLength = bytes.readUInt32LE(8);
  if (version !== 2) throw new Error(`Unsupported GLB version ${version}.`);
  if (declaredLength !== bytes.byteLength) throw new Error(`GLB length mismatch: header ${declaredLength}, file ${bytes.byteLength}.`);
  const jsonLength = bytes.readUInt32LE(12);
  const chunkType = bytes.toString("ascii", 16, 20);
  if (chunkType !== "JSON" || 20 + jsonLength > bytes.byteLength) throw new Error("GLB JSON chunk is invalid.");
  const document = JSON.parse(bytes.toString("utf8", 20, 20 + jsonLength).trim());
  if (!Array.isArray(document.meshes) || !document.meshes.length) throw new Error("GLB contains no meshes.");
  return {
    version,
    byteLength: bytes.byteLength,
    meshes: document.meshes.length,
    materials: document.materials?.length || 0,
    textures: document.textures?.length || 0,
    images: document.images?.length || 0
  };
}

async function writeJsonAtomic(path, value) {
  const temporary = `${path}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await rename(temporary, path);
}

async function readManifest(path) {
  try { return JSON.parse(await readFile(path, "utf8")); } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function withRetries(operation, { attempts = 3, delayMs = 1_000 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try { return await operation(attempt); } catch (error) {
      lastError = error;
      if (error.retryable === false) break;
      if (attempt < attempts) await new Promise(resolveDelay => setTimeout(resolveDelay, delayMs * attempt));
    }
  }
  throw lastError;
}

function taskData(payload) {
  return payload?.data || payload;
}

async function downloadOutputArtifacts(output, directory, fetchImplementation = fetch) {
  const candidates = [
    ["model_url", "model.glb"],
    ["rendered_image_url", "rendered-preview.png"],
    ["pbr_model", "model-pbr.glb"],
    ["model", "model.glb"],
    ["base_model", "model-base.glb"],
    ["rendered_image", "rendered-preview.png"]
  ].filter(([key]) => typeof output?.[key] === "string");
  const artifacts = [];
  for (const [kind, filename] of candidates) {
    const url = new URL(output[kind]);
    if (url.protocol !== "https:") throw new Error(`Tripo returned an unsafe ${kind} URL.`);
    const response = await withRetries(() => fetchImplementation(url));
    if (!response.ok) throw new Error(`Could not download ${kind}: HTTP ${response.status}.`);
    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > MAX_DOWNLOAD_BYTES) throw new Error(`${kind} exceeds the 250MB download safety limit.`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_DOWNLOAD_BYTES) throw new Error(`${kind} exceeds the 250MB download safety limit.`);
    const path = join(directory, filename);
    await writeFile(path, bytes);
    const artifact = { kind, path, sourceUrl: output[kind], bytes: bytes.byteLength };
    if (filename.endsWith(".glb")) artifact.glb = validateGlb(bytes);
    artifacts.push(artifact);
  }
  if (!artifacts.some(artifact => ["model_url", "pbr_model", "model"].includes(artifact.kind))) {
    throw new Error("Successful Tripo task did not provide a downloadable GLB model URL.");
  }
  return artifacts;
}

export async function runCharacterBatchItem(character, {
  outputRoot = DEFAULT_OUTPUT_ROOT,
  dryRun = true,
  submit = false,
  confirmUpload = false,
  retryFailed = false,
  pollIntervalMs = 10_000,
  timeoutMs = 30 * 60_000,
  api = { uploadTripoImage, generateTripoMultiviewModel, getTripoTask },
  fetchImplementation = fetch,
  now = () => new Date().toISOString(),
  onProgress = () => {}
} = {}) {
  if (!dryRun && (!submit || !confirmUpload)) throw new Error("Real Tripo execution requires both --submit and --confirm-upload.");
  const directory = join(outputRoot, character.slug);
  const viewsDirectory = join(directory, "views");
  const manifestPath = join(directory, "manifest.json");
  await mkdir(directory, { recursive: true });
  const previous = await readManifest(manifestPath);
  const crop = await cropTurnaroundSheet(character.sourceSheet, viewsDirectory);
  const viewPaths = crop.views.map(view => view.path);
  const manifest = {
    schemaVersion: 1,
    character: character.name,
    slug: character.slug,
    taskId: previous?.taskId || null,
    sourceSheet: character.sourceSheet,
    status: dryRun ? "dry-run" : (previous?.status || "cropped"),
    outputUrl: previous?.outputUrl || null,
    rightsNote: character.rightsNote,
    updatedAt: now(),
    views: crop.views,
    requestPreview: buildRequestPreview(viewPaths),
    uploads: previous?.uploads || {},
    output: previous?.output || null,
    artifacts: previous?.artifacts || [],
    error: null
  };
  await writeJsonAtomic(manifestPath, manifest);
  if (dryRun) return manifest;

  if (previous?.status === "success" && previous.artifacts?.some(artifact => artifact.glb)) {
    for (const artifact of previous.artifacts.filter(item => item.glb)) await stat(artifact.path);
    return { ...manifest, ...previous };
  }
  if (["failed", "banned", "expired", "cancelled", "unknown"].includes(previous?.status) && !retryFailed) {
    throw new Error(`${character.name} previously ended with status ${previous.status}; pass --retry-failed to create a new paid task.`);
  }

  try {
    let taskId = previous?.taskId;
    if (!taskId || retryFailed) {
      manifest.taskId = null;
      for (const view of crop.views) {
        if (!retryFailed && manifest.uploads[view.name]?.fileToken) continue;
        onProgress(`${character.name}: uploading ${view.name}`);
        const bytes = await readFile(view.path);
        const upload = await withRetries(() => api.uploadTripoImage({ bytes, filename: `${character.slug}-${view.name}.png`, mimeType: "image/png" }));
        manifest.uploads[view.name] = { fileToken: upload.fileToken, uploadedAt: now() };
        manifest.status = "uploading";
        manifest.updatedAt = now();
        await writeJsonAtomic(manifestPath, manifest);
      }
      const fileTokens = VIEW_ORDER.map(view => manifest.uploads[view]?.fileToken);
      onProgress(`${character.name}: submitting multiview task`);
      const submitted = taskData(await api.generateTripoMultiviewModel({ fileTokens, fileType: "png", ...TRIPO_WEB_OPTIONS }));
      taskId = submitted?.task_id;
      if (!taskId) throw new Error("Tripo task submission returned no task_id.");
      manifest.taskId = taskId;
      manifest.status = "submitted";
      manifest.updatedAt = now();
      await writeJsonAtomic(manifestPath, manifest);
    }

    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const task = taskData(await withRetries(() => api.getTripoTask(taskId)));
      manifest.status = task.status || "unknown";
      manifest.progress = task.progress ?? null;
      manifest.updatedAt = now();
      await writeJsonAtomic(manifestPath, manifest);
      onProgress(`${character.name}: ${manifest.status} ${manifest.progress ?? "?"}%`);
      if (task.status === "success") {
        manifest.output = task.output || {};
        manifest.outputUrl = task.output?.model_url || task.output?.pbr_model || task.output?.model || null;
        manifest.artifacts = await downloadOutputArtifacts(task.output, directory, fetchImplementation);
        manifest.textureNote = manifest.artifacts.some(artifact => artifact.glb?.textures > 0)
          ? "Textures are embedded in the downloaded GLB."
          : "Tripo returned no separately verifiable embedded textures.";
        manifest.updatedAt = now();
        await writeJsonAtomic(manifestPath, manifest);
        return manifest;
      }
      if (["failed", "banned", "expired", "cancelled", "unknown"].includes(task.status)) {
        throw new Error(`Tripo task ${taskId} ended with status ${task.status}: ${task.error_msg || "no detail"}`);
      }
      await new Promise(resolveDelay => setTimeout(resolveDelay, pollIntervalMs));
    }
    throw new Error(`Tripo task ${taskId} did not finish within ${timeoutMs}ms.`);
  } catch (error) {
    manifest.error = error.message;
    if (!["failed", "banned", "expired", "cancelled", "unknown"].includes(manifest.status)) manifest.status = "error";
    manifest.updatedAt = now();
    await writeJsonAtomic(manifestPath, manifest);
    throw error;
  }
}

export function selectCharacters({ all = false, character } = {}) {
  if (all === Boolean(character)) throw new Error("Choose exactly one of --all or --character <exact name-or-slug>.");
  if (all) {
    const canary = CHARACTERS.find(item => item.name === "Claude Monet");
    return [canary, ...CHARACTERS.filter(item => item !== canary)];
  }
  const selected = CHARACTERS.find(item => item.name === character || item.slug === character);
  if (!selected) throw new Error(`Unknown character '${character}'. Use an exact full name or slug.`);
  return [selected];
}
