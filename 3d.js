import { characterCatalog, immersiveScenes } from "./config/immersiveAssets.js";
import { ImmersiveWorld } from "./lib/immersiveWorld.js";

const stage = document.querySelector("#immersiveStage");
const poster = document.querySelector("#stagePoster");
const loadingPanel = document.querySelector("#loadingPanel");
const loadingStage = document.querySelector("#loadingStage");
const loadingBar = document.querySelector("#loadingBar");
const loadingPercent = document.querySelector("#loadingPercent");
const sceneRail = document.querySelector("#sceneRail");
const previousScene = document.querySelector("#previousScene");
const nextScene = document.querySelector("#nextScene");
const companionList = document.querySelector("#companionList");
const companionPresence = document.querySelector("#companionPresence");
const artworkFocus = document.querySelector("#artworkFocus");
const artworkAction = document.querySelector("#artworkAction");
const conversationPanel = document.querySelector("#conversationPanel");
const conversationLog = document.querySelector("#conversationLog");
const conversationInput = document.querySelector("#conversationInput");

let activeIndex = Math.max(0, Math.min(immersiveScenes.length - 1, Number(new URLSearchParams(location.search).get("scene")) || 0));
let activeScene = null;
let focusedArtwork = null;
let focusedCompanion = null;
let world;

const stageLabels = {
  world: "RECONSTRUCTING WORLD",
  geometry: "ALIGNING WALKABLE SPACE",
  artwork: "HANGING THE EXHIBITION",
  character: "GATHERING YOUR COMPANIONS",
  ready: "EXHIBITION READY"
};

function savedCompanionIds() {
  try {
    const stored = JSON.parse(sessionStorage.getItem("muse.companions") || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function resolveCompanions(scene) {
  if (scene.isFinal) return [];
  const selected = savedCompanionIds().map(id => characterCatalog[id]).filter(Boolean);
  const chosen = selected.length ? selected : [characterCatalog.socrates];
  const ordered = [chosen[0], scene.character, ...chosen.slice(1), characterCatalog.monet].filter(Boolean);
  return ordered.filter((companion, index) => ordered.findIndex(item => item.id === companion.id) === index).slice(0, 2);
}

function renderSceneRail() {
  sceneRail.innerHTML = immersiveScenes.map((scene, index) => `
    <button class="scene-tab${index === activeIndex ? " active" : ""}" type="button" data-scene="${index}" data-index="${String(index + 1).padStart(2, "0")}" style="--thumb:url('${scene.thumbnail}')" aria-label="Open ${scene.title}" title="${scene.title}"></button>
  `).join("");
}

function setLoading(stageName, ratio) {
  const percent = Math.round(Math.max(0, Math.min(1, ratio || 0)) * 100);
  loadingPanel.classList.toggle("ready", stageName === "ready");
  loadingStage.textContent = stageLabels[stageName] || "ENTERING WORLD";
  loadingBar.style.width = `${percent}%`;
  loadingPercent.textContent = `${percent}%`;
}

function setFocusedArtwork(artwork) {
  if (!artwork) {
    artworkFocus.hidden = true;
    focusedArtwork = null;
    return;
  }
  focusedArtwork = artwork;
  world?.setArtworkSelection(artwork.id);
  document.querySelector("#artworkTitle").textContent = artwork.title;
  document.querySelector("#artworkArtist").textContent = artwork.artist;
  document.querySelector("#artworkDate").textContent = artwork.date || "Undated";
  artworkFocus.hidden = false;
}

function updateSceneCopy(scene) {
  document.documentElement.style.setProperty("--accent", scene.character?.color || "#f0c5ad");
  document.querySelector("#sceneNumber").textContent = String(activeIndex + 1).padStart(2, "0");
  document.querySelector("#sceneChapter").textContent = scene.chapter;
  document.querySelector("#sceneTitle").textContent = scene.title;
  document.querySelector("#sceneArtist").textContent = scene.artist;
  poster.style.backgroundImage = `url('${scene.thumbnail}')`;
  previousScene.disabled = activeIndex === 0;
  nextScene.disabled = activeIndex === immersiveScenes.length - 1;
  conversationPanel.hidden = true;
  conversationLog.replaceChildren();
  focusedCompanion = null;
  setFocusedArtwork(null);
  companionPresence.hidden = !scene.companions.length;
  companionList.innerHTML = scene.companions.map(companion => `<span>${companion.name}</span>`).join("");
  renderSceneRail();
  sceneRail.querySelector(".active")?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
}

async function selectScene(index) {
  if (index < 0 || index >= immersiveScenes.length) return;
  activeIndex = index;
  const baseScene = immersiveScenes[index];
  activeScene = { ...baseScene, companions: resolveCompanions(baseScene) };
  history.replaceState(null, "", `${location.pathname}?scene=${index}`);
  updateSceneCopy(activeScene);
  setLoading("world", 0.02);
  await world.loadScene(activeScene);
}

function openConversation(companion = null) {
  if (!activeScene || !focusedArtwork) return;
  focusedCompanion = companion || focusedCompanion;
  const companions = focusedCompanion ? [focusedCompanion] : activeScene.companions;
  const names = companions.map(item => item.name).join(" + ") || "MUSE";
  document.querySelector("#conversationName").textContent = names;
  document.querySelector("#conversationArtwork").textContent = `${focusedArtwork.title} · ${focusedArtwork.artist}`;
  conversationPanel.hidden = false;
  artworkFocus.hidden = true;
  if (!conversationLog.childElementCount) {
    const introduction = document.createElement("p");
    const prompt = focusedArtwork.prompt || activeScene.prompt;
    introduction.innerHTML = `<strong>${names}</strong><br>We are standing before <em>${focusedArtwork.title}</em>. ${prompt}`;
    conversationLog.append(introduction);
  }
  conversationInput.focus();
}

async function askCompanions(question) {
  if (!focusedArtwork || !activeScene) return;
  const companions = focusedCompanion ? [focusedCompanion] : activeScene.companions;
  const visitorMessage = document.createElement("p");
  visitorMessage.textContent = question;
  conversationLog.append(visitorMessage);
  conversationLog.scrollTop = conversationLog.scrollHeight;

  try {
    const response = await fetch("/api/dialogue", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        question,
        companions: companions.map(({ id, name }) => ({ id, name })),
        artwork: {
          id: focusedArtwork.id,
          title: focusedArtwork.title,
          artist: focusedArtwork.artist,
          date: focusedArtwork.date,
          source: focusedArtwork.source
        }
      })
    });
    if (!response.ok) throw new Error(`Dialogue returned ${response.status}`);
    const answer = await response.json();
    const companionMessage = document.createElement("p");
    const speaker = document.createElement("strong");
    speaker.textContent = answer.speaker || companions[0]?.name || "MUSE";
    companionMessage.append(speaker, document.createElement("br"), document.createTextNode(answer.text));
    conversationLog.append(companionMessage);
    world.applyInterpretation({ question, response: answer.text });
  } catch {
    const fallback = document.createElement("p");
    fallback.textContent = focusedArtwork.prompt || activeScene.prompt;
    conversationLog.append(fallback);
    world.applyInterpretation({ question, response: fallback.textContent });
  }
  conversationLog.scrollTop = conversationLog.scrollHeight;
}

