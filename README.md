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

- `index.html` main homepage for the team with advanced interactive components
- `html/` individual member profile pages
- `css/style.css` complete styling and responsive layout
- `js/script.js` interactive behavior, live feedback feed fetching, and progressive disclosure UI features
- `server.js` Node.js / Express backend server handling API routes and persistence
- `feedback.json` local persistent storage file for client testimonials
- `package.json` project dependencies and configuration
- `assets/images/` team logo, preview assets, and member photos

## Technologies & Backend Stack Used
[](https://github.com/Srinder/Web_Systems_and_Technologies_TEAM-PETIX#technologies-used)

- **Frontend:** HTML5, CSS3, Responsive Grid & Flexbox, Web Accessibility Standards (WCAG / ARIA live regions)
- **Backend:** Node.js, Express.js (`server.js`)
- **Data Persistence:** JSON-based local server storage (`feedback.json`)
- **API Endpoints:** 
  - `GET /api/feedback` (Retrieves stored testimonials in newest-first order)
  - `POST /api/feedback` (Validates input rules and persists new review submissions)

## How to Run

The application features a fully self-contained Express backend for client testimonials and persistent data storage. To run the server locally:

```sh
npm install
node server.js

Open [http://localhost:3001/](http://localhost:3001/) to view the site. Keep the server running while testing the feedback form; opening `index.html` directly does not connect to the API. Press `Ctrl+C` in the terminal to stop the server.

## Repository Layout

```text
index.html          Team homepage
html/               Individual profile pages
css/style.css       Shared site styles
js/script.js        Frontend interactions and API requests
server.js           Express server and feedback routes
feedback.json       Local feedback data
docs/               Project and backend documentation
```

## Project Notes

- [Project scope and objectives](./docs/project_documentation.md)
- [Backend development guide](./docs/backend_development.md)

This is a student project developed for learning and portfolio use. The feedback API and JSON storage are intended for local demonstration, not production use.