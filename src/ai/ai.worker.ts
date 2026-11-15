import { AIController, type AIDifficulty, type AIShotPlan } from './AIController'
import type { EightBallState } from '../game/EightBallRuleEngine'
import { PhysicsWorld, type BallState, type PhysicsConfig } from '../physics/PhysicsWorld'

interface AIWorkerRequest {
  requestId: number
  config: PhysicsConfig
  balls: BallState[]
  gameState: EightBallState
  difficulty: AIDifficulty
}

interface AIWorkerResponse {
  requestId: number
  plan: AIShotPlan | null
}

const workerScope = self as unknown as {
  addEventListener(
    type: 'message',
    listener: (event: MessageEvent<AIWorkerRequest>) => void,
  ): void
  postMessage(message: AIWorkerResponse): void
}

workerScope.addEventListener('message', (event) => {
  const { requestId, config, balls, gameState, difficulty } = event.data
  const world = new PhysicsWorld(config)
  world.balls = balls
  const plan = new AIController().planShot(world, gameState, difficulty)
  workerScope.postMessage({ requestId, plan })
})
