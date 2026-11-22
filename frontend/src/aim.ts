import { mToFt } from "./fan";
import type { BandSpec } from "./profile";

export type LostReason = "out" | "off" | "quiet";

export interface AimInput {
  band: BandSpec;
  lostMs: number; // silence longer than this while aiming = "lost you"
  aimOn: boolean;
  aimStart: number; // ms epoch when the aim test started
  now: number;
  presence: boolean;
  enabled: boolean[];
  distance?: { meters: number; seenAt: number }; // latest target_distance reading
}

export interface AimView {
  live: boolean; // a fresh distance arrived since the test started
  active?: number; // band index you're in
  lost?: LostReason;
  waitedS: number;
}

export function aimView({ band, lostMs, aimOn, aimStart, now, presence, enabled, distance }: AimInput): AimView {
  const waitedS = Math.max(0, Math.round((now - aimStart) / 1000));
  const live = aimOn && !!distance && distance.seenAt >= aimStart;
  if (!live) return { live: false, waitedS };
  const m = distance!.meters;
  const active = m > 0 ? Math.min(band.count - 1, Math.floor(m / band.size_m)) : undefined;
  // The sensor never says "you left": infer it from presence dropping, standing in an
  // off band, or silence.
  const lost: LostReason | undefined = !presence
    ? "out"
    : active !== undefined && !enabled[active]
      ? "off"
      : now - distance!.seenAt > lostMs
        ? "quiet"
        : undefined;
  return { live, active, lost, waitedS };
}

const fmt = (m: number) => mToFt(m).toFixed(1);

export interface PillInput {
  band: BandSpec;
  editing: boolean;
  draftOn: number;
  pending: boolean;
  aimOn: boolean;
  known: boolean;
  onCount: number;
  maxFt: number;
  view: AimView;
}

export function pillText({ band, editing, draftOn, pending, aimOn, known, onCount, maxFt, view }: PillInput): string {
  if (editing) return `Editing · ${draftOn} of ${band.count} bands on`;
  if (pending) return "Saved · waiting for sensor to confirm";
  if (!aimOn) return known ? `${onCount}/${band.count} bands · ${maxFt.toFixed(1)} ft` : "Reading bands…";
  if (!view.live) return "Waiting for sensor…";
  if (view.lost === "out") return "Out of range · nobody detected";
  if (view.lost === "off") return `Band ${view.active! + 1} is off · not detecting here`;
  if (view.lost === "quiet") return "Lost you · keep moving to confirm";
  if (view.active === undefined) return "No one in range";
  const a = view.active;
  return `Band ${a + 1} · ${fmt(a * band.size_m)}–${fmt((a + 1) * band.size_m)} ft`;
}
