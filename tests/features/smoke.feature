@smoke
Feature: App shell
  As a visitor
  I want the app to load in my language
  So that I can start planning a trip

  Scenario: Home page loads in the default locale
    Given I open the home page
    Then I see the heading "Travel Planning"
    And the page has no accessibility violations

  @i18n
  Scenario Outline: Home page loads in each supported locale
    Given my locale is "<locale>"
    Then I see the text "<tagline>"

    Examples:
      | locale | tagline                               |
      | en     | Plan and budget trips together.       |
      | es     | Planea y presupuesta viajes en grupo. |
