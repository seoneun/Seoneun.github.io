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
   INTERACTIVE CANVAS (AGENTS + RIPPLE + SPLASH + FOOD)
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
    let foods = []; // Clouds/Stars

    // Configuration
    const agentCount = 8;
    const gravity = 0.5;
    const floorHeight = 50;

    // Mouse Interaction
    let mouse = { x: 0, y: 0 };
    let lastMouse = { x: 0, y: 0 };
    let isDragging = false;
    let draggedEntity = null; // Can be Agent or Food

    // Theme (tracked manually for canvas updates)
    let currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';

    // Image for Masking
    const profileImage = document.querySelector('.hero-image-wrapper');

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
            this.x = x; this.y = y;
            this.radius = 15; this.maxRadius = 50;
            this.speed = 1; this.alpha = 1;
        }
        update() { this.radius += this.speed; this.alpha -= 0.02; }
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
            this.x = x; this.y = y; this.color = color;
            const sizeMult = isBig ? 2.5 : 1;
            const speedMult = isBig ? 3.0 : 1;
            this.size = (Math.random() * 5 + 2) * sizeMult;
            this.speedX = (Math.random() * 6 - 3) * speedMult;
            this.speedY = (Math.random() * 6 - 3) * speedMult;
            this.gravity = 0.1; this.friction = 0.95;
            this.life = 1; this.decay = Math.random() * 0.02 + 0.01;
        }
        update() {
            this.speedY += this.gravity;
            this.speedX *= this.friction; this.speedY *= this.friction;
            this.x += this.speedX; this.y += this.speedY;
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

    class Food {
        constructor(type) {
            this.type = type; // 'CLOUD', 'STAR', 'MOON'
            this.x = Math.random() * (window.innerWidth - 100) + 50;
            this.y = Math.random() * (window.innerHeight / 2); // Top half
            this.radius = 20;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.isBeingEaten = false;
        }

        update() {
            if (this !== draggedEntity) {
                this.x += this.vx;
                this.y += this.vy;

                // Bounce bounds (top half of hero mostly)
                if (this.x < 0 || this.x > window.innerWidth) this.vx *= -1;
                if (this.y < 0 || this.y > window.innerHeight - 100) this.vy *= -1;
            } else {
                // Dragged
                const worldMouseY = mouse.y + window.scrollY;
                this.x += (mouse.x - this.x) * 0.3;
                this.y += (worldMouseY - this.y) * 0.3;
            }
        }

        draw(ctx, scrollY) {
            if (this.isBeingEaten) return;

            const screenY = this.y - scrollY;
            if (screenY < -100 || screenY > height + 100) return;

            ctx.save();
            ctx.translate(this.x, screenY);

            if (this.type === 'CLOUD') {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.beginPath();
                ctx.arc(0, 0, 20, 0, Math.PI * 2);
                ctx.arc(-15, 5, 15, 0, Math.PI * 2);
                ctx.arc(15, 5, 15, 0, Math.PI * 2);
                ctx.arc(8, -10, 18, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.type === 'STAR') {
                ctx.fillStyle = '#fbbf24'; // amber-400
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#fbbf24';
                this.drawStar(ctx, 0, 0, 5, 20, 10);
            } else if (this.type === 'MOON') {
                ctx.fillStyle = '#fef3c7'; // amber-100
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#fef3c7';
                ctx.beginPath();
                ctx.arc(0, 0, 15, 1.3, 5.2, false);
                ctx.bezierCurveTo(-5, 0, -5, 15, 0, 15);
                ctx.fill();
            }
            ctx.restore();
        }

        drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
            let rot = Math.PI / 2 * 3;
            let x = cx;
            let y = cy;
            let step = Math.PI / spikes;

            ctx.beginPath();
            ctx.moveTo(cx, cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
                x = cx + Math.cos(rot) * outerRadius;
                y = cy + Math.sin(rot) * outerRadius;
                ctx.lineTo(x, y);
                rot += step;

                x = cx + Math.cos(rot) * innerRadius;
                y = cy + Math.sin(rot) * innerRadius;
                ctx.lineTo(x, y);
                rot += step;
            }
            ctx.lineTo(cx, cy - outerRadius);
            ctx.closePath();
            ctx.fill();
        }
    }

    class Agent {
        constructor() {
            this.radius = 15;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.y = window.innerHeight - floorHeight - this.radius;
            this.x = Math.random() * window.innerWidth;
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = 0;
            this.state = 'WALK';

            this.walkCycle = 0;
            this.struggleCycle = 0;
            this.landTimer = 0;
            this.recoverTimer = 0;

            this.smileTimer = 0; // For profile click
            this.jumpTimer = 0; // For eating food

            this.scaleY = 1; this.scaleX = 1;
        }

        update() {
            if (this.smileTimer > 0) {
                this.smileTimer--;
            }

            // Logic to eat food
            if (this.state === 'WALK' || this.state === 'JUMP') {
                for (let i = 0; i < foods.length; i++) {
                    const food = foods[i];
                    if (draggedEntity === food) { // Check drag distance
                        const dx = this.x - food.x;
                        const dy = this.y - food.y;
                        if (Math.sqrt(dx * dx + dy * dy) < 50) {
                            // EAT!
                            foods.splice(i, 1);
                            draggedEntity = null; // Release drag
                            isDragging = false;
                            this.jump();
                            break;
                        }
                    }
                }
            }

            switch (this.state) {
                case 'WALK':
                    this.x += this.vx;
                    this.walkCycle += 0.2;
                    if (this.x < 0 || this.x > window.innerWidth) this.vx *= -1;
                    this.y = window.innerHeight - floorHeight - this.radius;
                    break;

                case 'JUMP':
                    this.vy += gravity;
                    this.y += this.vy;
                    this.x += this.vx;
                    // Land logic
                    if (this.y + this.radius >= window.innerHeight - floorHeight) {
                        this.y = window.innerHeight - floorHeight - this.radius;
                        this.state = 'WALK';
                        this.vy = 0;
                    }
                    break;

                case 'DRAGGED':
                    const worldMouseY = mouse.y + window.scrollY;
                    this.x += (mouse.x - this.x) * 0.2;
                    this.y += (worldMouseY - this.y) * 0.2;
                    this.vx = mouse.x - this.x; this.vy = worldMouseY - this.y;
                    this.struggleCycle += 0.8;
                    break;

                case 'FALL':
                    this.vy += gravity;
                    this.x += this.vx; this.y += this.vy; this.vx *= 0.99;
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

        jump() {
            this.state = 'JUMP';
            this.vy = -12; // Big jump
            this.smileTimer = 60; // Smile while jumping
        }

        draw(ctx, scrollY) {
            const screenY = this.y - scrollY;
            if (screenY < -50 || screenY > height + 50) return;

            ctx.save();
            ctx.translate(this.x, screenY);
            ctx.scale(this.scaleX, this.scaleY);

            // Legs
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            if (this.state === 'WALK') {
                const off = Math.sin(this.walkCycle) * 5;
                this.drawLeg(ctx, -5, 5, -5, 15 + off);
                this.drawLeg(ctx, 5, 5, 5, 15 - off);
            } else if (this.state === 'DRAGGED' || this.state === 'JUMP') {
                this.drawLeg(ctx, -5, 5, -8, 18);
                this.drawLeg(ctx, 5, 5, 8, 18); // Spread legs for jump
            } else {
                this.drawLeg(ctx, -5, 5, -5, 15);
                this.drawLeg(ctx, 5, 5, 5, 15);
            }

            // Body
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Face
            ctx.fillStyle = '#fff';

            // Smile Logic
            if (this.smileTimer > 0) {
                // ^ ^ Eyes
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#fff'; // ensure white smile
                ctx.beginPath(); ctx.moveTo(-7, -4); ctx.lineTo(-4, -7); ctx.lineTo(-1, -4); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(1, -4); ctx.lineTo(4, -7); ctx.lineTo(7, -4); ctx.stroke();
                // Smile
                ctx.beginPath(); ctx.arc(0, 2, 5, 0, Math.PI, false); ctx.stroke();
            } else if (this.state === 'LAND') {
                // X X
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
                this.drawX(ctx, -6, -4); this.drawX(ctx, 2, -4);
            } else if (this.state === 'DRAGGED' || this.state === 'FALL') {
                // O O
                ctx.beginPath(); ctx.arc(-4, -2, 4, 0, Math.PI * 2);
                ctx.arc(4, -2, 4, 0, Math.PI * 2); ctx.fill();
            } else {
                // . .
                const off = this.vx > 0 ? 3 : -3;
                ctx.beginPath(); ctx.arc(-4 + off, -2, 2, 0, Math.PI * 2);
                ctx.arc(4 + off, -2, 2, 0, Math.PI * 2); ctx.fill();
            }

            ctx.restore();
        }

        drawLeg(ctx, x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
        drawX(ctx, x, y) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 4, y + 4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 4, y); ctx.lineTo(x, y + 4); ctx.stroke(); }
    }

    // Init Logic
    function spawnFood() {
        foods = [];
        const theme = document.documentElement.getAttribute('data-theme');
        const count = 6;
        for (let i = 0; i < count; i++) {
            if (theme === 'light') {
                foods.push(new Food('CLOUD'));
            } else {
                foods.push(new Food(Math.random() > 0.3 ? 'STAR' : 'MOON'));
            }
        }
    }

    // Listen for theme changes logic (MutationObserver or simple click capture)
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            // Wait slightly for DOM to update
            setTimeout(spawnFood, 50);
        });
    }

    for (let i = 0; i < agentCount; i++) { agents.push(new Agent()); }
    spawnFood(); // Initial spawn

    // Events
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX; mouse.y = e.clientY;
        const dx = mouse.x - lastMouse.x; const dy = mouse.y - lastMouse.y;
        if (Math.sqrt(dx * dx + dy * dy) > 5) {
            ripples.push(new Ripple(mouse.x, mouse.y));
            lastMouse.x = mouse.x; lastMouse.y = mouse.y;
        }
    });

    window.addEventListener('mousedown', (e) => {
        mouse.x = e.clientX; mouse.y = e.clientY;
        const scrollY = window.scrollY;

        let hit = false;

        // 1. Check Foods (can be dragged)
        // Foods use screen/world hybrid logic? 
        // Our foods move in world space (x, y) but rendered relative to scroll? 
        // Let's assume Foods are floating in SKY, so they move with scroll or fixed? 
        // Plan: Foods are world objects too (like agents).

        for (let food of foods) {
            const screenY = food.y - scrollY;
            const dx = mouse.x - food.x;
            const dy = mouse.y - screenY;
            if (Math.sqrt(dx * dx + dy * dy) < 40) { // Larger hitbox
                isDragging = true;
                draggedEntity = food;
                hit = true;
                break;
            }
        }

        // 2. Check Agents
        if (!hit) {
            for (let agent of agents) {
                const screenY = agent.y - scrollY;
                const dx = mouse.x - agent.x;
                const dy = mouse.y - screenY;
                if (Math.sqrt(dx * dx + dy * dy) < agent.radius * 2.5) {
                    isDragging = true;
                    draggedEntity = agent;
                    agent.state = 'DRAGGED';
                    hit = true;
                    break;
                }
            }
        }

        // 3. Splash
        if (!hit) {
            for (let i = 0; i < 15; i++) {
                const c = colors[Math.floor(Math.random() * colors.length)];
                particles.push(new Particle(mouse.x, mouse.y, c));
            }
        }
    });

    window.addEventListener('mouseup', () => {
        if (isDragging && draggedEntity) {
            if (draggedEntity instanceof Agent) {
                draggedEntity.state = 'FALL';
            }
            draggedEntity = null;
            isDragging = false;
        }
    });

    if (profileImage) {
        profileImage.style.cursor = 'pointer';
        profileImage.addEventListener('click', (e) => {
            e.stopPropagation();
            const rect = profileImage.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            for (let i = 0; i < 200; i++) {
                const c = colors[Math.floor(Math.random() * colors.length)];
                particles.push(new Particle(cx, cy, c, true));
            }
            // Smile reaction
            agents.forEach(a => a.smileTimer = 90);
        });
    }

    // Loop
    function animate() {
        ctx.clearRect(0, 0, width, height);
        const scrollY = window.scrollY;

        // Ripples
        for (let i = 0; i < ripples.length; i++) {
            ripples[i].update(); ripples[i].draw(ctx);
            if (ripples[i].alpha <= 0) { ripples.splice(i, 1); i--; }
        }

        // Foods
        for (let i = 0; i < foods.length; i++) {
            foods[i].update();
            foods[i].draw(ctx, scrollY);
        }

        // Agents
        for (let agent of agents) {
            agent.update();
            agent.draw(ctx, scrollY);
        }

        // Particles
        for (let i = 0; i < particles.length; i++) {
            particles[i].update(); particles[i].draw(ctx);
            if (particles[i].life <= 0) { particles.splice(i, 1); i--; }
        }

        // MASKING: Clear the profile image area so paint falls *behind* it/is erased
        if (profileImage) {
            const rect = profileImage.getBoundingClientRect();
            // Create a hole
            ctx.save();
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            // Circle mask matching CSS border-radius 50%
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const radius = rect.width / 2; // Assuming square/circle
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Cursor logic
        let hovering = false;
        if (isDragging) {
            canvas.style.cursor = 'grabbing';
            canvas.style.pointerEvents = 'auto';
        } else {
            // Check agents or food
            for (let e of [...agents, ...foods]) {
                const screenY = e.y - scrollY;
                const dist = Math.sqrt((mouse.x - e.x) ** 2 + (mouse.y - screenY) ** 2);
                if (dist < 30) { hovering = true; break; }
            }
            canvas.style.cursor = hovering ? 'grab' : 'default';
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
