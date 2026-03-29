// ===== CUSTOM CURSOR =====
// Cursore personalizzato disabilitato
// const cursorDot = document.querySelector('.cursor-dot');
// const cursorOutline = document.querySelector('.cursor-outline');

// ===== DARK MODE TOGGLE =====
document.addEventListener('DOMContentLoaded', function () {
    const applySafariHighlightFix = () => {
        const ua = navigator.userAgent || navigator.vendor || window.opera;
        const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
        if (!isSafari) return;
        const els = document.querySelectorAll('.highlight');
        els.forEach(el => {
            el.style.webkitTextFillColor = 'transparent';
            el.style.backgroundImage = 'linear-gradient(135deg, var(--primary), var(--accent))';
            el.style.backgroundClip = 'text';
            el.style.webkitBackgroundClip = 'text';
            void el.offsetWidth;
        });
    };
    applySafariHighlightFix();
    window.addEventListener('load', applySafariHighlightFix);
    const themeToggle = document.getElementById('themeToggle');
    const htmlElement = document.documentElement;

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        htmlElement.classList.add('dark-mode');
    }

    // Toggle theme with smooth transition
    if (themeToggle) {
        themeToggle.addEventListener('click', function (e) {
            e.preventDefault();
            htmlElement.classList.toggle('dark-mode');
            const isDarkMode = htmlElement.classList.contains('dark-mode');
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');

            // Add ripple effect
            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position: absolute;
                width: 100%;
                height: 100%;
                top: 0;
                left: 0;
                background: radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%);
                pointer-events: none;
                animation: ripple 0.6s ease-out;
            `;
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    }

    // ===== HAMBURGER MENU =====
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        // Accessibility attributes
        hamburger.setAttribute('role', 'button');
        hamburger.setAttribute('tabindex', '0');
        hamburger.setAttribute('aria-label', 'Apri menu di navigazione');

        const toggleMenu = () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            const isOpen = hamburger.classList.contains('active');
            hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        };

        hamburger.addEventListener('click', toggleMenu);
        hamburger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleMenu();
            }
        });

        // Close menu with a brief animation before navigating
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const isMenuOpen = hamburger.classList.contains('active');
                const isMobile = window.matchMedia('(max-width: 1024px)').matches;
                if (isMenuOpen && isMobile) {
                    const href = link.getAttribute('href');
                    if (href && !href.startsWith('#')) {
                        e.preventDefault();
                        navMenu.classList.add('closing');
                        hamburger.classList.remove('active');
                        hamburger.setAttribute('aria-expanded', 'false');
                        setTimeout(() => {
                            navMenu.classList.remove('active');
                            navMenu.classList.remove('closing');
                            window.location.href = href;
                        }, 250);
                        return;
                    }
                }
                // Default immediate close (desktop or anchors)
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // ===== TILT EFFECT FOR CARDS =====
    const tiltElements = document.querySelectorAll('[data-tilt], .service-card, .category-card');
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    tiltElements.forEach(el => {
        // Skip tilt on mobile for elements explicitly marked
        if (isMobile && el.classList.contains('no-tilt-mobile')) {
            el.style.transform = 'perspective(1150px) rotateX(0) rotateY(0) translateZ(0)';
            return;
        }

        el.addEventListener('mousemove', function (e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 28; // inclinazione ancora più morbida
            const rotateY = (centerX - x) / 28;

            this.style.transform = `perspective(1150px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(3px)`;
        });

        el.addEventListener('mouseleave', function () {
            this.style.transform = 'perspective(1150px) rotateX(0) rotateY(0) translateZ(0)';
        });
    });

    // ===== ANTIGRAVITY SHOWCASE =====
    // ===== ANTIGRAVITY SHOWCASE: FILL-TO-FORM SINGLE SHAPE =====
    const showcase = document.querySelector('.particles-showcase-center');
    const showcaseCanvas = document.getElementById('agCanvas');

    if (showcase && showcaseCanvas) {
        const ctx = showcaseCanvas.getContext('2d', { alpha: true });
        if (ctx) {
            const particles = [];
            const targetShape = [];
            const mouse = { x: -9999, y: -9999, active: false, radius: 110 };
            let width = 0;
            let height = 0;
            let dpr = 1;

            const buildLightbulbShape = (centerX, centerY, size) => {
                targetShape.length = 0;
                const off = document.createElement('canvas');
                // Ensure integer dimensions for safe data extraction
                const w = Math.ceil(size * 2.5);
                const h = Math.ceil(size * 2.5);
                off.width = w;
                off.height = h;
                const octx = off.getContext('2d', { willReadFrequently: true });
                if (!octx) return;

                // Sposta l'origine al centro e centra verticalmente
                const center = w / 2;
                const verticalOffset = -size * 0.1;
                octx.translate(center, center + verticalOffset);
                const scale = size / 100;
                octx.scale(scale, scale);

                octx.fillStyle = '#000000';
                
                // SVG Path perfetto per una lampadina moderna, elegante e chiusa
                const bulbPath = new Path2D('M 0 -45 C -25 -45 -45 -25 -45 0 C -45 15 -35 28 -20 38 L -15 55 L 15 55 L 20 38 C 35 28 45 15 45 0 C 45 -25 25 -45 0 -45 Z');
                octx.fill(bulbPath);
                
                // Base della lampadina a segmenti per il filetto metallico
                const base1 = new Path2D('M -15 58 L 15 58 L 15 65 L -15 65 Z');
                const base2 = new Path2D('M -13 68 L 13 68 L 13 73 L -13 73 Z');
                const base3 = new Path2D('M -9 76 L 9 76 L 7 81 L -7 81 Z');
                octx.fill(base1);
                octx.fill(base2);
                octx.fill(base3);

                const data = octx.getImageData(0, 0, w, h).data;
                const offsetX = centerX - w / 2;
                const offsetY = centerY - h / 2;

                // Estrazione sicura: controlliamo solo l'Alfa
                for (let y = 0; y < h; y += 1.3) {
                    for (let x = 0; x < w; x += 1.3) {
                        const px = Math.floor(x);
                        const py = Math.floor(y);
                        const alpha = data[(py * w + px) * 4 + 3];
                        if (alpha > 128) {
                            targetShape.push({ x: px + offsetX, y: py + offsetY });
                        }
                    }
                }
            };

            const initParticles = () => {
                particles.length = 0;
                const header = showcase.querySelector('.ag-visual-header');
                const headerHeight = header ? header.offsetHeight : 0;
                
                // Usa le dimensioni REALI del canvas (impostate da resize())
                // non costanti hardcoded — questo è il fix del clipping
                const usableHeight = height - headerHeight;
                
                // Dimensiona la lampadina a massimo il 75% dello spazio disponibile
                // compreso il canvas offscreen che è size*1.5
                // Quindi la "footprint" reale è bulbSize * 1.5 in altezza/larghezza
                const bulbSize = Math.min(
                    width * 0.35,          // max 35% larghezza
                    usableHeight * 0.6,    // max 60% altezza disponibile
                    220                    // cap assoluto per non sovradimensionare
                );
                
                const centerX = width / 2;
                // Centro verticale nello spazio sotto l'header
                const centerY = headerHeight + usableHeight / 2;

                buildLightbulbShape(centerX, centerY, bulbSize);

                const count = 4000; 
                const palette = [
                    '#c41e5f', // Magenta standard
                    '#ffffff', // Bianco
                    '#7a1139', // Magenta scuro
                    '#ff66a3', // Magenta chiaro
                    '#bae6fd'  // Azzurrino chiaro
                ];
                
                // Distribuiamo uniformemente i 4000 punti lungo TUTTA la forma estratta.
                const step = Math.max(1, targetShape.length / count);

                for (let i = 0; i < count; i++) {
                    const targetIndex = Math.floor(i * step) % targetShape.length;
                    const target = targetShape[targetIndex] || { x: centerX, y: centerY };
                    particles.push({
                        x: Math.random() * width,
                        y: Math.random() * height,
                        scatterX: Math.random() * width,
                        scatterY: Math.random() * height,
                        targetX: target.x,
                        targetY: target.y,
                        size: Math.random() * 1.8 + 0.8,
                        color: palette[Math.floor(Math.random() * palette.length)],
                        // Movimento molto più dolce e fluido
                        speed: 0.03 + Math.random() * 0.04,
                        // Effetto di fluttuazione ("breathing/wobbling")
                        wobbleOffset: Math.random() * Math.PI * 2,
                        wobbleSpeed: 0.0005 + Math.random() * 0.0015,
                        wobbleDist: Math.random() * 4 + 1
                    });
                }
            };

            const resize = () => {
                const rect = showcase.getBoundingClientRect();
                width = rect.width;
                height = rect.height;
                dpr = Math.min(window.devicePixelRatio || 1, 2);
                showcaseCanvas.width = width * dpr;
                showcaseCanvas.height = height * dpr;
                ctx.scale(dpr, dpr);
                initParticles();
            };

            const animate = () => {
                ctx.clearRect(0, 0, width, height);
                const time = Date.now();
                const mouseArea = mouse.radius;
                const force = 0.5;

                particles.forEach(p => {
                    let baseTx, baseTy;

                    if (mouse.active) {
                        baseTx = p.targetX;
                        baseTy = p.targetY;
                        
                        const dx = p.x - mouse.x;
                        const dy = p.y - mouse.y;
                        const dist = Math.hypot(dx, dy);

                        if (dist < mouseArea) {
                            const angle = Math.atan2(dy, dx);
                            // Interazione col mouse morbida
                            baseTx += Math.cos(angle) * (mouseArea - dist) * force;
                            baseTy += Math.sin(angle) * (mouseArea - dist) * force;
                        }
                    } else {
                        baseTx = p.scatterX;
                        baseTy = p.scatterY;
                        
                        // Deriva lenta naturale
                        p.scatterX += (Math.random() - 0.5) * 0.6;
                        p.scatterY += (Math.random() - 0.5) * 0.6;
                        
                        if (p.scatterX < 0) p.scatterX = width;
                        if (p.scatterX > width) p.scatterX = 0;
                        if (p.scatterY < 0) p.scatterY = height;
                        if (p.scatterY > height) p.scatterY = 0;
                    }

                    // Aggiungiamo il movimento fluttuante morbido ("dolce" e fluido)
                    const tx = baseTx + Math.cos(time * p.wobbleSpeed + p.wobbleOffset) * p.wobbleDist;
                    const ty = baseTy + Math.sin(time * p.wobbleSpeed + p.wobbleOffset) * p.wobbleDist;

                    // Interpolazione inerziale per un arrivo setoso
                    p.x += (tx - p.x) * p.speed;
                    p.y += (ty - p.y) * p.speed;

                    // Disegniamo tutte le particelle come perfetti cerchi
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                });
                
                requestAnimationFrame(animate);
            };

            showcase.addEventListener('mousemove', (e) => {
                const rect = showcase.getBoundingClientRect();
                mouse.x = e.clientX - rect.left;
                mouse.y = e.clientY - rect.top;
                mouse.active = true;
            });
            
            showcase.addEventListener('mouseenter', () => { mouse.active = true; });

            showcase.addEventListener('mouseleave', () => {
                mouse.active = false;
                mouse.x = -9999;
                mouse.y = -9999;
            });

            window.addEventListener('resize', resize);
            resize();
            animate();
        }
    }

    // ===== SMOOTH SCROLL & UI HELPERS =====
    document.querySelectorAll('a[href^="/"]').forEach(link => {
        // Intercept internal links for potential SPA feel or logging
    });

    // Observe elements for scroll animation (Simplified: everything visible by default)
    document.querySelectorAll('.pillar-card, .bento-card, .portfolio-item').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
    });

    // ===== PARALLAX EFFECT WITH SMOOTH SCROLL =====
    const parallaxElements = document.querySelectorAll('.gradient-ball');
    let ticking = false;
    const isMobileParallax = window.matchMedia('(pointer: coarse), (max-width: 768px)').matches;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrolled = window.pageYOffset;

                // Skip heavy transforms on mobile for smooth scrolling
                if (!isMobileParallax && parallaxElements.length) {
                    parallaxElements.forEach((el, index) => {
                        const speed = 0.3 + (index * 0.1);
                        const offsetX = scrolled * speed * 0.5;
                        const offsetY = scrolled * speed;
                        const scale = 1 + scrolled * 0.00005;
                        el.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
                    });
                }

                // Hide/show scroll indicator with smooth fade
                const scrollIndicator = document.querySelector('.scroll-indicator');
                if (scrollIndicator) {
                    const targetOpacity = scrolled > 100 ? '0' : '1';
                    scrollIndicator.style.transition = 'opacity 0.3s ease';
                    scrollIndicator.style.opacity = targetOpacity;
                }

                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    // ===== FORM VALIDATION & ANIMATION =====
    const contactForm = document.getElementById('contactForm');
    const quoteForm = document.getElementById('quoteForm');
    const form = contactForm || quoteForm;

    if (form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        // Ensure FormSubmit redirect goes to current site origin
        const nextInput = form.querySelector('input[name="_next"]');
        if (nextInput) {
            try {
                const origin = window.location.origin;
                const path = window.location.pathname;
                nextInput.value = `${origin}${path}?success=true`;
            } catch (e) {
                // fallback: keep existing value
            }
        }

        // Add focus animations
        inputs.forEach(input => {
            input.addEventListener('focus', function () {
                if (this.parentElement.classList.contains('form-group')) {
                    this.parentElement.style.transform = 'scale(1.02)';
                }
            });

            input.addEventListener('blur', function () {
                if (this.parentElement.classList.contains('form-group')) {
                    this.parentElement.style.transform = 'scale(1)';
                }
            });

            // Real-time validation
            input.addEventListener('input', function () {
                if (this.type === 'text' && this.checkValidity()) {
                    this.style.borderColor = 'var(--primary)';
                } else if (this.value.length > 0 && !this.checkValidity()) {
                    this.style.borderColor = '#ef4444';
                }
            });
        });

        form.addEventListener('submit', function (e) {
            const isRealSend = this.hasAttribute('data-real-send');
            let isValid = true;
            inputs.forEach(input => {
                // Check required fields
                if (input.hasAttribute('required') && !input.value.trim()) {
                    isValid = false;
                    input.style.borderColor = '#ef4444';
                    input.style.animation = 'shake 0.4s ease';
                    setTimeout(() => input.style.animation = '', 400);
                } else if (input.type === 'email' && input.value && !input.checkValidity()) {
                    isValid = false;
                    input.style.borderColor = '#ef4444';
                } else {
                    input.style.borderColor = '';
                }
            });

            // Check privacy checkbox if it exists
            const privacyCheckbox = form.querySelector('#privacy');
            if (privacyCheckbox && !privacyCheckbox.checked) {
                isValid = false;
                privacyCheckbox.style.borderColor = '#ef4444';
            }

            if (!isValid) {
                e.preventDefault();
                return;
            }

            if (isValid && isRealSend) {
                // Allow native submit to FormSubmit; show lightweight loading state without emoji
                const button = this.querySelector('.btn-primary');
                if (button) {
                    button.innerHTML = 'Invio…';
                    button.classList.add('loading');
                    button.style.pointerEvents = 'none';
                }
                return; // no preventDefault
            }

            // Simulated flow (legacy behaviour)
            e.preventDefault();
            if (isValid) {
                const button = this.querySelector('.btn-primary');
                const originalText = button.innerHTML;

                button.innerHTML = 'Elaborazione…';
                button.style.pointerEvents = 'none';

                setTimeout(() => {
                    button.innerHTML = '<span style="display: flex; align-items: center; gap: 0.5rem;">✓ Inviato con successo!</span>';
                    button.style.background = 'linear-gradient(135deg, #10b981, #059669)';

                    setTimeout(() => {
                        button.innerHTML = originalText;
                        button.style.background = '';
                        button.style.pointerEvents = '';
                        this.reset();

                        // Reset input styles
                        inputs.forEach(input => {
                            input.style.borderColor = '';
                        });

                        // Scroll to top with success message
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }, 2500);
                }, 1500);
            }
        });

        // Manage select value state so labels behave
        const selects = form.querySelectorAll('select');
        selects.forEach(sel => {
            const updateSelectState = () => {
                // Mirror current value as attribute for CSS selector
                sel.setAttribute('value', sel.value);
                // Hide base label when a non-empty option is selected
                const fg = sel.closest('.form-group');
                if (fg) fg.classList.toggle('select-filled', sel.value !== '');
            };
            updateSelectState();
            sel.addEventListener('change', updateSelectState);
            sel.addEventListener('blur', updateSelectState);
        });
    }

    // ===== HERO SUBTITLE: KEEP STYLES ON FIRST LOAD =====
    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle) {
        heroSubtitle.style.opacity = '1';
    }

    // ===== HEADER SCROLL EFFECT (class-based for smoother behavior) =====
    let lastScroll = 0;
    const header = document.querySelector('header');
    const isMobileHeader = window.matchMedia('(max-width: 768px)').matches;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        // Condensed state toggle
        const shouldCondense = currentScroll > 100;
        const isCondensed = header.classList.contains('header-condensed');
        if (shouldCondense !== isCondensed) {
            header.classList.toggle('header-condensed', shouldCondense);
        }

        // Hide on scroll down only for larger screens
        if (!isMobileHeader) {
            const shouldHide = currentScroll > lastScroll && currentScroll > 500;
            const isHidden = header.classList.contains('header-hidden');
            if (shouldHide !== isHidden) {
                header.classList.toggle('header-hidden', shouldHide);
            }
        } else {
            // Ensure header visible on mobile to avoid flicker at top
            header.classList.remove('header-hidden');
        }

        lastScroll = currentScroll;
    }, { passive: true });

    // ===== ADD CSS ANIMATIONS =====
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        header {
            transition: all 0.3s ease;
        }
        
        .form-group {
            transition: transform 0.2s ease;
        }

        .form-success {
            margin: 0 auto 1rem;
            max-width: 1100px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: #fff;
            padding: 0.9rem 1rem;
            border-radius: 12px;
            box-shadow: 0 10px 24px rgba(16, 185, 129, 0.3);
            text-align: center;
            font-weight: 700;
        }
    `;
    document.head.appendChild(style);
    // Show success banner after redirect from FormSubmit
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
        const banner = document.createElement('div');
        banner.className = 'form-success';
        banner.textContent = 'Messaggio inviato! Ti risponderemo al più presto.';
        const qc = document.querySelector('.quote-container');
        const cs = document.querySelector('.contact-section');
        if (qc) qc.prepend(banner);
        else if (cs) cs.prepend(banner);
        else document.body.prepend(banner);
    }

    // ===== LOGO CLICK EASTER EGG =====
    const logo = document.querySelector('.logo');
    let clickCount = 0;

    if (logo) {
        logo.addEventListener('click', () => {
            clickCount++;
            if (clickCount === 5) {
                logo.style.animation = 'none';
                setTimeout(() => {
                    logo.style.animation = 'spin 0.5s ease';
                    setTimeout(() => {
                        logo.style.animation = 'float 3s ease-in-out infinite';
                    }, 500);
                }, 10);
                clickCount = 0;
            }
        });
    }

    console.log('🎨 Pinizzotto - Website loaded successfully!');

    // ===== PLASTICATURA: sincronizza select e opzioni radio (Opaca/Lucida) =====
    const plastSelect = document.getElementById('plasticatura');
    const radioOpaca = document.getElementById('plastica-opaca');
    const radioLucida = document.getElementById('plastica-lucida');

    if (plastSelect && radioOpaca && radioLucida) {
        const applyFromSelect = () => {
            const v = plastSelect.value;
            if (v === 'opaca') {
                radioOpaca.checked = true;
                radioLucida.checked = false;
            } else if (v === 'lucida') {
                radioLucida.checked = true;
                radioOpaca.checked = false;
            } else {
                radioOpaca.checked = false;
                radioLucida.checked = false;
            }
        };

        const applyFromRadio = () => {
            if (radioOpaca.checked) plastSelect.value = 'opaca';
            else if (radioLucida.checked) plastSelect.value = 'lucida';
        };

        // Init from current select value
        applyFromSelect();

        // Listeners
        plastSelect.addEventListener('change', applyFromSelect);
        radioOpaca.addEventListener('change', applyFromRadio);
        radioLucida.addEventListener('change', applyFromRadio);
    }

    // ===== PRIVACY MODAL =====
    const privacyLink = document.getElementById('privacyLink');
    const privacyModal = document.getElementById('privacyModal');
    const privacyClose = document.getElementById('privacyClose');

    // Helper to open/close privacy modal; works on touch and delegated triggers
    const openPrivacy = (e) => {
        if (!privacyModal) return;
        if (e) e.preventDefault();
        privacyModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closePrivacy = () => {
        if (!privacyModal) return;
        privacyModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    };

    if (privacyModal) {
        if (privacyClose) {
            privacyClose.addEventListener('click', closePrivacy);
        }

        privacyModal.addEventListener('click', function (e) {
            if (e.target === privacyModal) closePrivacy();
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && privacyModal.classList.contains('active')) {
                closePrivacy();
            }
        });

        // Attach to any element marked for privacy modal (anchor or button), plus legacy #privacyLink
        const privacyTriggers = Array.from(document.querySelectorAll('[data-privacy-link], #privacyLink'));
        privacyTriggers.forEach(trigger => {
            trigger.addEventListener('click', openPrivacy);
        });
    }

    // ===== Reveal on Scroll (site-wide smooth entrances) =====
    const revealTargets = document.querySelectorAll(
        '.service-card, .contact-form, .contact-info, .quote-container, .page-header, .social-card, .ag-showcase, .cta-buttons'
    );

    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    io.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            threshold: 0.15,
            rootMargin: '0px 0px -10% 0px'
        });

        revealTargets.forEach((el, idx) => {
            el.classList.add('reveal');
            el.style.transitionDelay = `${Math.min(idx * 60, 360)}ms`;
            io.observe(el);
        });
    } else {
        // Fallback: show immediately
        revealTargets.forEach((el) => el.classList.add('in-view'));
    }

    // ===== ANIMATED COUNTERS =====
    const statNumbers = document.querySelectorAll('.stat-number');

    function animateCounter(element) {
        const target = parseInt(element.getAttribute('data-target'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                element.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target;
            }
        };

        updateCounter();
    }

    if (statNumbers.length > 0) {
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(stat => statsObserver.observe(stat));
    }

    // ===== PORTFOLIO CAROUSEL (infinite forward loop) =====
    const carousel = document.querySelector('.portfolio-carousel');
    if (carousel) {
        const track = carousel.querySelector('.carousel-track');
        const originalSlides = Array.from(track.children);
        const prevBtn = carousel.querySelector('.prev');
        const nextBtn = carousel.querySelector('.next');
        const indicatorsContainer = carousel.querySelector('.carousel-indicators');

        const SLIDE_COUNT = originalSlides.length;
        if (SLIDE_COUNT === 0) return;

        // Clone first and last for seamless wrap
        const firstClone = originalSlides[0].cloneNode(true);
        const lastClone = originalSlides[SLIDE_COUNT - 1].cloneNode(true);
        track.insertBefore(lastClone, originalSlides[0]);
        track.appendChild(firstClone);

        // Internal index uses range [0..SLIDE_COUNT+1], where 0 = lastClone, 1..SLIDE_COUNT = real slides, SLIDE_COUNT+1 = firstClone
        let index = 1; // start on first real slide

        // Ensure transition style exists
        const transitionCSS = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
        track.style.transition = transitionCSS;
        track.style.transform = `translateX(-${index * 100}%)`;

        // Indicators for real slides
        originalSlides.forEach((_, i) => {
            const indicator = document.createElement('div');
            indicator.classList.add('carousel-indicator');
            if (i === 0) indicator.classList.add('active');
            indicator.addEventListener('click', () => goToRealSlide(i));
            indicatorsContainer.appendChild(indicator);
        });
        const indicators = Array.from(indicatorsContainer.children);

        function setActiveIndicator() {
            const visibleRealIndex = (index - 1 + SLIDE_COUNT) % SLIDE_COUNT; // map 1..SLIDE_COUNT to 0..SLIDE_COUNT-1
            indicators.forEach((dot, i) => dot.classList.toggle('active', i === visibleRealIndex));
        }

        function snapWithoutTransition(toIndex) {
            // Temporarily disable transition to avoid backward visual motion
            track.style.transition = 'none';
            index = toIndex;
            track.style.transform = `translateX(-${index * 100}%)`;
            // Force reflow, then restore transition
            void track.offsetHeight;
            track.style.transition = transitionCSS;
            setActiveIndicator();
        }

        function goToRealSlide(realIndex) {
            // realIndex is 0..SLIDE_COUNT-1, map to internal index realIndex+1
            index = realIndex + 1;
            track.style.transform = `translateX(-${index * 100}%)`;
            setActiveIndicator();
        }

        function nextSlide() {
            index += 1;
            track.style.transform = `translateX(-${index * 100}%)`;
            setActiveIndicator();

            // If we moved onto the firstClone, snap forward to first real slide
            if (index === SLIDE_COUNT + 1) {
                track.addEventListener('transitionend', function handleNextWrap() {
                    track.removeEventListener('transitionend', handleNextWrap);
                    snapWithoutTransition(1);
                });
            }
        }

        function prevSlide() {
            index -= 1;
            track.style.transform = `translateX(-${index * 100}%)`;
            setActiveIndicator();

            // If we moved onto the lastClone, snap backward to last real slide
            if (index === 0) {
                track.addEventListener('transitionend', function handlePrevWrap() {
                    track.removeEventListener('transitionend', handlePrevWrap);
                    snapWithoutTransition(SLIDE_COUNT);
                });
            }
        }

        nextBtn.addEventListener('click', nextSlide);
        prevBtn.addEventListener('click', prevSlide);

        // Auto-play
        let autoplayInterval = setInterval(nextSlide, 5000);
        carousel.addEventListener('mouseenter', () => clearInterval(autoplayInterval));
        carousel.addEventListener('mouseleave', () => {
            autoplayInterval = setInterval(nextSlide, 5000);
        });

        // Mobile/touch: tap to toggle overlay visibility and center text
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (isTouch) {
            track.querySelectorAll('.portfolio-item').forEach(item => {
                item.addEventListener('click', () => {
                    item.classList.toggle('overlay-visible');
                });
            });
        }
    }

    // ===== PARALLAX SCROLLING =====
    const parallaxSections = document.querySelectorAll('.parallax-section');

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;

        parallaxSections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const sectionTop = rect.top + scrolled;
            const sectionHeight = rect.height;

            if (scrolled > sectionTop - window.innerHeight && scrolled < sectionTop + sectionHeight) {
                const offset = (scrolled - (sectionTop - window.innerHeight)) * 0.3;
                section.style.transform = `translateY(${offset}px)`;
            }
        });
    });

    // ===== SCROLL TO TOP BUTTON =====
    const scrollToTopBtn = document.getElementById('scrollToTop');

    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 500) {
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        });

        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});

