# Tasks: <Feature title>

Plan: ./plan.md
Tests: ./tests.feature

Status values: todo | doing | done | blocked

Parallel batches:

```
T01 → T02, T03 → T04
```


## T01. <Imperative title, e.g. "Create a trip (happy path)">

Status: todo
Depends on: -
Model: sonnet
Scenarios: @T01
Covers: AC-1

Files:
- <path/to/file>
- <path/to/test>

Steps:
1. <concrete step>
2. <concrete step>

Done when:
- [ ] Scenarios tagged @T01 pass
- [ ] Unit tests for <X> cover <cases>
- [ ] <objective check>

Notes:
- <hint, pattern to follow, file to copy from>


## T02. <title>

Status: todo
Depends on: T01
Model: haiku
Scenarios: @T02
Covers: AC-2, EC-1

Files:
- <path>

Steps:
1. <step>

Done when:
- [ ] Scenarios tagged @T02 pass


## Coverage

| Criterion | Task(s)   | Scenario(s)                     |
| --------- | --------- | ------------------------------- |
| AC-1      | T01       | Create a trip with valid data   |
| EC-1      | T02       | <scenario name>                 |
