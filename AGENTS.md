# Sun-Aware Garden Planner Agent Guide

## Purpose

Build a credible, production-grade full-stack and applied-AI portfolio project.
Keep the product useful, technically coherent, testable, and explainable in a
new-graduate software engineering interview.

## Read First

Before planning, coding, reviewing, or changing dependencies, read:

1. `docs/project-strategy.md`
2. `docs/decisions/README.md`
3. Any ADR that applies to the task
4. The relevant implementation and tests

`docs/project-strategy.md` is the source of truth for product direction,
technology adoption, phases, and acceptance standards. ADRs are the source of
truth for accepted engineering decisions.

## Decision Policy

- Discuss a material product, architecture, data, AI, cloud, security, cost,
  licensing, or deployment decision with the user before implementation.
- Record an accepted material decision as an ADR in `docs/decisions/`.
- Each ADR must explain context, selected option, rationale, alternatives,
  consequences, and reconsideration conditions.
- Keep small implementation choices in code, tests, task handoffs, and commit
  history.
- Do not add a technology only to increase keyword coverage. Every adopted
  technology requires a working product use, appropriate tests, and operational
  evidence when applicable.

## Feature Work

One task should deliver one small, testable user-facing capability. Before
implementation, establish:

- Goal and user value.
- Files and modules in scope.
- Explicit exclusions for the task.
- Acceptance criteria that describe what a user can do and observe.
- Required tests and verification commands.

Avoid concurrent edits to the same files from separate worktrees. Use a focused
branch or worktree for a substantial feature, then hand it back for review.

## Definition of Done

A feature is complete only when:

- The agreed user workflow works end to end.
- Inputs, validation, loading, empty, and error states are handled where they
  apply.
- Relevant unit, integration, or end-to-end tests pass.
- Relevant build, type, lint, and formatting checks pass when configured.
- Documentation is updated when behavior, setup, architecture, or a decision
  changes.
- No secrets, generated artifacts, or unrelated changes are included.
- The handoff states changed files, verification performed, limitations, and
  follow-up work.

## Code and Product Standards

- Favor small, direct implementations over speculative abstractions.
- Use TypeScript for the web application and Python/FastAPI for the backend
  phases described in the project strategy.
- Keep solar physics and explicit garden constraints deterministic and tested.
- Use AI for retrieval, explanation, structured extraction, planning, and
  assistant workflows with evaluations, citations, fallbacks, and guardrails.
- Preserve existing user changes. Do not revert or overwrite unrelated work.
- Use Markdown for project documentation unless the user explicitly requests a
  different format.
- Use direct affirmative sentences in generated user-facing documentation.

## Git and Handoff

- Do not commit, push, merge, or change the default branch without explicit
  user authorization.
- Review `git status`, the scoped diff, and verification results before a
  handoff.
- Keep commits focused on one reviewed task.
- Report blockers clearly instead of silently widening scope.