// ============================================
// COOKIE BANNER
// ============================================
const cookieBanner = document.getElementById('cookieBanner');
const acceptCookies = document.getElementById('acceptCookies');
const declineCookies = document.getElementById('declineCookies');
const customizeCookies = document.getElementById('customizeCookies');
const cookiePrivacyLink = document.getElementById('cookiePrivacyLink');
const cookiePolicyLink = document.getElementById('cookiePolicyLink');

// Controlla se l'utente ha già fatto una scelta
function checkCookieConsent() {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
        // Mostra il banner dopo un piccolo ritardo
        setTimeout(() => {
            cookieBanner.classList.add('show');
        }, 1000);
    }
}

// Apri modale privacy dal cookie banner
if (cookiePrivacyLink) {
    cookiePrivacyLink.addEventListener('click', (e) => {
        e.preventDefault();
        const privacyLink = document.getElementById('privacyLink');
        if (privacyLink) {
            privacyLink.click();
        }
    });
}

// Apri modale cookie policy dal cookie banner
if (cookiePolicyLink) {
    cookiePolicyLink.addEventListener('click', (e) => {
        e.preventDefault();
        const privacyLink = document.getElementById('privacyLink');
        if (privacyLink) {
            privacyLink.click();
        }
    });
}

// Personalizza cookie (apre modale privacy)
if (customizeCookies) {
    customizeCookies.addEventListener('click', () => {
        const privacyLink = document.getElementById('privacyLink');
        if (privacyLink) {
            privacyLink.click();
        }
    });
}

// Accetta i cookie
if (acceptCookies) {
    acceptCookies.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'accepted');
        cookieBanner.classList.remove('show');
        console.log('Cookie accettati');
    });
}

// Rifiuta i cookie
if (declineCookies) {
    declineCookies.addEventListener('click', () => {
        localStorage.setItem('cookieConsent', 'declined');
        cookieBanner.classList.remove('show');
        console.log('Cookie rifiutati');
    });
}

// Verifica al caricamento della pagina
checkCookieConsent();
