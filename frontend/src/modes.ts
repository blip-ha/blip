// Detection modes. Kept free of build-tool features so the catalog script (plain Node) can use it.

export type Mode = "band" | "cone" | "map" | "regions";
export type Role = "range" | "presence" | "pir" | "distance" | "battery" | "track" | "motion" | "interval" | "action" | "configured_regions";

/** Modes this version of Blip can draw, and the roles each one needs. */
export const MODES: Partial<Record<Mode, { required: Role[] }>> = {
  band: { required: ["range", "presence"] },
  regions: { required: ["presence"] },
};
