# Team Petix
[](https://github.com/Srinder/Web_Systems_and_Technologies_TEAM-PETIX#team-petix)
A collaborative student portfolio website created as a web system and technologies project. This repository contains a team landing page and individual member profile pages built with HTML and CSS.

## Team Members
[](https://github.com/Srinder/Web_Systems_and_Technologies_TEAM-PETIX#team-members)

- Srinder Kour Singh
- Jasver Kour Singh
- Jonalyn Tumpong
- Ma. Carmela Paula Oreta

## Project Overview
[](https://github.com/Srinder/Web_Systems_and_Technologies_TEAM-PETIX#project-overview)
This project showcases the Team Petix group through a shared portfolio hub. The website includes:

- a team homepage with individual developer project spotlights
- featured project sections (including individual deployment showcases)
- member profile cards
- update and milestone content
- a persistent client testimonials and feedback system with real-time API rendering

## Website Structure
[](https://github.com/Srinder/Web_Systems_and_Technologies_TEAM-PETIX#website-structure)

- `index.html` main homepage for the team with advanced interactive components
- `html/` individual member profile pages
- `css/style.css` complete styling and responsive layout
- `js/script.js` interactive behavior, live feedback feed fetching, and progressive disclosure
- `server.js` Node.js / Express backend server handling API routes and persistence
- `feedback.json` local persistent storage file for client testimonials
- `assets/images/` team logo, preview assets, and member photos

## Technologies & Backend Stack Used
[](https://github.com/Srinder/Web_Systems_and_Technologies_TEAM-PETIX#technologies-used)

- **Frontend:** HTML5, CSS3, Responsive Grid & Flexbox, Web Accessibility Standards (WCAG / ARIA live regions)
- **Backend:** Node.js, Express.js (`server.js`)
- **Data Persistence:** JSON-based local server storage (`feedback.json`)
- **API Endpoints:**
  - `GET /api/feedback` (Retrieves stored testimonials)
  - `POST /api/feedback` (Validates and persists new review submissions)

## How to Run

The application includes an Express backend for client testimonials and persistent data storage. Run these commands from the repository root:

```sh
npm install
node server.js
```

Then visit `http://localhost:3001/`. The API and frontend are served from the same origin, so run the Express server when testing testimonial submissions.

See the [Backend Development Guide](./docs/backend_development.md) for API details and local data storage behavior.

## Project Documentation & Scope
For a detailed breakdown of our project targets and mitigation plans, please view our full documentation:
* 📁 **[Project Scope, SMART Objectives, & Risk Management](./docs/project_documentation.md)**
* **[Backend Development Guide](./docs/backend_development.md)**

## License
[](https://github.com/Srinder/Web_Systems_and_Technologies_TEAM-PETIX#license)
This project is intended for academic and portfolio use.