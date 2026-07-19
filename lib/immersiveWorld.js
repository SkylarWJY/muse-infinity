import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";
import RAPIER from "@dimforge/rapier3d-compat";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const disposeMaterial = material => {
  if (!material) return;
  for (const value of Object.values(material)) {
    if (value?.isTexture) value.dispose();
  }
  material.dispose?.();
};

function disposeObject(root) {
  root?.traverse?.(object => {
    object.geometry?.dispose?.();
    if (Array.isArray(object.material)) object.material.forEach(disposeMaterial);
    else disposeMaterial(object.material);
  });
  root?.removeFromParent?.();
}

function mergeWorldSpaceTriangles(root) {
  root.updateWorldMatrix(true, true);
  const positions = [];
  const indices = [];
  const vertex = new THREE.Vector3();
  let vertexOffset = 0;

  root.traverse(object => {
    if (!object.isMesh || !object.geometry?.attributes?.position) return;
    const position = object.geometry.attributes.position;
    for (let index = 0; index < position.count; index += 1) {
      vertex.fromBufferAttribute(position, index).applyMatrix4(object.matrixWorld);
      positions.push(vertex.x, vertex.y, vertex.z);
    }
    if (object.geometry.index) {
      for (let index = 0; index < object.geometry.index.count; index += 1) {
        indices.push(vertexOffset + object.geometry.index.getX(index));
      }
    } else {
      for (let index = 0; index < position.count; index += 1) indices.push(vertexOffset + index);
    }
    vertexOffset += position.count;
  });

  return { vertices: new Float32Array(positions), indices: new Uint32Array(indices) };
}

function loadGltf(loader, url, onProgress) {
  return new Promise((resolve, reject) => loader.load(url, resolve, event => onProgress?.(event.loaded, event.total), reject));
}

export class ImmersiveWorld {
  constructor({ container, onProgress, onReady, onCompanionFocus, onArtworkFocus, onPortalEnter, onError }) {
    this.container = container;
    this.onProgress = onProgress;
    this.onReady = onReady;
    this.onCompanionFocus = onCompanionFocus;
    this.onArtworkFocus = onArtworkFocus;
    this.onPortalEnter = onPortalEnter;
    this.onError = onError;
    this.keys = new Set();
    this.mobileInput = new Set();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.gazePointer = new THREE.Vector2(0, 0);
    this.clock = new THREE.Clock();
    this.yaw = 0;
    this.pitch = 0;
    this.verticalVelocity = 0;
    this.grounded = false;
    this.dragging = false;
    this.pointerMoved = false;
    this.loadToken = 0;
    this.sceneReady = false;
    this.disposed = false;
    this.companionRoots = [];
    this.companionRings = [];
    this.artworkGroups = [];
    this.focusedArtworkId = null;
    this.portalTriggered = false;
    this.focusSampleElapsed = 0;
  }

  async mount() {
    await RAPIER.init();
    if (this.disposed) return;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.04, 800);
    this.camera.rotation.order = "YXZ";

    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.className = "immersive-canvas";
    this.renderer.domElement.setAttribute("aria-label", "Interactive three-dimensional exhibition world");
    this.container.append(this.renderer.domElement);

    this.spark = new SparkRenderer({ renderer: this.renderer, enableLod: true, lodRenderScale: 1.35 });
    this.scene.add(this.spark);
    this.ambientLight = new THREE.HemisphereLight(0xfff4de, 0x25202b, 2.2);
    this.scene.add(this.ambientLight);
    this.keyLight = new THREE.DirectionalLight(0xffe4bd, 3.4);
    this.keyLight.position.set(-4, 8, 3);
    this.keyLight.castShadow = true;
    this.scene.add(this.keyLight);
    this.interpretiveState = {
      exposure: 1,
      lightColor: new THREE.Color(0xffe4bd),
      spread: 0,
      lift: 0
    };

    this.physics = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    this.characterController = this.physics.createCharacterController(0.015);
    this.characterController.enableAutostep(0.32, 0.16, false);
    this.characterController.enableSnapToGround(0.25);
    this.characterController.setMaxSlopeClimbAngle(Math.PI * 0.28);
    this.characterController.setMinSlopeSlideAngle(Math.PI * 0.34);

