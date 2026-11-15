export type PlayerId = 0 | 1
export type BallGroup = 'solids' | 'stripes'
export type EightBallPhase = 'break' | 'open-table' | 'groups-assigned' | 'game-over'
export type BallInHandZone = 'anywhere' | 'behind-head-string'

export interface EightBallState {
  phase: EightBallPhase
  currentPlayer: PlayerId
  playerGroups: [BallGroup | null, BallGroup | null]
  remainingBalls: number[]
  ballInHand: boolean
  ballInHandZone: BallInHandZone
  winner: PlayerId | null
  lastMessage: string
}

export interface PocketedBallEvent {
  ballNumber: number
  pocketIndex: number
}

export type EightBallOnBreakRule = 'rerack' | 'breaker-wins'
export type BreakRequirement = 'relaxed' | 'four-rails'

export interface EightBallRulesOptions {
  callShotRequired: boolean
  eightBallOnBreak: EightBallOnBreakRule
  breakRequirement: BreakRequirement
}

export interface ShotResult {
  firstContactBallNumber: number | null
  pocketedBallNumbers: number[]
  pocketedBallEvents?: PocketedBallEvent[]
  railContactBallNumbersAfterFirstHit?: number[]
  calledBallNumber?: number | null
  calledPocketIndex?: number | null
  cueBallPocketed: boolean
  railContactAfterFirstHit: boolean
}

export interface ShotResolution {
  state: EightBallState
  foulReasons: string[]
  rerack: boolean
}

export function createInitialEightBallState(currentPlayer: PlayerId = 0): EightBallState {
  return {
    phase: 'break',
    currentPlayer,
    playerGroups: [null, null],
    remainingBalls: Array.from({ length: 15 }, (_, index) => index + 1),
    ballInHand: false,
    ballInHandZone: 'anywhere',
    winner: null,
    lastMessage: `Player ${currentPlayer + 1} breaks`,
  }
}

function isGroupBall(number: number, group: BallGroup): boolean {
  return group === 'solids'
    ? number >= 1 && number <= 7
    : number >= 9 && number <= 15
}

function oppositePlayer(player: PlayerId): PlayerId {
  return player === 0 ? 1 : 0
}

function uniquePocketedBalls(numbers: number[]): number[] {
  return [...new Set(numbers.filter((number) => Number.isInteger(number) && number >= 1 && number <= 15))]
}

function removePocketedBalls(remaining: number[], pocketed: number[]): number[] {
  const removed = new Set(pocketed)
  return remaining.filter((number) => !removed.has(number))
}

export class EightBallRuleEngine {
  private options: EightBallRulesOptions

  constructor(options: Partial<EightBallRulesOptions> = {}) {
    this.options = { callShotRequired: false, eightBallOnBreak: 'rerack', breakRequirement: 'relaxed', ...options }
  }

  setOptions(options: Partial<EightBallRulesOptions>): void {
    this.options = { ...this.options, ...options }
  }

