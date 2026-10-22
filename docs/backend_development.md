# Backend Development Guide

This guide describes the Express backend that supports the portfolio's client feedback feature. It is a small local backend built as part of our student project, so the examples focus on running and understanding the current implementation.

## Run the Server

Use Node.js 18 or later. From the repository root, install backend dependencies and start the local server:

```sh
npm --prefix backend install
node backend/server.js
```

The server listens on port `3001`, serves `frontend/` at [http://localhost:3001/](http://localhost:3001/), and stores feedback in `backend/feedback.json`. Keep it running when testing the feedback form, since the browser sends requests to the same-origin API. Stop it with `Ctrl+C`.

When using Live Server to preview `frontend/`, leave this Express server running as well. The frontend directs local Live Server API calls to port `3001` and the backend allows requests from localhost origins.

## Vercel Feedback Storage

The root `vercel.json` publishes `frontend/` and includes `backend/feedback.json` for the function in `api/feedback.js`. That function serves `GET /api/feedback` from Upstash Redis when configured, seeding Redis from the JSON file on first use. Without Redis credentials, GET still returns the curated seed data so the feed can load; POST is disabled.

To accept submissions online, create an Upstash Redis database and add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to the Vercel project's Environment Variables. Set them for Production and Preview as needed, then redeploy. Vercel uses Redis for both review storage and an atomic per-client limit of five submissions per hour; if Redis is unavailable, submissions fail closed with HTTP `503`. Local Express submissions use an in-process limit of five per client per hour. Local limits reset when the server restarts.

## API Routes

### `GET /api/feedback`

Returns up to 20 approved reviews in newest-first order. Older curated seed records without a `status` are treated as approved for backward compatibility. New submissions remain private until approved.

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

The server validates every request independently of browser-side checks. Send `Content-Type: application/json`. The server rejects malformed JSON, request bodies larger than 8 KB, unknown fields, empty values, control characters, invalid ratings, and values over these limits: name 80 characters, project 100 characters, and feedback 1,000 characters. Rating must be a whole number from 1 through 5. A hidden `website` honeypot must remain empty. The browser limits are for usability; server validation is authoritative. Requests over the per-client allowance return HTTP `429` with `Retry-After`.

A valid request returns HTTP `202` with a receipt message. The review is stored with `status: "pending"` and is not returned by the public GET endpoint. The client does not add pending submissions to the public page.

## Review moderation

There is intentionally no public approval endpoint or admin credential in the website. Approve a review only through direct, authenticated storage access:

- **Local:** edit `backend/feedback.json` and change the chosen entry's `status` from `pending` to `approved`. Restarting the server is not required.
- **Vercel:** use the authenticated Upstash console to read the `team-petix:feedback` key, change the chosen entry's `status` to `approved`, and write the JSON array back. Never put the Redis token in frontend code or commit it to the repository.

Keep only reviews that have been checked. The system stores at most 500 records; newest records are retained when that bound is reached.

## How the Frontend Uses the API

The browser code lives in `frontend/js/script.js`. On page load, it calls `GET /api/feedback`, which returns at most 20 public reviews. The page initially renders only the first five to keep the section compact. When more than five are returned, the Show More / Show Less control reveals or collapses the remaining cards. The average rating is calculated from all valid reviews in the API response, not just the five currently visible.

When a visitor submits the form, the browser trims and checks required values and limits, then sends `POST /api/feedback` with the honeypot field. The server repeats validation, enforces rate limits, and records reviews as pending. On HTTP `202`, the frontend announces that the review awaits approval and leaves the public feed unchanged. On an error response, it announces the returned message in the form's live status region.

## Data and Limitations

The tracked `backend/feedback.json` file contains starter reviews. Local submissions modify that file, so avoid adding private or identifying client information and review changes before committing. Vercel submissions use Redis and do not write to the deployment filesystem.

Local storage validates the stored JSON before updates, serializes concurrent updates, and uses atomic replacement writes. Read, parse, and write failures return a storage error without replacing the existing data. Reviews are moderated before display, but approval is a manual operation through trusted storage access. The public API does not expose administrative operations.

## Development Checks

Run the automated review policy and API checks from the repository root with:

```sh
npm --prefix backend test
```

For a syntax check, run:

```sh
node --check backend/server.js
```

Then start the server and check `GET /api/feedback` in a browser or API client. When testing `POST /api/feedback`, remember that a successful request writes to `backend/feedback.json`.
