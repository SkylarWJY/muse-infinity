import { museumArtworks } from "./museumAssets.js";

const worldPath = "assets/worlds/3d";
const characterPath = "assets/characters/3d";

export const characterCatalog = {
  socrates: { id: "socrates", name: "Socrates", model: `${characterPath}/socrates.glb`, color: "#d8c9aa" },
  freud: { id: "freud", name: "Sigmund Freud", model: `${characterPath}/sigmund-freud.glb`, color: "#c8a0b8" },
  monet: { id: "monet", name: "Claude Monet", model: `${characterPath}/claude-monet.glb`, color: "#8bc6bc" },
  picasso: { id: "picasso", name: "Pablo Picasso", model: `${characterPath}/pablo-picasso.glb`, color: "#d78b78" },
  van_gogh: { id: "van_gogh", name: "Vincent van Gogh", model: `${characterPath}/vincent-van-gogh.glb`, color: "#d7aa55" },
  qi_baishi: { id: "qi_baishi", name: "Qi Baishi", model: `${characterPath}/qi-baishi.glb`, color: "#c9b77b" },
  frida: { id: "frida", name: "Frida Kahlo", model: `${characterPath}/frida-kahlo.glb`, color: "#c65e75" },
  kusama: { id: "kusama", name: "Yayoi Kusama", model: `${characterPath}/yayoi-kusama.glb`, color: "#f2c400" }
};

const [waterLilies, bedroom, grandeJatte] = museumArtworks;
const interpretiveStudy = (id, title, artist, image, prompt) => ({
  id,
  title,
  artist,
  date: "AI interpretive study",
  image,
  source: "MUSE visual study",
  rights: "AI-generated interpretive image; not an authentic historical artwork.",
  prompt
});

const studies = {
  picasso: interpretiveStudy(
    "picasso-multiple-realities",
    "Multiple Realities",
    "After Pablo Picasso",
    "assets/generated/worlds/picasso-multiple-realities-world-v1.png",
    "Which viewpoint does this image refuse to make final?"
  ),
  vanGogh: interpretiveStudy(
    "van-gogh-emotional-sky",
    "The Emotional Sky",
    "After Vincent van Gogh",
    "assets/generated/worlds/van-gogh-emotional-sky-world-v1.png",
    "Where does observation become emotional intensity?"
  ),
  qiBaishi: interpretiveStudy(
    "qi-baishi-living-ink",
    "Living Ink",
    "After Qi Baishi",
    "assets/generated/worlds/qi-baishi-living-ink-world-v2.png",
    "How little form is needed before life appears?"
  ),
  frida: interpretiveStudy(
    "frida-living-memory",
    "Living Memory",
    "After Frida Kahlo",
    "assets/generated/worlds/frida-living-memory-world-v1.png",
    "Which symbol turns private memory into a shared language?"
  ),
  kusama: interpretiveStudy(
    "kusama-infinite-self",
    "Infinite Self",
    "After Yayoi Kusama",
    "assets/generated/worlds/infinity-accumulation-self-obliteration-world-v5.png",
    "Does repetition dissolve the self or make it more visible?"
  ),
  future: interpretiveStudy(
    "future-being",
    "A World Still Becoming",
    "MUSE + visitor",
    "assets/generated/worlds/future-being-gallery-v1.png",
    "Which part of this world feels like an answer you authored?"
  )
};

