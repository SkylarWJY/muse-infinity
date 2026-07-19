# MUSE∞ — The Impossible Museum

> **Ask a question. Walk through humanity's cultural memory. Enter the world your answer becomes.**

![MUSE∞ glass conservatory exhibition](assets/scenes/01-entrance-conservatory.png)

MUSE∞ is a **spatial operating system for thinking with human culture**. A personal question becomes an AI-curated exhibition across time, geography, and institutional collections. The visitor walks through artworks that could never share one physical museum, accompanied by artist and thinker perspectives that discuss the work beside them. Each act of attention, each question, and each answer changes the curatorial relationship among the works and the atmosphere of the world. The final answer is not delivered as text. It becomes a personal Dream World the visitor can enter.

## Why this should exist

When people ask *What makes a life meaningful?*, *How do I live with uncertainty?*, or *What is art supposed to do to a human being?*, they rarely need one more instant answer. They need time, contradiction, emotion, historical perspective, and a way to see their own thinking change.

Search engines retrieve information. Chatbots produce language. Museums preserve objects. MUSE∞ combines them into a new medium for reflection:

- **The visitor becomes a co-curator.** The exhibition begins with a personal question, not a fixed institutional theme.
- **AI becomes a cultural orchestrator, not an answer machine.** It builds meaningful relationships among artworks, artists, thinkers, and the visitor's evolving point of view.
- **The collection becomes a living argument.** Chinese and Western works, ancient and contemporary ideas, and objects held by different museums can meet in one coherent spatial narrative.
- **The companions become perspectives in the room.** Transparent AI interpretations of artists and thinkers walk with the visitor and discuss the specific work currently in view.
- **The gallery becomes responsive.** Dialogue changes light, emphasis, spatial relationships, the next encounter, and eventually the architecture of the answer itself.
- **The answer becomes inhabitable.** The visitor's language, choices, and attention are synthesized into an explorable Dream World.

MUSE∞ is therefore not a virtual museum and not an AI tour guide. It proposes a new category: **an experiential interface for human meaning-making**, where cultural memory becomes an active thinking partner.

## The experience

```text
Ask a life question
        ↓
Choose artists and thinkers to walk with you
        ↓
AI curates a cross-temporal, cross-cultural exhibition
        ↓
Walk continuously through responsive 3D worlds
        ↓
Approach a work and discuss it together in context
        ↓
Each response changes the exhibition and the next encounter
        ↓
Form an answer through attention, dialogue, and choice
        ↓
Enter a personal Dream World generated from that answer
```

> **Judge-facing thesis:** MUSE∞ turns the museum from an archive of finished meaning into a living instrument for forming meaning. The visitor does not consume an AI answer; they build one with humanity's cultural memory, then step inside it.

This repository contains the working prototype for that thesis: nine local World Labs SPZ environments with collider-based movement, eight Tripo 3D historical companions, in-world framed exhibits, forward portals between exhibition chapters, artwork-grounded GPT dialogue with an honest local fallback, and the cinematic question-to-Dream-World narrative.

Read the full [product vision](PRODUCT_VISION.md).

For the latest product direction and engineer-facing build spec, read [LATEST_PRODUCT_SPEC.md](LATEST_PRODUCT_SPEC.md).

## Current build

The prototype keeps the judging path independent from paid services. The browser can enter a live World Labs splat, walk with real Tripo GLB characters, approach framed works inside the scene, and discuss the selected work through the server-side dialogue route. When no OpenAI key is configured, the UI labels and uses a deterministic local response. Separate protected routes cover future World Labs and Tripo generation tasks; the public server blocks secrets, repository metadata, tests, and project documents.

## Run

Requirements: Node.js 20 or newer.

```bash
npm start
```

Open `http://localhost:4173`.

Open the live World Labs + Tripo prototype at:

```text
http://localhost:4173/3d.html
```

For the 75–100 second judging path, open:

```text
http://localhost:4173/?demo=true
```

No account, API key, private data, or database is required for the fallback path. Set `OPENAI_API_KEY` on the server to enable live GPT-5.6 dialogue.

## Validate

```bash
npm run check
npm test
```

The contract suite validates the World Labs and Tripo request shapes without spending credits, then starts the local HTTP server to verify the public runtime surface, deterministic dialogue fallback, and secret-file boundaries.

## Working vertical slice

1. Question gate
2. Museum Between Worlds
3. Continuous dream-gallery route
4. Selection of up to three historical companion perspectives
5. A real WebGL gallery with drag/WASD navigation and clickable artworks
6. Live Art Institute of Chicago Open Access/IIIF loading with local fallback
7. Voice/text questions routed to GPT-5.6 when configured, with honest local fallback
8. Artwork-grounded companion responses and discussion prompts
9. One user choice and a visible particle-world transformation
10. A personalized final dream world and manifesto