    const bodyDescription = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, -0.76, 0);
    this.playerBody = this.physics.createRigidBody(bodyDescription);
    this.playerCollider = this.physics.createCollider(RAPIER.ColliderDesc.capsule(0.53, 0.28), this.playerBody);

    this.gltfLoader = new GLTFLoader();
    this.textureLoader = new THREE.TextureLoader();
    this.bindEvents();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);
    this.resize();
    this.animate();
  }

  async loadScene(sceneConfig) {
    const token = ++this.loadToken;
    this.sceneReady = false;
    this.currentScene = sceneConfig;
    this.clearLoadedScene();
    this.onProgress?.({ stage: "world", ratio: 0.02 });

    const transform = sceneConfig.transform || {};
    const position = transform.position || [0, 0, 0];
    const rotation = transform.rotation || [0, 0, 0];
    const scale = transform.scale || 1;

    try {
      const splat = new SplatMesh({
        url: sceneConfig.splat,
        lod: true,
        editable: false,
        raycastable: false,
        onProgress: progress => {
          if (token !== this.loadToken) return;
          const ratio = typeof progress === "number" ? progress : progress?.progress ?? (progress?.total ? progress.loaded / progress.total : 0.2);
          this.onProgress?.({ stage: "world", ratio: clamp(Number(ratio) || 0.2, 0.02, 0.88) });
        }
      });
      splat.position.fromArray(position);
      splat.rotation.fromArray(rotation);
      splat.scale.setScalar(scale);
      this.scene.add(splat);
      this.splat = splat;

      const colliderPromise = loadGltf(this.gltfLoader, sceneConfig.collider, (loaded, total) => {
        if (token === this.loadToken) this.onProgress?.({ stage: "geometry", ratio: total ? loaded / total : 0.35 });
      });
      const companions = (sceneConfig.companions || (sceneConfig.character ? [sceneConfig.character] : [])).slice(0, 3);
      const companionPromise = Promise.all(companions.map((companion, index) => loadGltf(
        this.gltfLoader,
        companion.model,
        (loaded, total) => {
          if (token !== this.loadToken) return;
          const itemRatio = total ? loaded / total : 0.35;
          this.onProgress?.({ stage: "character", ratio: (index + itemRatio) / companions.length });
        }
      )));
      const artworks = (sceneConfig.artworks || []).slice(0, 3);
      const artworkPromise = Promise.all(artworks.map(async (artwork, index) => {
        const texture = await this.textureLoader.loadAsync(artwork.image);
        if (token === this.loadToken) this.onProgress?.({ stage: "artwork", ratio: (index + 1) / artworks.length });
        return texture;
      }));

      const [colliderGltf, companionGltfs, artworkTextures] = await Promise.all([
        colliderPromise,
        companionPromise,
        artworkPromise,
        splat.initialized
      ]);
      if (token !== this.loadToken || this.disposed) {
        disposeObject(colliderGltf?.scene);
        companionGltfs.forEach(gltf => disposeObject(gltf?.scene));
        artworkTextures.forEach(texture => texture.dispose());
        return;
      }

      this.installCollider(colliderGltf.scene, { position, rotation, scale });
      this.resetPlayer(sceneConfig.spawn?.camera || [0, 0, 0]);
      this.installArtworks(artworks, artworkTextures, sceneConfig);
      this.installCompanions(companionGltfs.map((gltf, index) => ({ root: gltf.scene, companion: companions[index] })), sceneConfig);
      this.installPortal(sceneConfig);
      this.sceneReady = true;
      this.onProgress?.({ stage: "ready", ratio: 1 });
      const player = this.playerBody.translation();
      this.onReady?.({
        scene: sceneConfig,
        companionCount: companions.length,
        artworkCount: artworks.length,
        diagnostics: {
          colliderMin: this.colliderBounds.min.toArray(),
          colliderMax: this.colliderBounds.max.toArray(),
          lodSplats: splat.packedSplats?.lodSplats?.getNumSplats?.() || 0,
          player: [player.x, player.y, player.z],
          companions: this.companionRoots.map(root => root.position.toArray()),
          artworks: this.artworkGroups.map(({ group }) => group.position.toArray()),
          portal: this.portalRoot?.position.toArray() || null
        }
      });
    } catch (error) {
      if (token === this.loadToken) this.onError?.(error);
    }
  }

  installCollider(root, transform) {
    root.position.fromArray(transform.position);
    root.rotation.fromArray(transform.rotation);
    root.scale.setScalar(transform.scale);
    root.updateWorldMatrix(true, true);
    this.colliderBounds = new THREE.Box3().setFromObject(root);
    const triangles = mergeWorldSpaceTriangles(root);
    if (triangles.vertices.length < 9 || triangles.indices.length < 3) throw new Error("The scene collider contains no usable triangles.");

    this.colliderBody = this.physics.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    this.worldCollider = this.physics.createCollider(RAPIER.ColliderDesc.trimesh(triangles.vertices, triangles.indices), this.colliderBody);
    this.physics.updateSceneQueries();
    this.colliderRoot = root;
    root.visible = false;
    this.scene.add(root);
  }

  resetPlayer(cameraOrigin) {
    const [x, y, z] = cameraOrigin;
    const floor = this.findFloor(x, y + 1, z);
    const centerY = floor === null ? y - 0.76 : floor + 0.82;
    this.playerBody.setNextKinematicTranslation({ x, y: centerY, z });
    this.playerBody.setTranslation({ x, y: centerY, z }, true);
    this.verticalVelocity = 0;
    this.yaw = 0;
    this.pitch = 0;
    this.camera.position.set(x, centerY + 0.72, z);
    this.camera.rotation.set(0, 0, 0);
  }

  findFloor(x, originY, z) {
    const hit = this.physics.castRay(new RAPIER.Ray({ x, y: originY, z }, { x: 0, y: -1, z: 0 }), 20, true);
    return hit ? originY - hit.toi : null;
  }

  hasVisiblePixels() {
    const context = this.renderer.getContext();
    const width = Math.min(72, context.drawingBufferWidth);
    const height = Math.min(72, context.drawingBufferHeight);
    const pixels = new Uint8Array(width * height * 4);
    const x = Math.max(0, Math.floor((context.drawingBufferWidth - width) / 2));
    const y = Math.max(0, Math.floor((context.drawingBufferHeight - height) / 2));
    context.readPixels(x, y, width, height, context.RGBA, context.UNSIGNED_BYTE, pixels);
    let visible = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index] + pixels[index + 1] + pixels[index + 2] > 24) visible += 1;
    }
    return visible > width * height * 0.04;
  }

  installArtworks(artworks, textures, sceneConfig) {
    const player = this.playerBody.translation();
    const floorY = player.y - 0.82;
    const layouts = [
      { position: [-2.8, 1.48, -3.8], rotation: 0.58 },
      { position: [2.8, 1.58, -5.35], rotation: -0.54 },
      { position: [-2.8, 1.48, -6.9], rotation: 0.62 }
    ];
    const frameColors = [0xb58b4c, 0xc7a566, 0x8e6b3f];

    artworks.forEach((artwork, index) => {
      const texture = textures[index];
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
      const source = texture.image;
      const aspect = Math.max(0.48, Math.min(2.1, (source?.width || 4) / (source?.height || 3)));
      const paintingWidth = aspect >= 1 ? 1.52 : 1.22 * aspect;
      const paintingHeight = aspect >= 1 ? 1.52 / aspect : 1.22;
      const panelWidth = paintingWidth + 0.48;
      const panelHeight = paintingHeight + 0.76;
      const layout = layouts[index] || layouts[layouts.length - 1];
      const group = new THREE.Group();
      group.position.set(player.x + layout.position[0], floorY + layout.position[1], player.z + layout.position[2]);
      group.rotation.y = layout.rotation;
      group.userData.artwork = artwork;
      group.userData.basePosition = group.position.clone();
      group.userData.targetPosition = group.position.clone();
      group.userData.baseRotation = layout.rotation;
      group.userData.targetRotation = layout.rotation;

      const panelMaterial = new THREE.MeshStandardMaterial({ color: 0xeee7d9, roughness: 0.78, metalness: 0.02 });
      const panel = new THREE.Mesh(new THREE.BoxGeometry(panelWidth, panelHeight, 0.11), panelMaterial);
      panel.position.z = -0.07;
      group.add(panel);

      const frameMaterial = new THREE.MeshStandardMaterial({ color: frameColors[index % frameColors.length], roughness: 0.3, metalness: 0.72 });
      const frame = new THREE.Mesh(new THREE.BoxGeometry(paintingWidth + 0.18, paintingHeight + 0.18, 0.09), frameMaterial);
      frame.position.set(0, 0.12, 0.025);
      group.add(frame);

      const matte = new THREE.Mesh(
        new THREE.PlaneGeometry(paintingWidth + 0.07, paintingHeight + 0.07),
        new THREE.MeshStandardMaterial({ color: 0xfbf7ef, roughness: 0.85 })
      );
      matte.position.set(0, 0.12, 0.075);
      group.add(matte);

      const painting = new THREE.Mesh(
        new THREE.PlaneGeometry(paintingWidth, paintingHeight),
        new THREE.MeshBasicMaterial({ map: texture, color: 0xffffff, side: THREE.DoubleSide })
      );
      painting.position.set(0, 0.12, 0.081);
      group.add(painting);

      const stem = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, Math.max(0.35, layout.position[1] - panelHeight / 2), 0.08),
        new THREE.MeshStandardMaterial({ color: 0x8d7d69, roughness: 0.7 })
      );
      stem.position.set(0, -(panelHeight + stem.geometry.parameters.height) / 2, -0.09);
      group.add(stem);

      group.traverse(object => {
        if (!object.isMesh) return;
        object.castShadow = true;
        object.receiveShadow = true;
        object.userData.artwork = artwork;
      });
      this.scene.add(group);
      this.artworkGroups.push({ group, artwork, frameMaterial });
    });

    this.setArtworkSelection(artworks[0]?.id || null);
    if (artworks[0]) this.onArtworkFocus?.(artworks[0]);
  }

  installCompanions(companions, sceneConfig) {
    const player = this.playerBody.translation();
    const offsets = [[-1.02, -4.05], [1.05, -4.28], [0, -5.1]];

    companions.forEach(({ root, companion }, index) => {
      const bounds = new THREE.Box3().setFromObject(root);
      const size = bounds.getSize(new THREE.Vector3());
      if (!Number.isFinite(size.y) || size.y <= 0) throw new Error(`The ${companion.name} model has invalid dimensions.`);

      root.scale.setScalar(1.72 / size.y);
      root.updateWorldMatrix(true, true);
      const scaledBounds = new THREE.Box3().setFromObject(root);
      const center = scaledBounds.getCenter(new THREE.Vector3());
      const [offsetX, offsetZ] = offsets[index];
      const floor = this.findFloor(player.x + offsetX, player.y + 5, player.z + offsetZ);
      const floorY = floor ?? player.y - 0.82;
      root.position.set(player.x + offsetX - center.x, floorY - scaledBounds.min.y, player.z + offsetZ - center.z);
      root.rotation.y = Math.atan2(player.x - root.position.x, player.z - root.position.z);
      root.userData.companion = companion;
      root.userData.followOffset = new THREE.Vector3(offsetX, 0, offsetZ);
      root.userData.alignment = new THREE.Vector3(-center.x, -scaledBounds.min.y, -center.z);
      root.traverse(object => {
        if (!object.isMesh) return;
        object.castShadow = true;
        object.receiveShadow = true;
        object.userData.companion = companion;
      });
      this.scene.add(root);
      this.companionRoots.push(root);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.48, 0.56, 56),
        new THREE.MeshBasicMaterial({ color: companion.color, transparent: true, opacity: 0.66, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(player.x + offsetX, floorY + 0.016, player.z + offsetZ);
      ring.userData.companion = companion;
      this.scene.add(ring);
      this.companionRings.push(ring);
    });
  }

  installPortal(sceneConfig) {
    this.portalTriggered = false;
    if (sceneConfig.isFinal) return;
    const player = this.playerBody.translation();
    const floor = player.y - 0.82;
    const portal = new THREE.Group();
    portal.position.set(player.x, floor + 1.35, player.z - 10.2);
    const material = new THREE.MeshBasicMaterial({ color: sceneConfig.character?.color || 0xe4cfa0, transparent: true, opacity: 0.74 });
    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.035, 12, 96), material);
    portal.add(arch);
    for (const side of [-1, 1]) {
      const column = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.045, 2.7, 12), material);
      column.position.set(side * 1.25, 0, 0);
      portal.add(column);
    }
    const light = new THREE.PointLight(sceneConfig.character?.color || 0xe4cfa0, 7, 5.5, 2);
    light.position.z = 0.2;
    portal.add(light);
    this.scene.add(portal);
    this.portalRoot = portal;
  }

  setArtworkSelection(artworkId) {
    this.focusedArtworkId = artworkId;
    this.artworkGroups.forEach(({ artwork, frameMaterial }) => {
      const selected = artwork.id === artworkId;
      frameMaterial.emissive.set(selected ? frameMaterial.color : 0x000000);
      frameMaterial.emissiveIntensity = selected ? 0.22 : 0;
    });
  }

  applyInterpretation({ question = "", response = "" } = {}) {
    const source = `${question} ${response}`;
    let hash = 2166136261;
    for (let index = 0; index < source.length; index += 1) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    const normalized = (hash >>> 0) / 4294967295;
    const hue = (0.04 + normalized * 0.5) % 1;
    this.interpretiveState.exposure = 0.92 + normalized * 0.34;
    this.interpretiveState.lightColor.setHSL(hue, 0.52, 0.72);
    this.interpretiveState.spread = (normalized - 0.5) * 0.5;
    this.interpretiveState.lift = 0.04 + normalized * 0.16;

    this.artworkGroups.forEach(({ group, frameMaterial }, index) => {
      const direction = index - 1;
      group.userData.targetPosition.copy(group.userData.basePosition);
      group.userData.targetPosition.x += direction * this.interpretiveState.spread;
      group.userData.targetPosition.y += index === 1 ? this.interpretiveState.lift : this.interpretiveState.lift * 0.35;
      group.userData.targetRotation = group.userData.baseRotation - direction * this.interpretiveState.spread * 0.12;
      frameMaterial.emissive.copy(this.interpretiveState.lightColor);
      frameMaterial.emissiveIntensity = group.userData.artwork.id === this.focusedArtworkId ? 0.42 : 0.12;
    });
    this.portalRoot?.traverse(object => {
      if (object.material?.color) object.material.color.copy(this.interpretiveState.lightColor);
    });
  }

  clearLoadedScene() {
    this.splat?.dispose?.();
    this.splat?.removeFromParent?.();
    this.splat = null;
    if (this.worldCollider) this.physics.removeCollider(this.worldCollider, true);
    if (this.colliderBody) this.physics.removeRigidBody(this.colliderBody);
    this.worldCollider = null;
    this.colliderBody = null;
    disposeObject(this.colliderRoot);
    this.companionRoots.forEach(disposeObject);
    this.companionRings.forEach(disposeObject);
    this.artworkGroups.forEach(({ group }) => disposeObject(group));
    disposeObject(this.portalRoot);
    this.colliderRoot = null;
    this.companionRoots = [];
    this.companionRings = [];
    this.artworkGroups = [];
    this.portalRoot = null;
    this.focusedArtworkId = null;
  }

  setControlState(action, active) {
    if (active) this.mobileInput.add(action);
    else this.mobileInput.delete(action);
  }

  bindEvents() {
    const canvas = this.renderer.domElement;
    this.handlers = {
      keydown: event => {
        if (/INPUT|TEXTAREA/.test(document.activeElement?.tagName || "")) return;
        this.keys.add(event.code);
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
      },
      keyup: event => this.keys.delete(event.code),
      pointerdown: event => {
        this.dragging = true;
        this.pointerMoved = false;
        this.lastPointer = { x: event.clientX, y: event.clientY };
        canvas.setPointerCapture?.(event.pointerId);
      },
      pointermove: event => {
        if (!this.dragging) return;
        const dx = event.clientX - this.lastPointer.x;
        const dy = event.clientY - this.lastPointer.y;
        if (Math.abs(dx) + Math.abs(dy) > 2) this.pointerMoved = true;
        this.yaw -= dx * 0.0035;
        this.pitch = clamp(this.pitch - dy * 0.0027, -1.12, 1.12);
        this.lastPointer = { x: event.clientX, y: event.clientY };
      },
      pointerup: event => {
        if (!this.pointerMoved) this.pickInteractive(event);
        this.dragging = false;
        canvas.releasePointerCapture?.(event.pointerId);
      },
      blur: () => {
        this.keys.clear();
        this.mobileInput.clear();
      }
    };
    window.addEventListener("keydown", this.handlers.keydown);
    window.addEventListener("keyup", this.handlers.keyup);
    window.addEventListener("blur", this.handlers.blur);
    canvas.addEventListener("pointerdown", this.handlers.pointerdown);
    canvas.addEventListener("pointermove", this.handlers.pointermove);
    canvas.addEventListener("pointerup", this.handlers.pointerup);
  }

  pickInteractive(event) {
    const bounds = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const roots = [
      ...this.artworkGroups.map(({ group }) => group),
      ...this.companionRoots
    ];
    const hit = this.raycaster.intersectObjects(roots, true)[0];
    const artwork = hit?.object?.userData?.artwork;
    const companion = hit?.object?.userData?.companion;
    if (artwork) {
      this.setArtworkSelection(artwork.id);
      this.onArtworkFocus?.(artwork);
    } else if (companion) {
      this.onCompanionFocus?.(companion);
    }
  }

  updatePlayer(delta) {
    if (!this.sceneReady) return;
    const forwardInput = (this.keys.has("KeyW") || this.keys.has("ArrowUp") || this.mobileInput.has("forward") ? 1 : 0)
      - (this.keys.has("KeyS") || this.keys.has("ArrowDown") || this.mobileInput.has("back") ? 1 : 0);
    const sideInput = (this.keys.has("KeyD") || this.keys.has("ArrowRight") || this.mobileInput.has("right") ? 1 : 0)
      - (this.keys.has("KeyA") || this.keys.has("ArrowLeft") || this.mobileInput.has("left") ? 1 : 0);
    const sprinting = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight");
    const speed = sprinting ? 3.8 : 2.35;
    const movement = new THREE.Vector3(sideInput, 0, -forwardInput);
    if (movement.lengthSq() > 1) movement.normalize();
    movement.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw).multiplyScalar(speed * delta);

    if ((this.keys.has("Space") || this.mobileInput.has("jump")) && this.grounded) this.verticalVelocity = 4.3;
    this.verticalVelocity += -9.81 * delta;
    movement.y = this.verticalVelocity * delta;

    this.characterController.computeColliderMovement(this.playerCollider, movement);
    const corrected = this.characterController.computedMovement();
    this.grounded = this.characterController.computedGrounded();
    if (this.grounded && this.verticalVelocity < 0) this.verticalVelocity = -0.2;
    const current = this.playerBody.translation();
    this.playerBody.setNextKinematicTranslation({ x: current.x + corrected.x, y: current.y + corrected.y, z: current.z + corrected.z });
    this.physics.step();

    const position = this.playerBody.translation();
    this.camera.position.set(position.x, position.y + 0.72, position.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }

  updateCompanions(delta, time) {
    if (!this.sceneReady || !this.companionRoots.length) return;
    const player = this.playerBody.translation();
    const lerpAmount = 1 - Math.exp(-delta * 3.1);

    this.companionRoots.forEach((root, index) => {
      const offset = root.userData.followOffset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      const alignment = root.userData.alignment;
      const targetX = player.x + offset.x + alignment.x;
      const targetY = player.y - 0.82 + alignment.y + Math.sin(time * 1.25 + index) * 0.006;
      const targetZ = player.z + offset.z + alignment.z;
      root.position.x = THREE.MathUtils.lerp(root.position.x, targetX, lerpAmount);
      root.position.y = THREE.MathUtils.lerp(root.position.y, targetY, lerpAmount);
      root.position.z = THREE.MathUtils.lerp(root.position.z, targetZ, lerpAmount);
      root.rotation.y = Math.atan2(player.x - root.position.x, player.z - root.position.z);

      const ring = this.companionRings[index];
      ring.position.set(
        root.position.x - alignment.x,
        player.y - 0.82 + 0.016,
        root.position.z - alignment.z
      );
      ring.material.opacity = 0.48 + Math.sin(time * 1.8 + index) * 0.14;
    });
  }

  updateArtworkFocus(delta) {
    if (!this.sceneReady || !this.artworkGroups.length) return;
    this.focusSampleElapsed += delta;
    if (this.focusSampleElapsed < 0.12) return;
    this.focusSampleElapsed = 0;
    this.raycaster.setFromCamera(this.gazePointer, this.camera);
    const gazeHit = this.raycaster.intersectObjects(this.artworkGroups.map(({ group }) => group), true)[0];
    const gazeArtwork = gazeHit?.object?.userData?.artwork;
    if (gazeArtwork) {
      if (gazeArtwork.id !== this.focusedArtworkId) {
        this.setArtworkSelection(gazeArtwork.id);
        this.onArtworkFocus?.(gazeArtwork);
      }
      return;
    }
    const player = this.playerBody.translation();
    let nearest = null;
    let nearestDistance = Infinity;
    this.artworkGroups.forEach(item => {
      const dx = item.group.position.x - player.x;
      const dz = item.group.position.z - player.z;
      const distance = Math.hypot(dx, dz);
      if (distance < nearestDistance) {
        nearest = item;
        nearestDistance = distance;
      }
    });
    if (nearest && nearestDistance < 5.9 && nearest.artwork.id !== this.focusedArtworkId) {
      this.setArtworkSelection(nearest.artwork.id);
      this.onArtworkFocus?.(nearest.artwork);
    }
  }

  updatePortal(time) {
    if (!this.sceneReady || !this.portalRoot || this.portalTriggered) return;
    const player = this.playerBody.translation();
    const dx = this.portalRoot.position.x - player.x;
    const dz = this.portalRoot.position.z - player.z;
    this.portalRoot.children[0].material.opacity = 0.62 + Math.sin(time * 2.1) * 0.2;
    if (Math.hypot(dx, dz) < 1.35) {
      this.portalTriggered = true;
      this.onPortalEnter?.(this.currentScene);
    }
  }

  updateInterpretiveWorld(delta, time) {
    const amount = 1 - Math.exp(-delta * 2.2);
    this.renderer.toneMappingExposure = THREE.MathUtils.lerp(
      this.renderer.toneMappingExposure,
      this.interpretiveState.exposure,
      amount
    );
    this.keyLight.color.lerp(this.interpretiveState.lightColor, amount * 0.55);
    this.artworkGroups.forEach(({ group }, index) => {
      group.position.lerp(group.userData.targetPosition, amount);
      group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, group.userData.targetRotation, amount);
      group.position.y += Math.sin(time * 0.7 + index * 1.8) * 0.00035;
    });
  }

  animate() {
    if (this.disposed) return;
    this.frame = requestAnimationFrame(() => this.animate());
    const delta = Math.min(this.clock.getDelta(), 0.04);
    const time = performance.now() * 0.001;
    this.updatePlayer(delta);
    this.updateCompanions(delta, time);
    this.updateArtworkFocus(delta);
    this.updatePortal(time);
    this.updateInterpretiveWorld(delta, time);
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.fov = width < 680 ? 74 : 62;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  dispose() {
    this.disposed = true;
    this.loadToken += 1;
    cancelAnimationFrame(this.frame);
    this.clearLoadedScene();
    window.removeEventListener("keydown", this.handlers?.keydown);
    window.removeEventListener("keyup", this.handlers?.keyup);
    window.removeEventListener("blur", this.handlers?.blur);
    this.renderer?.domElement.removeEventListener("pointerdown", this.handlers?.pointerdown);
    this.renderer?.domElement.removeEventListener("pointermove", this.handlers?.pointermove);
    this.renderer?.domElement.removeEventListener("pointerup", this.handlers?.pointerup);
    this.resizeObserver?.disconnect();
    this.characterController?.free?.();
    this.physics?.free?.();
    this.spark?.dispose?.();
    this.renderer?.dispose?.();
    this.renderer?.domElement.remove();
  }
}