async function start() {
  renderSceneRail();
  world = new ImmersiveWorld({
    container: stage,
    onProgress: ({ stage: stageName, ratio }) => setLoading(stageName, ratio),
    onReady: ({ companionCount, artworkCount, diagnostics }) => {
      stage.dataset.diagnostics = JSON.stringify(diagnostics);
      stage.dataset.companions = String(companionCount);
      stage.dataset.artworks = String(artworkCount);
      stage.classList.add("has-live-world");
    },
    onArtworkFocus: setFocusedArtwork,
    onCompanionFocus: companion => openConversation(companion),
    onPortalEnter: () => selectScene(activeIndex + 1),
    onError: error => {
      console.error("Unable to load immersive scene", error);
      loadingStage.textContent = "3D WORLD UNAVAILABLE · SHOWING PREVIEW";
      loadingPercent.textContent = "";
      loadingBar.style.width = "100%";
    }
  });
  await world.mount();
  await selectScene(activeIndex);
}

sceneRail.addEventListener("click", event => {
  const button = event.target.closest("[data-scene]");
  if (button) selectScene(Number(button.dataset.scene));
});
previousScene.addEventListener("click", () => selectScene(activeIndex - 1));
nextScene.addEventListener("click", () => selectScene(activeIndex + 1));
artworkAction.addEventListener("click", () => openConversation());
document.querySelector("#closeConversation").addEventListener("click", () => {
  conversationPanel.hidden = true;
  artworkFocus.hidden = !focusedArtwork;
});
document.querySelector("#conversationForm").addEventListener("submit", event => {
  event.preventDefault();
  const question = conversationInput.value.trim();
  if (!question) return;
  conversationInput.value = "";
  askCompanions(question);
});

document.querySelectorAll("[data-control]").forEach(button => {
  const action = button.dataset.control;
  const activate = event => {
    event.preventDefault();
    world?.setControlState(action, true);
  };
  const deactivate = event => {
    event.preventDefault();
    world?.setControlState(action, false);
  };
  button.addEventListener("pointerdown", activate);
  button.addEventListener("pointerup", deactivate);
  button.addEventListener("pointercancel", deactivate);
  button.addEventListener("pointerleave", deactivate);
});

start();
