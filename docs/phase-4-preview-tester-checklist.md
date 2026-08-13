# QAIRU Hub protected Preview tester checklist

Preview URL: <https://qairu-hub-preview-nurdaulets-projects-3de7e07c.vercel.app>

This is a protected, live-data Preview for a small internal cohort. Do not share
the URL or your QAIRU Hub password. Use a test account and non-sensitive content.

## Before testing

- Confirm that the Vercel access screen only admits the intended tester.
- Use a fresh browser profile or private window where possible.
- Keep the browser console open and note any red errors.
- Because the project currently uses Supabase's limited default email service,
  coordinate sign-up and password-reset tests instead of running them in a burst.

## Account and recovery

- Create an account with an inbox you control.
- Record whether the confirmation email arrived, how long it took, the sender,
  and whether it landed in spam.
- Open the confirmation link and confirm that it returns to this Preview domain.
- Complete onboarding and confirm the profile persists after sign-out/sign-in.
- Request one password-reset email, open its link, set a new password, and confirm
  that the old password no longer signs in.

## Core product flow

- Visit Home, People, Communities, Projects, Events, Resources, Notifications,
  Messages, Settings, Opportunities, and Admin.
- Confirm that live pages do not show fictional demo people, counts, posts, or
  activity as real QAIRU data.
- Search and filter People, Projects, Events, and Resources, including a no-result
  search and a refresh/back-navigation check.
- Open detail pages and try the normal member actions available to your account.
- Confirm that direct links to authenticated pages redirect correctly after
  signing out.
- Confirm Opportunities remains a deliberate placeholder and that Admin does not
  grant access to a normal member.

## Two-account and realtime check

Use two different test accounts in independent browser sessions.

- Start or open a conversation and send messages in both directions.
- Confirm each message appears in the other session without a manual refresh.
- Confirm notifications update correctly and do not leak another user's private
  conversation or account data.
- Sign one account out and confirm its protected pages are no longer accessible.

## Device and quality check

- Repeat sign-in and one core flow on both desktop and phone over HTTPS.
- Check light and dark themes, keyboard navigation, focus visibility, mobile
  layout, loading states, empty states, and error messages.
- Visit an invalid URL while signed in and confirm a usable not-found state.
- Note slow pages, failed requests, console errors, or unexpected redirects.

## Report format

For each issue, send:

- tester/account label (never the password);
- device, browser, and approximate time;
- page URL and steps to reproduce;
- expected result and actual result;
- screenshot or console error, if available;
- whether it reproduces after refresh.
