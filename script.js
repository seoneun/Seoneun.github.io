/* ============================================
   SEONG-EUN HONG - GRAPHICS RESEARCHER
   Interactive JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    initThemeToggle();
    initNavbar();
    initMobileMenu();
    initScrollReveal();
    initCounterAnimation();
    initSmoothScroll();
    initActiveNavLinks();
    initInteractiveCanvas();
});

/* ============================================
   INTERACTIVE CANVAS (RIPPLE & SPLASH)
   ============================================ */
function initInteractiveCanvas() {
    const canvas = document.getElementById('interactive-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let ripples = [];
    let particles = [];

    // Colors for splashes (matching theme)
    const colors = [
        '#6366f1', // accent-primary
        '#8b5cf6', // accent-secondary
        '#a855f7', // accent-tertiary
        '#06b6d4', // accent-cyan
        '#ec4899', // accent-pink
        '#f97316'  // accent-orange
    ];

    // Resize canvas
    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // Mouse coordinates
    let mouse = { x: 0, y: 0 };
    let lastMouse = { x: 0, y: 0 };

    // Ripple Class
    class Ripple {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = 0;
            this.maxRadius = 50;
            this.speed = 1;
            this.alpha = 1;
            this.angle = Math.random() * Math.PI * 2;
        }

        update() {
            this.radius += this.speed;
            this.alpha -= 0.02;
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = this.alpha * 0.4;
            ctx.beginPath();
            ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim();
            ctx.lineWidth = 2;
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    // Particle Class (Paint Splash)
    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.size = Math.random() * 5 + 2;
            this.speedX = Math.random() * 6 - 3;
            this.speedY = Math.random() * 6 - 3;
            this.gravity = 0.1;
            this.friction = 0.95;
            this.life = 1;
            this.decay = Math.random() * 0.02 + 0.01;
        }

        update() {
            this.speedY += this.gravity;
            this.speedX *= this.friction;
            this.speedY *= this.friction;
            this.x += this.speedX;
            this.y += this.speedY;
            this.life -= this.decay;
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = this.life;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // Create ripples on mouse move
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;

        // Create ripple only if mouse moved enough distance
        const dx = mouse.x - lastMouse.x;
        const dy = mouse.y - lastMouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5) {
            ripples.push(new Ripple(mouse.x, mouse.y));
            lastMouse.x = mouse.x;
            lastMouse.y = mouse.y;
        }
    });

    // Create splash on click
    window.addEventListener('mousedown', (e) => {
        const splashCount = 15;
        for (let i = 0; i < splashCount; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            particles.push(new Particle(e.clientX, e.clientY, color));
        }
    });

    // PROFILE EXPLOSION EFFECT
    const profileImage = document.querySelector('.hero-image-wrapper');
    if (profileImage) {
        profileImage.style.cursor = 'pointer'; // Make it look clickable
        profileImage.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent default splash, run super splash instead (or both)

            // 1. Trigger Screen Shake
            document.body.classList.add('shake-active');
            setTimeout(() => {
                document.body.classList.remove('shake-active');
            }, 500);

            // 2. Trigger Massive Explosion (200 particles)
            const rect = profileImage.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            for (let i = 0; i < 200; i++) {
                const color = colors[Math.floor(Math.random() * colors.length)];
                const p = new Particle(centerX, centerY, color);

                // Boost velocity for explosion
                p.speedX *= 3;
                p.speedY *= 3;
                p.size *= 1.5; // Bigger particles

                particles.push(p);
            }
        });
    }

    // Animation Loop
    function animate() {
        ctx.clearRect(0, 0, width, height);

        // Update and draw ripples
        for (let i = 0; i < ripples.length; i++) {
            ripples[i].update();
            ripples[i].draw(ctx);

            if (ripples[i].alpha <= 0) {
                ripples.splice(i, 1);
                i--;
            }
        }

        // Update and draw particles
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw(ctx);

            if (particles[i].life <= 0) {
                particles.splice(i, 1);
                i--;
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
}

/* ============================================
   THEME TOGGLE (DARK/LIGHT MODE)
   ============================================ */
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            // Update theme
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);

            // Add animation class
            themeToggle.classList.add('rotating');
            setTimeout(() => {
                themeToggle.classList.remove('rotating');
            }, 300);
        });
    }

    function updateThemeIcon(theme) {
        if (themeIcon) {
            if (theme === 'dark') {
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
            } else {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
            }
        }
    }
}

/* ============================================
   NAVBAR SCROLL EFFECT
   ============================================ */
function initNavbar() {
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        // Add scrolled class when scrolled down
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });
}

/* ============================================
   MOBILE MENU TOGGLE
   ============================================ */
function initMobileMenu() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });

        // Close menu when clicking a link
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }
}

/* ============================================
   SCROLL REVEAL ANIMATION
   ============================================ */
function initScrollReveal() {
    const revealElements = document.querySelectorAll(
        '.publication-card, .project-card, .timeline-item, .about-text, .stat-card, .contact-info, .year-separator'
    );

    // Add reveal class to elements
    revealElements.forEach(el => {
        el.classList.add('reveal');
    });

    const revealOnScroll = () => {
        revealElements.forEach(el => {
            const elementTop = el.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;

            if (elementTop < windowHeight - 100) {
                el.classList.add('active');
            }
        });
    };

    // Initial check
    revealOnScroll();

    // Check on scroll
    window.addEventListener('scroll', revealOnScroll);
}

/* ============================================
   COUNTER ANIMATION
   ============================================ */
function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat-number');
    let hasAnimated = false;

    const animateCounters = () => {
        if (hasAnimated) return;

        const statsSection = document.querySelector('.about-stats');
        if (!statsSection) return;

        const sectionTop = statsSection.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;

        if (sectionTop < windowHeight - 100) {
            hasAnimated = true;

            counters.forEach(counter => {
                const target = parseInt(counter.getAttribute('data-count'));
                let current = 0;
                const increment = target / 50;
                const duration = 1500;
                const stepTime = duration / 50;

                const updateCounter = () => {
                    current += increment;
                    if (current < target) {
                        counter.textContent = Math.floor(current);
                        setTimeout(updateCounter, stepTime);
                    } else {
                        counter.textContent = target + '+';
                    }
                };

                updateCounter();
            });
        }
    };

    window.addEventListener('scroll', animateCounters);
    animateCounters(); // Initial check
}

/* ============================================
   SMOOTH SCROLL FOR ANCHOR LINKS
   ============================================ */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const navHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/* ============================================
   ACTIVE NAV LINK ON SCROLL
   ============================================ */
function initActiveNavLinks() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;

            if (window.pageYOffset >= sectionTop - 200) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

/* ============================================
   PARALLAX EFFECT FOR HERO
   ============================================ */
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const spheres = document.querySelectorAll('.gradient-sphere');

    spheres.forEach((sphere, index) => {
        const speed = 0.1 + (index * 0.05);
        sphere.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

/* ============================================
   TYPING EFFECT (OPTIONAL)
   ============================================ */
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.textContent = '';

    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }

    type();
}

/* ============================================
   IMAGE LAZY LOADING
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
});

/* ============================================
   THEME TOGGLE ANIMATION
   ============================================ */
const style = document.createElement('style');
style.textContent = `
    .theme-toggle.rotating {
        animation: rotateIcon 0.3s ease;
    }
    
    @keyframes rotateIcon {
        0% { transform: rotate(0deg) scale(1); }
        50% { transform: rotate(180deg) scale(1.2); }
        100% { transform: rotate(360deg) scale(1); }
    }
`;
document.head.appendChild(style);
