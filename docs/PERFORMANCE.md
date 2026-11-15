# Performance Benchmarks

Run the repeatable local benchmark smoke suite with:

~~~bash
npm run bench:performance
~~~

The suite reports:
- Average AI planning time for each of the five difficulty levels (three runs per level).
- Average time for a 240-step fixed-physics scenario (three runs).

Timings are informational and intentionally have no machine-specific pass/fail thresholds. Compare results on the same hardware, browser/runtime and power profile. The benchmark smoke tests also assert that every scenario completes and reports a finite duration.

AI planning in the browser runs in a Web Worker, so the planner timings measure search throughput independently of main-thread rendering. Physics stepping remains deterministic and uses the same 120 Hz step as gameplay.
