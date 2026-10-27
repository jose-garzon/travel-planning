@F005
Feature: Create a trip with a boarding-pass form and see it on home
  As a traveler
  I want to create a multi-city trip in one form
  So that I see my route as boarding passes on my home page

  Background:
    Given I am signed in as "Ana"

  @T01 @AC-1 @a11y
  Scenario: Create a trip with one leg
    When I start a new trip
    And I name the trip "Europe with friends"
    And I set leg 1 from "Bogotá" to "Madrid"
    And I create the trip
    Then I see "Europe with friends" as my next trip
    And I see "Trip created"
    And the page has no accessibility violations

  @T01 @EC-11
  Scenario: Trip name is required
    When I start a new trip
    And I set leg 1 from "Bogotá" to "Madrid"
    And I create the trip
    Then I see the error "Trip name is required"
    And focus is on the field "Trip name"

  @T01 @AC-6 @i18n
  Scenario Outline: Currency defaults from browser locale
    Given my browser language is "<language>"
    When I start a new trip
    Then the currency is "<currency>"

    Examples:
      | language | currency |
      | es-CO    | COP      |
      | en-US    | USD      |
      | en       | USD      |

  @T02 @AC-3 @i18n @a11y
  Scenario Outline: Search a city in my language
    Given my locale is "<locale>"
    When I start a new trip
    And I search "<query>" in leg 1 "<to-field>"
    Then I see the city option "<option>"
    And the page has no accessibility violations

    Examples:
      | locale | query | to-field | option        |
      | en     | lond  | To       | LON London    |
      | es     | lond  | Hasta    | LON Londres   |

  @T02 @EC-1
  Scenario: From city is not offered as destination
    When I start a new trip
    And I set leg 1 from "Madrid" to nothing
    And I search "madr" in leg 1 "To"
    Then I do not see the city option "MAD Madrid"

  @T03 @AC-2 @EC-9 @a11y
  Scenario: Adding legs chains cities; removing re-chains
    When I start a new trip
    And I set leg 1 from "Bogotá" to "Madrid"
    And I add a leg
    Then leg 2 starts from "Madrid"
    When I set leg 2 to "Rome"
    And I add a leg
    And I set leg 3 to "Paris"
    And I remove leg 2
    Then leg 2 starts from "Madrid"
    And the page has no accessibility violations

  @T03 @AC-5 @EC-10
  Scenario: Add the return home leg
    When I start a new trip
    And I set leg 1 from "Bogotá" to "Madrid"
    And I add the return home leg
    Then leg 2 goes from "Madrid" to "Bogotá"
    And I cannot add the return home leg

  @T03 @AC-4 @EC-3 @EC-5
  Scenario Outline: Invalid dates block the save
    When I start a new trip
    And I name the trip "Europe"
    And I set leg 1 from "Bogotá" to "Madrid" on day <first>
    And I add a leg
    And I set leg 2 to "Rome" on day <second>
    And I create the trip
    Then I see the error "<message>"
    And the trip is not saved

    Examples:
      | first | second | message                       |
      | +10   | +5     | Must be on or after           |
      | -1    | +5     | Pick today or a later date    |

  @T03 @EC-2
  Scenario: Same city in different legs
    When I start a new trip
    And I name the trip "Colombia"
    And I set leg 1 from "Bogotá" to "Cartagena"
    And I add a leg
    And I set leg 2 to "Bogotá"
    And I add a leg
    And I set leg 3 to "Medellín"
    And I create the trip
    Then I see "Colombia" as my next trip

  @T03 @EC-7 @EC-8
  Scenario: Leg limits
    When I start a new trip
    Then I cannot remove leg 1
    When I add legs until there are 10
    Then I cannot add a leg
    And I see "Up to 10 legs"

  @T04 @AC-7 @a11y
  Scenario: Home shows takeoff, stops and back home
    Given I have a trip "Europe" with route:
      | from   | to        | day |
      | Bogotá | Madrid    | +10 |
      | Madrid | Barcelona | +13 |
      | Barcelona | Bogotá | +18 |
    When I open the home page
    Then the trip stops are "Takeoff BOG, MAD, BCN, Back home BOG"
    And the stop "MAD" shows "Stop 1 of 2" and "3 nights"
    And the page has no accessibility violations

  @T04 @AC-8
  Scenario Outline: Current stop follows today
    Given I have a trip "Europe" with route:
      | from      | to        | day      |
      | Bogotá    | Madrid    | <first>  |
      | Madrid    | Barcelona | <second> |
    When I open the home page
    Then the current stop is "<current>"

    Examples:
      | first | second | current |
      | +10   | +13    | MAD     |
      | -2    | +3     | MAD     |
      | -5    | -1     | BCN     |

  @T04 @AC-9 @EC-12
  Scenario: Earliest trip takes the carousel; others are compact
    Given I have a trip "Peru" with route:
      | from   | to   | day |
      | Lima   | Cusco | +40 |
    And I have a trip "Europe" with route:
      | from   | to     | day |
      | Bogotá | Madrid | +10 |
    When I open the home page
    Then I see "Europe" as my next trip
    And I see "Peru" in my trip list with "LIM → CUZ"

  @T04 @AC-9
  Scenario: Past trips move to other trips
    Given I have a trip "Old trip" with route:
      | from   | to     | day |
      | Bogotá | Lima   | -30 |
    When I open the home page
    Then I see "No upcoming trips"
    And I see "Old trip" in my trip list

  @T05 @AC-10 @a11y
  Scenario: Edit a trip
    Given I have a trip "Europe" with route:
      | from   | to     | day |
      | Bogotá | Madrid | +10 |
    When I open the trip "Europe"
    And I name the trip "Europe 2027"
    And I save the changes
    Then I see "Europe 2027" as my next trip
    And the page has no accessibility violations

  @T05 @AC-10
  Scenario: Stale edit conflict
    Given I have a trip "Europe" with route:
      | from   | to     | day |
      | Bogotá | Madrid | +10 |
    When I open the trip "Europe"
    And someone else changes the trip "Europe"
    And I name the trip "Mine"
    And I save the changes
    Then I see "This trip changed. Reload to see the latest."

  @T05 @AC-11
  Scenario: Delete a trip
    Given I have a trip "Europe" with route:
      | from   | to     | day |
      | Bogotá | Madrid | +10 |
    When I open the trip "Europe"
    And I delete the trip and confirm
    Then I see "Trip deleted"
    And I do not see "Europe" on the home page

  @T05 @AC-12
  Scenario: Leaving with unsaved changes
    When I start a new trip
    And I name the trip "Draft"
    And I go back to the home page
    Then I see the dialog "Discard changes?"
