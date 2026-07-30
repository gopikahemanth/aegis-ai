document.addEventListener('DOMContentLoaded', () => {
  // Set current year in footer
  const yearSpan = document.getElementById('current-year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });

    // Close mobile menu when clicking a link
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    });
  }

  // Contact form submission handling with localStorage persistence pattern
  const contactForm = document.getElementById('contact-form');
  const formSuccess = document.getElementById('form-success');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('name');
      const emailInput = document.getElementById('email');
      const subjectInput = document.getElementById('subject');
      const messageInput = document.getElementById('message');

      const formData = {
        name: nameInput ? nameInput.value : '',
        email: emailInput ? emailInput.value : '',
        subject: subjectInput ? subjectInput.value : '',
        message: messageInput ? messageInput.value : '',
        timestamp: new Date().toISOString()
      };

      // Persist to local storage as per LocalStorageStateHook pattern concept
      try {
        const existingMessages = JSON.parse(localStorage.getItem('portfolio_messages') || '[]');
        existingMessages.push(formData);
        localStorage.setItem('portfolio_messages', JSON.stringify(existingMessages));
      } catch (err) {
        console.error('Failed to save message to local storage', err);
      }

      // Reset form and show success notification
      contactForm.reset();
      if (formSuccess) {
        formSuccess.classList.remove('hidden');
        setTimeout(() => {
          formSuccess.classList.add('hidden');
        }, 6000);
      }
    });
  }

  // Smooth scroll enhancement for navigation anchors
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});