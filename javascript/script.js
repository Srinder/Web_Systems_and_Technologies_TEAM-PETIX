document.addEventListener('DOMContentLoaded', () => {

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

    const responseDiv = document.createElement('div');
    responseDiv.id = 'form-response';
    responseDiv.style.display = 'none';
    responseDiv.style.textAlign = 'center';
    responseDiv.style.padding = '20px';
    contactForm.parentNode.appendChild(responseDiv);

    const errorDiv = document.createElement('p');
    errorDiv.id = 'form-error';
    errorDiv.style.color = '#dc2626';
    errorDiv.style.fontSize = '0.9rem';
    errorDiv.style.marginTop = '10px';
    errorDiv.style.display = 'none';
    contactForm.appendChild(errorDiv);

    contactForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const name = nameInput ? nameInput.value.trim() : 'User';
      const email = emailInput ? emailInput.value.trim() : '';
      const message = messageInput ? messageInput.value.trim() : '';

      errorDiv.style.display = 'none';
      if (nameInput) nameInput.style.borderColor = '';
      if (emailInput) emailInput.style.borderColor = '';

      const namePattern = /^[a-zA-Z\s.-]+$/;
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      // Validate Name
      if (!namePattern.test(name)) {
        errorDiv.textContent = 'Please enter a valid name (letters and spaces only, no numbers).';
        errorDiv.style.display = 'block';
        if (nameInput) {
          nameInput.style.borderColor = '#dc2626';
          nameInput.focus();
        }
        return;
      }

      // Validate Email
      if (!emailPattern.test(email)) {
        errorDiv.textContent = 'Please enter a valid email address (e.g., name@example.com).';
        errorDiv.style.display = 'block';
        if (emailInput) {
          emailInput.style.borderColor = '#dc2626';
          emailInput.focus();
        }
        return;
      }

      // Confirmation Email
      const templateParams = {
        to_name: name,
        to_email: email,
        message: message,
        from_name: 'Team Petix'
      };

      if (typeof emailjs !== 'undefined') {
        emailjs.send('service_o3vc1j4', 'template_lzpkfcf', templateParams)
          .then((response) => {
             console.log('Confirmation email sent successfully!', response.status, response.text);
          }, (error) => {
             console.error('Failed to send email...', error);
          });
      }

      contactForm.style.display = 'none';
      responseDiv.style.display = 'block';
      responseDiv.innerHTML = `
        <h3 style="color: #0d9488; margin-bottom: 10px;">Message Sent Successfully!</h3>
        <p style="color: #334155; font-size: 1rem; line-height: 1.5; margin-bottom: 15px;">
          Thank you, <strong>${name}</strong>. Team Petix has received your message and a confirmation email has been dispatched to <strong>${email}</strong>.
        </p>
        <button id="reset-form-btn" class="btn primary-btn" style="margin-top: 10px;">Send Another Message</button>
      `;

      document.getElementById('reset-form-btn').addEventListener('click', () => {
        contactForm.reset();
        contactForm.style.display = 'block';
        responseDiv.style.display = 'none';
      });
    });
  }

});