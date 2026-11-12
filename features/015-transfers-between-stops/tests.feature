@F015
Feature: Transfers between destinations
  As a traveler in a group trip
  I want to see how we move between cities, with times and costs
  So that nobody misses a flight, train or bus

  Background:
    Given I am signed in as a traveler
    And I own a trip from "Bogotá" to "Cartagena" on "2027-03-15" and to "Santa Marta" on "2027-03-19"

  @T01 @AC-1
  Scenario: Gaps show transfers or an empty slot
    Given the trip has a flight from "Bogotá" to "Cartagena" on "2027-03-15"
    When I open the trip
    Then the gap before "Cartagena" shows 1 transfer
    And the gap before "Santa Marta" asks "How do you get to Santa Marta?"
    And the page has no accessibility violations

  @T01 @EC-5
  Scenario: Several transfers sorted by departure
    Given the trip has a bus from "Cartagena" to "Santa Marta" on "2027-03-19" at "14:00"
    And the trip has a bus from "Cartagena" to "Santa Marta" on "2027-03-19" at "08:00"
    When I open the trip
    Then the transfers before "Santa Marta" are in this order: "08:00", "14:00"

  @T01 @EC-8
  Scenario: One-destination trip gaps
    Given I own a trip from "Bogotá" to "Lima" on "2027-05-02"
    When I open that trip
    Then I see a gap before "Lima"
    And I see a return gap after "Lima"

  @T02 @AC-2
  Scenario: Add a transfer with from and to prefilled
    When I open the trip
    And I start adding a transfer before "Santa Marta"
    Then the transfer form shows from "Cartagena" and to "Santa Marta"
    When I save a "Bus" transfer on "2027-03-19"
    Then the gap before "Santa Marta" shows 1 transfer
    And the page has no accessibility violations

  @T02 @AC-3 @EC-2 @EC-3
  Scenario: Duration across time zones
    Given I own a trip from "Bogotá" to "Madrid" on "2027-06-01"
    When I add a "Flight" transfer before "Madrid" departing "2027-06-01" at "18:00" and arriving "2027-06-02" at "10:30"
    Then the transfer shows a duration of "9 hr 30 min"
    And the transfer shows the arrival as next day

  @T02 @EC-4
  Scenario: Transfer without times
    When I add a "Train" transfer before "Santa Marta" on "2027-03-19" without times or cost
    Then the transfer shows "No price yet"
    And the transfer shows no duration

  @T02 @AC-4
  Scenario: Arrival before departure
    When I add a "Bus" transfer before "Santa Marta" departing "2027-03-19" at "12:00" and arriving "2027-03-19" at "09:00"
    Then I see the error "Arrival must be after departure."
    And the transfer is not saved

  @T02 @AC-4
  Scenario: Date outside the gap warns but saves
    When I add a "Bus" transfer before "Santa Marta" on "2027-03-25"
    Then I see the warning "Doesn't match route dates"
    And the gap before "Santa Marta" shows 1 transfer

  @T02 @EC-10
  Scenario: Cost in another currency
    Given the trip currency is "COP"
    When I add a "Flight" transfer before "Cartagena" on "2027-03-15" costing 100 "USD" at rate "4000"
    Then my budget includes 400000 "COP" for transfers

  @T02
  Scenario: Edit and delete a transfer
    Given the trip has a flight from "Bogotá" to "Cartagena" on "2027-03-15"
    When I change the transfer's booking reference to "AV9512"
    Then the transfer shows "AV9512"
    When I delete the transfer
    Then the gap before "Cartagena" asks "How do you get to Cartagena?"

  @T03 @AC-5
  Scenario: All-travelers transfer in every budget
    Given the trip has 3 travelers
    And the trip has a flight from "Bogotá" to "Cartagena" costing 100 "COP" for all travelers
    When I open the budget
    Then each traveler's share includes 100 "COP" for transfers
    And the trip total for transfers is 300 "COP"

  @T03 @EC-7
  Scenario: Member leaves, all-travelers total shrinks
    Given the trip has 3 travelers
    And the trip has a flight from "Bogotá" to "Cartagena" costing 100 "COP" for all travelers
    When one traveler leaves the trip
    Then the trip total for transfers is 200 "COP"

  @T03 @AC-11
  Scenario: Transfers group in the budget
    Given the trip has a flight from "Bogotá" to "Cartagena" costing 100 "COP" for all travelers
    When I open the budget
    Then the "Transfers" group lists "Bogotá → Cartagena"
    And the page has no accessibility violations

  @T03 @AC-10
  Scenario: Flights become transfers
    Given the trip had a flight budget item "AV 9512" of 180 "COP" for me before the update
    When the flights migration runs
    Then the gap before "Cartagena" shows 1 transfer
    And my budget includes 180 "COP" for transfers
    And the budget has no "Flights" category

  @T04 @AC-6
  Scenario: Join and leave an opt-in transfer
    Given the trip has 2 travelers
    And the trip has an opt-in bus from "Cartagena" to "Santa Marta" costing 25 "COP"
    When I join the transfer
    Then the transfer shows "1 of 2"
    And my budget includes 25 "COP" for transfers
    When I leave the transfer
    Then my budget includes 0 "COP" for transfers

  @T04 @EC-6
  Scenario: Opt-in nobody joined costs nothing
    Given the trip has 2 travelers
    And the trip has an opt-in bus from "Cartagena" to "Santa Marta" costing 25 "COP"
    When I open the trip
    Then the transfer shows "0 of 2"
    And the trip total for transfers is 0 "COP"

  @T05 @AC-7
  Scenario: Find options and approve one
    Given the assistant will suggest a flight from "Bogotá" to "Cartagena" with source "https://example.com/flight"
    When I open the trip
    And I find options for the gap before "Cartagena"
    Then the assistant shows a transfer option with a source link
    When I approve the transfer option
    Then the gap before "Cartagena" shows 1 transfer
    And the transfer links to "https://example.com/flight"

  @T05 @AC-7
  Scenario: No options found
    Given the assistant will suggest nothing
    When I open the trip
    And I find options for the gap before "Cartagena"
    Then I see "No options found. Add it yourself"
    When I choose to add it myself
    Then the transfer form shows from "Bogotá" and to "Cartagena"

  @T06 @AC-8
  Scenario: Next up card with countdown
    Given today is "2027-03-14"
    And the trip has a flight from "Bogotá" to "Cartagena" on "2027-03-15" at "09:40"
    When I open the home page
    Then the next trip shows the transfer "Bogotá" to "Cartagena" leaving tomorrow
    And the page has no accessibility violations

  @T06 @EC-9
  Scenario: Past transfer is muted and not next up
    Given today is "2027-03-18"
    And the trip has a flight from "Bogotá" to "Cartagena" on "2027-03-15"
    And the trip has a bus from "Cartagena" to "Santa Marta" on "2027-03-19"
    When I open the home page
    Then the next trip shows the transfer "Cartagena" to "Santa Marta"
    When I open the trip
    Then the transfer to "Cartagena" is shown as past

  @T06 @AC-9 @EC-1
  Scenario: Route change flags a transfer
    Given the trip has a bus from "Cartagena" to "Santa Marta" on "2027-03-19"
    When I change the trip's second destination to "Barranquilla"
    Then the transfer to "Santa Marta" shows "Route changed. Check from/to"

  @T06 @AC-8
  Scenario: Next transfer stays off home until the day before
    Given today is "2027-03-13"
    And the trip has a flight from "Bogotá" to "Cartagena" on "2027-03-15" at "09:40"
    When I open the home page
    Then the next trip shows no transfer

  @T07 @AC-12 @a11y @i18n
  Scenario Outline: Transfer read as one sentence
    Given my locale is "<locale>"
    And the trip has a flight from "Bogotá" to "Cartagena" on "2027-03-15" at "09:40" arriving at "11:05"
    When I open the trip
    Then the transfer is announced as "<sentence>"
    And the page has no accessibility violations

    Examples:
      | locale | sentence                                                                                          |
      | en     | Flight from Bogotá to Cartagena, Monday, March 15, departs 9:40 AM, arrives 11:05 AM, 1 hr 25 min |
      | es     | Vuelo de Bogotá a Cartagena, lunes, 15 de marzo, sale 09:40, llega 11:05, 1 h 25 min              |

  @T07 @EC-11
  Scenario: Long city names wrap
    Given I own a trip from "Bogotá" to "San Andrés de Providencia y Santa Catalina" on "2027-04-01"
    And that trip has a flight before "San Andrés de Providencia y Santa Catalina"
    When I open that trip on a phone
    Then the full city name "San Andrés de Providencia y Santa Catalina" is visible
    And the page has no accessibility violations
