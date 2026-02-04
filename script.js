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
   INTERACTIVE CANVAS (CROWD AGENTS)
   ============================================ */
function initInteractiveCanvas() {
    const canvas = document.getElementById('interactive-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;

    // Agent System Variables
    const agents = [];
    const agentCount = 8;
    const gravity = 0.5;
    const floorHeight = 50; // Distance from bottom

    // Mouse Interaction
    let mouse = { x: 0, y: 0 };
    let isDragging = false;
    let draggedAgent = null;

    // Colors matching theme
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

    // AGENT CLASS
    class Agent {
        constructor() {
            this.radius = 15;
            this.color = colors[Math.floor(Math.random() * colors.length)];

            // Position (start on floor)
            this.y = height - floorHeight - this.radius;
            this.x = Math.random() * width;

            // Physics
            this.vx = (Math.random() - 0.5) * 2; // Walking speed
            this.vy = 0;

            // State: 'WALK', 'DRAGGED', 'FALL', 'LAND', 'RECOVER'
            this.state = 'WALK';

            // Animation properties
            this.walkCycle = 0;
            this.struggleCycle = 0;
            this.landTimer = 0;
            this.recoverTimer = 0;
            this.scaleY = 1; // For squash/stretch
            this.scaleX = 1;
        }

        update() {
            // State Machine
            switch (this.state) {
                case 'WALK':
                    this.x += this.vx;
                    this.walkCycle += 0.2;

                    // Bounce off walls
                    if (this.x < 0 || this.x > width) {
                        this.vx *= -1;
                    }

                    // Stay on floor
                    this.y = height - floorHeight - this.radius;
                    break;

                case 'DRAGGED':
                    // Follow mouse with lerp for smoothness
                    this.x += (mouse.x - this.x) * 0.2;
                    this.y += (mouse.y - this.y) * 0.2;

                    this.vx = mouse.x - this.x; // Track velocity for throw
                    this.vy = mouse.y - this.y;

                    this.struggleCycle += 0.8; // Fast struggle
                    break;

                case 'FALL':
                    this.vy += gravity;
                    this.x += this.vx;
                    this.y += this.vy;

                    // Air resistance / friction
                    this.vx *= 0.99;

                    // Hit floor
                    if (this.y + this.radius >= height - floorHeight) {
                        this.y = height - floorHeight - this.radius;
                        this.state = 'LAND';
                        this.landTimer = 20; // Frames to stay squashed
                        this.vy = 0;
                        this.vx = 0;
                        // Impact squash
                        this.scaleY = 0.6;
                        this.scaleX = 1.4;
                    }
                    break;

                case 'LAND':
                    // Butt bump animation (butt hurting)
                    this.landTimer--;

                    // Elastic recovery
                    this.scaleY += (1 - this.scaleY) * 0.1;
                    this.scaleX += (1 - this.scaleX) * 0.1;

                    if (this.landTimer <= 0) {
                        this.state = 'RECOVER';
                        this.recoverTimer = 60; // 1 second to stand up
                    }
                    break;

                case 'RECOVER':
                    this.recoverTimer--;
                    // Shake head / dust off?
                    if (this.recoverTimer <= 0) {
                        this.state = 'WALK';
                        // Pick random direction
                        this.vx = (Math.random() - 0.5) * 2;
                    }
                    break;
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.scale(this.scaleX, this.scaleY);

            // Draw Legs
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';

            if (this.state === 'WALK') {
                const legOffset = Math.sin(this.walkCycle) * 5;
                // Leg 1
                ctx.beginPath();
                ctx.moveTo(-5, 5);
                ctx.lineTo(-5, 15 + legOffset);
                ctx.stroke();
                // Leg 2
                ctx.beginPath();
                ctx.moveTo(5, 5);
                ctx.lineTo(5, 15 - legOffset);
                ctx.stroke();
            } else if (this.state === 'DRAGGED') {
                // Struggling legs
                const legKicking = Math.sin(this.struggleCycle) * 8;
                ctx.beginPath();
                ctx.moveTo(-5, 5);
                ctx.lineTo(-8 - legKicking, 18);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(5, 5);
                ctx.lineTo(8 + legKicking, 18);
                ctx.stroke();
            } else if (this.state === 'LAND') {
                // Splayed legs (butt bump)
                ctx.beginPath();
                ctx.moveTo(-5, 5);
                ctx.lineTo(-12, 12);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(5, 5);
                ctx.lineTo(12, 12);
                ctx.stroke();
            } else {
                // Default falling/standing
                ctx.beginPath();
                ctx.moveTo(-5, 5);
                ctx.lineTo(-5, 15);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(5, 5);
                ctx.lineTo(5, 15);
                ctx.stroke();
            }

            // Draw Body
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Draw Eyes (Direction)
            ctx.fillStyle = '#fff';
            const eyeOffsetX = this.vx > 0 ? 3 : -3;

            if (this.state === 'DRAGGED' || this.state === 'FALL') {
                // Big surprised eyes
                ctx.beginPath();
                ctx.arc(-4, -2, 4, 0, Math.PI * 2);
                ctx.arc(4, -2, 4, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.state === 'LAND') {
                // X X eyes (dizzy/pain)
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                // Left X
                ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(-2, 0); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(-2, -4); ctx.lineTo(-6, 0); ctx.stroke();
                // Right X
                ctx.beginPath(); ctx.moveTo(2, -4); ctx.lineTo(6, 0); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(6, -4); ctx.lineTo(2, 0); ctx.stroke();
            } else {
                // Regular walking eyes
                ctx.beginPath();
                ctx.arc(-4 + eyeOffsetX, -2, 2, 0, Math.PI * 2);
                ctx.arc(4 + eyeOffsetX, -2, 2, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    // Initialize Agents
    for (let i = 0; i < agentCount; i++) {
        agents.push(new Agent());
    }

    // Mouse Listeners
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener('mousedown', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;

        // Check collision with agents
        for (let agent of agents) {
            const dx = mouse.x - agent.x;
            const dy = mouse.y - agent.y;
            // Hitbox slightly larger for easier grabbing
            if (Math.sqrt(dx * dx + dy * dy) < agent.radius * 2) {
                isDragging = true;
                draggedAgent = agent;
                agent.state = 'DRAGGED';
                break;
            }
        }
    });

    window.addEventListener('mouseup', () => {
        if (isDragging && draggedAgent) {
            draggedAgent.state = 'FALL';
            // Carry over velocity from drag
            // (Calculated in update loop)
            draggedAgent = null;
            isDragging = false;
        }
    });

    // Animation Loop
    function animate() {
        ctx.clearRect(0, 0, width, height);

        // Draw Agents
        for (let agent of agents) {
            agent.update();
            agent.draw(ctx);
        }

        // Pointer Update (Grab hand)
        if (isDragging) {
            canvas.style.cursor = 'grabbing';
            canvas.style.pointerEvents = 'auto'; // Keep capturing events while dragging
        } else {
            // Check hover
            let hovering = false;
            for (let agent of agents) {
                const dx = mouse.x - agent.x;
                const dy = mouse.y - agent.y;
                if (Math.sqrt(dx * dx + dy * dy) < agent.radius * 2) {
                    hovering = true;
                    break;
                }
            }
            canvas.style.cursor = hovering ? 'grab' : 'default';
            // Crucial: Create a "hole" in the canvas for clicks to pass through if not hovering an agent
            canvas.style.pointerEvents = hovering ? 'auto' : 'none';
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