The prototype includes a centralized experience state, constrained world-effect vocabulary, cached fallback dialogue, responsive design, reduced-motion support, a deterministic particle renderer, and a Three.js gallery renderer.

## Demo controls

| Key | Destination |
|---|---|
| `1` | Threshold |
| `2` | Museum Between Worlds |
| `3` | World of Light |
| `4` | Companion conversation |
| `5` | Discussion questions |
| `6` | Transformation |
| `7` | Final world |
| `R` | Reset |
| `M` | Sound on/off |
| `P` | Auto → High → Low performance |
| `D` | Development visual-effect panel; unavailable in Demo Mode |

## Architecture

```text
User interaction
      ↓
Deterministic experience state machine
      ↓
Dialogue/choice data → Philosophy scoring
      ↓                       ↓
Constrained effect name   Final-world resolver
      ↓                       ↓
Canvas effect mapper      Personal manifesto
      ↓
World environment adapter + memory-particle renderer
      ↓
Particles, character formation, architecture and world blend
```

The dialogue layer never manipulates individual scene objects. It returns a constrained effect such as `mist`, `fracture`, `infinity`, `void`, `network`, `garden`, or `turbulence`. The frontend owns the deterministic visual implementation.

The implementation separates responsibilities into:

- `config/assets.js` — centralized world and character placeholders.
- `config/immersiveAssets.js` — nine SPZ/collider chapters, Tripo character catalog, and scene-specific exhibits.
- `services/worldLabs.js` — supported hosted/embed loading, lifecycle, timeout and local fallback.
- `lib/audioAnalysis.js` — smoothed low/mid/high/amplitude signal with deterministic simulation.
- `lib/performance.js` — Auto/High/Low quality selection, DPR and particle budgets.
- `lib/museum3d.js` — local WebGL architecture, camera movement, artwork frames, raycasting and companion markers.
- `lib/immersiveWorld.js` — Spark SPZ rendering, Rapier collision, in-world exhibits, following companions, and forward portals.
- `services/museumCollections.js` — open-access collection loading.
- `services/voiceConversation.js` — speech recognition, GPT-5.6 dialogue request and spoken reply.
- `app.js` — preserved narrative state machine plus the constrained world-effect controller.
- `tests/integration-contracts.mjs` — mocked external API request-contract coverage.
- `tests/server-contracts.mjs` — local HTTP, fallback and private-file boundary coverage.

## World Labs integration

The repository includes nine exported World Labs worlds under `assets/worlds/3d/`, each paired with an SPZ render asset and a GLB collider. The independent `/3d.html` experience renders them with Spark, uses Rapier for walkable collision, and adds the interactive exhibition layer in Three.js. Generation remains a protected server-side operation; the judging path only loads reviewed local exports and never exposes a World Labs key.

The original cinematic journey also retains the hosted-world adapter in `worlds.json` as a lighter fallback/deployment option:

Edit [`worlds.json`](worlds.json):

```json
{
  "monet": {
    "id": "monet",
    "title": "World of Light",
    "sourceType": "embed",
    "worldUrl": "https://YOUR-PUBLIC-HOSTED-WORLD-URL",
    "assetUrl": "",
    "thumbnailUrl": "",
    "fallbackSceneId": "monet-particles"
  }
}
```

Only put a public hosted-world URL in this file. Never put an API key in browser-readable configuration. If the hosted world is missing or blocked, the cinematic journey continues with its authored local particle world; the separate 3D route uses the reviewed local SPZ exports.

World Labs and Tripo generation/task endpoints are intentionally separate from the public judging path. Configure a long random `INTEGRATION_ADMIN_TOKEN` and send it as `Authorization: Bearer <token>` when invoking those routes; without it, the server returns `503` before any paid provider request is attempted.

## Tripo character assets

Labeled multi-view inputs are stored under:

```text
/assets/generated/turnarounds/
```

Each sheet is also split into the exact Tripo order `[front, left, back, right]` under `assets/generated/turnarounds/views/<character>/`. The server exposes explicit Tripo OpenAPI v3 single-view, multiview, polling, rigging and animation routes. Set `PUBLIC_APP_URL` only after these files are available on the deployed public HTTPS site, then submit one reviewed character at a time through `POST /api/tripo/characters/:id`. Submission is never automatic because it consumes credits.

The local batch pipeline accepts the eight approved four-view sheets, finds whitespace separators without cutting the subject, and writes normalized `768x1024` PNG views plus a resumable manifest under `outputs/tripo-characters/<slug>/`:

```bash
npm run tripo:characters -- --dry-run --all
npm run tripo:characters -- --dry-run --character "Claude Monet"
npm run tripo:characters -- --submit --confirm-upload --character "Claude Monet"
npm run tripo:characters -- --submit --confirm-upload --all
```

