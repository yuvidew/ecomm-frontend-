---
description: Write tests for a feature with the test-writer agent, then run them with the test-runner agent and report
argument-hint: <feature or phase, e.g. "products" or "phase-2">
---

Write and run tests for: **$ARGUMENTS**

Follow these steps in order. Use the Agent tool for every agent step. Don't write or run the
tests yourself.

## 1. Resolve the scope

- If `$ARGUMENTS` is empty, list the phase plans in `.claude/plan/` and ask the user which
  feature to test. Stop until they answer.
- Match `$ARGUMENTS` to a phase plan (`.claude/plan/phase-<n>-<name>.md`) and a feature folder
  (`src/features/<feature>/`). If it matches nothing, or matches more than one, ask the user.
  Don't guess.

## 2. Write the tests (`test-writer` agent)

Launch the `test-writer` agent. Give it:
- the plan file path and the feature folder path
- the instruction to write tests from the spec (the plan plus the backend contract), not from
  the implementation
- a request for its usual report: files added, coverage, spec mismatches, open questions

Wait for it to finish.

## 3. Run the tests (`test-runner` agent)

Launch the `test-runner` agent, scoped to `src/features/<feature>`. Ask it to run the tests,
type-check them, and put every failure into one of its categories: implementation bug, test
bug, spec ambiguity, or environment.

## 4. One repair round for test bugs

If the runner reports any **test bugs**, send those failures (with the runner's evidence) back
to the `test-writer` agent with SendMessage, or launch it again if SendMessage isn't available.
Then run the `test-runner` agent once more on the same scope.

Do this only once. Don't loop.

## 5. Report to the user

Give a short summary:
- **Files added/changed** (from test-writer)
- **Results:** passed / failed / skipped counts, and whether the type-check was clean
- **Implementation bugs:** each one with the spec source, expected vs. actual, and the file:line
  in the implementation. **Don't fix application code.** Ask the user whether they want these
  fixed.
- **Spec ambiguities / open questions** that need the user's decision
- **Environment issues**, if any
