@F009
Feature: Invite friends to a trip by link
  As a trip owner
  I want to share one invite link with my friends
  So that we plan the trip together

  @T01 @AC-8 @a11y
  Scenario: Members see who is traveling
    Given I own the trip "Europe"
    And "Laura" and "Ana" are editors of "Europe"
    When I open the trip "Europe"
    Then the travelers list shows "Jose, Laura, Ana" in that order
    And "Jose" is marked as the owner
    And the page has no accessibility violations

  @T01 @AC-8
  Scenario: Owner alone sees an invitation prompt
    Given I own the trip "Europe"
    When I open the trip "Europe"
    Then the travelers list shows "Jose"
    And I see "Invite friends to plan together"

  @T01 @EC-8 @a11y
  Scenario: Long names are truncated but fully named
    Given I own the trip "Europe"
    And "Maria Fernanda de los Angeles Rodriguez Gomez" is an editor of "Europe"
    When I open the trip "Europe"
    Then the traveler "Maria Fernanda de los Angeles Rodriguez Gomez" is listed by full name
    And the page has no accessibility violations

  @T02 @AC-1 @a11y
  Scenario: Owner opens the invite link
    Given I own the trip "Europe"
    When I open the trip "Europe"
    And I open the invite card
    Then I see the invite link
    And I see the link expires in 7 days
    And the page has no accessibility violations

  @T02 @AC-2
  Scenario: Owner copies the invite link
    Given I own the trip "Europe"
    And I opened the invite card of "Europe"
    When I copy the invite link
    Then the clipboard holds the invite link
    And I hear "Copied"

  @T02 @AC-3
  Scenario: Owner resets the invite link
    Given I own the trip "Europe"
    And I opened the invite card of "Europe"
    When I reset the invite link and confirm
    Then I see a new invite link
    And I see the link expires in 7 days

  @T03 @AC-4 @EC-10 @a11y
  Scenario: Signed-in visitor joins
    Given "Jose" owns the trip "Europe" with an invite link
    And I am signed in as "Laura"
    When I open the invite link of "Europe"
    Then I see "Jose invited you to" and "Europe"
    And the page has no accessibility violations
    When I join the trip
    Then I am on the trip page of "Europe" with "You joined Europe"
    And "Europe" is on my home page

  @T03 @EC-1
  Scenario Outline: A member opens the invite link
    Given "Jose" owns the trip "Europe" with an invite link
    And I am signed in as "<member>"
    And "<member>" is a member of "Europe"
    When I open the invite link of "Europe"
    Then I am on the trip page of "Europe" with "You're already in this trip"

    Examples:
      | member |
      | Jose   |
      | Laura  |

  @T03 @AC-6 @AC-3 @EC-7 @a11y
  Scenario Outline: Dead links show the expired page
    Given "Jose" owns the trip "Europe" with an invite link
    And the invite link of "Europe" is <state>
    And I am signed in as "Laura"
    When I open the invite link of "Europe"
    Then I see "<message>"
    And I am not a member of "Europe"
    And the page has no accessibility violations

    Examples:
      | state          | message                                                   |
      | 8 days old     | This invite link has expired. Ask Jose for a new one.    |
      | reset          | This invite link has expired. Ask Jose for a new one.    |
      | for a deleted trip | This invite link has expired.                         |
      | unknown        | This invite link has expired.                             |

  @T03 @EC-4
  Scenario: Link reset while on the join page
    Given "Jose" owns the trip "Europe" with an invite link
    And I am signed in as "Laura"
    And I opened the invite link of "Europe"
    And the invite link of "Europe" is reset
    When I join the trip
    Then I see "This invite link has expired. Ask Jose for a new one."

  @T03 @AC-7
  Scenario: A full trip cannot be joined
    Given "Jose" owns the trip "Europe" with an invite link
    And "Europe" has 20 members
    And I am signed in as "Laura"
    When I open the invite link of "Europe"
    And I join the trip
    Then I see "This trip is full (20 travelers)"
    And I am not a member of "Europe"

  @T03 @EC-9 @i18n
  Scenario Outline: Join page in the visitor's locale
    Given "Jose" owns the trip "Europe" from "2026-11-20" to "2026-12-03" with an invite link
    And my locale is "<locale>"
    And I am signed in as "Laura"
    When I open the invite link of "Europe"
    Then I see "<dates>"
    And I see "<count>"

    Examples:
      | locale | dates          | count      |
      | en     | Nov 20 – Dec 3 | 1 traveler |
      | es     | 20 nov – 3 dic | 1 viajero  |

  @T04 @AC-5
  Scenario Outline: Signed-out visitor signs in and joins
    Given "Jose" owns the trip "Europe" with an invite link
    And I am signed out
    When I open the invite link of "Europe"
    And I sign in to join as <who>
    Then I am on the trip page of "Europe" with "You joined Europe"

    Examples:
      | who                          |
      | an existing user "Laura"     |
      | a new user named "Ana"       |

  @T04 @AC-6
  Scenario: Invite expires between the email and the click
    Given "Jose" owns the trip "Europe" with an invite link
    And I am signed out
    And I opened the invite link of "Europe"
    And I requested a sign-in link as "Laura"
    And the invite link of "Europe" is reset
    When I open my sign-in link
    Then I see "This invite link has expired. Ask Jose for a new one."

  @T05 @AC-9 @a11y
  Scenario: Owner removes a member
    Given I own the trip "Europe"
    And "Laura" is an editor of "Europe"
    When I open the trip "Europe"
    And I remove "Laura" and confirm
    Then the travelers list shows "Jose"
    And I hear "Laura removed"
    And the page has no accessibility violations

  @T05 @AC-9
  Scenario: Removed member loses access
    Given "Jose" owns the trip "Europe"
    And I am signed in as "Laura"
    And "Laura" was removed from "Europe"
    When I open the trip "Europe"
    Then I am on my home page with "You're no longer in this trip"

  @T05 @AC-10
  Scenario: Editor leaves the trip
    Given "Jose" owns the trip "Europe"
    And I am signed in as "Laura"
    And "Laura" is an editor of "Europe"
    When I open the trip "Europe"
    And I leave the trip and confirm
    Then I am on my home page with "You left Europe"
    And "Europe" is not on my home page

  @T05 @EC-2
  Scenario: Removed member rejoins with a valid link
    Given "Jose" owns the trip "Europe" with an invite link
    And I am signed in as "Laura"
    And "Laura" was removed from "Europe"
    When I open the invite link of "Europe"
    And I join the trip
    Then I am on the trip page of "Europe" with "You joined Europe"

  @T06 @AC-11 @a11y
  Scenario: Editor edits but cannot manage
    Given "Jose" owns the trip "Europe"
    And I am signed in as "Laura"
    And "Laura" is an editor of "Europe"
    When I open the trip "Europe"
    Then I see no "Delete trip", "Invite" or "Remove" controls
    When I rename the trip to "Europe 2027" and save
    Then the trip is named "Europe 2027"
    And the page has no accessibility violations

  @T07 @AC-11
  Scenario Outline: Editor cannot call owner actions
    Given "Jose" owns the trip "Europe"
    And I am signed in as "Laura"
    And "Laura" is an editor of "Europe"
    When I <action> through the API
    Then the API answers 403 "TRIP_FORBIDDEN"

    Examples:
      | action                     |
      | delete the trip            |
      | get the invite link        |
      | reset the invite link      |
      | remove "Jose"              |

  @T06 @EC-5
  Scenario: Removed while editing
    Given "Jose" owns the trip "Europe"
    And I am signed in as "Laura"
    And "Laura" is an editor of "Europe"
    And I opened the trip "Europe"
    And "Laura" was removed from "Europe"
    When I rename the trip to "Mine" and save
    Then I am on my home page with "You're no longer in this trip"

  @T06 @EC-6
  Scenario: Two editors save at once
    Given "Jose" owns the trip "Europe"
    And I am signed in as "Laura"
    And "Laura" is an editor of "Europe"
    And I opened the trip "Europe"
    And "Jose" renamed "Europe" to "Euro trip"
    When I rename the trip to "Mine" and save
    Then I see the version conflict message

  @T07 @AC-1
  Scenario: Invite from the Trip created toast
    Given I am signed in as "Jose"
    When I create the trip "Europe"
    And I choose "Invite friends" in the toast
    Then I am on the trip page of "Europe"
    And I see the invite link

  @T07 @a11y
  Scenario: Actions are disabled offline
    Given I own the trip "Europe"
    And "Laura" is an editor of "Europe"
    And I opened the invite card of "Europe"
    When I go offline
    Then I can still copy the invite link
    And reset and remove are disabled with an offline note
    And the page has no accessibility violations

  @T07 @i18n @a11y
  Scenario Outline: Travelers card in each locale
    Given my locale is "<locale>"
    And I own the trip "Europe"
    And "Laura" is an editor of "Europe"
    When I open the trip "Europe"
    Then I see "<count>"
    And the page has no accessibility violations

    Examples:
      | locale | count       |
      | en     | 2 travelers |
      | es     | 2 viajeros  |
