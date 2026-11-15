# American 8-Ball — Current Playable Ruleset

This document describes the playable game-oriented rules subset. It is intentionally explicit about house-rule choices and does not claim full WPA/BCA tournament-rule coverage.

## Rack arrangement

The opening rack uses a triangular 15-ball layout. The 8-ball occupies the geometric center, and the two rear corner positions contain one solid and one stripe. The remaining balls use a deterministic mixed layout for reproducible breaks.

## Players and groups

- Two local players take alternate turns, or one human may play against the AI.
- The table is open after the break.
- The first qualifying called object ball pocketed on an open table assigns the shooter's group: 1–7 are solids; 9–15 are stripes.
- The opponent receives the opposite group.
- Pocketed object balls remain down.

## Legal contact and turn flow

- On an open table, the cue ball may contact any numbered object ball except the 8-ball first.
- After groups are assigned, the cue ball must contact a ball in the shooter's group first.
- Once all balls in the shooter's group have been cleared, the 8-ball becomes the legal first contact.
- Without call-shot mode, pocketing at least one ball from the shooter's group without a foul keeps the turn.
- With call-shot mode, the selected ball must enter the selected pocket to qualify for group assignment or retain the turn.

## Optional call-shot mode

Call-shot mode is off by default and can be enabled in the game toolbar.

- Before a non-break shot, the human player selects a ball number and one of the six numbered pockets.
- The AI automatically calls the target ball and pocket selected by its shot plan.
- A called shot is made only when physics telemetry confirms that exact ball entered that exact pocket.
- A missed or mismatched call is not itself a foul. Pocketed balls remain down, but the shooter does not earn a group assignment or retain the turn from those balls.
- To win by pocketing the 8-ball, the player must call the 8-ball and the pocket it actually enters.
- The break is exempt from call-shot declarations.

## Fouls and ball in hand

The current rules engine detects:
- cue-ball scratch;
- no object-ball contact;
- wrong first contact;
- no ball reaching a cushion after first contact when no object ball is pocketed.

A foul passes the turn and grants ball in hand. The player clicks a clear position on the table to place the cue ball. A foul during the break restricts placement to behind the head string; other fouls allow placement anywhere in the legal playing area. Placement is rejected outside the playing rectangle, too close to a pocket mouth, or overlapping another active ball.

This implementation currently allows placement anywhere in the legal playing area; behind-the-head-string restrictions are not yet modeled.

## 8-ball and break options

- Pocketing the 8-ball before clearing the shooter's group loses the game.
- Pocketing the 8-ball legally after clearing the shooter's group wins the game.
- **Re-rack (default):** pocketing the 8-ball on the break re-racks for the same player.
- **Breaker wins:** pocketing the 8-ball on the break wins for the breaker; if the cue ball is also pocketed, the opponent wins.
- Call-shot declarations do not apply to the break.
- **Break requirement (optional):** Relaxed (default) accepts a dry break without a rail-count test. Four-rails requires at least four distinct object balls to reach a cushion after first contact when no object ball is pocketed; otherwise it is a foul and the opponent receives ball in hand.

## Scope and future refinement

The rules engine is a pure TypeScript domain module. It consumes completed-shot telemetry and produces a new game state; it does not read the scene or mutate the physics world.

Remaining rule work includes additional break/foul profiles, behind-the-head-string placement, more tournament-specific variants and match/tournament scoring.
