# <Feature title>

Issue: #<n>
Status: draft | approved
Owner: <name>


## Summary

<Two or three sentences. What the user can do after this ships that they
cannot do today.>


## Problem

<Who has the problem, how it shows up today, why it matters now.>

Success metric: <observable number, e.g. "80% of trips have an itinerary
within 7 days of creation">


## Users and roles

| Role        | Can do                         | Cannot do            |
| ----------- | ------------------------------ | -------------------- |
| <role>      | <actions>                      | <actions>            |


## Use cases

### UC-1: <name>

Actor: <role>
Trigger: <what starts it>

1. <step>
2. <step>
3. <step>

Result: <what is true at the end>

Alternate flows:
- 2a. <condition>: <what happens>


## States

| State    | When                        | User sees                      |
| -------- | --------------------------- | ------------------------------ |
| empty    | <condition>                 | <message, call to action>      |
| loading  | <condition>                 | <skeleton, spinner, nothing>   |
| success  | <condition>                 | <content>                      |
| error    | <condition>                 | <message, recovery action>     |
| offline  | <condition>                 | <behavior>                     |


## Edge cases

- EC-1. <situation>: <expected behavior>
- EC-2. <situation>: <expected behavior>


## Errors

| Failure                  | Message to user              | Recovery       |
| ------------------------ | ---------------------------- | -------------- |
| <failure>                | <copy>                       | <action>       |


## UI

<One ASCII wireframe per screen or significant state.>

```
┌──────────────────────────────────────┐
│ Header                               │
├──────────────────────────────────────┤
│                                      │
│                                      │
└──────────────────────────────────────┘
```


## Accessibility

- Keyboard: <tab order, shortcuts, no traps>
- Screen reader: <landmarks, labels, live announcements>
- Focus: <where focus goes after each action>
- Motion and contrast: <reduced motion, color not sole signal>


## Internationalization

- Locales: <list>
- Dates and times: <format, time zone rules>
- Currency and numbers: <rules>
- Pluralization and text length: <notes>


## Acceptance criteria

- AC-1. Given <context>, when <action>, then <outcome>.
- AC-2. Given <context>, when <action>, then <outcome>.


## Out of scope

- <thing explicitly not done now>


## Open questions

- <question> (owner, due)
