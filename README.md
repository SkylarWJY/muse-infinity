<div align="center">

<img src="assets/generated/muse-hero-conservatory-v3.png" alt="MUSE∞ — the threshold conservatory where one question becomes a museum" width="100%" />

<h1>MUSE∞ · The Impossible Museum</h1>

**Ask one question. Walk through the museum it becomes.**
A playable, AI-native dream museum: your question curates the collection, AI masters
walk beside you and argue about every painting in their own voices, and at the end the
walk you *actually took* is synthesised into a world that exists only for you.

[![Hackathon](https://img.shields.io/badge/Hackathon-SensAI%20·%20WORLDS%20IN%20ACTION%20%5B02%5D%20·%20SIGGRAPH%20LA-7c83ff?style=flat-square)](https://sensai.devpost.com)
[![Worlds](https://img.shields.io/badge/Worlds-World%20Labs%20Marble%20·%209%20generated%20spaces-1fd5b6?style=flat-square)](https://www.worldlabs.ai)
[![Characters](https://img.shields.io/badge/Companions-Tripo%203D%20masters-f59e0b?style=flat-square)](https://www.tripo3d.ai)
[![Voices](https://img.shields.io/badge/Narration-MiniMax%20speech--2.8%20·%207%20cast%20voices-b594ff?style=flat-square)](https://www.minimax.io)
[![Dialogue](https://img.shields.io/badge/Dialogue-GPT--5.x%20·%203%20parallel%20perspectives-10a37f?style=flat-square)](#%EF%B8%8F-architecture)
[![Collection](https://img.shields.io/badge/Collection-Art%20Institute%20of%20Chicago%20Open%20Access-8b5e3c?style=flat-square)](https://www.artic.edu/open-access)
[![License: MIT](https://img.shields.io/badge/License-MIT-success?style=flat-square)](LICENSE)
[![Stack](https://img.shields.io/badge/Stack-Vanilla%20JS%20·%20Three.js%20·%20zero%20build-f7df1e?style=flat-square)](#%EF%B8%8F-built-with)

</div>

<div align="center">

<img src="assets/generated/demo-walk.gif" alt="The full MUSE∞ walk — question, masters, nine worlds, finale — in 15 seconds" width="82%" />

*The whole walk in 15 seconds — [watch the full demo with sound ▶](https://youtu.be/PlCZUTLrMvI)*

</div>

---

## ⏱️ For judges — everything in 60 seconds

🎬 **Demo video:** [youtu.be/PlCZUTLrMvI](https://youtu.be/PlCZUTLrMvI)
🏆 **Tracks:** Best Interactive Splat Experience (World Labs) · Best Storytelling & Entertainment · Best 3D GenAI Character (TRIPO)
⚡ **Built July 18–19 2026 at Worlds in Action [02] LA** — full commit history in this repo, 15 acceptance-inspection reports in [`docs/acceptance/`](docs/acceptance/)

**Run it** — zero API keys required, the full walk works offline. The worlds are a
one-time ~790 MB download from the release, so give it a few minutes:

```bash
git clone https://github.com/SkylarWJY/muse-infinity && cd muse-infinity
gh release download worlds-v1 && unzip -o worlds.zip -d assets/ && unzip -o characters.zip -d assets/
npm start   # → http://localhost:4173
```

**The 3-minute path:** type a question → invite Monet, Van Gogh, Socrates → click any
painting (three parallel live readings, the room re-lights) → click the tour HUD to
auto-walk between stops → the closing roundtable reads *your* walk → step into the
world it names.

---

## 🌌 Why this exists

**Humanity already built its answer machine. We just can't walk into it.**
The paintings that answer our real questions exist — scattered across continents,
sealed behind glass, separated by centuries, and silent. MUSE∞ is a museum with
those constraints removed:

- **It collapses space** — works that could never share a wall hang in one room,
  because your *question*, not geography, decides what belongs together.
- **It collapses time** — the minds behind the work stand beside you as a roundtable
  across centuries, disagreeing in their own voices. Disagreement is where thinking
  starts.
- **It listens back** — every answer re-lights the room, bends the route, moves the
  ending. No two people can walk the same MUSE∞.
- **It ends with you** — your walk is synthesised into a final world that exists for
  no one else. You leave standing *inside your own answer*.

Generated worlds are not for escaping reality — they are for **entering ideas**.
A question is an invisible thing; MUSE∞ makes it a place you can walk through.

**One question in. One world out. Everything in between is a conversation the real
world could never host.**

---

## 🎬 The 60-second story

You arrive with one existential question — *"What makes a life meaningful?"* — and the
museum builds itself around it. You pick three masters (Monet, Van Gogh, Socrates…)
and step into a **walkable, AI-generated 3D world** where real public-domain paintings
hang on the walls. Click one and it becomes a **game dialogue**: a master opens in
character, you answer, another master answers *you* — then all three deliver **live,
parallel LLM readings of that exact painting**, each in their own cast voice, while the
room's light literally changes with each reading. When you're done walking, the masters
hold a **closing roundtable about the walk you actually took** — the paintings you
stopped at, the questions you asked — and name the world your choices built. Then you
step into it.

<div align="center">
<table><tr>
<td><img src="assets/thumbs/fantasy-realm-of-shimmering-spheres.jpg" width="220" alt="Shimmering Spheres"/></td>
<td><img src="assets/thumbs/van-gogh-inspired-gallery-interior.jpg" width="220" alt="Van Gogh studio world"/></td>
<td><img src="assets/thumbs/enchanted-water-garden-sanctuary.jpg" width="220" alt="Water Garden"/></td>
<td><img src="assets/thumbs/yellow-polka-dot-infinity-room.jpg" width="220" alt="Infinity Dot Room"/></td>
</tr></table>

*Four of the nine World Labs Marble worlds generated for MUSE∞ — every one walkable,
collider-grounded, and rendered at native metric scale.*
</div>

---

## 🎮 How to play

### Act I — One question opens the gate

Type the question you actually carry — *"What makes a life meaningful?"* — and
stop. That is the only input the museum ever asks for.

### Act II — Choose the minds who walk with you

<div align="center">
<img src="assets/generated/interactions/companions-at-the-bedroom-v1.png" alt="Masters standing with the visitor inside a generated world" width="82%" />

*The masters don't sit in a chat panel. They stand in the world, walk with you,
and are clickable.*
</div>

Invite up to three of seven masters. Each is built from a documented public-domain
portrait into a full 3D figure via **Tripo**, and each carries an authored lens that
makes their reading of a painting genuinely their own.

### Act III — The museum curates itself, visibly

GPT reads your question and answers with a themed exhibition title, three chapter
names, and a preview of the route it has planned. Curation is something you watch
happen, not something the interface claims.

### Act IV — Eight worlds, one continuous walk

<div align="center">
<table>
<tr>
<td align="center"><img src="assets/thumbs/grand-conservatory-with-lush-gardens.jpg" width="168" alt="Glass Conservatory"/><br/><sub><b>01 · ARRIVAL</b><br/>Glass Conservatory</sub></td>
<td align="center"><img src="assets/thumbs/elegant-floral-palace-interior.jpg" width="168" alt="Floral Palace"/><br/><sub><b>02 · QUESTION</b><br/>Floral Palace</sub></td>
<td align="center"><img src="assets/thumbs/enchanted-water-garden-sanctuary.jpg" width="168" alt="Water Garden"/><br/><sub><b>03 · PERCEPTION</b><br/>Water Garden</sub></td>
<td align="center"><img src="assets/thumbs/dreamlike-coastal-villa-gardens.jpg" width="168" alt="Coastal Villa"/><br/><sub><b>04 · INVENTION</b><br/>Coastal Villa</sub></td>
</tr>
<tr>
<td align="center"><img src="assets/thumbs/van-gogh-inspired-gallery-interior.jpg" width="168" alt="Van Gogh Studio"/><br/><sub><b>05 · INTENSITY</b><br/>Van Gogh Studio</sub></td>
<td align="center"><img src="assets/thumbs/sunlit-palace-gardens.jpg" width="168" alt="Sunlit Gardens"/><br/><sub><b>06 · TRANSFORMATION</b><br/>Sunlit Gardens</sub></td>
<td align="center"><img src="assets/thumbs/mexican-courtyard-bedroom-fantasy.jpg" width="168" alt="Mexican Courtyard"/><br/><sub><b>07 · IDENTITY</b><br/>Mexican Courtyard</sub></td>
<td align="center"><img src="assets/thumbs/yellow-polka-dot-infinity-room.jpg" width="168" alt="Infinity Dot Room"/><br/><sub><b>08 · INFINITY</b><br/>Infinity Dot Room</sub></td>
</tr>
</table>

*The eight stops of the walk, in order.*
</div>

The exhibition is a **spine of eight generated worlds**, walked in order — not a menu.
Drag to look, `W A S D` to move; a **guided-tour HUD** names your next stop, points at
it and counts the metres down, so you are led rather than left wandering. The Marble
world streams in behind a dark veil (no placeholder flash) and your feet snap to the
real collider ground.

**Every world hangs its own artist.** The walls are not decoration reused from room to
room: thirty-six public-domain Art Institute works on the static floor, globally
deduplicated, so no painting is ever seen twice — and a live open-access fetch
upgrades each wall at runtime.

| Chapter | World | The collection on its walls |
|---|---|---|
| 01 · ARRIVAL | Glass Conservatory | Camille Pissarro |
| 02 · QUESTION | Floral Palace | Pierre-Auguste Renoir |
| 03 · PERCEPTION | Water Garden | Claude Monet |
| 04 · INVENTION | Coastal Villa | Paul Cézanne |
| 05 · INTENSITY | Van Gogh Studio | Vincent van Gogh |
| 06 · TRANSFORMATION | Sunlit Gardens | Georges Seurat |
| 07 · IDENTITY | Mexican Courtyard | Mary Cassatt |
| 08 · INFINITY | Infinity Dot Room | Vasily Kandinsky |

<div align="center">
<img src="assets/thumbs/fantasy-realm-of-shimmering-spheres.jpg" width="380" alt="Shimmering Spheres — the ninth world"/>

**09 · ANSWER — the ninth world**
*Not on the walk. It opens only after the closing roundtable names it,*
*and the collection hanging inside is the one your philosophy chose.*
</div>

### Act V — Every painting is an encounter

Click a painting and a **visual-novel dialogue** rises: a master opens *in
character* about this exact work (typewriter text, skippable), you choose your
answer, and a different master responds to *you*. Seconds later the **live layer**
lands: three parallel LLM readings of the painting — grounded in its real metadata,
strictly schema-validated, each labeled `LIVE`, each carrying its own
AI-interpretation disclaimer — and each reading re-lights the room through a
constrained effect vocabulary. Click a **master** instead and you can ask them
anything; all three answer in their own voice, never each other's.

The **SOUND** toggle is on from the first page, and it plays like a game: each master speaks with a
distinct MiniMax-cast voice (Socrates is a deep British gentleman; Van Gogh burns),
while a per-act public-domain score — Mussorgsky's *Promenade* for the overture,
Debussy for the gallery, Satie for the salon — **ducks under every spoken line and
swells back after it**.

<div align="center">
<img src="assets/generated/museum-salon-romantic-v2.png" alt="The salon where the masters gather" width="82%" />
</div>

### Act VI — The roundtable that read your walk

Your answers feed a philosophy meter (perception / emotion / invention). At the
end, the masters hold a closing roundtable **about your actual trajectory** — it
quotes the paintings you stopped at and the questions you asked, refuses to invent
stops you never made, and names the world your walk built. One click later you are
standing inside it: a finale-only Marble world that is not on the eight-stop walk,
hung with a collection matched to your philosophy.

<div align="center">
<table><tr>
<td><img src="assets/generated/transformation-romantic-v2.png" width="340" alt="The transformation"/></td>
<td><img src="assets/generated/manifesto-garden-v2.png" width="340" alt="Your manifesto"/></td>
</tr></table>

*The synthesis is yours: same product, different walk, different world.*
</div>

---

## ✨ What makes it interesting

| | |
|---|---|
| 🖼️ **A collection, not wallpaper** | Thirty-six public-domain Art Institute works, one artist cast per world, globally deduplicated — **no painting appears twice in the museum**. Every record keeps title, date, source URL and rights, and the live open-access fetch upgrades each wall at runtime without ever being required. |
| 🌍 **Real generated worlds, walked natively** | Nine World Labs Marble worlds rendered at **native metric scale** (no bounding-box renormalisation): baked transforms, collider-driven ground snapping and walk bounds, per-world tuning. The official Marble viewer look — but playable. |
| 🎭 **Three minds, not one chatbot** | One question returns **three parallel readings** in a single strict-JSON LLM call — per-master authored lenses, quarantined vocabularies (Monet may not borrow Van Gogh's words), positional speaker reconciliation. Divergence is engineered, not hoped for. |
| 🗣️ **A cast, not a TTS** | Seven masters, seven MiniMax voices chosen from the live voice catalogue. Sentence-segmented narration advances only on the previous segment's `ended` event — no mid-line cut-offs — with one-segment prefetch (no dead air) and a watchdog (no stuck queue). |
| 🎼 **A score that knows when to be quiet** | Per-act public-domain recordings — Mussorgsky's *Promenade* is literally music about walking an exhibition. Game-style ducking drops the score under any speaking master in ~0.6 s. |
| 🧠 **The ending is earned** | The closing roundtable is grounded in a capped, server-re-clamped digest of your real session — visited artworks, asked questions, what each master already told you. Walk differently, get a different world. |
| 🧯 **Honest by construction** | No canned prose behind an HTTP 200. Live replies are labeled `LIVE`; fallbacks say so on screen; failures return real errors with reasons. The static server whitelists public files and never serves `.env`, tests, or docs. |

---

## 🏗️ Architecture

```mermaid
flowchart LR
    V([Visitor]) -->|drag · WASD · click| B[Three.js gallery<br/>native-metric Marble worlds<br/>+ deterministic state machine]
    B -->|"POST /api/dialogue"| S[Node server<br/>zero dependencies]
    B -->|"POST /api/roundtable"| S
    B -->|"POST /api/tts"| S
    B -->|"GET /api/artworks"| S
    S -->|"strict json_schema · 3 perspectives"| L[GPT-5.x via<br/>OpenAI-compatible route]
    S -->|per-master voice cast| M[MiniMax T2A v2]
    S -->|open-access IIIF| A[Art Institute<br/>of Chicago]
    B -->|constrained effect enum| E[config/effects.js<br/>one shared vocabulary]
    E -->|scene-lighting tween| B
```

- **One effect vocabulary** (`config/effects.js`) feeds both the server's JSON-schema
  enum and the renderer's lighting targets — the two sides cannot drift apart.
- **Session digest** is capped at construction client-side *and* re-clamped
  server-side: a trust boundary, not a hope.
- Worlds are local `.spz`/`.glb` assets generated ahead of time with Marble —
  the judging path never depends on a paid call succeeding.

## 🛠️ Built with

| Tool | Role |
|------|------|
| [**World Labs Marble**](https://www.worldlabs.ai) | All nine walkable worlds — generated from authored prompts + reference images, rendered natively as splat + collider pairs. |
| [**Tripo**](https://www.tripo3d.ai) | The masters' 3D bodies — multiview turnaround sheets → reviewed GLB companions that walk with the visitor. |
| [**MiniMax**](https://www.minimax.io) | `speech-2.8-turbo` per-master narration — seven voices cast from the live catalogue. |
| **GPT-5.x** (OpenAI-compatible route) | Three-perspective artwork readings and the closing roundtable — strict `json_schema`, bounded retry, honest 502s. |
| [**Art Institute of Chicago Open Access**](https://www.artic.edu/open-access) | Every painting on the walls, with title/date/source/rights intact. |
| [**Three.js**](https://threejs.org) | Rendering, raycasting, collider walking. Everything else is **vanilla JS, zero build step**. |

## 🧾 APIs & paid services (full disclosure)

| Service | Used for | Tier |
|---|---|---|
| World Labs Marble | nine world generations — pre-generated during the event, shipped as local assets | paid API |
| Tripo | master turnarounds → GLB bodies | paid API |
| MiniMax speech-2.8-turbo | per-master narration cast | paid API |
| GPT-5.x (OpenAI-compatible route) | three-perspective readings + roundtable | paid API |
| Art Institute of Chicago Open Access | every painting on the walls | free |
| Three.js · vanilla JS · Node.js | rendering, server, everything else | open source |

## 📦 Get the worlds (one download)

The nine Marble worlds (511 MB of `.spz` splats + `.glb` colliders) and five master
GLB companions (278 MB) are distributed via a
[GitHub Release](https://github.com/SkylarWJY/muse-infinity/releases/tag/worlds-v1) —
too heavy for a git tree, too real to fake:

```bash
gh release download worlds-v1 --repo SkylarWJY/muse-infinity
unzip -o worlds.zip -d assets/ && unzip -o characters.zip -d assets/
```

Everything else — dialogue, roundtable, artwork walls, audio, tests — runs from this
repo alone.

## 🚀 Run it

**Zero API keys required** — the full walk, dialogue fallbacks and score all work
offline once the worlds are downloaded. Keys only upgrade dialogue and narration to
live. Requirements: Node.js 20+.

```bash
npm start          # serves http://localhost:4173
npm run check      # syntax gate over every runtime file
npm test           # API contracts + public-surface/secret boundaries
```

| `.env` (all optional) | Unlocks |
|---|---|
| `LLM_API_KEY` / `LLM_BASE_URL` / `LLM_MODEL` | Live three-perspective dialogue + roundtable (labeled `LIVE`) |
| `MINIMAX_API_KEY` | Per-master voice narration behind the SOUND toggle |
| *(nothing)* | The full walk still works — with clearly labeled local fallbacks |

**Controls:** drag to look · `W A S D` walk · click paintings & masters · scene dots
to move along the spine · **SOUND** toggle (top right, on by default — the score
starts on your first click, as the autoplay policy requires) · `1`…`9`,`0` step
through the ten acts · `R` reset · `P` performance tier.

## 🛡️ Rights & representation

- Historical figures are **explicitly interpretive AI perspectives** — every
  attributed line carries a visible disclaimer; no quotation, no endorsement, no
  voice cloning of real people.
- Artworks: public-domain / open-access records only, always with source and rights.
- Music: public-domain recordings. Voices: synthetic casting.
  Everything bundled is itemised in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
- No accounts, no personal data, no tracking.

## 🏁 Worlds in Action Hack [02] LA — track alignment

Built by **Team MUSE∞** during the 48-hour hack, July 18–19 2026, SIGGRAPH Week LA.

| Track | What this project brings |
|---|---|
| **Best Interactive Splat Experience** *(World Labs)* | Nine Marble worlds walked natively at metric scale — baked transforms, collider ground-snapping, walk bounds, a guided-tour HUD with click-to-walk. The official viewer look, but playable. |
| **Best Storytelling & Entertainment** | A five-act structure whose ending is computed, not scripted: the closing roundtable quotes the paintings you stopped at, refuses to invent stops you never made, and names a finale world only your choices unlock. |
| **Best 3D GenAI Character** *(TRIPO)* | Masters built from documented public-domain portraits → multiview turnarounds → reviewed GLB companions that stand in the world, walk beside you, and are clickable — not a chat panel. |

The product was pair-built with AI coding agents (Codex + Claude) under human product
direction — the full commit history is in this repo, the engineer-facing spec in
[`docs/LATEST_PRODUCT_SPEC.md`](docs/LATEST_PRODUCT_SPEC.md), and the QA trail
(15 acceptance-inspection reports) in [`docs/acceptance/`](docs/acceptance/).

Released under the [MIT License](LICENSE).

<div align="center">
<sub>MUSE∞ — because the best answer to a real question is a world you can walk through.</sub>
</div>
