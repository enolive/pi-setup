---
name: market-research
description: Use when researching existing tools/packages/implementations, comparing buy-vs-build options, or writing a research summary for a technical decision.
---

# Market Research Skill

Use this skill when the user asks to research existing implementations, compare alternatives, or justify a make-vs-buy decision.

## Goals

- Identify existing solutions and adjacent implementations.
- Separate direct fits from partial fits.
- Explain what each option solves and what it does not solve.
- Produce a decision-oriented summary, not just a link dump.

## Required related skill

Use the `web-search` skill for the search phase. Load it before researching external packages, repositories, catalogs, or market alternatives.

## Research steps

1. Load and use the `web-search` skill to search for exact names, likely package names, GitHub repositories, npm packages, and catalog/package pages.
2. Inspect package metadata when available:
   - name
   - version
   - description
   - repository/homepage
   - peer dependencies
   - package manifest
3. Inspect implementation shape if source/package contents are available:
   - entrypoints
   - event mapping
   - runtime assumptions
   - dependencies
   - tests present or missing
4. Compare against the desired local requirements.
5. Document why each option is or is not a fit.

## What to look for

- Is it solving the same problem or only an adjacent one?
- Is it a thin adapter or a full product/subsystem?
- Does it duplicate policy that should live elsewhere?
- Does it use current dependencies and APIs?
- Does it have tests?
- Does the architecture prove testability, or merely look tidy?
- Does it match the desired operational model?
- Does adopting it increase review/security/maintenance surface area?

## Output structure

Prefer this structure:

```md
# Existing implementations

## Management summary — why make or buy?

Short decision summary for busy readers.

## Options found

### Package/tool A

- what it is
- what it does well
- why it is or is not a fit

### Package/tool B

...

## Make-vs-buy conclusion

Clear recommendation with the key reasons.
```

## Tone

Be explicit and fair. Existing packages can be useful references even when they are not suitable dependencies.

Avoid overstating novelty. Prefer:

> Existing packages prove the use case is valuable, but they solve a broader/different problem.

## Useful conclusion pattern

```md
Decision: make, do not buy.

Use existing implementations as references, but build the smaller adapter because
it matches our runtime contract, current dependency expectations, diagnostics,
and testing requirements.
```