export const immersiveScenes = [
  {
    id: "threshold-conservatory",
    title: "The Threshold Conservatory",
    chapter: "01 / ARRIVAL",
    artist: "A cross-temporal salon",
    prompt: "What must become visible before an answer can begin?",
    thumbnail: "assets/scenes/01-entrance-conservatory.png",
    splat: `${worldPath}/grand-conservatory-lush-gardens.spz`,
    collider: `${worldPath}/grand-conservatory-lush-gardens-collider.glb`,
    character: characterCatalog.socrates,
    artworks: [grandeJatte, waterLilies, bedroom]
  },
  {
    id: "court-of-light",
    title: "The Court of Light",
    chapter: "02 / QUESTION",
    artist: "Sigmund Freud",
    prompt: "Which part of your question belongs to you, and which part was inherited?",
    thumbnail: "assets/scenes/02-court-of-light.png",
    splat: `${worldPath}/elegant-floral-palace-interior.spz`,
    collider: `${worldPath}/elegant-floral-palace-interior-collider.glb`,
    character: characterCatalog.freud,
    artworks: [bedroom, grandeJatte, waterLilies]
  },
  {
    id: "water-and-light",
    title: "The Garden of Water and Light",
    chapter: "03 / PERCEPTION",
    artist: "Claude Monet",
    prompt: "Can a life change simply because attention becomes more precise?",
    thumbnail: "assets/scenes/03-monet-water-and-light.png",
    splat: `${worldPath}/enchanted-water-garden-sanctuary.spz`,
    collider: `${worldPath}/enchanted-water-garden-sanctuary-collider.glb`,
    character: characterCatalog.monet,
    artworks: [waterLilies, grandeJatte, bedroom]
  },
  {
    id: "sunset-frames",
    title: "The Sunset Frame Gallery",
    chapter: "04 / INVENTION",
    artist: "Pablo Picasso",
    prompt: "What changes when the same truth is seen from more than one angle?",
    thumbnail: "assets/scenes/04-sunset-frame-gallery.png",
    splat: `${worldPath}/dreamlike-coastal-villa-gardens.spz`,
    collider: `${worldPath}/dreamlike-coastal-villa-gardens-collider.glb`,
    character: characterCatalog.picasso,
    artworks: [studies.picasso, grandeJatte, bedroom]
  },
  {
    id: "burning-sky",
    title: "The Studio of the Burning Sky",
    chapter: "05 / INTENSITY",
    artist: "Vincent van Gogh",
    prompt: "Can struggle deepen attention without becoming the source of meaning itself?",
    thumbnail: "assets/scenes/05-van-gogh-burning-sky.png",
    splat: `${worldPath}/van-gogh-inspired-gallery-interior.spz`,
    collider: `${worldPath}/van-gogh-inspired-gallery-interior-collider.glb`,
    character: characterCatalog.van_gogh,
    artworks: [bedroom, studies.vanGogh, waterLilies]
  },
  {
    id: "petal-transition",
    title: "The Petal Transition Hall",
    chapter: "06 / TRANSFORMATION",
    artist: "Qi Baishi",
    prompt: "How little can an image contain and still hold an entire world?",
    thumbnail: "assets/scenes/06-petal-transition-hall.png",
    splat: `${worldPath}/sunlit-palace-gardens.spz`,
    collider: `${worldPath}/sunlit-palace-gardens-collider.glb`,
    character: characterCatalog.qi_baishi,
    artworks: [studies.qiBaishi, waterLilies, grandeJatte]
  },
  {
    id: "living-memory",
    title: "The Courtyard of Living Memory",
    chapter: "07 / IDENTITY",
    artist: "Frida Kahlo",
    prompt: "What can pain become after it is given color, symbol and form?",
    thumbnail: "assets/scenes/07-frida-living-memory.png",
    splat: `${worldPath}/mexican-courtyard-bedroom-fantasy.spz`,
    collider: `${worldPath}/mexican-courtyard-bedroom-fantasy-collider.glb`,
    character: characterCatalog.frida,
    artworks: [studies.frida, bedroom, waterLilies]
  },
  {
    id: "infinite-repetition",
    title: "The Infinite Repetition Chamber",
    chapter: "08 / INFINITY",
    artist: "Yayoi Kusama",
    prompt: "If the self repeats into infinity, what remains uniquely yours?",
    thumbnail: "assets/scenes/08-kusama-infinite-dots.png",
    splat: `${worldPath}/yellow-polka-dot-infinity-room.spz`,
    collider: `${worldPath}/yellow-polka-dot-infinity-room-collider.glb`,
    character: characterCatalog.kusama,
    artworks: [studies.kusama, grandeJatte, waterLilies]
  },
  {
    id: "personal-dream-world",
    title: "Your Dream World",
    chapter: "09 / ANSWER",
    artist: "A world formed from your answer",
    prompt: "What will you carry back into the life outside this world?",
    thumbnail: "assets/scenes/09-final-dream-world.png",
    splat: `${worldPath}/fantasy-realm-shimmering-spheres.spz`,
    collider: `${worldPath}/fantasy-realm-shimmering-spheres-collider.glb`,
    isFinal: true,
    character: null,
    artworks: [studies.future, waterLilies, bedroom]
  }
].map(scene => ({
  ...scene,
  transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 },
  spawn: { camera: [0, 0, 0] }
}));
