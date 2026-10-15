import { it, expect } from "vitest";
import { current } from "../presets";
import { simulateShooter, wheelSpeeds } from "../physics/shooter";
import { toRPM } from "../utils/units";

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
