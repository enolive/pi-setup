---
name: later-equals-never
description: Use when the user or the agent proposes deferring a decision, cleanup, refactor, or task to "later," "next time," "a future issue," or "when X happens." Surfaces disguised status-quo decisions and the accretion trap.
---

# Later Equals Never

Phil LeBlanc's law, via *The Pragmatic Programmer*: **later equals never.** Most deferrals are not postponements — they are decisions to keep the current state, disguised as deferrals, because the conditions that would make "later" arrive rarely materialize on their own.

## When to apply

Load this skill when the user says or implies any of:

- "I'll do that later / next time / in a follow-up."
- "Let's make that a future issue."
- "Not now, but we should revisit this."
- "We can tackle that separately."
- "TODO" / "FIXME" / "for now" / "temporary" / "good enough for now."
- "I'm leaning toward X but want to think about it."

Also apply when the agent itself is about to emit a deferral ("could be improved later," "consider refactoring when...").

## Core test

Ask one question: **what concrete event will cause "later" to arrive?**

- If the answer is a specific, scheduled, likely trigger (a release, a migration, a confirmed user appearing) — the deferral may be honest. Note it and move on.
- If the answer is "when it becomes a problem," "when we have time," or no answer — the deferral is a decision to never do it. Name it as such.

The failure mode is **accretion**: each deferral makes the next review marginally harder, so the question gets marginally harder to ask again. This does not self-correct — LeBlanc's Law.

## Response pattern

1. **Surface the deferral as a decision.** Say plainly: "Deferring this is effectively deciding to keep it as-is. Is that the decision you want to make?"
2. **Name the trap if the user resists.** One sentence: "Later equals never — the cost of revisiting grows and the trigger rarely materializes."
3. **Offer a now-or-never framing.** Either do it now (if it's small enough), or decide explicitly not to do it (and record that decision somewhere it will actually be re-read, not buried).

Do not moralize. The user may have good reasons to defer (cognitive load, release pressure, scope discipline). The skill's job is to make the decision conscious, not to force action.

## What to avoid

- **Don't act on the deferral yourself.** Don't create a TODO file, open an issue, or write "deferred" comments unless the user asks. That turns the skill into an enabler of the trap.
- **Don't lecture.** One sentence naming the trap is enough. A paragraph is already too much.
- **Don't force the issue.** If the user hears the framing and still defers, that's a valid decision. Record and move on.

## Examples

**Deferral that is actually a decision:**

> User: "I'm leaning toward splitting this file but let's make it a future issue."

Surface it: "A future issue is unlikely to get attention unless something forces it. Splitting now is ~5 minutes; deferring is effectively deciding to keep the file merged. Which do you want?"

**Honest deferral (has a trigger):**

> User: "We'll fix the Windows path handling when we get a native-Windows user."

Accept: that has a concrete trigger condition. Note it where it will be re-read, not buried in a file nobody opens.

**Agent-generated deferral:**

> Agent: "This could be refactored for clarity later."

Catch yourself: is "later" a real event, or a way to avoid deciding whether the refactor matters? If it doesn't matter enough to do now, say that. If it does, do it now.
