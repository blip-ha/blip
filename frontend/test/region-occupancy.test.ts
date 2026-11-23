import { describe, expect, it } from "vitest";
import { updateRegionOccupancy } from "../src/region-occupancy";
import type { HassEntity } from "../src/hass";

function event(
  timestamp: string,
  eventType: string,
  region: number
): HassEntity {
  return {
    entity_id: "event.fp1_action",
    state: timestamp,
    attributes: {
      event_type: eventType,
      region,
    },
    last_changed: timestamp,
    last_updated: timestamp,
  };
}

describe("FP1 live region occupancy", () => {
  it("ignores historical occupancy on first observation", () => {
    const state = updateRegionOccupancy(
      undefined,
      event("2026-11-23T19:52:03Z", "region_occupied", 1),
      10
    );

    expect(state.occupied.size).toBe(0);
    expect(state.lastEvent).toBe("2026-11-23T19:52:03Z");
  });

  it("lights a region when occupied", () => {
    const state = updateRegionOccupancy(
      updateRegionOccupancy(
        undefined,
        event("2026-11-23T19:50:00Z", "region_unoccupied", 1),
        10
      ),
      event("2026-11-23T19:52:03Z", "region_occupied", 1),
      10
    );

    expect(state.occupied.has(1)).toBe(true);
  });

  it("clears a region when unoccupied", () => {
    const occupied = updateRegionOccupancy(
      updateRegionOccupancy(
        undefined,
        event("2026-11-23T19:50:00Z", "region_unoccupied", 1),
        10
      ),
      event("2026-11-23T19:52:03Z", "region_occupied", 1),
      10
    );

    const cleared = updateRegionOccupancy(
      occupied,
      event("2026-11-23T19:53:03Z", "region_unoccupied", 1),
      10
    );

    expect(cleared.occupied.has(1)).toBe(false);
  });

  it("ignores repeated events", () => {
    const first = updateRegionOccupancy(
      updateRegionOccupancy(
        undefined,
        event("2026-11-23T19:50:00Z", "region_unoccupied", 1),
        10
      ),
      event("2026-11-23T19:52:03Z", "region_occupied", 1),
      10
    );

    const repeated = updateRegionOccupancy(
      first,
      event("2026-11-23T19:52:03Z", "region_occupied", 1),
      10
    );

    expect(repeated).toBe(first);
  });

  it("rejects invalid region numbers", () => {
    const state = updateRegionOccupancy(
      undefined,
      event("2026-11-23T19:52:03Z", "region_occupied", 11),
      10
    );

    expect(state.occupied.size).toBe(0);
  });
});

describe("FP1 region enter and leave events", () => {
  it("activates region 2 on enter and clears it on leave", () => {
    const makeEvent = (state: string, event_type: string, region: number) => ({
      state,
      attributes: { event_type, region },
    });

    let current = updateRegionOccupancy(
      undefined,
      makeEvent("initial", "region_unoccupied", 2) as any,
      10
    );

    current = updateRegionOccupancy(
      current,
      makeEvent("enter-1", "region_enter", 2) as any,
      10
    );
    expect([...current.occupied]).toEqual([2]);

    current = updateRegionOccupancy(
      current,
      makeEvent("leave-1", "region_leave", 2) as any,
      10
    );
    expect([...current.occupied]).toEqual([]);
  });

  it("keeps region 1 active when region 2 is left", () => {
    const makeEvent = (state: string, event_type: string, region: number) => ({
      state,
      attributes: { event_type, region },
    });

    let current = updateRegionOccupancy(
      undefined,
      makeEvent("initial", "region_unoccupied", 1) as any,
      10
    );

    for (const [state, event_type, region] of [
      ["enter-1", "region_enter", 1],
      ["enter-2", "region_enter", 2],
      ["leave-2", "region_leave", 2],
    ] as const) {
      current = updateRegionOccupancy(
        current,
        makeEvent(state, event_type, region) as any,
        10
      );
    }

    expect([...current.occupied]).toEqual([1]);
  });
});
