/**
 * Unified billiards table geometry spec.
 *
 * Single source of truth for the dimensions shared by the physics engine and
 * the Three.js rendering model. Both sides import from here so the visible
 * table and the simulated table can never drift apart again.
 *
 * All measurements are in meters, table centered on the origin, playing
 * surface in the x/z plane. The cloth boundary line is at x = ±tableLength/2,
 * z = ±tableWidth/2; ball centers are limited to that line minus the ball
 * radius.
 *
 * Pocket openings follow the WPBA/BCA equipment specification used for a
 * 9 ft American pool table:
 *   - corner pocket mouth: 4.5 in = 0.1143 m (diameter) -> 0.05715 m radius
 *   - side pocket mouth:   5.0 in = 0.1270 m (diameter) -> 0.0635 m radius
 * and every pocket mouth is a circle centered exactly on the table boundary
 * line (corner pockets centered on the corner point, side pockets centered on
 * the side boundary midpoint).
 */

export const CORNER_POCKET_MOUTH_RADIUS = 0.05715;
export const SIDE_POCKET_MOUTH_RADIUS = 0.0635;
export const CORNER_POCKET_MOUTH_WIDTH = CORNER_POCKET_MOUTH_RADIUS * 2;
export const SIDE_POCKET_MOUTH_WIDTH = SIDE_POCKET_MOUTH_RADIUS * 2;

/**
 * Depth of the rubber jaw facing along the rail line, measured from the
 * cushion end toward the pocket tip. Jaws start this far from the pocket
 * center measured along the rail (i.e. from mouth radius + jaw depth) and
 * taper to the pocket tip.
 */
export const POCKET_JAW_DEPTH = 0.045;

/**
 * Capture radius equals the visible mouth radius exactly: a ball is pocketed
 * precisely when its center crosses the boundary line inside the circle of
 * the visible hole. Balls outside that circle always meet a visible rubber
 * surface (cushion nose or jaw face), so nothing ever vanishes over solid
 * cloth and nothing bounces off empty space.
 */
export const CORNER_POCKET_CAPTURE_RADIUS = CORNER_POCKET_MOUTH_RADIUS;
export const SIDE_POCKET_CAPTURE_HALF_WIDTH = SIDE_POCKET_MOUTH_RADIUS;

/** Offset of the jaw tip from the pocket center, along each table axis. */
export const CORNER_POCKET_JAW_TIP_OFFSET =
  CORNER_POCKET_MOUTH_RADIUS * Math.SQRT1_2;
export const SIDE_POCKET_JAW_TIP_OFFSET = SIDE_POCKET_MOUTH_RADIUS * Math.SQRT1_2;

/** Distance from the pocket center to the jaw start along the rail line. */
export const CORNER_JAW_START_OFFSET =
  CORNER_POCKET_MOUTH_RADIUS + POCKET_JAW_DEPTH;
export const SIDE_JAW_START_OFFSET = SIDE_POCKET_MOUTH_RADIUS + POCKET_JAW_DEPTH;

export interface TablePoint {
  x: number;
  z: number;
}

export interface JawSegment {
  start: TablePoint;
  end: TablePoint;
}

const sign = (value: number): number => (value < 0 ? -1 : 1);

/**
 * Corner pocket jaw segments for the pocket at (xSign * halfLength,
 * zSign * halfWidth). One segment per rail meeting at that corner. The jaw
 * runs along the rail line from (halfLength - jawStartOffset) to the jaw tip,
 * whose x/z offsets from the corner are the mouth radius projected at 45°.
 */
export function getCornerJawSegments(
  halfLength: number,
  halfWidth: number,
  xSign: number,
  zSign: number,
): JawSegment[] {
  const sx = sign(xSign);
  const sz = sign(zSign);
  const railX = sx * halfLength;
  const railZ = sz * halfWidth;
  const startX = sx * (halfLength - CORNER_JAW_START_OFFSET);
  const startZ = sz * (halfWidth - CORNER_JAW_START_OFFSET);
  const tipX = sx * (halfLength - CORNER_POCKET_JAW_TIP_OFFSET);
  const tipZ = sz * (halfWidth - CORNER_POCKET_JAW_TIP_OFFSET);
  return [
    { start: { x: startX, z: railZ }, end: { x: tipX, z: tipZ } },
    { start: { x: railX, z: startZ }, end: { x: tipX, z: tipZ } },
  ];
}

/**
 * Side pocket jaw segments for the pocket at (0, zSign * halfWidth). The jaws
 * run along the side rail from ±(mouth + jaw depth) and taper inward to the
 * pocket tip.
 */
export function getSideJawSegments(
  halfWidth: number,
  zSign: number,
): JawSegment[] {
  const sz = sign(zSign);
  const railZ = sz * halfWidth;
  const tipX = SIDE_POCKET_JAW_TIP_OFFSET;
  const tipZ = sz * (halfWidth - SIDE_POCKET_JAW_TIP_OFFSET);
  const startX = SIDE_JAW_START_OFFSET;
  return [
    { start: { x: -startX, z: railZ }, end: { x: -tipX, z: tipZ } },
    { start: { x: startX, z: railZ }, end: { x: tipX, z: tipZ } },
  ];
}

/**
 * Foot spot: where the rack apex ball sits. Physics racks the triangle from
 * this x position; the cloth marking is drawn at the same coordinate.
 */
export const FOOT_SPOT_X = 0.48

/** All six pocket centers for a table with the given half dimensions. */
export function getPocketCenters(halfLength: number, halfWidth: number): TablePoint[] {
  return [
    { x: -halfLength, z: -halfWidth },
    { x: 0, z: -halfWidth },
    { x: halfLength, z: -halfWidth },
    { x: -halfLength, z: halfWidth },
    { x: 0, z: halfWidth },
    { x: halfLength, z: halfWidth },
  ];
}
