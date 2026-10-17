# Backend Development Guide

This guide describes the Express backend that supports the portfolio's client feedback feature. It is a small local backend built as part of our student project, so the examples focus on running and understanding the current implementation.

## Run the Server

Use Node.js 18 or later. From the repository root, install dependencies and start the local server:

```sh
npm install
node server.js
```

The server listens on port `3001`, serves the site at [http://localhost:3001/](http://localhost:3001/), and stores feedback in the root `feedback.json` file. Keep it running when testing the feedback form, since the browser sends requests to the same-origin API. Stop it with `Ctrl+C`.

## API Routes

### `GET /api/feedback`

Returns saved reviews in newest-first order:

```json
{
  "success": true,
  "data": []
}
```

Each item in `data` includes an `id`, `clientName`, `projectType`, `rating`, `feedback`, and ISO-formatted `date`.

### `POST /api/feedback`

Send a JSON body with the review details:

```json
{
  "clientName": "Client Name",
  "projectType": "Project or service",
  "rating": 5,
  "feedback": "Feedback text"
}
```

The server validates every request independently of browser-side checks:

- `clientName` must be a non-empty string after trimming and no longer than 100 characters.
- `projectType` may be omitted or empty; otherwise it must be a string no longer than 120 characters. An omitted or empty value is saved as `General Portfolio`.
- `rating` must be a whole number from 1 through 5. Numeric strings are accepted for form-encoded requests; decimals and other types are rejected.
- `feedback` must be a non-empty string after trimming and no longer than 2,000 characters.

Invalid input returns HTTP `400` with `{ "success": false, "message": "..." }`. A valid request returns HTTP `201`, a confirmation message, and the saved review in `data`.

## How the Frontend Uses the API

The browser code lives in `js/script.js`. On page load, it calls `GET /api/feedback`. The response contains the complete review list in `data`; the page initially renders only the first five to keep the section compact. When more than five exist, the Show More / Show Less control reveals or collapses the remaining cards. The average rating is calculated from all valid reviews in `data`, not just the five currently visible.

When a visitor submits the form, the browser trims the values and checks required fields, the rating range, and field lengths before sending `POST /api/feedback`. The server repeats validation because requests can bypass the browser. On HTTP `201`, the frontend adds the returned `data` item, recalculates the average, refreshes the feed, and announces the response message without reloading the page. On an error response, it announces the returned message in the form's live status region.

## Data and Limitations

Reviews are stored in the tracked root `feedback.json` file. New submissions modify that file, so avoid adding private or identifying client information and review changes before committing.

The backend uses synchronous local file reads and writes. The API does not include authentication, moderation, or rate limiting, so submissions should be reviewed before being presented publicly.

## Development Checks

The `test` script in `package.json` is still a placeholder; there is no automated test suite configured yet. After changing the server, run a syntax check from the repository root with:

```sh
node --check server.js
```

Then start the server and check `GET /api/feedback` in a browser or API client. When testing `POST /api/feedback`, remember that a successful request writes to `feedback.json`.