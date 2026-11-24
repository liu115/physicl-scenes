/**
 * The lighting section: one view of the lobby under a chosen time of day and lamp groups.
 *
 * Every still is a take of nfinite-video's `lightgrid` material
 * (`lightgrid/NFINITE-PUB_1193-LOBBY-LS-UN/takes/grid_final/stills/<time>_<bits>.png`), converted into
 * `public/media/lighting/<time>_<bits>.webp`. `bits` has one character per entry of `GROUPS`, in
 * order, `1` for on; it must match the candidate's `groups` order.
 */
const TIMES = [
  ["morning", "Sunrise"],
  ["noon", "Noon"],
  ["sunset", "Sunset"],
  ["night", "Night"],
];

const GROUPS = [
  ["ceiling", "Ceiling lights"],
  ["pendants", "Pendants"],
  ["floor_table", "Floor & table lamps"],
  ["led", "LED strips"],
];

const stillUrl = (time, bits) => `${import.meta.env.BASE_URL}media/lighting/${time}_${bits}.webp`;

function allBits(n) {
  return Array.from({ length: 2 ** n }, (_, i) => i.toString(2).padStart(n, "0"));
}

/**
 * Builds the time switch in `.lighting-times`, the lamp toggles in `.lighting-groups` and shows
 * the matching still in `img.lighting-still`. Preloads every still of the selected time once the
 * section is near the viewport, so toggling a lamp group swaps the image without a wait.
 */
export function setUpLighting(root) {
  const image = root.querySelector(".lighting-still");
  const timeBar = root.querySelector(".lighting-times");
  const groupBar = root.querySelector(".lighting-groups");
  const state = { time: "night", on: new Set(GROUPS.map(([key]) => key)) };
  const cache = new Map();
  let near = false;

  function preload(time) {
    for (const bits of allBits(GROUPS.length)) {
      const url = stillUrl(time, bits);
      if (cache.has(url)) continue;
      const img = new Image();
      img.decoding = "async";
      img.src = url;
      cache.set(url, img);
    }
  }

  const timeButtons = TIMES.map(([key, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.time = key;
    button.textContent = label;
    button.addEventListener("click", () => {
      state.time = key;
      render();
    });
    timeBar.append(button);
    return button;
  });

  const groupButtons = GROUPS.map(([key, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip lamp";
    button.dataset.group = key;
    button.innerHTML = `<span class="lamp-dot" aria-hidden="true"></span>${label}`;
    button.addEventListener("click", () => {
      if (state.on.has(key)) state.on.delete(key);
      else state.on.add(key);
      render();
    });
    groupBar.append(button);
    return button;
  });

  function render() {
    const bits = GROUPS.map(([key]) => (state.on.has(key) ? "1" : "0")).join("");
    timeButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.time === state.time)));
    groupButtons.forEach((b) => b.setAttribute("aria-pressed", String(state.on.has(b.dataset.group))));
    const time = TIMES.find(([key]) => key === state.time)[1];
    const lit = GROUPS.filter(([key]) => state.on.has(key)).map(([, label]) => label.toLowerCase());
    image.alt = `The lobby at ${time.toLowerCase()}, ${lit.length ? `with ${lit.join(", ")} on` : "with every light off"}.`;
    image.src = stillUrl(state.time, bits);
    if (near) preload(state.time);
  }

  new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting || near) return;
    near = true;
    preload(state.time);
  }, { rootMargin: "400px" }).observe(root);

  render();
}
