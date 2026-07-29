document.addEventListener('DOMContentLoaded', () => {
    // Current Year for Footer
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // Mobile Menu Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    menuToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
        });
    });

    // Navbar Scroll Effect
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            header.classList.add('py-3', 'shadow-2xl', 'bg-slate-950/90');
            header.classList.remove('py-4', 'bg-slate-950/60');
        } else {
            header.classList.remove('py-3', 'shadow-2xl', 'bg-slate-950/90');
            header.classList.add('py-4', 'bg-slate-950/60');
        }
    });

    // Project Filtering
    const filterButtons = document.querySelectorAll('.project-filter');
    const projectCards = document.querySelectorAll('.project-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active styles from all buttons
            filterButtons.forEach(btn => {
                btn.classList.remove('bg-neon-cyan', 'text-slate-950', 'font-bold', 'shadow-lg', 'shadow-neon-cyan/20');
                btn.classList.add('bg-glass-100', 'text-slate-300');
            });

            // Add active styles to clicked button
            button.classList.remove('bg-glass-100', 'text-slate-300');
            button.classList.add('bg-neon-cyan', 'text-slate-950', 'font-bold', 'shadow-lg', 'shadow-neon-cyan/20');

            const filterValue = button.getAttribute('data-filter');

            projectCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filterValue === 'all' || category === filterValue) {
                    card.style.display = 'flex';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1)';
                    }, 50);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });

    // Contact Form Validation & Submission
    const contactForm = document.getElementById('contact-form');
    const toast = document.getElementById('toast');
    const closeToast = document.getElementById('close-toast');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const btnIcon = document.getElementById('btn-icon');

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const subjectInput = document.getElementById('subject');
        const messageInput = document.getElementById('message');

        let isValid = true;

        [nameInput, emailInput, subjectInput, messageInput].forEach(input => {
            const errorMsg = input.nextElementSibling;
            if (!input.value.trim()) {
                input.classList.add('border-rose-500');
                if (errorMsg) errorMsg.classList.remove('hidden');
                isValid = false;
            } else {
                input.classList.remove('border-rose-500');
                if (errorMsg) errorMsg.classList.add('hidden');
            }
        });

        // Email regex check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailInput.value.trim() && !emailRegex.test(emailInput.value.trim())) {
            emailInput.classList.add('border-rose-500');
            emailInput.nextElementSibling.classList.remove('hidden');
            isValid = false;
        }

        if (isValid) {
            // Simulate sending state
            btnText.textContent = 'Sending Neural Packet...';
            btnIcon.className = 'fa-solid fa-spinner fa-spin';
            submitBtn.disabled = true;

            setTimeout(() => {
                btnText.textContent = 'Send Message';
                btnIcon.className = 'fa-solid fa-paper-plane';
                submitBtn.disabled = false;
                contactForm.reset();

                // Show toast
                toast.classList.remove('hidden');
                setTimeout(() => {
                    toast.classList.add('hidden');
                }, 5000);
            }, 1500);
        }
    });

    closeToast.addEventListener('click', () => {
        toast.classList.add('hidden');
    });

    // Interactive Neural Canvas Background
    const canvas = document.getElementById('neural-canvas');
    const ctx = canvas.getContext('2d');

    let width, height;
    let particles = [];

    function resizeCanvas() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class NeuralParticle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.8;
            this.vy = (Math.random() - 0.5) * 0.8;
            this.radius = Math.random() * 2 + 1;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > width) this.vx = -this.vx;
            if (this.y < 0 || this.y > height) this.vy = -this.vy;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 242, 254, 0.7)';
            ctx.fill();
        }
    }

    function initParticles() {
        particles = [];
        const particleCount = Math.min(Math.floor((width * height) / 18000), 80);
        for (let i = 0; i < particleCount; i++) {
            particles.push(new NeuralParticle());
        }
    }

    initParticles();

    function animateNeuralNetwork() {
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 130) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    const alpha = (1 - (dist / 130)) * 0.25;
                    ctx.strokeStyle = `rgba(127, 0, 255, ${alpha})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animateNeuralNetwork);
    }

    animateNeuralNetwork();
});