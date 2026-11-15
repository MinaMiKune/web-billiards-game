# Game-First Product Redesign

## Product decision

Web Billiards is a playable browser game first, not a physics simulator or a developer-facing playground. Physics fidelity remains a core differentiator, but it must stay behind an approachable game loop.

## Player promise

Open the page, understand the objective, and take a shot within seconds. The table is the visual focus; the player should never need to understand physics terminology to play a normal match.

## Experience priorities

1. **Play immediately** — default to a ready-to-play 8-ball match, with a clear primary action and no setup wizard.
2. **Teach by doing** — show a short, persistent control hint: drag backward from the cue ball to aim and release to shoot. Provide visible aim, power and spin feedback.
3. **Keep the table central** — allocate the largest visual area to the table; keep score, turn and ball-group state readable without competing with play.
4. **Progressive disclosure** — advanced rules, call-shot options, AI difficulty and camera controls remain available but should not dominate the first screen.
5. **Game feel** — prioritize readable shot previews, clear active-player state, pocket feedback, turn transitions, and satisfying audiovisual response.
6. **Responsive touch-first input** — support pointer and touch with generous targets, prevent accidental page scrolling during table interaction, and provide a simple power/aim workflow.
7. **Modes before simulation settings** — make local two-player and versus-AI understandable game modes; physics tuning and diagnostic information stay out of the player-facing flow.

## Main screen information architecture

- Header: game identity, language and lightweight navigation.
- Match strip: active player, opponent, group and remaining balls.
- Playfield: large interactive table with concise contextual instruction.
- Shot controls: prominent power control and cue-ball spin selector.
- Secondary controls: camera presets, sound and new rack.
- Advanced rules: collapsible settings, closed by default.

## Interaction contract

- A player can identify whose turn it is and what to do next without reading documentation.
- Aim direction and strength are visually distinguishable before shooting.
- The primary shot action is reachable on desktop and mobile without hunting through settings.
- Ball-in-hand mode replaces shot guidance with a clear placement instruction.
- During ball motion, conflicting rule controls are unavailable and the game clearly communicates that the shot is resolving.
- The game remains playable with keyboard and pointer/touch input.

## Scope and sequencing

### Stage A — First-screen clarity
- Replace simulator/developer language with player-facing game language.
- Reorder the page around the table and the next playable action.
- Move advanced rules into progressive disclosure.
- Make match state and turn guidance prominent.
- Improve responsive layout and touch target sizing.

### Stage B — Shot interaction
- Add a clear aim/power interaction affordance and preview.
- Make power and spin controls feel like game controls, not tuning panels.
- Add contextual instructions for ball-in-hand, AI thinking and game over.

### Stage C — Game loop and delight
- Add mode selection and fast restart/rematch flow.
- Improve shot result feedback and player turn transitions.
- Add onboarding that disappears after the player demonstrates the action.
- Validate on real desktop and mobile browsers.

## Explicit non-goals for this redesign

- Removing the existing deterministic physics, AI planner, rules engine or four camera modes.
- Exposing physical calibration controls to ordinary players.
- Adding online multiplayer before the local game loop is compelling.
- Claiming physical calibration before measured-shot validation.

## Acceptance criteria

- A first-time player can find the table, identify the active turn and understand the shot gesture immediately.
- The first screen communicates a game, not a simulation or physics test bench.
- Core playfield and controls remain usable at 320px width.
- Advanced options do not overwhelm the default match experience.
- Existing 8-ball, AI, localization, spin, ball-in-hand and camera functionality remains intact.
