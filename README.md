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

- `index.html` main homepage
- `html/` individual member profile pages
- `css/style.css` shared styles and responsive layout
- `js/script.js` frontend interactions and API requests
- `assets/` favicon and team/member images
- `server.js` Express server and feedback API
- `feedback.json` local testimonial data
- `package.json` and `package-lock.json` project dependencies
- `docs/` project and backend documentation

## Technologies & Backend Stack Used
[](https://github.com/Srinder/Web_Systems_and_Technologies_TEAM-PETIX#technologies-used)

- **Frontend:** HTML5, CSS3, Responsive Grid & Flexbox, Web Accessibility Standards (WCAG / ARIA live regions)
- **Backend:** Node.js, Express.js (`server.js`)
- **Data Persistence:** Local JSON storage (`feedback.json`)
- **API Endpoints:** 
  - `GET /api/feedback` (Retrieves stored testimonials in newest-first order)
  - `POST /api/feedback` (Validates input rules and persists new review submissions)

## How to Run

From the repository root, install dependencies and start the server with these two commands:

```sh
npm install
node server.js
```

Then visit [http://localhost:3001/](http://localhost:3001/) in your browser. Keep the server running while testing the feedback form.

See the [Backend Development Guide](./docs/backend_development.md) for API endpoints, validation logic, and local storage behavior.

## Repository Layout

```text
assets/              Team and member images
css/                 Shared styles
docs/                Project and backend documentation
html/                Individual profile pages
js/                  Frontend interactions
index.html           Team homepage
server.js            Express API and local server
feedback.json        Local feedback data
```

## Project Notes

- [Project scope and objectives](./docs/project_documentation.md)
- [Backend development guide](./docs/backend_development.md)

This is a student project developed for learning and portfolio use. Feedback is stored locally in `feedback.json` for demonstration.