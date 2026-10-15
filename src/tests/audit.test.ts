import { it, expect } from "vitest";
import { current } from "../presets";
import { simulateShooter, wheelSpeeds } from "../physics/shooter";
import { toRPM } from "../utils/units";
import { fieldConfig } from "../field/fieldConfig";
import { hiveCells } from "../field/hiveGeometry";

const surface = (c: typeof current) =>
  (c.shooter.primary.omega * c.shooter.primary.diameter) / 2;

it("passive topology makes every hood roller passive", () => {
  const c = structuredClone(current);
  c.shooter.topology = "passive";
  expect(wheelSpeeds(c).slice(1)).toEqual([0, 0, 0]);
  const s = simulateShooter(c);
  const r = c.projectile.diameter / 2;
  // Rolling along a fixed hood: centre speed is half the wheel surface speed
  // and the ball spins at S = omega r / v = 1 (pure-roll kinematic limit).
  expect(s.speed / surface(c)).toBeCloseTo(0.5, 2);
  expect((s.spin * r) / s.speed).toBeCloseTo(1, 2);
  expect(s.speed).toBeCloseTo(3.644, 2);
  expect(toRPM(s.spin)).toBeCloseTo(979, -1);
});

it("powered hood rim speed is tangent to the path (mount angle is placement)", () => {
  const c = structuredClone(current);
  const s = simulateShooter(c);
  // Default 3.75 RPM ratio gives hood surface speed 0.992 of the main wheel:
  // exit ≈ mean surface speed and only a few RPM of spin.
  expect(s.speed / surface(c)).toBeCloseTo(0.996, 3);
  expect(Math.abs(toRPM(s.spin))).toBeLessThan(10);
  // Mount angles must not change the result.
  const flat = structuredClone(c);
  for (const w of [flat.shooter.secondary, ...flat.shooter.rollers])
    w.angle = 0;
  const f = simulateShooter(flat);
  expect(f.speed).toBeCloseTo(s.speed, 12);
  expect(f.spin).toBeCloseTo(s.spin, 12);
});

it("CELL opening center follows the 30° arm geometry of manual Fig. 9-9/9-10", () => {
  const f = fieldConfig;
  const inch = 0.0254;
  const [x, y, z] = f.target.center;
  expect(x / inch).toBeCloseTo(12.75, 6);
  expect(y / inch).toBeCloseTo(-15.77, 2);
  expect(z / inch).toBeCloseTo(59.55, 6);
  // Opening face lies 21.455 in (half the 42.91 in assembly) from the pivot
  // along the 30° arm.
  const along = -y * Math.cos(Math.PI / 6) + (z - f.hive.pivotHeight) * 0.5;
  expect(along / inch).toBeCloseTo(42.91 / 2, 6);
  // Opening corners reproduce the published 53.5 / 65.6 in heights.
  const half = (f.target.height / 2) * Math.sin(Math.PI / 3);
  expect((z - half) / inch).toBeCloseTo(53.5, 1);
  expect((z + half) / inch).toBeCloseTo(65.6, 1);
  // The downward CELL opening stays just above the 30.6 in HIVE bottom.
  expect(f.hive.bottomHeight / inch).toBeCloseTo(30.6, 6);
  const lower = hiveCells(f).find((c) => c.id === "blue-lower-cell")!;
  const lowest = lower.center[2] - half;
  expect(lowest).toBeGreaterThan(f.hive.bottomHeight);
  expect(lowest - f.hive.bottomHeight).toBeLessThan(2 * inch);
});
