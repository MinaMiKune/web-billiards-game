# Performance Benchmarks

Run the repeatable local benchmark suite with:

~~~bash
npm run bench:performance
~~~

The suite measures:
- AI planning at all five difficulty levels using the standard opening rack.
- 240 fixed physics steps (two simulated seconds) including rack setup and one cue shot.

Vitest reports timing distributions for the current machine/runtime. These are comparison baselines, not universal pass/fail thresholds: compare runs on the same hardware, browser/runtime and power profile. Do not add hard millisecond assertions to CI until stable reference hardware is available.

AI planning in the browser runs in a Web Worker, so the AI benchmark measures planner throughput independently of main-thread rendering. Physics stepping remains deterministic and uses the same 120 Hz step as gameplay.
