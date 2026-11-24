import { TURNTABLES } from "./turntables.js";

/**
 * Builds the asset gallery inside `root`: one tile per turntable in `.asset-grid`, and the view
 * switch `[data-asset-view]` buttons. A tile crops its clip to the left half (`original`) or the
 * right half (`parts`), so both views stay on the same frame. A clip plays while its tile is on
 * screen.
 */
export function setUpAssetGallery(root) {
  const grid = root.querySelector(".asset-grid");
  const buttons = [...root.querySelectorAll("[data-asset-view]")];

  const visibility = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      if (isIntersecting) {
        target.preload = "auto";
        target.play().catch(() => {});
      } else {
        target.pause();
      }
    }
  }, { threshold: 0.25 });

  for (const asset of TURNTABLES) {
    const tile = document.createElement("figure");
    tile.className = "asset-tile";
    const frame = document.createElement("div");
    frame.className = "asset-frame";
    const video = document.createElement("video");
    Object.assign(video, { src: asset.video, poster: asset.poster, muted: true, loop: true, playsInline: true, preload: "none" });
    video.setAttribute("aria-label", `${asset.label} turning on a turntable`);
    const caption = document.createElement("figcaption");
    caption.textContent = asset.label;
    frame.append(video);
    tile.append(frame, caption);
    grid.append(tile);
    visibility.observe(video);
  }

  function select(view) {
    grid.dataset.view = view;
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.assetView === view)));
  }
  buttons.forEach((b) => b.addEventListener("click", () => select(b.dataset.assetView)));
  select("original");
}
