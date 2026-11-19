# Student Task Manager – Enhancements

The original task manager features and styling have been retained. The following additions were made:

- A local sign-in screen with first-use account creation and logout.
- NIE Odd Semester 2026–27 academic events, proctorship periods and holidays transcribed from the supplied tentative academic calendar PDF. Dates with events are marked in the calendar; selecting a date displays its events and personal tasks.
- A custom focus timer duration (1–600 minutes). The original 25-minute focus duration and 5-/15-minute break presets remain available.

## Run the project

Open the folder in VS Code and run `index.html` using the Live Server extension, or serve the folder through another localhost web server. The login uses the browser Web Crypto API, so use localhost or HTTPS rather than opening the HTML as a `file://` URL.

## Login note

This is a front-end demonstration login. The account and session are stored in the current browser's local storage; it is not server-side authentication and should not be used to protect sensitive information. Clearing browser storage removes the local account.

## Calendar source

The events are taken from `assets/NIE-Odd-Semester-Academic-Calendar-2026-27.pdf`. The source calendar is marked tentative and may be revised by the institution. The PDF lists dates and events but does not provide event times, so events are shown as date-based entries.
