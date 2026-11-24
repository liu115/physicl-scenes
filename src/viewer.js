import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { N8AOPass } from "n8ao";
import { SCENES } from "./scenes.js";

const SENSOR_WIDTH_MM = 36;
/** Top-down camera tilt from vertical: the 75 degree elevation of nfinite-process's dollhouse renders, steep enough that near walls hide little. */
const TOP_DOWN_TILT = THREE.MathUtils.degToRad(15);
/**
 * Multisampling of the scene render. The AO pass renders the scene into its own target, so the
 * renderer's `antialias` never applies; multisampling that target is what smooths geometry edges.
 */
const MSAA_SAMPLES = 4;
/** Anisotropic filtering of every texture: sharp floors and walls at a slant without the shimmer of the GPU maximum. */
const TEXTURE_ANISOTROPY = 4;
const TOP_DOWN_FOV = 35;
const TOP_DOWN_MARGIN = 1.08;
/** Inside, the camera turns around a point this far ahead of it, in metres: turning the head, not circling a far target. */
const LOOK_PIVOT_M = 1.0;
/** Inside, metres walked per pixel of wheel scroll. */
const WALK_M_PER_PIXEL = 0.004;

/** Blender world (Z up) to glTF/three world (Y up), in metres. */
function fromBlender([x, y, z]) {
  return new THREE.Vector3(x, z, -y);
}

function verticalFov(lensMm, aspect) {
  const horizontal = 2 * Math.atan(SENSOR_WIDTH_MM / 2 / lensMm);
  return THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(horizontal / 2) / aspect));
}

function disposeObject(root) {
  root.traverse((node) => {
    if (!node.isMesh) return;
    node.geometry.dispose();
    for (const material of [node.material].flat()) {
      for (const value of Object.values(material)) {
        if (value && value.isTexture) value.dispose();
      }
      material.dispose();
    }
  });
}

