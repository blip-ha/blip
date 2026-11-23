import { describe, expect, it } from "vitest";
import { usable } from "../src/profile";
import fp1 from "../../profiles/aqara_fp1.json";

describe("Aqara FP1 regions geometry", () => {
  it("accepts the FP1 4x7 grid with 10 regions", () => {
    expect(fp1.regions).toEqual({
      columns: 4,
      rows: 7,
      max_regions: 10,
    });
    expect(usable(fp1)).toBe(true);
  });

  it("rejects missing geometry", () => {
    const { regions, ...invalid } = fp1;
    expect(usable(invalid)).toBe(false);
  });

  it.each([
    { columns: 0 },
    { columns: 33 },
    { columns: 2.5 },
    { rows: 0 },
    { rows: 33 },
    { max_regions: 0 },
    { max_regions: 33 },
  ])("rejects invalid geometry: %o", (change) => {
    expect(usable({
      ...fp1,
      regions: { ...fp1.regions, ...change },
    })).toBe(false);
  });
});
