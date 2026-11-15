import { describe, expect, it } from 'vitest'
import {
  createInitialEightBallState,
  EightBallRuleEngine,
  type BallGroup,
  type ShotResult,
} from '../src/game/EightBallRuleEngine'

const cleanShot = (overrides: Partial<ShotResult> = {}): ShotResult => ({
  firstContactBallNumber: 1,
  pocketedBallNumbers: [],
  cueBallPocketed: false,
  railContactAfterFirstHit: true,
  ...overrides,
})

describe('EightBallRuleEngine', () => {
  const rules = new EightBallRuleEngine()

  it('starts with an open break and fifteen object balls', () => {
    const state = createInitialEightBallState()
    expect(state.phase).toBe('break')
    expect(state.currentPlayer).toBe(0)
    expect(state.remainingBalls).toHaveLength(15)
  })

  it('keeps the breaker at the table after pocketing an object ball', () => {
    const result = rules.resolveShot(
      createInitialEightBallState(),
      cleanShot({ pocketedBallNumbers: [1] }),
    )
    expect(result.state.phase).toBe('open-table')
    expect(result.state.currentPlayer).toBe(0)
    expect(result.state.remainingBalls).not.toContain(1)
  })

  it('switches turns after a dry break', () => {
    const result = rules.resolveShot(createInitialEightBallState(), cleanShot({
      firstContactBallNumber: 1,
    }))
    expect(result.state.currentPlayer).toBe(1)
    expect(result.state.phase).toBe('open-table')
  })

  it('supports the breaker-wins option when the 8-ball is pocketed on the break', () => {
    const breakRules = new EightBallRuleEngine({ eightBallOnBreak: 'breaker-wins' })
    const result = breakRules.resolveShot(
      createInitialEightBallState(),
      cleanShot({ pocketedBallNumbers: [8] }),
    )
    expect(result.rerack).toBe(false)
    expect(result.state.phase).toBe('game-over')
    expect(result.state.winner).toBe(0)
  })

  it('awards the opponent when the breaker pockets the 8-ball and scratches', () => {
    const breakRules = new EightBallRuleEngine({ eightBallOnBreak: 'breaker-wins' })
    const result = breakRules.resolveShot(
      createInitialEightBallState(),
      cleanShot({ pocketedBallNumbers: [8], cueBallPocketed: true }),
    )
    expect(result.state.phase).toBe('game-over')
    expect(result.state.winner).toBe(1)
    expect(result.foulReasons).toContain('Cue ball pocketed')
  })

  it('re-racks if the 8-ball is pocketed on the break', () => {
    const result = rules.resolveShot(
      createInitialEightBallState(),
      cleanShot({ pocketedBallNumbers: [8] }),
    )
    expect(result.rerack).toBe(true)
    expect(result.state.phase).toBe('break')
    expect(result.state.remainingBalls).toHaveLength(15)
  })

  it('assigns groups after a legal open-table pot', () => {
    const openState = rules.resolveShot(
      createInitialEightBallState(),
      cleanShot({ pocketedBallNumbers: [4] }),
    ).state
    const result = rules.resolveShot(openState, cleanShot({
      firstContactBallNumber: 2,
      pocketedBallNumbers: [2],
    }))
    expect(result.state.playerGroups).toEqual(['solids', 'stripes'])
    expect(result.state.phase).toBe('groups-assigned')
    expect(result.state.currentPlayer).toBe(0)
  })

  it('detects a wrong first contact and grants ball in hand', () => {
    const state = {
      ...createInitialEightBallState(),
      phase: 'groups-assigned' as const,
      playerGroups: ['solids', 'stripes'] as [BallGroup | null, BallGroup | null],
    }
    const result = rules.resolveShot(state, cleanShot({
      firstContactBallNumber: 10,
    }))
    expect(result.foulReasons).toContain('Wrong group contacted first')
    expect(result.state.currentPlayer).toBe(1)
    expect(result.state.ballInHand).toBe(true)
  })

  it('detects a scratch and switches the turn', () => {
    const result = rules.resolveShot(
      createInitialEightBallState(),
      cleanShot({ cueBallPocketed: true }),
    )
    expect(result.foulReasons).toContain('Cue ball pocketed')
    expect(result.state.currentPlayer).toBe(1)
    expect(result.state.ballInHand).toBe(true)
  })

  it('detects no rail after contact when no ball is pocketed', () => {
    const result = rules.resolveShot(
      { ...createInitialEightBallState(), phase: 'open-table' },
      cleanShot({ railContactAfterFirstHit: false }),
    )
    expect(result.foulReasons).toContain('No ball reached a cushion after contact')
    expect(result.state.ballInHand).toBe(true)
  })

  it('awards the game when the player legally pockets the 8-ball after clearing their group', () => {
    const state = {
      ...createInitialEightBallState(),
      phase: 'groups-assigned' as const,
      playerGroups: ['solids', 'stripes'] as [BallGroup | null, BallGroup | null],
      remainingBalls: [8, 9, 10, 11, 12, 13, 14, 15],
    }
    const result = rules.resolveShot(state, cleanShot({
      firstContactBallNumber: 8,
      pocketedBallNumbers: [8],
    }))
    expect(result.state.phase).toBe('game-over')
    expect(result.state.winner).toBe(0)
  })

  it('awards the opponent if the 8-ball is pocketed before the group is cleared', () => {
    const state = {
      ...createInitialEightBallState(),
      phase: 'groups-assigned' as const,
      playerGroups: ['solids', 'stripes'] as [BallGroup | null, BallGroup | null],
      remainingBalls: [3, 8, 9, 10, 11, 12, 13, 14, 15],
    }
    const result = rules.resolveShot(state, cleanShot({
      firstContactBallNumber: 8,
      pocketedBallNumbers: [8],
    }))
    expect(result.state.winner).toBe(1)
    expect(result.state.phase).toBe('game-over')
  })

  it('requires all own group balls to be cleared before an 8-ball win', () => {
    const state = {
      ...createInitialEightBallState(),
      phase: 'groups-assigned' as const,
      playerGroups: ['solids', 'stripes'] as [BallGroup | null, BallGroup | null],
      remainingBalls: [3, 8, 9, 10, 11, 12, 13, 14, 15],
    }
    const result = rules.resolveShot(state, cleanShot({
      firstContactBallNumber: 3,
      pocketedBallNumbers: [3, 8],
    }))
    expect(result.state.winner).toBe(1)
  })

  it('assigns groups only when the called ball reaches the called pocket', () => {
    const callRules = new EightBallRuleEngine({ callShotRequired: true })
    const state = { ...createInitialEightBallState(), phase: 'open-table' as const }
    const missedCall = callRules.resolveShot(state, cleanShot({
      pocketedBallNumbers: [1],
      pocketedBallEvents: [{ ballNumber: 1, pocketIndex: 2 }],
      calledBallNumber: 1,
      calledPocketIndex: 1,
    }))
    expect(missedCall.state.playerGroups).toEqual([null, null])
    expect(missedCall.state.currentPlayer).toBe(1)
    expect(missedCall.state.ballInHand).toBe(false)
    expect(missedCall.state.remainingBalls).not.toContain(1)

    const madeCall = callRules.resolveShot(state, cleanShot({
      pocketedBallNumbers: [1],
      pocketedBallEvents: [{ ballNumber: 1, pocketIndex: 2 }],
      calledBallNumber: 1,
      calledPocketIndex: 2,
    }))
    expect(madeCall.state.playerGroups).toEqual(['solids', 'stripes'])
    expect(madeCall.state.currentPlayer).toBe(0)
  })

  it('requires the 8-ball to be called into the correct pocket to win', () => {
    const callRules = new EightBallRuleEngine({ callShotRequired: true })
    const state = {
      ...createInitialEightBallState(),
      phase: 'groups-assigned' as const,
      playerGroups: ['solids', 'stripes'] as [BallGroup | null, BallGroup | null],
      remainingBalls: [8, 9, 10, 11, 12, 13, 14, 15],
    }
    const wrongPocket = callRules.resolveShot(state, cleanShot({
      firstContactBallNumber: 8,
      pocketedBallNumbers: [8],
      pocketedBallEvents: [{ ballNumber: 8, pocketIndex: 2 }],
      calledBallNumber: 8,
      calledPocketIndex: 1,
    }))
    expect(wrongPocket.state.phase).toBe('game-over')
    expect(wrongPocket.state.winner).toBe(1)

    const correctPocket = callRules.resolveShot(state, cleanShot({
      firstContactBallNumber: 8,
      pocketedBallNumbers: [8],
      pocketedBallEvents: [{ ballNumber: 8, pocketIndex: 2 }],
      calledBallNumber: 8,
      calledPocketIndex: 2,
    }))
    expect(correctPocket.state.phase).toBe('game-over')
    expect(correctPocket.state.winner).toBe(0)
  })

  it('does not mutate the previous game state', () => {
    const state = createInitialEightBallState()
    const before = [...state.remainingBalls]
    rules.resolveShot(state, cleanShot({ pocketedBallNumbers: [1] }))
    expect(state.remainingBalls).toEqual(before)
  })

  it('does nothing after the game is over', () => {
    const state = {
      ...createInitialEightBallState(),
      phase: 'game-over' as const,
      winner: 0 as const,
    }
    const result = rules.resolveShot(state, cleanShot())
    expect(result.state).toBe(state)
  })

  it('releases ball-in-hand state after the cue ball is placed', () => {
    const state = { ...createInitialEightBallState(), ballInHand: true }
    const placed = rules.placeBallInHand(state)
    expect(placed.ballInHand).toBe(false)
  })
})