/** Builds the 3D viewer inside the section `root`: scene chips, the view switch, the canvas and its hint. */
export function setUpViewer(root) {
  const stage = root.querySelector(".viewer-stage");
  const status = root.querySelector(".viewer-status");
  const sceneButtons = root.querySelector(".viewer-scenes");
  const viewButtons = [...root.querySelectorAll("[data-view]")];
  const hint = root.querySelector(".viewer-hint-controls");
  const background = getComputedStyle(document.documentElement).getPropertyValue("--media-bg").trim();

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.domElement.style.visibility = "hidden";
  stage.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(background);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new THREE.HemisphereLight(0xfff6ea, 0x8a7f72, 0.6));
  const sun = new THREE.DirectionalLight(0xfff1e0, 1.2);
  sun.position.set(0.4, 1, 0.25);
  scene.add(sun);

  const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.05, 2000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.12;
  controls.screenSpacePanning = true;
  controls.zoomToCursor = true;

  const composer = new EffectComposer(renderer);
  const aoPass = new N8AOPass(scene, camera, 1, 1);
  aoPass.configuration.aoRadius = 1.0;
  aoPass.configuration.distanceFalloff = 1.0;
  aoPass.configuration.intensity = 4;
  aoPass.configuration.halfRes = true;
  aoPass.configuration.gammaCorrection = false;
  aoPass.beautyRenderTarget.samples = MSAA_SAMPLES;
  composer.addPass(aoPass);
  composer.addPass(new OutputPass());

  const loader = new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath(`${import.meta.env.BASE_URL}draco/`));

  let current = null;
  let model = null;
  let hidden = [];
  let hiddenMeshes = new Set();
  let view = "inside";
  let loadToken = 0;
  let visible = false;
  let running = false;

  function setStatus(text) {
    status.textContent = text;
    status.hidden = !text;
  }

  function resize() {
    const { width, height } = stage.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(width, height);
    camera.aspect = width / height;
    if (current && view === "inside") camera.fov = verticalFov(current.inside.lensMm, camera.aspect);
    camera.updateProjectionMatrix();
  }

  function sceneBounds() {
    const box = new THREE.Box3();
    model.traverse((node) => {
      if (node.isMesh && !hiddenMeshes.has(node)) box.expandByObject(node);
    });
    return box;
  }

  /**
   * Camera distance along the unit vector `direction` from `center` at which every corner of `box`
   * projects inside the frame shrunk by `TOP_DOWN_MARGIN`. Moves `camera`; `far` (metres) bounds the search.
   */
  function fitDistance(box, center, direction, far) {
    const corners = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => new THREE.Vector3(
      i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z));
    const fits = (d) => {
      camera.position.copy(center).addScaledVector(direction, d);
      camera.lookAt(center);
      camera.updateMatrixWorld();
      return corners.every((c) => {
        const p = c.clone().project(camera);
        return p.z < 1 && Math.abs(p.x) * TOP_DOWN_MARGIN <= 1 && Math.abs(p.y) * TOP_DOWN_MARGIN <= 1;
      });
    };
    let lo = 0, hi = far;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (fits(mid)) hi = mid;
      else lo = mid;
    }
    return hi;
  }

  function applyView() {
    if (!model) return;
    const topDown = view === "top";
    for (const node of hidden) node.visible = !topDown;

    if (topDown) {
      const box = sceneBounds();
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      camera.fov = TOP_DOWN_FOV;
      camera.updateProjectionMatrix();
      const direction = new THREE.Vector3(0, Math.cos(TOP_DOWN_TILT), Math.sin(TOP_DOWN_TILT));
      const distance = fitDistance(box, center, direction, Math.max(size.x, size.y, size.z) * 4);
      camera.position.copy(center).addScaledVector(direction, distance);
      controls.target.copy(center);
      controls.enableZoom = true;
      controls.rotateSpeed = 1;
      controls.panSpeed = 1;
      controls.minDistance = 0.5;
      controls.maxDistance = distance * 3;
      controls.maxPolarAngle = THREE.MathUtils.degToRad(75);
    } else {
      camera.fov = verticalFov(current.inside.lensMm, camera.aspect);
      camera.updateProjectionMatrix();
      const eye = fromBlender(current.inside.pos);
      const ahead = fromBlender(current.inside.look).sub(eye).normalize();
      camera.position.copy(eye);
      controls.target.copy(eye).addScaledVector(ahead, LOOK_PIVOT_M);
      controls.enableZoom = false;
      controls.rotateSpeed = 0.35;
      controls.panSpeed = 3;
      controls.minDistance = 0;
      controls.maxDistance = Infinity;
      controls.maxPolarAngle = Math.PI;
    }
    camera.near = topDown ? 0.1 : 0.05;
    camera.updateProjectionMatrix();
    controls.update();
  }

  async function load(entry) {
    const token = ++loadToken;
    current = entry;
    [...sceneButtons.children].forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.stem === entry.stem)));
    setStatus(`Loading ${entry.label}…`);

    const gltf = await loader.loadAsync(entry.file, (event) => {
      if (token !== loadToken || !event.total) return;
      setStatus(`Loading ${entry.label}… ${Math.round((100 * event.loaded) / event.total)}%`);
    });
    if (token !== loadToken) {
      disposeObject(gltf.scene);
      return;
    }

    if (model) {
      scene.remove(model);
      disposeObject(model);
    }
    model = gltf.scene;
    const anisotropy = Math.min(TEXTURE_ANISOTROPY, renderer.capabilities.getMaxAnisotropy());
    model.traverse((node) => {
      if (!node.isMesh) return;
      for (const material of [node.material].flat()) {
        for (const value of Object.values(material)) {
          if (value && value.isTexture) value.anisotropy = anisotropy;
        }
      }
    });
    const groups = model.children.length === 1 ? model.children[0].children : model.children;
    hidden = groups.filter((group) => entry.hideTopDown.includes(group.name));
    hiddenMeshes = new Set();
    for (const group of hidden) group.traverse((node) => node.isMesh && hiddenMeshes.add(node));
    scene.add(model);
    renderer.domElement.style.visibility = "";
    setStatus("");
    applyView();
  }

  const pointer = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  renderer.domElement.addEventListener("wheel", (event) => {
    if (view !== "inside" || !model) return;
    event.preventDefault();
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const pixels = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? event.deltaY * 16 : event.deltaY;
    const step = raycaster.ray.direction.multiplyScalar(-pixels * WALK_M_PER_PIXEL);
    camera.position.add(step);
    controls.target.add(step);
  }, { passive: false });

  function setView(next) {
    view = next;
    hint.textContent = hint.dataset[next];
    viewButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === next)));
    applyView();
  }

  function frame() {
    if (!visible) {
      running = false;
      return;
    }
    controls.update();
    composer.render();
    requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  }

  for (const entry of SCENES) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.dataset.stem = entry.stem;
    button.textContent = entry.label;
    button.addEventListener("click", () => load(entry).catch((error) => setStatus(`Could not load ${entry.label}: ${error.message}`)));
    sceneButtons.append(button);
  }
  viewButtons.forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));

  new ResizeObserver(resize).observe(stage);
  resize();

  let started = false;
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !started) {
      started = true;
      load(SCENES[0]).catch((error) => setStatus(`Could not load ${SCENES[0].label}: ${error.message}`));
    }
    if (visible) start();
  }, { rootMargin: "200px" }).observe(stage);

  return { load, setView };
}
