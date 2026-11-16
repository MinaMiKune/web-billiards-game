# Physics Measurement and Calibration Protocol

This protocol defines how to collect evidence before changing the simulation's default physical coefficients. It is intentionally measurement-first: do not tune by visual impression alone or describe the engine as physically calibrated without a named reference table and held-out validation.

## 1. Reference setup

Record before collecting shots:

- Table make/model, table length and width, playing-surface dimensions and measured cushion-nose height.
- Cloth type and approximate condition; ball make, diameter and mass; cue and tip details.
- Camera model, lens, frame rate, shutter speed, camera-to-table geometry and calibration target.
- Room temperature and any known slope/level measurements.
- Software commit SHA, browser/runtime, physics configuration and capture tool version.

Measure the playing surface and cushion/pocket geometry in meters. Keep raw measurements, units, uncertainty and calibration images with the dataset.

## 2. Coordinate and observation convention

Use table coordinates matching the engine: X along table length, Z along table width, and Y vertically above the cloth. Define the origin at table center. Mark at least four non-collinear points on the playing surface and a scale reference in the same plane.

Track each ball center frame-by-frame. Convert pixels to meters using a planar homography for cloth-plane motion. For airborne shots, use a calibrated camera model or a second synchronized view; a planar homography alone cannot recover ball height.

Store raw timestamps, detected image coordinates, converted world coordinates, confidence/uncertainty and any manually corrected annotations. Never overwrite raw observations.

## 3. Required shot families

Collect at least 10 repeat trials per family, across multiple initial speeds where practical:

1. **Free roll:** cue ball rolling without spin toward a clear stop; fit rolling deceleration from speed-versus-time.
2. **Sliding to rolling:** apply known follow/draw offsets and track contact-point slip until pure rolling; fit sliding friction and spin coupling.
3. **Side spin:** measure angular marker rotation and lateral trajectory drift; fit side-spin decay and bounded swerve separately.
4. **Ball-ball impact:** equal-ball head-on and glancing impacts at multiple speeds; measure pre/post linear and angular velocities.
5. **Cushion rebound:** perpendicular and oblique impacts on long and short rails; fit normal restitution and tangential friction separately.
6. **Pocket and jaw:** direct captures and controlled near-misses at corner and side pockets; measure capture boundaries and rebound trajectories.
7. **Elevated shots:** record cue elevation, launch speed, apex, flight duration, landing point, bounce height and post-landing speed.
8. **Jump/cushion clearance:** measure ball-center height while crossing the cushion nose; document safe clearance and collisions with the cushion profile.

Do not infer vertical trajectories from a single uncalibrated overhead camera.

## 4. Dataset format

Keep one CSV row per ball per frame, with at least:

`trial_id, family, frame, timestamp_s, ball_number, x_m, y_m, z_m, confidence, x_sigma_m, y_sigma_m, z_sigma_m`

Keep a separate trial metadata file with initial conditions, cue settings, table/ball metadata, camera calibration IDs, operator notes and the exact software/configuration SHA.

Retain failed, ambiguous and excluded trials with an explicit exclusion reason. Split by complete trial—not by individual frames—into fit and held-out validation sets to avoid leakage.

## 5. Fitting and validation

- Fit only parameters identifiable from the corresponding shot family.
- Report parameter estimates, confidence intervals, residual plots and units.
- Compare predicted and observed trajectories at matched timestamps.
- Report position RMSE, velocity error, rebound-angle error, spin-rate error, pocket outcome accuracy and airborne apex/landing error where applicable.
- Compare against a simple baseline and preserve the previous parameter set.
- Validate on held-out trials collected independently from the fit set.
- Run deterministic unit tests and the performance benchmark after every parameter change.

Set acceptance tolerances before inspecting held-out results, based on measurement resolution and intended game behavior. A parameter change is not accepted merely because it improves the fitting trials.

## 6. Release evidence and limitations

A calibration report must include the reference table, measurement procedure, raw-data location, fitted configuration, exact code commit, fitting script/version, held-out metrics and known limitations.

If the required measurements are unavailable, retain the current description: deterministic, game-realistic simulation, not calibrated to a specific physical table. Do not substitute synthetic fixtures or hand-tuned visual examples for measured evidence.
