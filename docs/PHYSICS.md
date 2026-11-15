# Billiards Physics Notes

## Goals

The goal is a credible and tunable game simulation. The model is intentionally staged: implement the most influential table physics first, document assumptions and test each behavior independently.

## Units and coordinate frame

- SI units: meters, seconds and kilograms.
- Table plane: X/Z.
- Positive Y: upward.
- Ball center height in the render: one ball radius above the cloth.
- Initial 9-foot table playing surface reference: approximately 2.54 m × 1.27 m.
- Standard pool ball diameter reference: approximately 0.05715 m.
- A solid sphere uses moment of inertia I = 2/5 m r².

These are configurable starting dimensions. Table construction, cushion nose positions and pocket jaw geometry must be measured consistently against the chosen table model.

## Simulation loop

Use a fixed simulation step, initially 1/120 second. Rendering runs independently and interpolates between simulation snapshots. Clamp unusually large frame deltas and cap accumulated catch-up steps to prevent a tab-resume spiral.

## Current motion model

The physics layer stores planar position and velocity plus a 3D angular velocity and presentation rotation. Three.js is not imported by the physics domain.

The cloth-contact slip velocity is computed from the ball's linear velocity and angular velocity at the bottom contact point. Kinetic friction applies a bounded impulse opposite that slip and transfers the corresponding torque to the sphere. Once slip falls below a small threshold, the model switches to rolling resistance and enforces the no-slip rolling relationship.

- Sliding friction coefficient: configurable, initial value 0.20.
- Rolling deceleration: configurable, initial value 0.32 m/s².
- Vertical spin (follow/draw): initialized from the selected cue contact offset.
- Side spin: represented as angular velocity about the vertical axis and gradually dissipated.
- Ball-ball impacts apply a normal impulse plus a Coulomb-limited tangential impulse at the contact point. This allows side spin to transfer into a small throw and angular-velocity change.
- Straight-cushion and angled-jaw impacts use a normal restitution response plus a Coulomb-limited tangential friction impulse; side spin can change the tangential rebound velocity.
- The current contact model is still planar and simplified: it omits cushion height, vertical ball motion, curved/rounded jaw profiles and measured cloth calibration.

This is a game-oriented approximation and is not calibrated to a specific cloth, ball set or table.

## Pocket and cushion model

- Four corner openings use circular capture regions; two side pockets use a configurable half-width.
- A first-pass planar jaw model adds finite angled segments at the corner and side-pocket mouths. Ball-to-segment contacts use the same restitution and tangential-friction response as straight cushions.
- Clean captures are resolved before jaw contacts. Near-misses can be deflected by the angled jaws, with the straight cushion boundary retained as a fallback.
- Captured balls emit a pocket target and a normalized drop-progress value; rendering animates the ball down into the selected mouth and hides it when the animation completes.
- The drop is presentation-only and does not feed back into the authoritative table-plane simulation.
- The jaw segments are an initial, configurable game approximation rather than measured table geometry. Pocket shelves, rounded/curved jaws and calibration of opening width, jaw depth and trajectories against a physical table remain future work.

## State model

A ball state contains stable ID/number/color, radius/mass, planar position and velocity, 3D angular velocity, orientation, previous state for render interpolation, and active/pocketed flags.

## Test fixtures

Maintain deterministic cases for:
- stationary state remains stationary;
- sliding contact velocity is reduced by cloth friction;
- pure rolling remains no-slip under rolling resistance;
- follow and draw spin have opposite rotational signs;
- side spin decays;
- equal-mass head-on collision transfers normal velocity;
- side spin creates a bounded tangential response in ball-ball contact;
- side spin creates a tangential component on cushion rebound;
- straight cushion reflection;
- corner and side pocket captures;
- angled jaw deflections for corner and side-pocket near-misses;
- pocket near-miss rebounds from the straight cushion fallback.

Do not claim professional accuracy without calibration data and measured validation fixtures.
