# Backend Development Guide

This guide describes the Express backend that supports the portfolio's client feedback feature. It is a small local backend built as part of our student project, so the examples focus on running and understanding the current implementation.

## Run the Server

Use Node.js 18 or later. From the repository root, install the backend dependencies and start the server:

```sh
npm --prefix backend install
node backend/server.js
```

The server listens on port `3001` and serves the site at [http://localhost:3001/](http://localhost:3001/). Keep it running when testing the feedback form, since the browser sends requests to the same-origin API. Stop it with `Ctrl+C`.

## Vercel Deployment

The repository-root `vercel.json` publishes `frontend/` and configures the root `api/feedback.js` Vercel Function to include `backend/feedback.json`. Vercel maps this function to `/api/feedback`; the function entrypoint reuses the Express app from `backend/server.js`. The local `app.listen()` runs only when `backend/server.js` is executed directly outside production, and uses `PORT` when provided.

`backend/feedback.json` is suitable for local demos, but a serverless deployment does not provide reliable persistent writes to an application JSON file. Use a managed database or another persistent storage service before relying on feedback submissions in production.

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

The browser code lives in `frontend/js/script.js`. On page load, it calls `GET /api/feedback`. The response contains the complete review list in `data`; the page initially renders only the first five to keep the section compact. When more than five exist, the Show More / Show Less control reveals or collapses the remaining cards. The average rating is calculated from all valid reviews in `data`, not just the five currently visible.

When a visitor submits the form, the browser trims the values and checks required fields, the rating range, and field lengths before sending `POST /api/feedback`. The server repeats validation because requests can bypass the browser. On HTTP `201`, the frontend adds the returned `data` item, recalculates the average, refreshes the feed, and announces the response message without reloading the page. On an error response, it announces the returned message in the form's live status region.

## Data and Limitations

Reviews are stored in `backend/feedback.json`. The file is tracked and includes starter feedback, so new submissions modify a tracked file. Avoid adding private or identifying client information to this demonstration data, and review changes to the file before committing.

The current implementation uses synchronous local file reads and writes. It does not use a database, authentication, moderation, or rate limiting, and its validation is intentionally basic. These choices are suitable for demonstrating the feature locally, but should be revisited before using the API publicly.

## Development Checks

The `test` script in `backend/package.json` is still a placeholder; there is no automated test suite configured yet. After changing the server, run a syntax check from the repository root with:

```sh
node --check backend/server.js
```

Then start the server and check `GET /api/feedback` in a browser or API client. When testing `POST /api/feedback`, remember that a successful request writes to `backend/feedback.json`.