import { PhysicsWorld, type BallSpin, type BallState, type Vec2 } from '../physics/PhysicsWorld'
import type { EightBallState, BallGroup } from '../game/EightBallRuleEngine'

export type AIDifficulty = 1 | 2 | 3 | 4 | 5

export interface ShotCommand {
  direction: Vec2
  power: number
  spin: BallSpin
}

export interface AIShotPlan {
  command: ShotCommand
  targetBallNumber: number
  pocketIndex: number
  score: number
  style: 'pot' | 'safety'
  routeType: 'direct' | 'bank' | 'kick'
  difficulty: AIDifficulty
  consideredCandidates: number
}

interface DifficultyProfile {
  candidateBudget: number
  aimErrorRadians: number
  powerError: number
  simulationSteps: number
}

interface Candidate {
  targetBallNumber: number
  pocketIndex: number
  direction: Vec2
  power: number
  routeLength: number
  routeType: 'direct' | 'bank' | 'kick'
}

const FIXED_STEP = 1 / 120
const POCKET_COUNT = 6
const PROFILES: Record<AIDifficulty, DifficultyProfile> = {
  1: { candidateBudget: 4, aimErrorRadians: 0.095, powerError: 0.22, simulationSteps: 300 },
  2: { candidateBudget: 8, aimErrorRadians: 0.06, powerError: 0.14, simulationSteps: 360 },
  3: { candidateBudget: 14, aimErrorRadians: 0.032, powerError: 0.08, simulationSteps: 420 },
  4: { candidateBudget: 22, aimErrorRadians: 0.014, powerError: 0.04, simulationSteps: 480 },
  5: { candidateBudget: 30, aimErrorRadians: 0.004, powerError: 0.015, simulationSteps: 540 },
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(b.x - a.x, b.z - a.z)
}

function normalized(vector: Vec2): Vec2 {
  const length = Math.hypot(vector.x, vector.z)
  return length <= 1e-9 ? { x: 0, z: 0 } : { x: vector.x / length, z: vector.z / length }
}

function rotate(vector: Vec2, angle: number): Vec2 {
  const cosine = Math.cos(angle)
  const sine = Math.sin(angle)
  return {
    x: vector.x * cosine - vector.z * sine,
    z: vector.x * sine + vector.z * cosine,
  }
}

function deterministicNoise(a: number, b: number, difficulty: number): number {
  const value = Math.sin(a * 127.1 + b * 311.7 + difficulty * 74.7) * 43758.5453
  return (value - Math.floor(value)) * 2 - 1
}

function distanceToSegment(point: Vec2, start: Vec2, end: Vec2): number {
  const dx = end.x - start.x
  const dz = end.z - start.z
  const lengthSquared = dx * dx + dz * dz
  if (lengthSquared <= 1e-12) return distance(point, start)
  const projection = clamp(
    ((point.x - start.x) * dx + (point.z - start.z) * dz) / lengthSquared,
    0,
    1,
  )
  return Math.hypot(
    point.x - (start.x + projection * dx),
    point.z - (start.z + projection * dz),
  )
}

function segmentClear(
  balls: BallState[],
  start: Vec2,
  end: Vec2,
  ignoredIds: Set<string>,
): boolean {
  return balls.every((ball) => {
    if (!ball.active || ignoredIds.has(ball.id)) return true
    return distanceToSegment(ball.position, start, end) > ball.radius + 0.004
  })
}

function isGroupBall(number: number, group: BallGroup): boolean {
  return group === 'solids'
    ? number >= 1 && number <= 7
    : number >= 9 && number <= 15
}

function getEligibleTargets(world: PhysicsWorld, state: EightBallState): BallState[] {
  const group = state.playerGroups[state.currentPlayer]
  let numbers: number[]
  if (group) {
    const remaining = state.remainingBalls.filter((number) => isGroupBall(number, group))
    numbers = remaining.length > 0 ? remaining : [8]
  } else {
    numbers = state.remainingBalls.filter((number) => number !== 8)
  }
  return world.balls.filter((ball) =>
    ball.active && ball.number !== 0 && numbers.includes(ball.number),
  )
}

function getPockets(world: PhysicsWorld): Vec2[] {
  const x = world.config.tableLength / 2
  const z = world.config.tableWidth / 2
  return [
    { x: -x, z: -z }, { x: 0, z: -z }, { x, z: -z },
    { x: -x, z }, { x: 0, z }, { x, z },
  ]
}

