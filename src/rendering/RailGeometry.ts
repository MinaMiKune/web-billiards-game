export interface RailSegment {
  start: number
  end: number
  center: number
  length: number
}

/**
 * Two open spans per long rail: one between each corner pocket and the
 * side pocket. All values are measured along the table's long axis.
 */
export function getLongRailSegments(
  halfLength: number,
  sideJawOuterX: number,
  cornerPocketClearance: number,
): RailSegment[] {
  const spans = [
    { start: -halfLength + cornerPocketClearance, end: -sideJawOuterX },
    { start: sideJawOuterX, end: halfLength - cornerPocketClearance },
  ]
  return spans
    .filter(({ start, end }) => end > start)
    .map(({ start, end }) => ({
      start,
      end,
      center: (start + end) / 2,
      length: end - start,
    }))
}
