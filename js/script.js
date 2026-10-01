document.addEventListener('DOMContentLoaded', () => {

  const sectionNavLinks = Array.from(document.querySelectorAll('.side-nav a[href^="#"]'));
  const setActiveSectionLink = (activeLink) => {
    sectionNavLinks.forEach((link) => {
      const isActive = link === activeLink;
      link.classList.toggle('active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  sectionNavLinks.forEach((link) => {
    link.addEventListener('click', () => setActiveSectionLink(link));
  });

  const syncActiveSectionLink = () => {
    const activeLink = sectionNavLinks.find((link) => link.hash === window.location.hash);
    if (activeLink) setActiveSectionLink(activeLink);
  };

  window.addEventListener('hashchange', syncActiveSectionLink);
  syncActiveSectionLink();

  if (typeof emailjs !== 'undefined') {
    emailjs.init('5E7cMI8TTdzpkP5Sz');
  }
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

  // 2. Interactive Contact Form Submission
  const contactForm = document.getElementById('contact-form');

   if (contactForm) {
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const messageInput = document.getElementById('message');
    const feedback = document.getElementById('contact-feedback');
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const submitLabel = submitButton.textContent;

    const showFeedback = (message, type) => {
      feedback.textContent = message;
      feedback.classList.remove('is-success', 'is-error');
      feedback.classList.add(`is-${type}`);
      feedback.hidden = false;
    };

    if (nameInput) {
      nameInput.addEventListener('input', () => {
        nameInput.value = nameInput.value.replace(/[^a-zA-Z\s.-]/g, '');
      });
    }

    if (emailInput) {
      emailInput.addEventListener('input', () => {
        emailInput.value = emailInput.value.replace(/\s/g, '');
      });
    }

    contactForm.addEventListener('input', () => {
      feedback.hidden = true;
      feedback.classList.remove('is-success', 'is-error');
    });

    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const name = nameInput ? nameInput.value.trim() : 'User';
      const email = emailInput ? emailInput.value.trim() : '';
      const message = messageInput ? messageInput.value.trim() : '';

      feedback.hidden = true;
      feedback.classList.remove('is-success', 'is-error');
      if (nameInput) nameInput.style.borderColor = '';
      if (emailInput) emailInput.style.borderColor = '';

      const namePattern = /^[a-zA-Z\s.-]+$/;
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      if (!namePattern.test(name)) {
        showFeedback('Please enter a valid name (letters and spaces only, no numbers).', 'error');
        if (nameInput) {
          nameInput.style.borderColor = '#dc2626';
          nameInput.focus();
        }
        return;
      }

      if (!emailPattern.test(email)) {
        showFeedback('Please enter a valid email address (e.g., name@example.com).', 'error');
        if (emailInput) {
          emailInput.style.borderColor = '#dc2626';
          emailInput.focus();
        }
        return;
      }

      const templateParams = {
        to_name: name,
        to_email: email,
        message: message,
        from_name: 'Team Petix'
      };

      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';

      try {
        if (typeof emailjs === 'undefined') {
          throw new Error('The message service is unavailable.');
        }

        await emailjs.send('service_o3vc1j4', 'template_lzpkfcf', templateParams);
        showFeedback(`Message sent successfully, ${name}. Our team will review your message and follow up at ${email}.`, 'success');
        contactForm.reset();
      } catch (error) {
        console.error('Failed to send message.', error);
        showFeedback('We could not send your message right now. Please try again.', 'error');
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = submitLabel;
      }
    });
  }

  const themeToggle = document.getElementById('theme-toggle');
  const themeStorageKey = 'teamPetixTheme';
  let darkMode = false;

  try {
    darkMode = localStorage.getItem(themeStorageKey) === 'dark';
  } catch {
    darkMode = false;
  }

  const applyTheme = () => {
    document.body.classList.toggle('dark-mode', darkMode);
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', String(darkMode));
      themeToggle.setAttribute('aria-label', `Switch to ${darkMode ? 'light' : 'dark'} mode`);
      themeToggle.querySelector('.theme-icon').innerHTML = darkMode ? '&#9728;' : '&#9790;';
      themeToggle.querySelector('.theme-label').textContent = `${darkMode ? 'Light' : 'Dark'} mode`;
    }
  };

  applyTheme();

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      darkMode = !darkMode;
      applyTheme();
      try {
        localStorage.setItem(themeStorageKey, darkMode ? 'dark' : 'light');
      } catch {
        // Keep the selected theme active for the current page.
      }
    });
  }

  const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
  const filterCards = Array.from(document.querySelectorAll('.team-card[data-category]'));

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      filterButtons.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-pressed', String(isActive));
      });

      filterCards.forEach((card) => {
        card.hidden = filter !== 'all' && card.dataset.category !== filter;
      });
    });
  });

  const counters = Array.from(document.querySelectorAll('[data-counter]'));
  const animateCounter = (counter) => {
    const target = Number(counter.dataset.counter);
    const duration = 1200;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      counter.textContent = String(target);
      return;
    }

    const startTime = performance.now();
    const updateCounter = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      counter.textContent = String(Math.round(target * progress));
      if (progress < 1) requestAnimationFrame(updateCounter);
    };

    requestAnimationFrame(updateCounter);
  };

  if (counters.length && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });

    counters.forEach((counter) => counterObserver.observe(counter));
  } else {
    counters.forEach((counter) => {
      counter.textContent = counter.dataset.counter;
    });
  }

});