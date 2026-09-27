@F3
Feature: Account creation, sign-in and home page
  As a visitor who wants to plan a trip with friends
  I want to sign in with just my email and see my trips
  So that I can start using the app without a password

  @T00 @AC-1 @a11y
  Scenario: Signed-out visitor sees the landing page
    Given I am a visitor with no account
    When I open the site
    Then I see the landing page with a hero and an email field
    And the page has no accessibility violations

  @T01 @AC-2 @a11y
  Scenario: Requesting a magic link with a valid email
    Given I am a visitor with no account
    When I request a magic link for "ana@example.com"
    Then I see "Check your email for a sign-in link"
    And I see my email "ana@example.com" on the screen
    And the page has no accessibility violations

  @T01 @EC-3
  Scenario: Returning without clicking the magic link
    Given I requested a magic link for "ana@example.com" and did not click it
    When I open the site again
    Then I see the landing page with a hero and an email field

  @T01 @AC-9 @a11y
  Scenario: Invalid email format is rejected before sending
    Given I am a visitor with no account
    When I request a magic link for "not-an-email"
    Then I see the error "Enter a valid email address"
    And focus stays on the email field
    And no magic link is sent
    And the page has no accessibility violations

  @T01 @AC-12 @a11y
  Scenario: The email provider fails to send
    Given the email provider is failing
    When I request a magic link for "ana@example.com"
    Then I see the error "Something went wrong. Try again."
    And my email "ana@example.com" is still in the field
    And the page has no accessibility violations

  @T01 @AC-10 @EC-1 @a11y
  Scenario Outline: Cooldown after repeated requests
    Given I requested "<previous>" magic links for "ana@example.com" within 15 minutes
    When I request a magic link for "ana@example.com"
    Then I see "<outcome>"
    And the page has no accessibility violations

    Examples:
      | previous | outcome                                       |
      | 2        | Check your email for a sign-in link           |
      | 3        | Too many requests. Try again in a few minutes. |

  @T02 @AC-3
  Scenario Outline: Verifying an unexpired magic link
    Given <setup> "ana@example.com"
    When I open the magic link sent to "ana@example.com"
    Then I am signed in

    Examples:
      | setup                                  |
      | no account exists yet for               |
      | an account already exists for           |

  @T02 @EC-2
  Scenario: Opening the link on a different device
    Given I requested a magic link for "ana@example.com" on one device
    When I open that magic link on a different device
    Then I am signed in on that device

  @T02 @AC-11 @a11y
  Scenario: Opening an expired magic link
    Given my magic link for "ana@example.com" is more than 15 minutes old
    When I open that magic link
    Then I see "This link expired."
    And I see a button to send a new link
    And the page has no accessibility violations

  @T02 @AC-4 @EC-5 @a11y
  Scenario Outline: First-time name capture validates length
    Given I just verified my magic link for the first time
    When I submit "<name>" as my name
    Then <result>
    And the page has no accessibility violations

    Examples:
      | name                                                 | result                                            |
      | Ana                                                   | I see the home page                               |
      |                                                       | I see the error "Enter a name (1-50 characters)"  |
      | 12345678901234567890123456789012345678901234567890    | I see the home page                               |
      | 123456789012345678901234567890123456789012345678901   | I see the error "Enter a name (1-50 characters)"  |

  @T02 @AC-5 @AC-13
  Scenario: Returning member already has a name
    Given I am signed in as "Ana" who already has a name on file
    When I verify a new magic link
    Then I see the home page directly, with no name form
    And focus moves to the page's heading

  @T03 @AC-6
  Scenario: Visiting the site with an existing session
    Given I am signed in as "Ana"
    When I open the site
    Then I see the home page directly, with no landing page

  @T03 @AC-7 @a11y
  Scenario: Home page with an upcoming trip and other trips
    Given I am signed in as "Ana" with trips "Colombia trip" upcoming and "Peru trip" upcoming
    When I open the site
    Then I see "Hi, Ana"
    And I see "Colombia trip" as my next trip
    And I see "Peru trip" in my trip list
    And the page has no accessibility violations

  @T03 @AC-8 @EC-4 @a11y
  Scenario Outline: Home page empty state
    Given I am signed in as "Ana" with <trips>
    When I open the site
    Then I see the empty trips state with a "Create your first trip" button
    And the page has no accessibility violations

    Examples:
      | trips                       |
      | no trips                    |
      | only trips in the past      |

  @T03 @AC-14 @i18n
  Scenario Outline: Trip dates are locale-formatted
    Given my locale is "<locale>"
    And I am signed in as "Ana" with trips "Colombia trip" upcoming and "Peru trip" upcoming
    When I open the site
    Then I see "Colombia trip" with the date range formatted as "<formatted>"

    Examples:
      | locale | formatted        |
      | en     | Mar 3 - 10, 2027 |
      | es     | 3 - 10 mar 2027  |
