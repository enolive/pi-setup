pi-peon-adapter
===============

## Make unattended pi sessions noticeable and trustworthy.

![pi-peon-adapter banner](slide-banner.png)

<!-- end_slide -->

The problem
===========

AI agents now work while humans look away.

When the agent finishes, fails, or needs attention, the moment is easy to miss.

<!-- end_slide -->

Why it matters
==============

Missed agent events waste time.

- finished work sits idle
- failures are discovered late
- users start babysitting terminals again

<!-- end_slide -->

The solution
============

`pi-peon-adapter` connects pi lifecycle events to `peon`.

```text
pi notices → peon alerts → human reacts
```

Pi observes the work. Peon handles the notification policy.

<!-- end_slide -->

Current state
=============

A useful one-file prototype exists.

It forwards selected pi events to `peon`, fire-and-forget.

But it has no tests and little diagnostic visibility.

<!-- end_slide -->

Future state
============

A small standalone adapter package.

Tested event mapping and guard conditions.

Opt-in debug logging for real-session soak testing.

<!-- end_slide -->

Why not leave the prototype as-is?
==================================

If no sound plays, we cannot tell whether the adapter, pi, peon, ACP, or the model caused it.

Manual listening tests are not enough for publishing.

<!-- end_slide -->

Why build instead of buy?
=========================

Existing packages solve adjacent problems.

Most are full sound systems or target older hook scripts.

We need a small current-pi adapter that delegates policy to `peon`.

<!-- end_slide -->

What we build
=============

Keep it deliberately small.

- standalone package shape
- tested event mapping
- minimal runtime dispatch
- opt-in debug log for real-session soak testing

<!-- end_slide -->

The ask
=======

Approve incremental work on `pi-peon-adapter`.

Goal: a tiny, auditable adapter that makes unattended agent sessions easier to trust.
