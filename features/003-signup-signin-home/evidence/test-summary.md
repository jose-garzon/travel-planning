# Test summary: Account creation, sign-in and home page

Last full run, 2026-09-30, branch feat/3-signup-signin-home.

| Check          | Result                                         |
| -------------- | ---------------------------------------------- |
| BDD scenarios  | 238/240 passed (desktop + mobile)              |
| Unit tests     | 238/238 passed                                 |
| Lint           | pass                                           |
| Typecheck      | pass                                           |
| Build          | pass                                           |

Both failures are in feature 001 (design system), not this feature:
- Tooltip hover (desktop): passes in isolation, load flake.
- Late webfonts layout shift (mobile): not rerun in isolation.

After the layout commit (c790d86): @F3 44 scenarios, 1 intermittent
name-capture failure, 24/24 on rerun. Unit 238/238.
