# ADR-0023: Keep Care History As The Completed-Care Record

- Status: Accepted
- Date: 2026-08-31
- Supersedes: [ADR-0022](0022-use-repeatable-care-tasks-with-completion-history.md)

## Context

Care Tasks plan future watering and fertilizing. Care History records work that
actually happened. Showing completed tasks alongside their matching history
events repeats the same action in two places and makes the Care workspace
harder to scan.

## Decision

Tasks shows only Overdue, Due today, and Upcoming work.

Completing a one-time task creates a Care History record and removes the task
from the task list. Completing a repeating task creates the same Care History
record and advances that task to the next due date from the actual completion
date.

Care History is the only completed-care view. Its actions are labelled Correct
record and Delete record to make their scope explicit.

Existing completed task entries are removed during the browser-storage upgrade.
Their matching Care History events remain available.

## Why This Option

- Daily task planning stays focused on work that remains to be done.
- Care History provides one durable timeline of watering and fertilizing.
- Repeating tasks retain one scheduling record that advances after completion.
- Clear history actions distinguish correcting facts from editing future plans.

## Alternatives Considered

### Keep A Completed Task Group

The group duplicates Care History and makes it harder to identify unfinished
work.

### Keep Completed Tasks Hidden In Storage

Retaining unused completed task entries adds persistence state that has no
current product use.

### Make History Immutable

Gardeners can enter an incorrect date, target, or note. Correcting the actual
record is a useful maintenance workflow.

## Consequences

- Browser persistence advances from version 7 to version 8.
- A task completion creates one history event and leaves only open tasks in
  task storage.
- Tests cover one-time removal, repeating-task advancement, and retained
  history.

## Revisit When

Revisit this decision if users need a separate audit trail for task scheduling,
task assignment, reminders, shared-garden accountability, or missed-task
analytics.
