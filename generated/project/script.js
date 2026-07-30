document.addEventListener('DOMContentLoaded', () => {
  // Set current year in footer
  const yearSpan = document.getElementById('currentYear');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });

    // Close mobile menu on nav link click
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    });
  }

  // Theme Toggle with Local Storage Persistence (LocalStorageStateHook pattern equivalent)
  const themeToggle = document.getElementById('themeToggle');
  const htmlElement = document.documentElement;

  // Initialize theme from localStorage or default to dark
  const storedTheme = localStorage.getItem('portfolio_theme');
  if (storedTheme === 'light') {
    htmlElement.classList.remove('dark');
  } else {
    htmlElement.classList.add('dark');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      if (htmlElement.classList.contains('dark')) {
        htmlElement.classList.remove('dark');
        localStorage.setItem('portfolio_theme', 'light');
      } else {
        htmlElement.classList.add('dark');
        localStorage.setItem('portfolio_theme', 'dark');
      }
    });
  }

  // Project Filtering
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active button styles
      filterButtons.forEach(b => {
        b.classList.remove('bg-indigo-600', 'text-white');
        b.classList.add('bg-slate-900', 'border', 'border-slate-800', 'text-slate-300', 'hover:bg-slate-800');
      });
      btn.classList.remove('bg-slate-900', 'border', 'border-slate-800', 'text-slate-300', 'hover:bg-slate-800');
      btn.classList.add('bg-indigo-600', 'text-white');

      const filterValue = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filterValue === 'all' || category === filterValue) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Contact Form Submission Handler
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');

  if (contactForm && formStatus) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const nameInput = document.getElementById('name').value.trim();
      const emailInput = document.getElementById('email').value.trim();
      const messageInput = document.getElementById('message').value.trim();

      if (!nameInput || !emailInput || !messageInput) {
        formStatus.textContent = 'Please fill in all required fields.';
        formStatus.className = 'block text-sm font-medium p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400';
        return;
      }

      // Simulate successful asynchronous submission
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Sending...';

      setTimeout(() => {
        formStatus.textContent = 'Thank you! Your message has been successfully sent. I will get back to you shortly.';
        formStatus.className = 'block text-sm font-medium p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400';
        contactForm.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }, 1000);
    });
  }
});