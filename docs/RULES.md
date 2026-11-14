# American 8-Ball — Current Playable Ruleset

This document describes the initial game-oriented rules subset implemented in the browser prototype. It is intentionally explicit about house-rule choices and does not claim full WPA/BCA tournament-rule coverage.

## Players and groups

- Two local players take alternate turns.
- The table begins open after the break.
- The first legally pocketed object ball on an open table assigns the shooter's group: 1–7 are solids; 9–15 are stripes.
- The other player receives the opposite group.
- Pocketed object balls remain down.

## Legal contact and turn flow

- On an open table, the cue ball may contact any numbered object ball except the 8-ball first.
- After groups are assigned, the cue ball must contact a ball in the shooter's group first.
- Once all balls in the shooter's group have been cleared, the 8-ball becomes the legal first contact.
- A player continues when at least one ball from their own group is pocketed without a foul.
- Otherwise, the turn passes to the opponent.

## Fouls and ball in hand

The current rules engine detects:
- cue-ball scratch;
- no object-ball contact;
- wrong first contact;
- no ball reaching a cushion after the first contact when no object ball is pocketed.

A foul passes the turn and grants ball in hand. The player clicks a clear position on the table to place the cue ball. Placement is rejected when it is outside the playing rectangle, too close to a pocket mouth, or overlaps another active ball.

## 8-ball and break house rules

- Pocketing the 8-ball before clearing the shooter's group loses the game.
- Pocketing the 8-ball legally after clearing the shooter's group wins the game.
- Pocketing the 8-ball on the break triggers a full re-rack for the same player.
- Call-shot / called-pocket declarations are not currently required.
- Break-specific cushion-count requirements, safety-shot rules and tournament variants are not currently modeled.

## Scope and future refinement

The rules engine is a pure TypeScript domain module. It consumes completed-shot telemetry and produces a new game state; it does not read the scene or mutate the physics world.

Future work may add selectable rule profiles, called shots, more complete break rules, foul history, match scoring and tournament-specific variants.
