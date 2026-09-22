document.addEventListener('DOMContentLoaded', () => {
  // Handle click navigation for team cards on the main home page
  const teamCards = document.querySelectorAll('.team-card');

  teamCards.forEach(card => {
    card.addEventListener('click', (event) => {
      // Don't trigger if the user clicked directly on an <a> link tag inside
      if (event.target.tagName === 'A') return;

      const targetUrl = card.getAttribute('data-href');
      if (targetUrl) {
        window.location.href = targetUrl;
      }
    });
  });
});