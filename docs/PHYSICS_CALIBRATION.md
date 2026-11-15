# Physics Calibration Protocol

The current parameter values are deterministic game-simulation starting points, not measured properties of a particular table. Do not call the physics physically calibrated until a real table and measured shot trajectories have been supplied and replayed.

## Required table measurements

Record the actual playing-surface length and width, ball diameter/mass, cushion-nose position, pocket throat widths, jaw endpoints/depth and cloth/table condition. Measure from the playing surface and cushion nose, not the outside cabinet.

## Reference-shot capture

Use a fixed overhead camera with a calibration ruler or fiducial markers in the table plane. Track ball-center positions in meters with timestamps in seconds. Record the cue command, initial ball positions and spin input for every shot.

Capture at least these scenarios:

1. Free roll at several initial speeds (rolling deceleration).
2. Sliding-to-rolling transition with known cue offset (sliding friction).
3. Follow and draw at multiple vertical contact offsets.
4. Side-spin roll-out and cushion rebound.
5. Full and cut ball-ball collisions (restitution and throw).
6. Straight cushion rebounds at several incident angles and speeds.
7. Corner/side pocket clean captures and jaw near-misses.

Repeat each shot several times and retain the raw observations; do not average away measurement noise before fitting.

## Reference dataset shape

Store one JSON file per scenario under tests/fixtures/physics-calibration/:

~~~json
{
  "table": {
    "lengthMeters": 2.54,
    "widthMeters": 1.27,
    "ballDiameterMeters": 0.05715
  },
  "shot": {
    "id": "straight-roll-medium",
    "cueBall": { "x": -0.72, "z": 0 },
    "direction": { "x": 1, "z": 0 },
    "power": 0.45,
    "spin": { "side": 0, "vertical": 0 }
  },
  "samples": [
    { "timeSeconds": 0, "cueBall": { "x": -0.72, "z": 0 } },
    { "timeSeconds": 0.25, "cueBall": { "x": -0.4, "z": 0 } }
  ],
  "metadata": {
    "tableId": "record-the-measured-table",
    "cameraFps": 120,
    "positionUncertaintyMeters": 0.001
  }
}
~~~

The values above are schema examples only; they are not calibration measurements.

## Fitting and validation

- Fit one parameter family at a time: rolling deceleration, sliding friction, spin decay/transfer, ball restitution, cushion restitution/friction, then pocket/jaw geometry.
- Minimize trajectory position RMSE over the fitting shots, then validate against held-out shots.
- Compare rebound angle, travel distance, time-to-rest, spin decay and pocket outcome in addition to aggregate RMSE.
- Preserve the raw dataset, fitted config, code revision and fitting script output together.
- Never tune against the same shots used for final validation.

## Completion criteria

Calibration remains open until the dataset identifies the measured table, measurement uncertainty is documented, all listed scenario families are represented, and held-out validation results are recorded. Acceptance thresholds must be chosen from the actual measurement resolution and intended simulation fidelity, not invented in advance.
