# Billiards Physics Notes

## Goals

The goal is a credible and tunable game simulation. The first model should be stable, explainable and testable. Visual effects must never be used to conceal incorrect ball state.

## Units and coordinate frame

- SI units: meters, seconds and kilograms.
- Table plane: X/Z.
- Positive Y: upward.
- Ball center height in the render: one ball radius above the cloth.
- Initial 9-foot table playing surface reference: approximately 2.54 m × 1.27 m.
- Standard pool ball diameter reference: approximately 0.05715 m.

These are configurable starting dimensions. Table construction, cushion nose positions and pocket jaw geometry must be measured consistently against the chosen table model.

## Simulation loop

Use a fixed simulation step, initially 1/120 second. Rendering runs independently and interpolates between simulation snapshots. Clamp unusually large frame deltas and cap accumulated catch-up steps to prevent a tab-resume spiral.

## State model

A ball state should eventually contain:
- stable ID and type/number;
- planar position and linear velocity;
- angular velocity / spin;
- radius and mass;
- activity and pocket state;
- optional diagnostic contact/sleep state.

Do not embed Three.js Vector3, Mesh or scene references in domain state.

## Motion model increments

### First pass
- Integrate planar position.
- Apply a deterministic friction/deceleration model.
- Clamp tiny residual velocities to zero using named tolerances.

### Collision pass
- Detect ball overlap.
- Resolve penetration with mass-aware positional correction.
- Apply normal impulse only when bodies approach.
- Conserve momentum within the limits of the configured restitution and numerical tolerances.

### Later refinements
- Distinguish sliding and rolling friction.
- Couple translational and angular motion.
- Model ball-ball tangential impulse and throw.
- Model cushion restitution, jaw contacts and spin influence.
- Model pocket capture, pocket shelf/rim collision and drop animation separately from rule events.

Do not claim tournament-grade accuracy without calibration data and measured validation fixtures.

## Test fixtures

Maintain deterministic cases for:
- a stationary ball remains stationary;
- a moving ball decelerates and stops;
- equal-mass head-on collision transfers normal velocity;
- glancing collision changes both balls' directions plausibly;
- overlap correction separates balls without injecting excessive energy;
- cushion reflection reverses the normal component;
- pocket capture occurs only inside the modeled capture region;
- a cue-ball pocket event becomes a scratch event for the rules layer.

Use numeric tolerances and record expected invariants. Avoid brittle pixel-based assertions for physics behavior.

## Diagnostics

Expose optional debug values (velocity, angular velocity, contact normal, collision count and simulation step) behind a development-only toggle. Keep diagnostics out of production HUD unless explicitly enabled.