`--all` always runs Claude Monet first and stops unless that canary downloads as a valid GLB with at least one mesh. Real uploads require both `--submit` and `--confirm-upload`; failed paid tasks are not recreated unless `--retry-failed` is also supplied. The default request uses ordered PNG upload tokens, approximately 12k faces, PBR textures, original-image texture alignment, and image-aligned orientation.

Eight reviewed Tripo outputs are bundled under `assets/characters/3d/` and mapped in `config/immersiveAssets.js`. Each 3D chapter loads one chosen companion plus the relevant artist or thinker, then updates their position and orientation as they walk with the visitor. The generation pipeline remains available for rebuilding those assets from the approved multiview sheets.

## Fallback levels

1. Local reviewed World Labs SPZ + collider with Tripo GLB companions at `/3d.html`.
2. Public World Labs hosted embed behind the cinematic interface when configured.
3. Authored Three.js conservatory and open-access artworks.
4. Deterministic particle world, image journey, and cached dialogue.

The lower levels remain available so a provider or network failure never blocks questions, choices, scoring, transformation, or the final manifesto.

## Performance

- `Auto` samples frame rate over several seconds and changes quality only after a cooldown.
- `High` uses up to 2,200 deterministic Canvas particles and higher DPR.
- `Medium` uses 1,250 particles.
- `Low` uses 620 particles and DPR 1.
- Particle count values are intentionally conservative because this version uses Canvas rather than instanced GPU geometry.
- Inactive hosted worlds are hidden; replaced frames are removed and timers disposed.

## Safety and representation

- Dialogue is labeled as AI interpretation, not authentic quotation.
- The prototype does not clone voices or imply endorsement.
- Bundled museum works are documented public-domain/open-access images; generated visual studies are explicitly labeled as interpretive rather than authentic works.
- Historical and living creators are represented by AI-generated Tripo models and transparent interpretive dialogue, never as authentic resurrection or quotation.
- The current build uses no personal data.

## Codex collaboration

The frontend vertical slice was built with Codex during the hackathon workflow. Codex helped convert the product concept into a deterministic scene architecture; implement the state machine, visual-effect mapper, particle renderer, branching dialogue, philosophy scoring, Demo Mode, responsive interface, and local server; and verify the complete interaction path in a real browser.

Key human product decisions retained in the implementation:

- Conversation must alter the world, not sit in a chat panel.
- The MVP should feel like one continuous dream gallery, not disconnected random rooms.
- Up to three active companions are stronger than a crowded cast.
- Independent autonomous agents are excluded.
- The critical judging path has no live-service dependency.
- Historical dialogue is interpretive and never presented as quotation.

Before submission, add the `/feedback` session ID for the task where the majority of core functionality was built.

## OpenAI Build Week judging access

- **Track:** Apps for Your Life
- **Repository access:** Public under the MIT License so judges can inspect and run the source without an invitation.
- **Testing path:** Run `npm start`, then open `http://localhost:4173/?demo=true` for the shortest complete path.
- **Credentials:** None required. The local fallback does not require an API key or private account.
- **Core Codex Session ID:** `PENDING - replace with the /feedback Session ID before the Devpost submission is finalized.`

### Submission-readiness disclosure

This repository is being published during the submission period as a work in progress. The current visual journey, 3D gallery, collection API route, GPT-5.6 dialogue endpoint and deterministic fallback are implemented. Live GPT-5.6 still requires a server-side `OPENAI_API_KEY`; when it is absent, the UI reports `LOCAL FALLBACK`. Do not describe fallback text as a live model response. Before final submission, deploy with the key configured, verify one live response, record the core `/feedback` Session ID above, and update this disclosure with the hosted test URL.

## Next phase

1. Connect the implemented WebRTC session bridge to the 3D gallery microphone for interruptible speech-to-speech.
2. Ground companion responses in a reviewed retrieval corpus of writings, letters, biographies, and collection scholarship.
3. Optimize and stream the large SPZ/GLB assets for faster first entry on deployed hardware.
4. Generate the final Dream World from the complete visitor interaction trace rather than a deterministic local resolver.

## Current limitations

- The nine World Labs scenes are separate reviewed chapters connected by forward portals, not one monolithic spatial reconstruction.
- GPT-5.6 dialogue only becomes live when `OPENAI_API_KEY` is configured; otherwise the interface clearly reports its local fallback.
- The current Tripo companions follow and turn toward the visitor but are not yet rigged with walking or facial animation.
- Several scene-specific images are clearly labeled AI interpretive studies because open-access reproductions for every represented artist are not bundled.
- The final share card is rendered in-app but not yet exported as an image.

## License and attribution

The current prototype is released under the [MIT License](LICENSE) and contains original application source code. Three.js, Google Fonts, generated scene assets, and every bundled public-domain museum/portrait image are recorded in `THIRD_PARTY_NOTICES.md`. Add every future model, texture, audio file, open-source package, museum record, and generated asset there before submission.