export class AIController {
  planShot(
    world: PhysicsWorld,
    gameState: EightBallState,
    difficulty: AIDifficulty,
  ): AIShotPlan | null {
    if (gameState.phase === 'game-over' || world.isMoving || !world.cueBall.active) return null

    const targets = getEligibleTargets(world, gameState)
    if (targets.length === 0) return null

    const cue = world.cueBall
    const pockets = getPockets(world)
    const candidates: Candidate[] = []

    for (const target of targets) {
      for (let pocketIndex = 0; pocketIndex < pockets.length; pocketIndex += 1) {
        const pocket = pockets[pocketIndex]
        const objectDirection = normalized({
          x: pocket.x - target.position.x,
          z: pocket.z - target.position.z,
        })
        if (objectDirection.x === 0 && objectDirection.z === 0) continue

        const ghost = {
          x: target.position.x - objectDirection.x * (cue.radius + target.radius),
          z: target.position.z - objectDirection.z * (cue.radius + target.radius),
        }
        const cueDistance = distance(cue.position, ghost)
        const objectDistance = distance(target.position, pocket)
        if (cueDistance < 0.04 || objectDistance < 0.04) continue

        const ignoredCueAndTarget = new Set([cue.id, target.id])
        const cuePathClear = segmentClear(world.balls, cue.position, ghost, ignoredCueAndTarget)
        if (!segmentClear(world.balls, target.position, pocket, ignoredCueAndTarget)) continue

        if (cuePathClear) {
          const routeLength = cueDistance + objectDistance
          const desiredSpeed = Math.sqrt(
            2 * world.config.rollingDeceleration * routeLength,
          ) * 1.28
          const power = clamp(desiredSpeed / world.config.maxShotSpeed, 0.16, 0.92)

          candidates.push({
            targetBallNumber: target.number,
            pocketIndex,
            direction: normalized({
              x: ghost.x - cue.position.x,
              z: ghost.z - cue.position.z,
            }),
            power,
            routeLength,
            routeType: 'direct',
          })
        } else {
          // A kick shot mirrors the desired cue-ball contact point across a
          // cushion, so a banked cue-ball path can reach the same ghost ball.
          const halfLength = world.config.tableLength / 2
          const halfWidth = world.config.tableWidth / 2
          const cushionLines: { axis: 'x' | 'z'; value: number }[] = [
            { axis: 'x', value: -halfLength + cue.radius },
            { axis: 'x', value: halfLength - cue.radius },
            { axis: 'z', value: -halfWidth + cue.radius },
            { axis: 'z', value: halfWidth - cue.radius },
          ]
          for (const rail of cushionLines) {
            const reflectedGhost = rail.axis === 'x'
              ? { x: 2 * rail.value - ghost.x, z: ghost.z }
              : { x: ghost.x, z: 2 * rail.value - ghost.z }
            const kickDistance = distance(cue.position, reflectedGhost)
            if (kickDistance < 0.04) continue
            if (!segmentClear(world.balls, cue.position, reflectedGhost, ignoredCueAndTarget)) continue
            const kickRouteLength = kickDistance + objectDistance
            const kickSpeed = Math.sqrt(
              2 * world.config.rollingDeceleration * kickRouteLength,
            ) * 1.42
            candidates.push({
              targetBallNumber: target.number,
              pocketIndex,
              direction: normalized({
                x: reflectedGhost.x - cue.position.x,
                z: reflectedGhost.z - cue.position.z,
              }),
              power: clamp(kickSpeed / world.config.maxShotSpeed, 0.2, 0.98),
              routeLength: kickRouteLength,
              routeType: 'kick',
            })
          }
        }
        
        // Bank-shot candidates are generated by reflecting the pocket across
        // each non-adjacent cushion. The real physics simulation below decides
        // whether the rebound actually reaches the pocket.
        const halfLength = world.config.tableLength / 2
        const halfWidth = world.config.tableWidth / 2
        const railOffset = target.radius
        const reflectedPockets = [
          { x: -2 * (halfLength - railOffset) - pocket.x, z: pocket.z },
          { x: 2 * (halfLength - railOffset) - pocket.x, z: pocket.z },
          { x: pocket.x, z: -2 * (halfWidth - railOffset) - pocket.z },
          { x: pocket.x, z: 2 * (halfWidth - railOffset) - pocket.z },
        ]
        const onLeftRail = Math.abs(pocket.x + halfLength) < 1e-6
        const onRightRail = Math.abs(pocket.x - halfLength) < 1e-6
        const onTopRail = Math.abs(pocket.z + halfWidth) < 1e-6
        const onBottomRail = Math.abs(pocket.z - halfWidth) < 1e-6
        const canBankOffRail = [!onLeftRail, !onRightRail, !onTopRail, !onBottomRail]

        for (let railIndex = 0; railIndex < reflectedPockets.length; railIndex += 1) {
          if (!canBankOffRail[railIndex]) continue
          const reflectedPocket = reflectedPockets[railIndex]
          const bankDirection = normalized({
            x: reflectedPocket.x - target.position.x,
            z: reflectedPocket.z - target.position.z,
          })
          if (bankDirection.x === 0 && bankDirection.z === 0) continue
          const bankGhost = {
            x: target.position.x - bankDirection.x * (cue.radius + target.radius),
            z: target.position.z - bankDirection.z * (cue.radius + target.radius),
          }
          const bankCueDistance = distance(cue.position, bankGhost)
          const bankObjectDistance = distance(target.position, reflectedPocket)
          if (bankCueDistance < 0.04 || bankObjectDistance < 0.04) continue
          if (!segmentClear(world.balls, cue.position, bankGhost, new Set([cue.id, target.id]))) continue
          if (!segmentClear(world.balls, target.position, reflectedPocket, new Set([cue.id, target.id]))) continue

          const bankRouteLength = bankCueDistance + bankObjectDistance
          const bankDesiredSpeed = Math.sqrt(
            2 * world.config.rollingDeceleration * bankRouteLength,
          ) * 1.38
          candidates.push({
            targetBallNumber: target.number,
            pocketIndex,
            direction: normalized({
              x: bankGhost.x - cue.position.x,
              z: bankGhost.z - cue.position.z,
            }),
            power: clamp(bankDesiredSpeed / world.config.maxShotSpeed, 0.18, 0.96),
            routeLength: bankRouteLength,
            routeType: 'bank',
          })
        }
      }
    }

    candidates.sort((a, b) => (a.routeLength + (a.routeType === 'bank' ? 0.12 : a.routeType === 'kick' ? 0.24 : 0)) - (b.routeLength + (b.routeType === 'bank' ? 0.12 : b.routeType === 'kick' ? 0.24 : 0)))
    const profile = PROFILES[difficulty]
    const selected = candidates.slice(0, profile.candidateBudget)
    let best: AIShotPlan | null = null

    for (const candidate of selected) {
      const angleNoise = deterministicNoise(
        candidate.targetBallNumber,
        candidate.pocketIndex + 1,
        difficulty,
      )
      const powerNoise = deterministicNoise(
        candidate.targetBallNumber + 17,
        candidate.pocketIndex + 3,
        difficulty,
      )
      const direction = normalized(rotate(
        candidate.direction,
        angleNoise * profile.aimErrorRadians,
      ))
      const power = clamp(
        candidate.power * (1 + powerNoise * profile.powerError),
        0.12,
        0.98,
      )

      const simulation = world.clone()
      if (!simulation.shootCueBall(direction, power)) continue

      for (let step = 0; step < profile.simulationSteps; step += 1) {
        simulation.step(FIXED_STEP)
        if (step > 12 && !simulation.isMoving) break
      }

      const telemetry = simulation.getShotTelemetry()
      const targetAfter = simulation.balls.find(
        (ball) => ball.number === candidate.targetBallNumber,
      )
      const targetPocketed = targetAfter?.pocketed ?? false
      const pocketed = telemetry.pocketedBallNumbers
      const ownGroup = gameState.playerGroups[gameState.currentPlayer]
      const otherGroup = gameState.playerGroups[gameState.currentPlayer === 0 ? 1 : 0]
      const ownPots = pocketed.filter((number) =>
        ownGroup ? isGroupBall(number, ownGroup) : number !== 8,
      ).length
      const opponentPots = otherGroup
        ? pocketed.filter((number) => isGroupBall(number, otherGroup)).length
        : 0

      let score = targetPocketed ? 1200 : -160
      score += Math.max(0, ownPots - (targetPocketed ? 1 : 0)) * 95
      score -= opponentPots * 260
      if (telemetry.firstContactBallNumber !== candidate.targetBallNumber) score -= 650
      if (telemetry.cueBallPocketed) score -= 2400
      if (!targetPocketed && !telemetry.railContactAfterFirstHit) score -= 220

      if (simulation.cueBall.active) {
        const opponentBalls = simulation.balls.filter((ball) =>
          ball.active && ball.number !== 0 &&
          (otherGroup ? isGroupBall(ball.number, otherGroup) : ball.number !== 8),
        )
        if (opponentBalls.length > 0) {
          const nearest = Math.min(
            ...opponentBalls.map((ball) => distance(simulation.cueBall.position, ball.position)),
          )
          const opponentHasOpenShot = opponentBalls.some((ball) =>
            segmentClear(
              simulation.balls,
              simulation.cueBall.position,
              ball.position,
              new Set([simulation.cueBall.id, ball.id]),
            ),
          )
          // Prefer cue-ball positions that leave the opponent both farther away
          // and without an immediate unobstructed reply.
          score += clamp(nearest, 0, 1.2) * 34
          if (!opponentHasOpenShot) score += 72
        }
      }
      score -= candidate.routeLength * 2.5
      if (targetPocketed) score += 100

      if (!best || score > best.score) {
        best = {
          command: { direction, power, spin: { side: 0, vertical: 0.06 } },
          targetBallNumber: candidate.targetBallNumber,
          pocketIndex: candidate.pocketIndex,
          score,
          style: targetPocketed ? 'pot' : 'safety',
          routeType: candidate.routeType,
          difficulty,
          consideredCandidates: selected.length,
        }
      }
    }

    return best ?? this.createFallbackPlan(world, targets, difficulty)
  }

