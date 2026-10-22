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

  const testimonialForm = document.getElementById('testimonial-form');
  const testimonialList = document.getElementById('testimonial-list');
  const testimonialToggle = document.getElementById('testimonial-toggle');
  const testimonialSummary = document.getElementById('testimonial-summary');
  const isLocalFrontend = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
  const feedbackApiUrl = isLocalFrontend && window.location.port !== '3001'
    ? 'http://localhost:3001/api/feedback'
    : '/api/feedback';

  if (testimonialForm && testimonialList && testimonialToggle && testimonialSummary) {
    const testimonialStatus = document.getElementById('testimonial-status');
    const submitButton = testimonialForm.querySelector('button[type="submit"]');
    const submitLabel = submitButton.textContent;
    const initialTestimonialCount = 5;
    let allTestimonials = [];
    let showAllTestimonials = false;

    const showTestimonialStatus = (message, type) => {
      testimonialStatus.textContent = message;
      testimonialStatus.classList.remove('is-success', 'is-error');
      testimonialStatus.classList.add(`is-${type}`);
      testimonialStatus.hidden = false;
    };

    const createTestimonialCard = (testimonial) => {
      const card = document.createElement('article');
      card.className = 'testimonial-card';

      const heading = document.createElement('h3');
      heading.textContent = testimonial.clientName;

      const project = document.createElement('p');
      project.className = 'testimonial-project';
      project.textContent = testimonial.projectType || 'General Portfolio';

      const rating = document.createElement('p');
      rating.className = 'testimonial-rating';
      rating.setAttribute('aria-label', `${testimonial.rating} out of 5 stars`);
      rating.textContent = `${'★'.repeat(Number(testimonial.rating))}${'☆'.repeat(5 - Number(testimonial.rating))}`;

      const feedback = document.createElement('blockquote');
      feedback.textContent = testimonial.feedback;

      card.append(heading, project, rating, feedback);

      if (testimonial.date) {
        const date = document.createElement('time');
        const timestamp = new Date(testimonial.date);
        if (!Number.isNaN(timestamp.getTime())) {
          date.dateTime = timestamp.toISOString();
          date.textContent = timestamp.toLocaleDateString();
          card.append(date);
        }
      }

      return card;
    };

    const renderTestimonials = (testimonials) => {
      testimonialList.replaceChildren();
      testimonialSummary.replaceChildren();

      const ratings = testimonials
        .map((testimonial) => Number(testimonial.rating))
        .filter((rating) => Number.isFinite(rating) && rating >= 1 && rating <= 5);

      if (ratings.length) {
        const average = ratings.reduce((total, rating) => total + rating, 0) / ratings.length;
        const roundedStars = Math.round(average);
        const stars = document.createElement('span');
        stars.className = 'testimonial-summary-stars';
        stars.setAttribute('aria-hidden', 'true');
        stars.textContent = `${'★'.repeat(roundedStars)}${'☆'.repeat(5 - roundedStars)}`;

        const score = document.createElement('strong');
        score.textContent = `${average.toFixed(1)} / 5`;

        const count = document.createElement('span');
        count.textContent = `Average rating from ${ratings.length} ${ratings.length === 1 ? 'review' : 'reviews'}`;

        testimonialSummary.append(stars, score, count);
      } else {
        testimonialSummary.textContent = 'No ratings yet';
      }

      if (!testimonials.length) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'testimonial-empty';
        emptyMessage.textContent = 'No testimonials yet. Be the first to share feedback.';
        testimonialList.append(emptyMessage);
        testimonialToggle.hidden = true;
        testimonialToggle.setAttribute('aria-expanded', 'false');
        return;
      }

      const visibleTestimonials = showAllTestimonials
        ? testimonials
        : testimonials.slice(0, initialTestimonialCount);

      visibleTestimonials.forEach((testimonial) => {
        testimonialList.append(createTestimonialCard(testimonial));
      });

      testimonialToggle.hidden = testimonials.length <= initialTestimonialCount;
      testimonialToggle.textContent = showAllTestimonials ? 'Show Less' : 'Show More';
      testimonialToggle.setAttribute('aria-expanded', String(showAllTestimonials));
    };

    const fetchTestimonials = async () => {
      try {
        const response = await fetch(feedbackApiUrl);
        const result = await response.json();
        if (!response.ok || !result.success || !Array.isArray(result.data)) {
          throw new Error('Unable to load testimonials.');
        }
        allTestimonials = result.data;
        renderTestimonials(allTestimonials);
      } catch (error) {
        console.error('Failed to load testimonials.', error);
        testimonialList.replaceChildren();
        showTestimonialStatus('Testimonials could not be loaded right now. Please try again later.', 'error');
      }
    };

    testimonialToggle.addEventListener('click', () => {
      showAllTestimonials = !showAllTestimonials;
      renderTestimonials(allTestimonials);
    });

    testimonialForm.addEventListener('input', () => {
      testimonialStatus.hidden = true;
      testimonialStatus.classList.remove('is-success', 'is-error');
    });

    testimonialForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      testimonialStatus.hidden = true;
      testimonialStatus.classList.remove('is-success', 'is-error');

      if (!testimonialForm.checkValidity()) {
        testimonialForm.reportValidity();
        showTestimonialStatus('Complete every field and select a star rating before submitting.', 'error');
        return;
      }

      const formData = new FormData(testimonialForm);
      const website = formData.get('website').trim();
      const testimonial = {
        clientName: formData.get('clientName').trim(),
        projectType: formData.get('projectType').trim(),
        rating: Number(formData.get('rating')),
        feedback: formData.get('feedback').trim()
      };

      if (!testimonial.clientName || !testimonial.projectType || !testimonial.feedback) {
        showTestimonialStatus('Please enter a value for each field.', 'error');
        return;
      }

      if (!Number.isInteger(testimonial.rating) || testimonial.rating < 1 || testimonial.rating > 5) {
        showTestimonialStatus('Choose a rating from 1 to 5 stars.', 'error');
        return;
      }

      if (testimonial.clientName.length > 80 || testimonial.projectType.length > 100 || testimonial.feedback.length > 1000) {
        showTestimonialStatus('Check the field length limits and try again.', 'error');
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = 'Submitting...';

      try {
        const response = await fetch(feedbackApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...testimonial, website })
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || 'We could not submit your feedback.');
        }

        showTestimonialStatus(result.message || 'Thank you for sharing your feedback.', 'success');
        testimonialForm.reset();
      } catch (error) {
        console.error('Failed to submit testimonial.', error);
        showTestimonialStatus(error.message || 'We could not submit your feedback right now. Please try again.', 'error');
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = submitLabel;
      }
    });

    fetchTestimonials();
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
