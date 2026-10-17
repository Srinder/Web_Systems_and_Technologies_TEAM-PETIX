# Team Petix
[](https://github.com/Srinder/Web_Systems_and_Technologies_TEAM-PETIX#team-petix)
A collaborative student portfolio website created as a web system and technologies project. This repository contains a team landing page, individual member profile pages, interactive feedback processing, and deployed project showcases built with Node.js, Express, HTML, and CSS.

## Team Members
[](https://github.com/Srinder/Web_Systems_and_Technologies_TEAM-PETIX#team-members)

- Srinder Kour Singh
- Jasver Kour Singh
- Jonalyn Tumpong
- Ma. Carmela Paula Oreta

## Project Overview
[](https://github.com/Srinder/Web_Systems_and_Technologies_TEAM-PETIX#project-overview)
This project showcases the Team Petix group through a shared portfolio hub. The website includes:

- a team homepage with individual developer project spotlights (including individual deployment showcases like *Wings and Chops*)
- featured project sections
- member profile cards
- update and milestone content
- a persistent client testimonials and feedback system with real-time API rendering and progressive disclosure

## Website Structure
[](https://github.com/Srinder/Web_Systems_and_Technologies_TEAM-PETIX#website-structure)

- `frontend/index.html` main homepage
- `frontend/html/` individual member profile pages
- `frontend/css/style.css` shared styles and responsive layout
- `frontend/js/script.js` frontend interactions and API requests
- `frontend/assets/` favicon and team/member images
- `api/feedback.js` Vercel Function entry point for feedback requests
- `backend/server.js` Express server and feedback API
- `backend/feedback.json` local testimonial data
- `backend/package.json` and `backend/package-lock.json` backend dependencies
- `docs/` project and backend documentation

## Technologies & Backend Stack Used
[](https://github.com/Srinder/Web_Systems_and_Technologies_TEAM-PETIX#technologies-used)

- **Frontend:** HTML5, CSS3, Responsive Grid & Flexbox, Web Accessibility Standards (WCAG / ARIA live regions)
- **Backend:** Node.js, Express.js (`backend/server.js`)
- **Data Persistence:** JSON-based local server storage (`backend/feedback.json`)
- **API Endpoints:** 
  - `GET /api/feedback` (Retrieves stored testimonials in newest-first order)
  - `POST /api/feedback` (Validates input rules and persists new review submissions)

## How to Run

From the repository root, install the backend dependencies and start the server with these two commands:

```sh
npm --prefix backend install
node backend/server.js
```

Then visit [http://localhost:3001/](http://localhost:3001/) in your browser. Keep the server running while testing the feedback form.

See the [Backend Development Guide](./docs/backend_development.md) for API endpoints, validation logic, and local storage behavior.

## Deploy to Vercel

The root `vercel.json` publishes `frontend/` and traces `backend/feedback.json` for the Vercel Function at `api/feedback.js`. Vercel maps that function to `/api/feedback`; connect this GitHub repository to deploy updates from the configured branch. The current JSON-file feedback storage is for local development; use a persistent database before relying on public submissions in a serverless deployment.


## Repository Layout

```text
api/                  Vercel Function entry point
backend/             Express API, dependencies, and feedback data
frontend/            Homepage, profiles, styles, scripts, and assets
docs/                Project and backend documentation
.gitignore           Local dependency ignore rules
README.md             Project overview and setup
```

## Project Notes

- [Project scope and objectives](./docs/project_documentation.md)
- [Backend development guide](./docs/backend_development.md)

This is a student project developed for learning and portfolio use. The feedback API and JSON storage are intended for local demonstration, not production use.