  resolveShot(state: EightBallState, shot: ShotResult): ShotResolution {
    if (state.phase === 'game-over') {
      return { state, foulReasons: [], rerack: false }
    }

    const pocketed = uniquePocketedBalls(shot.pocketedBallNumbers)
    const eightPocketed = pocketed.includes(8)
    const objectBallsPocketed = pocketed.filter((number) => number !== 8)
    const callShotApplies = this.options.callShotRequired && state.phase !== 'break'
    const calledShotMade = !callShotApplies || (
      shot.calledBallNumber !== null &&
      shot.calledBallNumber !== undefined &&
      shot.calledPocketIndex !== null &&
      shot.calledPocketIndex !== undefined &&
      (shot.pocketedBallEvents ?? []).some((event) =>
        event.ballNumber === shot.calledBallNumber &&
        event.pocketIndex === shot.calledPocketIndex,
      )
    )
    const scoringObjectBallsPocketed = callShotApplies
      ? calledShotMade && shot.calledBallNumber !== null && shot.calledBallNumber !== undefined
        ? objectBallsPocketed.filter((number) => number === shot.calledBallNumber)
        : []
      : objectBallsPocketed
    const player = state.currentPlayer

    if (state.phase === 'break' && eightPocketed) {
      if (this.options.eightBallOnBreak === 'breaker-wins') {
        const winner = shot.cueBallPocketed ? oppositePlayer(player) : player
        const foulReasons = shot.cueBallPocketed ? ['Cue ball pocketed'] : []
        const nextState: EightBallState = {
          ...state,
          phase: 'game-over',
          currentPlayer: player,
          remainingBalls: removePocketedBalls(state.remainingBalls, pocketed),
          ballInHand: false,
          ballInHandZone: 'anywhere',
          winner,
          lastMessage: shot.cueBallPocketed
            ? `Player ${winner + 1} wins · foul on the 8-ball`
            : `Player ${winner + 1} wins · 8-ball on the break`,
        }
        return { state: nextState, foulReasons, rerack: false }
      }

      const rerackState = createInitialEightBallState(player)
      rerackState.lastMessage = '8-ball on the break · re-rack'
      return { state: rerackState, foulReasons: [], rerack: true }
    }

    const ownGroup = state.playerGroups[player]
    const ownBallsBeforeShot = ownGroup
      ? state.remainingBalls.filter((number) => isGroupBall(number, ownGroup))
      : []

    const foulReasons: string[] = []
    if (
      state.phase === 'break' &&
      this.options.breakRequirement === 'four-rails' &&
      objectBallsPocketed.length === 0 &&
      (shot.railContactBallNumbersAfterFirstHit ?? []).length < 4
    ) {
      foulReasons.push('Illegal break — fewer than four object balls reached a cushion')
    }
    if (shot.cueBallPocketed) foulReasons.push('Cue ball pocketed')
    if (shot.firstContactBallNumber === null) {
      foulReasons.push('No object ball contacted')
    } else if (shot.firstContactBallNumber === 8) {
      if (!ownGroup || ownBallsBeforeShot.length > 0) {
        foulReasons.push('8-ball contacted before the group was cleared')
      }
    } else if (ownGroup && !isGroupBall(shot.firstContactBallNumber, ownGroup)) {
      foulReasons.push('Wrong group contacted first')
    }

    if (
      state.phase !== 'break' &&
      shot.firstContactBallNumber !== null &&
      !shot.railContactAfterFirstHit &&
      pocketed.length === 0
    ) {
      foulReasons.push('No ball reached a cushion after contact')
    }

    const remainingAfterShot = removePocketedBalls(state.remainingBalls, pocketed)

    if (eightPocketed) {
      const legalEight =
        state.phase !== 'break' &&
        ownGroup !== null &&
        ownBallsBeforeShot.length === 0 &&
        shot.firstContactBallNumber === 8 &&
        (!callShotApplies || (calledShotMade && shot.calledBallNumber === 8)) &&
        foulReasons.length === 0

      const winner = legalEight ? player : oppositePlayer(player)
      const nextState: EightBallState = {
        ...state,
        phase: 'game-over',
        currentPlayer: player,
        remainingBalls: remainingAfterShot,
        ballInHand: false,
        winner,
        lastMessage: legalEight
          ? `Player ${winner + 1} wins · 8-ball`
          : `Player ${winner + 1} wins · foul on the 8-ball`,
      }
      return { state: nextState, foulReasons, rerack: false }
    }

    const nextGroups: [BallGroup | null, BallGroup | null] = [state.playerGroups[0], state.playerGroups[1]]
    let assignedGroup: BallGroup | null = null

    if (state.phase === 'open-table' && ownGroup === null && foulReasons.length === 0) {
      const firstGroupBall = scoringObjectBallsPocketed.find((number) => number !== 8)
      if (firstGroupBall !== undefined) {
        assignedGroup = firstGroupBall <= 7 ? 'solids' : 'stripes'
        nextGroups[player] = assignedGroup
        nextGroups[oppositePlayer(player)] = assignedGroup === 'solids' ? 'stripes' : 'solids'
      }
    }

    const effectiveGroup = ownGroup ?? assignedGroup
    const ownBallPocketed = effectiveGroup !== null &&
      scoringObjectBallsPocketed.some((number) => isGroupBall(number, effectiveGroup))
    // On the break groups are not assigned, but pocketing an object ball keeps
    // the breaker at the table for the next shot.
    const keepsTurn = state.phase === 'break'
      ? objectBallsPocketed.length > 0
      : ownBallPocketed

    const isFoul = foulReasons.length > 0
    const nextPlayer = isFoul || !keepsTurn ? oppositePlayer(player) : player
    const nextPhase: EightBallPhase = nextGroups[0] && nextGroups[1]
      ? 'groups-assigned'
      : 'open-table'

    let message: string
    if (isFoul) {
      message = `Foul · ${foulReasons.join(' · ')} · Player ${nextPlayer + 1} ball in hand`
    } else if (assignedGroup) {
      message = `Groups set · Player ${player + 1}: ${assignedGroup}`
    } else if (ownBallPocketed) {
      message = `Player ${player + 1} continues`
    } else {
      message = `Player ${nextPlayer + 1} to play`
    }

    const nextState: EightBallState = {
      ...state,
      phase: nextPhase,
      currentPlayer: nextPlayer,
      playerGroups: nextGroups,
      remainingBalls: remainingAfterShot,
      ballInHand: isFoul,
      ballInHandZone: isFoul && state.phase === 'break' ? 'behind-head-string' : 'anywhere',
      winner: null,
      lastMessage: message,
    }
    return { state: nextState, foulReasons, rerack: false }
  }

  placeBallInHand(state: EightBallState): EightBallState {
    if (!state.ballInHand || state.phase === 'game-over') return state
    return {
      ...state,
      ballInHand: false,
      ballInHandZone: 'anywhere',
      lastMessage: `Player ${state.currentPlayer + 1} · ball placed`,
    }
  }
}
