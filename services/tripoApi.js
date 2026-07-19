const TRIPO_BASE = "https://openapi.tripo3d.ai/v3";
const DEFAULT_MODEL = "tripo-p1";
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const VIEW_ORDER = ["front", "left", "back", "right"];

function requireKey() {
  const key = process.env.TRIPO_API_KEY;
  if (!key) throw new Error("TRIPO_API_KEY is not configured on the server.");
  return key;
}

function safeId(value, label = "task id") {
  const id = String(value || "");
  if (!/^[a-zA-Z0-9_-]{6,180}$/.test(id)) throw new Error(`Invalid ${label}.`);
  return id;
}

function safeHttpsUrl(value) {
  if (!value) return null;
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("Tripo image inputs must use a public HTTPS URL without embedded credentials.");
  }
  return url.toString();
}

function imageInput({ url, fileToken, object } = {}) {
  const populated = [url, fileToken, object].filter(Boolean);
  if (populated.length !== 1) throw new Error("Each Tripo image requires exactly one URL, file token, or uploaded object.");
  if (url) return safeHttpsUrl(url);
  if (fileToken) return safeId(fileToken, "file token");
  const bucket = String(object?.bucket || "");
  const key = String(object?.key || "");
  if (!/^[a-zA-Z0-9._-]{2,100}$/.test(bucket) || !key || key.length > 1200 || key.includes("..")) {
    throw new Error("Invalid Tripo uploaded object.");
  }
  return { object: { bucket, key } };
}

function normalizeModel(value) {
  const aliases = {
    "P1-20260311": "tripo-p1",
    "v3.1-20260211": "tripo-v3.1",
    "v3.0-20250812": "tripo-v3.0",
    "v2.5-20250123": "tripo-v2.5",
    "v2.0-20240919": "tripo-v2.0"
  };
  const model = String(value || DEFAULT_MODEL);
  return aliases[model] || model;
}

export function buildTripoGenerationOptions(input = {}) {
  const options = {
    model: normalizeModel(input.modelVersion || input.model || process.env.TRIPO_MODEL || DEFAULT_MODEL),
    texture: input.texture !== false,
    pbr: input.pbr !== false
  };
  if (Number.isInteger(input.faceLimit)) options.face_limit = Math.max(48, Math.min(20_000, input.faceLimit));
  if (Number.isInteger(input.modelSeed)) options.model_seed = input.modelSeed;
  if (["standard", "detailed", "extreme"].includes(input.textureQuality)) options.texture_quality = input.textureQuality;
  if (["original_image", "geometry"].includes(input.textureAlignment)) options.texture_alignment = input.textureAlignment;
  if (["default", "align_image"].includes(input.orientation)) options.orientation = input.orientation;
  if (input.autoSize === true) options.auto_size = true;
  if (input.compress === "geometry") options.compress = "geometry";
  return options;
}

async function tripoRequest(path, { method = "GET", body, form } = {}) {
  const response = await fetch(`${TRIPO_BASE}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${requireKey()}`,
      ...(body ? { "content-type": "application/json" } : {})
    },
    body: form || (body ? JSON.stringify(body) : undefined)
  });
  const text = await response.text();
  let payload = {};
  try { payload = text ? JSON.parse(text) : {}; } catch { payload = { message: text.slice(0, 500) }; }
  if (!response.ok || (typeof payload.code === "number" && payload.code !== 0)) {
    const detail = payload.message || payload.error?.message || payload.error || "request failed";
    const error = new Error(`Tripo returned ${response.status}: ${detail}`);
    error.status = response.status;
    error.retryable = response.status === 429 || response.status >= 500;
    throw error;
  }
  return payload;
}

export function tripoConfigured() {
  return Boolean(process.env.TRIPO_API_KEY);
}

export async function uploadTripoImage({ bytes, filename, mimeType = "image/png" } = {}) {
  if (!(bytes instanceof Uint8Array) || !bytes.byteLength) throw new Error("A non-empty local image is required for Tripo upload.");
  if (bytes.byteLength > MAX_UPLOAD_BYTES) throw new Error("Tripo image uploads must not exceed 20MB.");
  const safeFilename = String(filename || "view.png").replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 180);
  const form = new FormData();
  form.set("file", new Blob([bytes], { type: mimeType }), safeFilename);
  const payload = await tripoRequest("/files", { method: "POST", form });
  const fileToken = payload?.data?.file_token;
  if (!fileToken) throw new Error("Tripo upload completed without a file_token.");
  return { fileToken: safeId(fileToken, "file token"), payload };
}

export function buildTripoMultiviewRequest(input = {}) {
  const options = buildTripoGenerationOptions(input);
  if (input.originalTaskId) {
    return { inputs: [{ task_id: safeId(input.originalTaskId) }], ...options };
  }

  let views;
  if (Array.isArray(input.imageUrls)) views = input.imageUrls.map(url => imageInput({ url }));
  else if (Array.isArray(input.fileTokens)) views = input.fileTokens.map(fileToken => imageInput({ fileToken }));
  else if (Array.isArray(input.files)) views = input.files.map(file => imageInput(file));
  else throw new Error("Four Tripo views are required in front, left, back, right order.");

  if (views.length !== 4) throw new Error("Tripo multiview generation requires exactly four views: front, left, back, right.");
  return { inputs: views.map((value, index) => ({ [VIEW_ORDER[index]]: value })), ...options };
}

export async function generateTripoModel(input = {}) {
  const options = buildTripoGenerationOptions(input);
  if (input.imageUrl || input.fileToken || input.object) {
    const image = imageInput({ url: input.imageUrl, fileToken: input.fileToken, object: input.object });
    return tripoRequest("/generation/image-to-model", { method: "POST", body: { input: image, ...options } });
  }

  const prompt = String(input.prompt || "").trim();
  if (!prompt) throw new Error("A Tripo prompt, public HTTPS image URL, file token, or uploaded object is required.");
  const body = { prompt: prompt.slice(0, 1024), ...options };
  if (input.negativePrompt) body.negative_prompt = String(input.negativePrompt).slice(0, 255);
  return tripoRequest("/generation/text-to-model", { method: "POST", body });
}

export async function generateTripoMultiviewModel(input = {}) {
  return tripoRequest("/generation/multiview-to-model", { method: "POST", body: buildTripoMultiviewRequest(input) });
}

export async function getTripoTask(taskId) {
  return tripoRequest(`/tasks/${encodeURIComponent(safeId(taskId))}`);
}

export async function checkTripoRig(input) {
  return tripoRequest("/animations/rig-check", {
    method: "POST",
    body: { input: safeId(input, "model task id") }
  });
}

export async function rigTripoModel({ input, rigType = "biped", spec = "tripo" } = {}) {
  return tripoRequest("/animations/rig", {
    method: "POST",
    body: {
      input: safeId(input, "model task id"),
      rig_type: String(rigType),
      spec: String(spec)
    }
  });
}

export async function animateTripoModel({ input, animations = ["preset:idle", "preset:walk"] } = {}) {
  const allowed = new Set([
    "preset:idle", "preset:walk", "preset:run", "preset:dive", "preset:climb", "preset:jump",
    "preset:slash", "preset:shoot", "preset:hurt", "preset:fall", "preset:turn"
  ]);
  const safeAnimations = Array.isArray(animations) ? animations.slice(0, 5).map(String).filter(value => allowed.has(value)) : [];
  if (!safeAnimations.length) throw new Error("At least one supported Tripo animation preset is required.");
  return tripoRequest("/animations/retarget", {
    method: "POST",
    body: {
      input: safeId(input, "rigged model task id"),
      animations: safeAnimations
    }
  });
}
