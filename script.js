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
   INTERACTIVE CANVAS (AGENTS + RIPPLE + SPLASH)
   ============================================ */
function initInteractiveCanvas() {
    const canvas = document.getElementById('interactive-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;

    // Simulation Objects
    const agents = [];
    let ripples = [];
    let particles = [];

    // Configuration
    const agentCount = 8;
    const gravity = 0.5;
    const floorHeight = 50; // Distance from bottom of HERO section (not window)

    // Mouse Interaction
    let mouse = { x: 0, y: 0 };
    let lastMouse = { x: 0, y: 0 };
    let isDragging = false;
    let draggedAgent = null;

    // Colors
    const colors = [
        '#6366f1', '#8b5cf6', '#a855f7',
        '#06b6d4', '#ec4899', '#f97316'
    ];

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // ==========================================
    // CLASSES
    // ==========================================

    class Ripple {
        constructor(x, y) {
            this.x = x;
            this.y = y; // Canvas coordinates (fixed)
            this.radius = 0;
            this.maxRadius = 50;
            this.speed = 1;
            this.alpha = 1;
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

    class Particle {
        constructor(x, y, color, isBig = false) {
            this.x = x;
            this.y = y;
            this.color = color;
            // Bigger particles for profile explosion
            const sizeMult = isBig ? 2.5 : 1;
            const speedMult = isBig ? 3.0 : 1;

            this.size = (Math.random() * 5 + 2) * sizeMult;
            this.speedX = (Math.random() * 6 - 3) * speedMult;
            this.speedY = (Math.random() * 6 - 3) * speedMult;
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

    class Agent {
        constructor() {
            this.radius = 15;
            this.color = colors[Math.floor(Math.random() * colors.length)];

            // World Position (Relative to top of document/hero)
            // Initial Y is grounded relative to window height to start
            this.y = window.innerHeight - floorHeight - this.radius;
            this.x = Math.random() * window.innerWidth;

            this.vx = (Math.random() - 0.5) * 2;
            this.vy = 0;

            this.state = 'WALK';

            this.walkCycle = 0;
            this.struggleCycle = 0;
            this.landTimer = 0;
            this.recoverTimer = 0;
            this.glowTimer = 0; // For profile click effect

            this.scaleY = 1;
            this.scaleX = 1;
        }

        update() {
            // Glow decay
            if (this.glowTimer > 0) this.glowTimer--;

            // Physics & State
            switch (this.state) {
                case 'WALK':
                    this.x += this.vx;
                    this.walkCycle += 0.2;
                    if (this.x < 0 || this.x > window.innerWidth) this.vx *= -1;

                    // Keep on floor (hero bottom)
                    this.y = window.innerHeight - floorHeight - this.radius;
                    break;

                case 'DRAGGED':
                    // Map mouse (screen) to world y
                    // Mouse Y is screen relative. Agent Y is world relative.
                    // World Mouse Y = mouse.y + window.scrollY
                    const worldMouseY = mouse.y + window.scrollY;

                    this.x += (mouse.x - this.x) * 0.2;
                    this.y += (worldMouseY - this.y) * 0.2;

                    this.vx = mouse.x - this.x;
                    this.vy = worldMouseY - this.y;
                    this.struggleCycle += 0.8;
                    break;

                case 'FALL':
                    this.vy += gravity;
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vx *= 0.99;

                    // Floor check
                    if (this.y + this.radius >= window.innerHeight - floorHeight) {
                        this.y = window.innerHeight - floorHeight - this.radius;
                        this.state = 'LAND';
                        this.landTimer = 20;
                        this.vy = 0; this.vx = 0;
                        this.scaleY = 0.6; this.scaleX = 1.4;
                    }
                    break;

                case 'LAND':
                    this.landTimer--;
                    this.scaleY += (1 - this.scaleY) * 0.1;
                    this.scaleX += (1 - this.scaleX) * 0.1;
                    if (this.landTimer <= 0) {
                        this.state = 'RECOVER';
                        this.recoverTimer = 60;
                    }
                    break;

                case 'RECOVER':
                    this.recoverTimer--;
                    if (this.recoverTimer <= 0) {
                        this.state = 'WALK';
                        this.vx = (Math.random() - 0.5) * 2;
                    }
                    break;
            }
        }

        draw(ctx, scrollY) {
            // Screen Position = World Y - Scroll Y
            const screenY = this.y - scrollY;

            // Simple culling
            if (screenY < -50 || screenY > height + 50) return;

            ctx.save();
            ctx.translate(this.x, screenY);

            // GLOW EFFECT
            if (this.glowTimer > 0) {
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#ffffff';
            }

            ctx.scale(this.scaleX, this.scaleY);

            // Legs
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';

            if (this.state === 'WALK') {
                const legOffset = Math.sin(this.walkCycle) * 5;
                this.drawLeg(ctx, -5, 5, -5, 15 + legOffset);
                this.drawLeg(ctx, 5, 5, 5, 15 - legOffset);
            } else if (this.state === 'DRAGGED') {
                const k = Math.sin(this.struggleCycle) * 8;
                this.drawLeg(ctx, -5, 5, -8 - k, 18);
                this.drawLeg(ctx, 5, 5, 8 + k, 18);
            } else {
                this.drawLeg(ctx, -5, 5, -5, 15);
                this.drawLeg(ctx, 5, 5, 5, 15);
            }

            // Body
            ctx.fillStyle = this.glowTimer > 0 ? '#fff' : this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Eyes
            ctx.shadowBlur = 0; // Reset shadow for eyes
            ctx.fillStyle = (this.glowTimer > 0) ? '#000' : '#fff'; // Invert eye color if glowing

            const eyeFace = (this.state === 'DRAGGED' || this.state === 'FALL' || this.glowTimer > 0)
                ? 'SURPRISED' : (this.state === 'LAND' ? 'DIZZY' : 'NORMAL');

            if (eyeFace === 'SURPRISED') {
                ctx.beginPath();
                ctx.arc(-4, -2, 4, 0, Math.PI * 2);
                ctx.arc(4, -2, 4, 0, Math.PI * 2);
                ctx.fill();
            } else if (eyeFace === 'DIZZY') {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                this.drawX(ctx, -6, -4);
                this.drawX(ctx, 2, -4);
            } else {
                const off = this.vx > 0 ? 3 : -3;
                ctx.beginPath();
                ctx.arc(-4 + off, -2, 2, 0, Math.PI * 2);
                ctx.arc(4 + off, -2, 2, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        drawLeg(ctx, x1, y1, x2, y2) {
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        }

        drawX(ctx, x, y) {
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 4, y + 4); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x + 4, y); ctx.lineTo(x, y + 4); ctx.stroke();
        }
    }

    // Initialize Agents
    for (let i = 0; i < agentCount; i++) {
        agents.push(new Agent());
    }

    // ==========================================
    // EVENT LISTENERS
    // ==========================================

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;

        // Ripples
        const dx = mouse.x - lastMouse.x;
        const dy = mouse.y - lastMouse.y;
        if (Math.sqrt(dx * dx + dy * dy) > 5) {
            ripples.push(new Ripple(mouse.x, mouse.y));
            lastMouse.x = mouse.x;
            lastMouse.y = mouse.y;
        }
    });

    window.addEventListener('mousedown', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        const scrollY = window.scrollY;

        // 1. Check Agent Drag
        let hitAgent = false;
        for (let agent of agents) {
            // Agent Screen Pos
            const screenY = agent.y - scrollY;
            const dx = mouse.x - agent.x;
            const dy = mouse.y - screenY;

            if (Math.sqrt(dx * dx + dy * dy) < agent.radius * 2.5) {
                isDragging = true;
                draggedAgent = agent;
                agent.state = 'DRAGGED';
                hitAgent = true;
                break;
            }
        }

        // 2. If no agent hit, Splash!
        if (!hitAgent) {
            for (let i = 0; i < 15; i++) {
                const c = colors[Math.floor(Math.random() * colors.length)];
                particles.push(new Particle(mouse.x, mouse.y, c));
            }
        }
    });

    window.addEventListener('mouseup', () => {
        if (isDragging && draggedAgent) {
            draggedAgent.state = 'FALL';
            draggedAgent = null;
            isDragging = false;
        }
    });

    // Profile Interaction
    const profileImage = document.querySelector('.hero-image-wrapper');
    if (profileImage) {
        profileImage.style.cursor = 'pointer';
        profileImage.addEventListener('click', (e) => {
            e.stopPropagation();

            // Big Splash
            const rect = profileImage.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;

            for (let i = 0; i < 200; i++) {
                const c = colors[Math.floor(Math.random() * colors.length)];
                particles.push(new Particle(cx, cy, c, true)); // isBig = true
            }

            // Agents Glow Reaction
            agents.forEach(agent => agent.glowTimer = 60); // 1 second glow
        });
    }


    // ==========================================
    // ANIMATION LOOP
    // ==========================================
    function animate() {
        ctx.clearRect(0, 0, width, height);
        const scrollY = window.scrollY;

        // 1. Ripples
        for (let i = 0; i < ripples.length; i++) {
            ripples[i].update();
            ripples[i].draw(ctx);
            if (ripples[i].alpha <= 0) { ripples.splice(i, 1); i--; }
        }

        // 2. Agents
        // Update pointer cursor based on hover
        let hovering = false;
        if (isDragging) {
            canvas.style.cursor = 'grabbing';
            canvas.style.pointerEvents = 'auto';
        } else {
            for (let agent of agents) {
                // Check hover on SCREEN position
                const screenY = agent.y - scrollY;
                const dx = mouse.x - agent.x;
                const dy = mouse.y - screenY;
                if (Math.sqrt(dx * dx + dy * dy) < agent.radius * 2) {
                    hovering = true;
                    break;
                }
            }
            canvas.style.cursor = hovering ? 'grab' : 'default';
            canvas.style.pointerEvents = hovering ? 'auto' : 'none';
        }

        for (let agent of agents) {
            agent.update();
            agent.draw(ctx, scrollY);
        }

        // 3. Particles
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw(ctx);
            if (particles[i].life <= 0) { particles.splice(i, 1); i--; }
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
