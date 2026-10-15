import { Section } from "./Inputs";
import {
  legacyDistanceIn,
  legacyExcludedPositions,
  legacyFormulas,
  legacyHood,
  legacyLookupTable,
  legacyRPM,
  legacyShots,
  type LegacyBand,
} from "../data/legacy2025";
/** Read-only view of FTC #25577's 2025-26 (DECODE) measured hits. */
export function LegacyData() {
  const [d0, d1] = legacyFormulas.validDistanceIn;
  const shots = legacyShots.map((s) => ({
    ...s,
    distance: legacyDistanceIn(s.position),
    excluded: legacyExcludedPositions.includes(s.position),
  }));
  const xMin = 30,
    xMax = 160,
    yMin = 3500,
    yMax = 6000;
  const x = (d: number) => 40 + (210 * (d - xMin)) / (xMax - xMin);
  const y = (r: number) => 160 - (145 * (r - yMin)) / (yMax - yMin);
  const line = (band: LegacyBand) =>
    `${x(d0)},${y(legacyRPM(d0, band))} ${x(d1)},${y(legacyRPM(d1, band))}`;
  return (
    <Section title="Last-season reference data (DECODE 2025-26)">
      <p className="notice">
        FTC #25577 Zağanos, DECODE 2025-26: single 4 in flywheel, passive hood,
        5 in ARTIFACT, DECODE GOAL. Not BIOBUZZ and not a simulator prediction.
      </p>
      <svg
        className="legacy-chart"
        viewBox="0 0 260 180"
        aria-label="Legacy RPM versus distance"
      >
        {[3500, 4000, 4500, 5000, 5500, 6000].map((r) => (
          <g key={r}>
            <line x1="40" x2="250" y1={y(r)} y2={y(r)} stroke="#344047" />
            <text x="2" y={y(r) + 3} fontSize="9" fill="#73867c">
              {r}
            </text>
          </g>
        ))}
        {[40, 80, 120, 160].map((d) => (
          <text key={d} x={x(d) - 6} y="175" fontSize="9" fill="#73867c">
            {d}
          </text>
        ))}
        {(["min", "max"] as const).map((band) => (
          <polyline
            key={band}
            points={line(band)}
            stroke="#73867c"
            strokeDasharray="3 3"
            fill="none"
          />
        ))}
        <polyline points={line("mean")} stroke="#afd4be" fill="none" />
        {shots.map((s) => (
          <circle
            key={s.odsRow}
            cx={x(s.distance)}
            cy={y(s.actualRPM)}
            r={2}
            fill={s.excluded ? "none" : "#e7bc77"}
            stroke="#e7bc77"
            opacity={0.8}
          />
        ))}
      </svg>
      <p className="muted">
        Measured wheel RPM of recorded hits against robot-center distance to
        Pedro (0, 144) in (x: in, y: RPM). Hollow: position 2,2, excluded by the
        original analysis. Lines: fitted mean (solid) and min/max (dashed) RPM,{" "}
        {d0}–{d1} in.
      </p>
      <table>
        <thead>
          <tr>
            <th>Distance in</th>
            <th>Hood cmd</th>
            <th>Min RPM</th>
            <th>Max RPM</th>
          </tr>
        </thead>
        <tbody>
          {legacyLookupTable.map(([d, h, lo, hi], i) => (
            <tr key={i}>
              <td>{d.toFixed(1)}</td>
              <td>{h.toFixed(1)}</td>
              <td>{lo}</td>
              <td>{hi}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted">
        Fits: RPM = {legacyFormulas.rpm.mean.slope}·d +{" "}
        {legacyFormulas.rpm.mean.intercept}; hood command at 100 in ={" "}
        {legacyHood(100).toFixed(1)}. Hood values are a 25–50 servo command, not
        a launch angle.
      </p>
      <p className="muted">
        Not converted to calibration rows. The rows have no exit speed, spin, or
        timed position. The hood launch angle, exit height, and ARTIFACT mass
        were never measured, and the target was the DECODE GOAL, which is not
        modeled here.
      </p>
    </Section>
  );
}
