# Backend Development Guide

## Run Locally

The Express backend, package manifests, and feedback data file are in the repository root. From that directory, install dependencies and start the server:

```sh
npm install
node server.js
```

The server listens on port `3001` and serves the portfolio at `http://localhost:3001/`. The feedback form uses same-origin API requests, so run this server rather than opening `index.html` directly when testing submissions.

## API

### `GET /api/feedback`

Returns all saved testimonials, newest first:

```json
{
  "success": true,
  "data": []
}
```

### `POST /api/feedback`

Accepts a JSON request with the following fields:

```json
{
  "clientName": "Client Name",
  "projectType": "Project or service",
  "rating": 5,
  "feedback": "Feedback text"
}
```

`clientName`, `rating`, and `feedback` are required. `rating` must be between 1 and 5. `projectType` is optional and defaults to `General Portfolio`. A successful submission returns HTTP `201` with the saved entry; invalid required fields or an out-of-range rating return HTTP `400` with a message.

Saved entries include an ID and ISO timestamp. The frontend renders returned text as text content and updates its testimonial list and average rating after submission.

## Persistence and Development Notes

The server stores entries in the repository-root `feedback.json`. This file is included in the repository and currently contains one review. New submissions update the file; review those changes before committing because the data is tracked. This is local JSON-file storage, not a database, and the server currently reads and writes the file synchronously.

The root `package.json` currently has no automated test suite configured. When extending the API, validate both successful and invalid requests. For a deployed or multi-user backend, add stronger input validation, moderation/rate limiting, and a database-backed persistence layer.