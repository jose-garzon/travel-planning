@F<issue>
Feature: <Feature title>
  As a <role>
  I want <capability>
  So that <benefit>

  Background:
    Given I am signed in as a traveler

  @T01 @AC-1
  Scenario: <Happy path in plain words>
    Given <context>
    When <action>
    Then <observable outcome>
    And the page has no accessibility violations

  @T02 @EC-1
  Scenario Outline: <Variation in plain words>
    Given <context with "<input>">
    When <action>
    Then I see the error "<message>"

    Examples:
      | input | message        |
      | <a>   | <message a>    |
      | <b>   | <message b>    |

  @T03 @AC-3 @i18n
  Scenario Outline: <Locale-dependent behavior>
    Given my locale is "<locale>"
    When <action>
    Then I see "<formatted>"

    Examples:
      | locale | formatted   |
      | en-US  | <value>     |
      | es-CO  | <value>     |
