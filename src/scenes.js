/**
 * Scenes shown in the 3D viewer.
 *
 * `file` is a scene-LOD GLB under `public/media/scenes/`, written by nfinite-process's
 * `compress_scene`. `inside` is a key of the scene's fly-through clip in nfinite-video
 * (`materials/flythrough/candidates/<stem>.json`), or the scene's authored camera where it has no
 * fly-through (Kids room), in Blender world coordinates: metres, Z up.
 * `lensMm` is that clip's focal length on a 36 mm wide sensor. `hideTopDown` names the depth-1
 * groups the top-down view hides: those nfinite-process's `occluders.view_kind` classes as
 * "ceiling", the rule its dollhouse renders use (ceiling fixtures and walls stay).
 */
export const SCENES = [
  {
    stem: "NFINITE-DATASET360-LIVINGROOM-LS-MEA_243-UN",
    label: "Living room",
    kind: "Household",
    hideTopDown: ["CEILING", "CEILING_MOLDING"],
    inside: { pos: [3.72, -3.6, 1.65], look: [3.95, -7.4, 1.0], lensMm: 24 },
  },
  {
    stem: "NFINITE-DATASET360-KIDSROOM-LS-MEA_187-UN",
    label: "Kids room",
    kind: "Household",
    hideTopDown: ["CEILING"],
    inside: { pos: [1.088, -5.54, 0.834], look: [2.809, -3.082, 0.834], lensMm: 32.3 },
  },
  {
    stem: "NFINITE-DATASET360-ENTRANCE-LS-MEA_208-UN",
    label: "Entrance",
    kind: "Household",
    hideTopDown: ["CEILING", "CEILING_MOLDING"],
    inside: { pos: [2.2, -0.45, 1.5], look: [2.0, -6.6, 1.55], lensMm: 20 },
  },
  {
    stem: "NFINITE-PUB_102-RESTAURANT-LS-UN",
    label: "Restaurant",
    kind: "Public",
    hideTopDown: ["CEILING"],
    inside: { pos: [12.4, -6.15, 1.6], look: [7.9, -3.95, 1.0], lensMm: 24 },
  },
  {
    stem: "NFINITE-EXT186-COURTYARD-LS-UN",
    label: "Courtyard",
    kind: "Outdoor",
    hideTopDown: [],
    inside: { pos: [28.7, -55.0, 1.65], look: [28.4, -41.0, 1.0], lensMm: 24 },
  },
].map((scene) => ({ ...scene, file: `${import.meta.env.BASE_URL}media/scenes/${scene.stem}.glb` }));
