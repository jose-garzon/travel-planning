@F1
Feature: Design system
  As a developer building Parche
  I want shared tokens, primitives and a styleguide
  So that every screen looks like one product in both themes

  # T01: tokens, fonts

  @T01 @AC-3
  Scenario: Design tokens are defined for both themes
    When I inspect the design tokens
    Then every required design token is defined
    And every color token has a light and a dark value

  @T01 @AC-16 @EC-2
  Scenario: Fallback fonts render when webfonts fail
    Given webfonts fail to load
    When I open the home page
    Then I see the heading "Parche"
    And headings use the display fallback fonts

  @T01 @AC-16 @EC-2 @perf
  Scenario: Late webfonts do not shift the layout
    Given webfonts load slowly
    When I open the home page
    And the webfonts finish loading
    Then the layout shift is at most 0.01

  # T15: translatable text, root header

  @T16 @AC-3
  Scenario: Secondary accent and scrim tokens are defined
    When I inspect the design tokens
    Then the secondary accent token has a light and a dark value
    And the scrim token is defined for photo card text

  @T15 @a11y
  Scenario: Root header shows the wordmark
    Given I open the home page
    Then the header shows the wordmark "parche"
    And the page has no accessibility violations

  # T02: styleguide shell

  @T02 @AC-4
  Scenario: Styleguide shows every section in order
    Given I open the styleguide
    Then I see the heading "Parche design system"
    And I see these sections in order:
      | Brand             |
      | Color             |
      | Type              |
      | Spacing           |
      | Radius and shadow |
      | Motion            |
      | Icons             |
      | Primitives        |
    And the page has no accessibility violations

  @T02 @AC-4 @i18n
  Scenario Outline: Styleguide heading is translated
    When I open the styleguide in "<locale>"
    Then I see the heading "<heading>"

    Examples:
      | locale | heading                     |
      | en     | Parche design system        |
      | es     | Sistema de diseño de Parche |

  @T02 @AC-11
  Scenario: Styleguide shell fits a narrow screen
    Given the viewport is 320 pixels wide
    When I open the styleguide
    Then the page does not scroll horizontally

  # T03: lint rules

  @T03 @AC-1
  Scenario Outline: Lint rejects raw design values
    Given the source file "<path>" contains '<code>'
    When the source file is linted
    Then lint reports "<message>"

    Examples:
      | path      | code                                  | message          |
      | src/a.css | .a { color: #fff; }                   | Raw design value |
      | src/a.css | .a { color: rgb(0 0 0); }             | Raw design value |
      | src/a.css | .a { color: hsl(10 50% 50%); }        | Raw design value |
      | src/a.css | .a { color: rebeccapurple; }          | Raw design value |
      | src/a.css | .a { padding: 13px; }                 | Raw design value |
      | src/a.css | .a { margin: 0.5rem; }                | Raw design value |
      | src/a.css | .a { gap: 2em; }                      | Raw design value |
      | src/a.css | .a { box-shadow: 0 1px var(--c); }    | Raw design value |
      | src/a.css | .a { transition-duration: 200ms; }    | Raw design value |
      | src/a.css | .a { animation-duration: 1s; }        | Raw design value |
      | src/a.tsx | export const a = "#ff0000";           | Raw design value |
      | src/a.tsx | export const a = "red";               | Raw design value |
      | src/a.tsx | export const a = { t: "all 200ms" };  | Raw design value |
      | src/a.tsx | export const a = "p-[13px]";          | arbitrary value  |
      | src/a.tsx | const A = <p className="bg-[#fff]" />; | arbitrary value |
      | src/a.tsx | export const a = `m-[2px] ${"p"}`;    | arbitrary value  |
      | src/a.tsx | const A = <p style={{ gap: 4 }} />;   | Inline style     |

  @T03 @AC-1
  Scenario Outline: Lint accepts tokens and token utilities
    Given the source file "<path>" contains '<code>'
    When the source file is linted
    Then lint reports no problems

    Examples:
      | path                     | code                                       |
      | src/shared/ui/tokens.css | :root { --spacing-1: 0.25rem; --x: #fff; } |
      | src/ok.css               | .a { padding: var(--spacing-2); }          |
      | src/ok.css               | .a { white-space: nowrap; }                |
      | src/ok.tsx               | export const a = "p-4 bg-accent";          |
      | src/ok.tsx               | export const a = "data-[state=open]:p-4";  |
      | src/ok.test.tsx          | export const a = "#fff";                   |

  @T03 @AC-2 @a11y
  Scenario Outline: Lint rejects click handlers on non-interactive elements
    Given the source file "src/click.tsx" contains '<code>'
    When the source file is linted
    Then lint reports "<rule>"

    Examples:
      | code                            | rule                                |
      | const A = <div onClick={f} />;  | noStaticElementInteractions         |
      | const A = <li onClick={f} />;   | noNoninteractiveElementInteractions |
      | const A = <span onClick={f} />; | useKeyWithClickEvents               |

  @T03 @AC-2 @a11y
  Scenario: Lint accepts click handlers on buttons
    Given the source file "src/click.tsx" contains:
      """
      export const A = () => (
        <button type="button" onClick={() => {}}>
          x
        </button>
      );
      """
    When the source file is linted
    Then lint reports no problems

  @T03
  Scenario Outline: App folder only imports route files
    Given an app page that imports "<file>"
    When the dependencies are checked
    Then the dependency check reports "<result>"

    Examples:
      | file                                  | result          |
      | src/app/[locale]/_components/card.tsx | app-is-a-router |
      | src/app/_composition/wiring.ts        | no violations   |

  @T03 @AC-1 @AC-2
  Scenario: Project source passes the design lint rules
    When the project source is linted
    Then lint reports no problems

  # T04: Text and Stack

  @T04 @AC-10
  Scenario: Layout primitives show their default state
    Given I open the styleguide
    Then the "Stack and Text" demo shows these states:
      | Default |
    And the "Stack and Text" demo shows every font size
    And the page has no accessibility violations

  # T05: theme

  @T05 @AC-6
  Scenario Outline: Theme follows the system color scheme
    Given I have no stored theme
    And my system prefers the "<scheme>" color scheme
    When I open the styleguide
    Then the page uses the "<scheme>" theme
    And the theme toggle is named "<name>"
    And the page has no accessibility violations

    Examples:
      | scheme | name                  |
      | light  | Switch to dark theme  |
      | dark   | Switch to light theme |

  @T05 @AC-6
  Scenario: Theme changes when the system setting changes
    Given I have no stored theme
    And my system prefers the "light" color scheme
    And I open the styleguide
    When my system switches to the "dark" color scheme
    Then the page uses the "dark" theme

  @T05 @AC-7
  Scenario: Theme toggle switches the theme and remembers it
    Given I have no stored theme
    And my system prefers the "light" color scheme
    And I open the styleguide
    When I switch to the "dark" theme
    Then the page uses the "dark" theme
    And my theme choice "dark" is stored
    And the theme toggle is named "Switch to light theme"

  @T05 @AC-7
  Scenario: Stored theme is rendered by the server
    Given my stored theme is "dark"
    And my system prefers the "light" color scheme
    When I open the styleguide without scripts
    Then the page uses the "dark" theme

  @T05 @AC-7
  Scenario Outline: Theme toggle is on every page
    Given I have no stored theme
    And my system prefers the "light" color scheme
    When I open the <page>
    Then the theme toggle is named "Switch to dark theme"

    Examples:
      | page       |
      | home page  |
      | styleguide |

  @T05 @AC-19 @AC-21 @a11y
  Scenario: Theme toggle has the focus ring and touch target
    Given I open the home page
    When I focus the theme toggle by keyboard
    Then the focused element shows the token focus ring
    And the theme toggle is at least 44 by 44 pixels

  @T05 @AC-7 @i18n
  Scenario Outline: Theme toggle name is translated
    Given I have no stored theme
    And my system prefers the "light" color scheme
    When I open the styleguide in "<locale>"
    Then the theme toggle is named "<name>"

    Examples:
      | locale | name                  |
      | en     | Switch to dark theme  |
      | es     | Cambiar a tema oscuro |

  # T06: Button

  @T06 @AC-10
  Scenario: Button shows each supported state
    Given I open the styleguide
    Then the "Button" demo shows these states:
      | Default | Hover | Focus | Active | Loading | Disabled |
    And every "Button" state looks different from its default state
    And the page has no accessibility violations

  @T06 @AC-10
  Scenario: Loading button keeps its label and is busy
    Given I open the styleguide
    Then the loading "Save trip" button keeps its label and is busy

  @T06 @AC-9 @desktop
  Scenario: Button state changes animate
    Given I open the styleguide
    When I hover the "Save trip" button in the "Button" demo
    Then its state change animates in the fast duration

  @T06 @AC-19 @a11y
  Scenario: Button shows the token focus ring
    Given I open the styleguide
    When I focus the "Save trip" button in the "Button" demo by keyboard
    Then the focused element shows the token focus ring

  @T06 @AC-21 @a11y
  Scenario: Button meets the touch target size
    Given I open the styleguide
    Then every control in the "Button" demo is at least 44 by 44 pixels

  # T07: Input

  @T07 @AC-10
  Scenario: Input shows each supported state
    Given I open the styleguide
    Then the "Input" demo shows these states:
      | Default | Hover | Focus | Disabled | Error |
    And every "Input" state looks different from its default state
    And the page has no accessibility violations

  @T07 @AC-10 @a11y
  Scenario: Input error is announced with an icon and text
    Given I open the styleguide
    Then the "City" field in the error state is invalid and linked to its error
    And its error message shows an icon and text
    And its error message enters with a fade and a shake

  @T07 @AC-19 @AC-21 @a11y
  Scenario: Input shows the focus ring and meets the touch target size
    Given I open the styleguide
    When I focus the "City" field in the "Input" demo by keyboard
    Then the focused element shows the token focus ring
    And every control in the "Input" demo is at least 44 by 44 pixels

  # T08: Tooltip

  @T08 @AC-13 @a11y @desktop
  Scenario Outline: Tooltip shows on hover and stays while hovered
    Given I open the styleguide
    When I hover the "Add to budget" button in the "Tooltip" demo
    Then I see the tooltip "<tip>"
    And the tooltip "<tip>" describes its trigger
    When I move the pointer onto the tooltip
    Then I see the tooltip "<tip>"

    Examples:
      | tip                                   |
      | Adds this activity to the trip budget |

  @T08 @AC-13 @a11y
  Scenario Outline: Tooltip shows on focus and hides on Escape and blur
    Given I open the styleguide
    When I focus the "Add to budget" button in the "Tooltip" demo by keyboard
    Then I see the tooltip "<tip>"
    And the tooltip has no focusable elements
    When I press the "Escape" key
    Then I do not see a tooltip
    When I focus the "Add to budget" button in the "Tooltip" demo by keyboard
    And I press the "Tab" key
    Then I do not see a tooltip

    Examples:
      | tip                                   |
      | Adds this activity to the trip budget |

  # T09: Card

  @T09 @AC-10 @AC-21
  Scenario: Card shows each supported state
    Given I open the styleguide
    Then the "Card" demo shows these states:
      | Default | Hover | Focus | Active |
    And every "Card" state looks different from its default state
    And every control in the "Card" demo is at least 44 by 44 pixels
    And the page has no accessibility violations

  @T09 @AC-12 @EC-1 @desktop
  Scenario Outline: Long name on a clickable card truncates, tooltip on hover
    Given I open the styleguide
    Then the clickable card "<name>" is truncated with an ellipsis
    When I hover the clickable card "<name>"
    Then I see the tooltip "<name>"

    Examples:
      | name                                                     |
      | Museo del Oro and the Candelaria walking tour with lunch |

  @T09 @AC-12 @EC-1 @a11y
  Scenario Outline: Long name on a clickable card shows a tooltip on focus
    Given I open the styleguide
    When I focus the clickable card "<name>" by keyboard
    Then I see the tooltip "<name>"

    Examples:
      | name                                                     |
      | Museo del Oro and the Candelaria walking tour with lunch |

  @T09 @AC-12 @EC-1
  Scenario Outline: Long name on a static card wraps
    Given I open the styleguide
    Then the static card "<name>" wraps its text

    Examples:
      | name                                                     |
      | Museo del Oro and the Candelaria walking tour with lunch |

  @T09 @AC-12
  Scenario: Short name on a clickable card has no tooltip
    Given I open the styleguide
    When I focus the clickable card "Café" by keyboard
    Then I do not see a tooltip

  # T10: Dialog

  @T10 @AC-14 @a11y
  Scenario: Dialog traps focus and returns it on close
    Given the viewport is 1280 pixels wide
    And I open the styleguide
    When I open the "Rename trip" dialog
    Then focus is inside the "Rename trip" dialog
    When I press the "Tab" key 6 times
    Then focus is inside the "Rename trip" dialog
    When I press the "Escape" key
    Then focus returns to the "Rename trip" button
    And the page has no accessibility violations

  @T10 @AC-14 @EC-6 @a11y
  Scenario: Dialog locks background scroll until closed
    Given I open the styleguide
    When I open the "Rename trip" dialog
    Then the page behind the dialog does not scroll
    When I close the dialog with the "Cancel" button
    Then focus returns to the "Rename trip" button
    And the page scrolls again

  @T10 @AC-15 @EC-8
  Scenario Outline: Dialog layout depends on the viewport
    Given the viewport is <width> pixels wide
    And I open the styleguide
    When I open the "Rename trip" dialog
    Then the dialog is shown as a <layout>
    And the page has no accessibility violations

    Examples:
      | width | layout          |
      | 375   | bottom sheet    |
      | 767   | bottom sheet    |
      | 768   | centered dialog |

  @T10 @EC-5
  Scenario: Open dialog re-themes when the system scheme changes
    Given I have no stored theme
    And my system prefers the "light" color scheme
    And I open the styleguide
    And I open the "Rename trip" dialog
    And I focus the "Trip name" field
    When my system switches to the "dark" color scheme
    Then the page uses the "dark" theme
    And the "Rename trip" dialog uses the "dark" theme
    And the "Rename trip" dialog is still open
    And focus is on the "Trip name" field

  # T11: section navigation

  @T11 @AC-17 @a11y
  Scenario: Section link scrolls to the section and moves focus
    Given the viewport is 1280 pixels wide
    And I open the styleguide
    When I choose the "Motion" section link
    Then the "Motion" section is in view
    And focus is on the "Motion" section heading
    And the "Motion" section link is active

  @T11 @AC-17
  Scenario: Active section link follows scrolling
    Given I open the styleguide
    When I scroll to the "Spacing" section
    Then the "Spacing" section link is active
    And only one section link is active

  @T11 @AC-18
  Scenario: Mobile section links wrap instead of scrolling sideways
    Given the viewport is 320 pixels wide
    When I open the styleguide
    Then the section links wrap onto more than one line
    And the section links do not scroll horizontally
    And the page has no accessibility violations

  # T12: token sections

  @T12 @AC-3
  Scenario Outline: Token sections name every token
    Given I open the styleguide
    Then the "<section>" section names every "<group>" token

    Examples:
      | section           | group          |
      | Color             | color          |
      | Type              | font           |
      | Spacing           | space          |
      | Radius and shadow | radius, shadow |
      | Motion            | motion         |

  @T12 @AC-4
  Scenario: Color section shows light and dark swatches side by side
    Given I open the styleguide
    Then the "Color" section shows a light panel and a dark panel
    And the page has no accessibility violations

  @T12 @a11y
  Scenario: Icons section separates decorative and meaningful icons
    Given I open the styleguide
    Then each icon in the "Icons" section is hidden or has a name

  # T13: brand

  @T13 @AC-20 @i18n
  Scenario Outline: Brand section shows name, wordmark direction and voice
    When I open the styleguide in "<locale>"
    Then the "<section>" section shows the name "Parche"
    And the "<section>" section shows the wordmark direction
    And the "<section>" section shows 4 voice rules with do and don't examples
    And the page has no accessibility violations

    Examples:
      | locale | section |
      | en     | Brand   |
      | es     | Marca   |

  # T14: hardening

  @T14 @AC-4 @AC-5 @a11y
  Scenario Outline: Styleguide has no accessibility violations in each theme
    Given my stored theme is "<theme>"
    When I open the styleguide
    Then the page has no accessibility violations

    Examples:
      | theme |
      | light |
      | dark  |

  @T14 @AC-8 @EC-4
  Scenario: Reduced motion drops movement but keeps fades
    Given I prefer reduced motion
    When I open the styleguide
    Then no "Primitives" control moves or scales on state change
    And the error message in the "Input" demo only fades in

  @T14 @AC-8 @AC-15 @EC-4
  Scenario: Reduced motion bottom sheet only fades
    Given I prefer reduced motion
    And the viewport is 375 pixels wide
    And I open the styleguide
    When I open the "Rename trip" dialog
    Then the dialog only fades in

  @T14 @AC-8 @AC-17 @EC-4
  Scenario: Reduced motion section links jump instantly
    Given I prefer reduced motion
    And I open the styleguide
    When I choose the "Icons" section link
    Then the "Icons" section is in view without smooth scrolling

  @T14 @AC-9
  Scenario: Primitive state changes use the fast duration
    Given I open the styleguide
    Then every "Primitives" control transitions in the fast duration

  @T14 @AC-19 @AC-21 @a11y
  Scenario: Every interactive primitive has a focus ring and touch target
    Given I open the styleguide
    Then every "Primitives" control shows the token focus ring by keyboard
    And every "Primitives" control is at least 44 by 44 pixels

  @T14 @AC-11 @EC-3 @EC-7
  Scenario Outline: Styleguide reflows without scroll, clipping or overlap
    Given <condition>
    When I open the styleguide
    Then the page does not scroll horizontally
    And no primitive clips or overlaps its content

    Examples:
      | condition                       |
      | the viewport is 320 pixels wide |
      | the page is zoomed to 200%      |
      | my browser text size is 200%    |

  @T14 @AC-22 @desktop
  Scenario Outline: Primitive demo states lay out in a row on desktop
    Given the viewport is 1280 pixels wide
    When I open the styleguide
    Then the "<demo>" demo lays out its states in a row

    Examples:
      | demo   |
      | Button |
      | Input  |
      | Card   |

  @T14 @AC-11 @i18n
  Scenario Outline: Spanish labels fit at the narrowest width
    Given the viewport is 320 pixels wide
    When I open the styleguide in "<locale>"
    Then the page does not scroll horizontally
    And no primitive clips or overlaps its content

    Examples:
      | locale |
      | en     |
      | es     |