  chooseBallInHandPlacement(world: PhysicsWorld, state: EightBallState): Vec2 | null {
    if (state.phase === 'game-over' || world.isMoving) return null
    const targets = getEligibleTargets(world, state)
    if (targets.length === 0) return null

    // Scale the search grid to the configured playing surface instead of assuming
    // one fixed table size. PhysicsWorld.placeCueBall remains the legality authority.
    const xLimit = world.config.tableLength / 2 - world.cueBall.radius
    const zLimit = world.config.tableWidth / 2 - world.cueBall.radius
    const xCandidates = [-0.82, -0.64, -0.46, -0.28, -0.1, 0.08, 0.26, 0.44, 0.62, 0.8]
      .map((fraction) => fraction * xLimit)
    const zCandidates = [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75]
      .map((fraction) => fraction * zLimit)
    let bestPosition: Vec2 | null = null
    let bestScore = Number.NEGATIVE_INFINITY

    for (const x of xCandidates) {
      for (const z of zCandidates) {
        const position = { x, z }
        const simulation = world.clone()
        if (!simulation.placeCueBall(position)) continue
        const cue = simulation.cueBall
        let visibleTargets = 0
        let nearestDistance = Number.POSITIVE_INFINITY

        for (const target of targets) {
          nearestDistance = Math.min(nearestDistance, distance(cue.position, target.position))
          if (segmentClear(
            simulation.balls,
            cue.position,
            target.position,
            new Set([cue.id, target.id]),
          )) visibleTargets += 1
        }

        const score = visibleTargets * 20 - nearestDistance
        if (score > bestScore) {
          bestScore = score
          bestPosition = position
        }
      }
    }
    return bestPosition
  }

  private createFallbackPlan(
    world: PhysicsWorld,
    targets: BallState[],
    difficulty: AIDifficulty,
  ): AIShotPlan | null {
    const cue = world.cueBall
    const target = [...targets].sort(
      (a, b) => distance(cue.position, a.position) - distance(cue.position, b.position),
    )[0]
    if (!target) return null

    const direction = normalized({
      x: target.position.x - cue.position.x,
      z: target.position.z - cue.position.z,
    })
    if (direction.x === 0 && direction.z === 0) return null

    return {
      command: { direction, power: 0.28, spin: { side: 0, vertical: 0 } },
      targetBallNumber: target.number,
      pocketIndex: 0,
      score: -1000,
      style: 'safety',
      routeType: 'direct',
      difficulty,
      consideredCandidates: 0,
    }
  }
}
