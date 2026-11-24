import { FLYTHROUGHS, KINDS } from "./flythroughs.js";

/**
 * Builds the Scenes gallery inside `root`: filter chips in `.gallery-filters`, tiles in
 * `.gallery-grid`. A tile's video plays only while at least half of it is on screen.
 */
export function setUpGallery(root) {
  const filters = root.querySelector(".gallery-filters");
  const grid = root.querySelector(".gallery-grid");

  const visibility = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const video = entry.target;
      if (entry.isIntersecting) {
        video.preload = "auto";
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }
  }, { threshold: 0.5 });

  const tiles = FLYTHROUGHS.map((clip) => {
    const tile = document.createElement("figure");
    tile.className = "gallery-tile";
    tile.dataset.kind = clip.kind;

    const video = document.createElement("video");
    Object.assign(video, { src: clip.video, poster: clip.poster, muted: true, loop: true, playsInline: true, preload: "none" });
    video.setAttribute("aria-label", `Fly-through of the ${clip.label.toLowerCase()} scene`);

    const caption = document.createElement("figcaption");
    caption.textContent = clip.label;

    tile.append(video, caption);
    grid.append(tile);
    visibility.observe(video);
    return tile;
  });

  const options = [...KINDS.map((kind) => [kind, FLYTHROUGHS.filter((c) => c.kind === kind).length]), ["All", FLYTHROUGHS.length]];
  const buttons = options.map(([kind, count]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.dataset.kind = kind;
    button.innerHTML = `${kind} <span class="count">${count}</span>`;
    button.addEventListener("click", () => select(kind));
    filters.append(button);
    return button;
  });

  function select(kind) {
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.kind === kind)));
    for (const tile of tiles) {
      const shown = kind === "All" || tile.dataset.kind === kind;
      tile.hidden = !shown;
      if (!shown) tile.querySelector("video").pause();
    }
  }

  select(KINDS[0]);
}
