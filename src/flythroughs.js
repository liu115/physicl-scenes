/**
 * Fly-through clips in the Scenes gallery, one per scene.
 *
 * Each clip is a final take from nfinite-video's `flythrough` material
 * (`flythrough/<stem>/takes/<take>/video.mp4` under its data root), re-encoded at 720 px into
 * `public/media/fly/<stem>.mp4` with a poster frame `<stem>.jpg`.
 */
const HOUSEHOLD = [
  ["NFINITE-DATASET360-ENTRANCE-LS-MEA_208-UN", "Entrance"],
  ["NFINITE-DATASET360-KIDSROOM-LS-MEA_2088-UN", "Kids room"],
  ["NFINITE-DATASET360-KITCHEN-LS-MEA_2524-UN", "Kitchen"],
  ["NFINITE-DATASET360-LIVINGROOM-LS-MEA_376-UN", "Loft living room"],
  ["NFINITE-DATASET360-LIVINGROOM-LS-MEA_423-UN", "Living room"],
  ["NFINITE-DATASET360-OFFICE-LS-MEA_7371-UN", "Home office"],
];

const PUBLIC = [
  ["NFINITE-PUB_102-RESTAURANT-LS-UN", "Restaurant"],
  ["NFINITE-PUB_1184-LOBBY-LS-UN", "Lobby"],
  ["NFINITE-PUB_1222-CONF_ROOM-LS-UN", "Conference room"],
  ["NFINITE-PUB_1341-CAFE-LS-UN", "Café"],
  ["NFINITE-PUB_1403-LIBRARY-LS-UN", "Library"],
  ["NFINITE-PUB_1441-AUDITORIUM-LS-UN", "Auditorium"],
  ["NFINITE-PUB_733-ART_GALLERY-LS-UN", "Art gallery"],
  ["NFINITE-PUB_765-MEDIEVAL_DH-LS-UN", "Medieval dining hall"],
  ["NFINITE-PUB_780-CHURCH-LS-UN", "Church"],
  ["NFINITE-PUB_931-PLAYROOM-LS-UN", "Playroom"],
  ["NFINITE-PUB_962-GYM_SPACE-LS-UN", "Gym"],
  ["NFINITE-PUB_12-SPACESHIP-LS-UN", "Spaceship"],
];

const OUTDOOR = [
  ["NFINITE-EXT186-COURTYARD-LS-UN", "Courtyard"],
  ["NFINITE-EXT184-FOUNTAIN_PLAZA-LS-UN", "Fountain plaza"],
  ["NFINITE-EXT159-POCKET_PARK-LS-UN", "Pocket park"],
  ["NFINITE-EXT201-GARDEN_PATIO-LS-UN", "Garden patio"],
  ["NFINITE-EXT209-TOWN_GARDEN-LS-UN", "Town garden"],
  ["NFINITE-EXT236-PARK_PAVILION-LS-UN", "Park pavilion"],
];

const entries = (kind, list) => list.map(([stem, label]) => ({
  stem,
  label,
  kind,
  video: `${import.meta.env.BASE_URL}media/fly/${stem}.mp4`,
  poster: `${import.meta.env.BASE_URL}media/fly/${stem}.jpg`,
}));

export const KINDS = ["Household", "Public", "Outdoor"];

export const FLYTHROUGHS = [
  ...entries("Household", HOUSEHOLD),
  ...entries("Public", PUBLIC),
  ...entries("Outdoor", OUTDOOR),
];
