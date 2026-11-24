/**
 * Assets in the asset gallery, in display order.
 *
 * Each clip is one take of nfinite-video's `turntable` material for the teaser scene
 * (`turntable/NFINITE-PUB_938-PLAYROOM-LS-UN/takes/turntable_final/<name>.mp4`; the wicker basket,
 * coloured as one basket and three books, from `takes/basket_final/`), re-encoded into
 * `public/media/assets/<name>.mp4`. A frame holds two squares side by side: the asset in its own
 * materials on the left, its part colouring on the right, from the same camera.
 */
const ASSETS = [
  ["ARMCHAIR_01", "Armchair"],
  ["OUT_TABLE_TENNIS_TABLE_01", "Table-tennis table"],
  ["PROPS_01", "Chess set"],
  ["ACCESSORY_06", "Pencil cup"],
  ["GAMEPAD_01", "Gamepad"],
  ["TOY_01", "Tabletop game"],
  ["BASKET_01", "Monstera plant"],
  ["ACCESSORY_07", "Wicker basket"],
];

export const TURNTABLES = ASSETS.map(([name, label]) => ({
  name,
  label,
  video: `${import.meta.env.BASE_URL}media/assets/${name}.mp4`,
  poster: `${import.meta.env.BASE_URL}media/assets/${name}.jpg`,
}));
