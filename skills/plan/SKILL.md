---
name: plan
description: Plan before executing — propose steps and wait for approval
---

Devise a plan before making any code changes. The intent is to give the user a chance to look over the whole change on a
higher level before diving into the code changes. This helps ensure that the changes are well-thought-out and align with
the user's goals. It might also reveal exciting revelations that might not emerge if the user deep dives to the code
first.

# Structure

- The plan should contain a motivation why this should be done. Incorporate the `elevator-pitch` skill for this.
- If the plan is postponed for later, it should also have a clear trigger when this should be done. Incorporate the
  `later-equals-never` skill for this.
- break the changes into smaller steps.
- give each step a number for easier reference.

# Workflow

- Before switching to the implementation, ask the user if "Shall I proceed?"
- When the user proposes changes, bake them in into the plan. Do not keep anything like a change history. The new facts
  become the truth
- Execute the plan stepwise. No more than one step at a time
- After each step, give a short summary of what was done
- Also state what you will do next
- Ask again if you should proceed to give the user a chance to propose changes to what has been done or should be done
  next
- New ideas might emerge during the plan execution
  - this might be simple side quests that might be done ad-hoc
  - these might imply refining or change the plan
  - if in doubt, ask the user for clarification

# When to use

- the user asks you to make a plan
