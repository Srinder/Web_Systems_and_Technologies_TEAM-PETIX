# Project Documentation & Scope



## Project Scope & SMART Objectives

* **Specific:** Build a fully responsive, multi-page student portfolio web system encompassing a shared team landing page and distinct individual profile pages for all four members, complete with WCAG-compliant accessibility and semantic navigation.
* **Measurable:** Achieve a 100/100 Lighthouse score for Accessibility and Best Practices, maintain sub-2-second load benchmarks, and guarantee absolute zero horizontal overflow across responsive viewports (320px to 1280px+).
* **Achievable:** Execute using foundational HTML5 semantic elements (`<nav>`, `<aside>`, `<main>`), modular CSS Flexbox/Grid stylesheets, and standard local development tools.
* **Realistic:** Deliverable within the academic project timeline using our collective data analytics and web technologies coursework experience without requiring paid plugins or external frameworks.
* **Time-bound:** Complete all development, cross-device testing, repository cleanups, and documentation updates prior to the final milestone 1 submission deadline.


## Risk Management & Contingency Strategy

* **Version Control & Merge Conflicts (Risk):** 
  * *Impact:* High. Concurrent edits to shared files (`index.html` or `css/style.css`) could cause Git merge conflicts and delay code integration.
  * *Contingency Strategy:* Team members will work on isolated feature branches and utilize descriptive commit messages. If a conflict occurs, the team will pause, review conflict markers collaboratively via VS Code Live Share, resolve them locally, and push a clean consolidated commit.

* **Responsive Layout & Accessibility Inconsistencies (Risk):** 
  * *Impact:* Medium. Edits on desktop viewports might inadvertently introduce horizontal overflow or break contrast ratios on smaller mobile screens (320px–700px).
  * *Contingency Strategy:* Enforce mobile-first testing using Chrome DevTools device emulators before merging any CSS updates. If contrast or overflow regressions are detected, revert immediately to the last stable baseline commit and re-apply fixes using verified CSS clamp or media query boundaries.

* **Timeline & Feature Delivery Delays (Risk):** 
  * *Impact:* Medium. Complex styling or documentation tasks falling behind schedule near the submission deadline.
  * *Contingency Strategy:* Prioritize core grading requirements (semantic structure, WCAG accessibility, and responsive stability) over optional enhancements. If necessary, redistribute pending documentation tasks among available team members to ensure all deliverables are finalized prior to the submission cutoff.