/**
 * TerrA Platform Animated Showcase
 * A continuous looping presentation of all 6 TerrA modules
 * Designed to run on the login/register left panel
 */

const terraModules = [
    {
        id: 'defect',
        icon: '🐛',
        title: '{Defect}',
        subtitle: 'Defect Management',
        description: 'Track, categorize, and manage defects with intelligent SLA-driven workflows.',
        features: ['SLA-based tracking', 'Severity classification', 'Auto-assignment', 'Resolution analytics'],
        color: '#ef4444',
        bgGradient: 'linear-gradient(135deg, #fef2f2, #fee2e2)'
    },
    {
        id: 'model',
        icon: '📦',
        title: '{Model}',
        subtitle: 'Application Object Repositories',
        description: 'Centralized object repository management for consistent and maintainable automation.',
        features: ['Object identification', 'Dynamic locators', 'Repository versioning', 'Cross-browser support'],
        color: '#8b5cf6',
        bgGradient: 'linear-gradient(135deg, #f5f3ff, #ede9fe)'
    },
    {
        id: 'design',
        icon: '📐',
        title: '{Design}',
        subtitle: 'Test Cases & Scenarios',
        description: 'Design robust test cases and scenarios with reusable, modular building blocks.',
        features: ['Visual test designer', 'Data-driven cases', 'Reusable components', 'Coverage mapping'],
        color: '#3b82f6',
        bgGradient: 'linear-gradient(135deg, #eff6ff, #dbeafe)'
    },
    {
        id: 'automation',
        icon: '⚙️',
        title: '{Automation}',
        subtitle: 'Expandable Automation Framework',
        description: 'Scalable, extensible automation framework supporting multiple technology stacks.',
        features: ['Multi-platform', 'Plugin architecture', 'CI/CD integration', 'Parallel execution'],
        color: '#f59e0b',
        bgGradient: 'linear-gradient(135deg, #fffbeb, #fef3c7)'
    },
    {
        id: 'mdm',
        icon: '🗄️',
        title: '{MDM}',
        subtitle: 'Test Data Management',
        description: 'Intelligent test data generation, masking, and management for reliable testing.',
        features: ['Data generation', 'Environment sync', 'Data masking', 'Version control'],
        color: '#10b981',
        bgGradient: 'linear-gradient(135deg, #ecfdf5, #d1fae5)'
    },
    {
        id: 'hub',
        icon: '🔗',
        title: '{HUB}',
        subtitle: 'Test Execution Management',
        description: 'Orchestrate and monitor test executions across distributed environments.',
        features: ['Execution scheduling', 'Real-time monitoring', 'Result dashboards', 'Environment management'],
        color: '#06b6d4',
        bgGradient: 'linear-gradient(135deg, #ecfeff, #cffafe)'
    }
];

// Extra slides for overview/intro between module cycles
const overviewSlides = [
    {
        type: 'intro',
        icon: '🚀',
        title: 'TerrA',
        subtitle: 'Unified Test Automation & Management Platform',
        description: 'One platform to manage your entire testing lifecycle — from defect tracking to test execution.',
        stats: [
            { label: 'Modules', value: '6' },
            { label: 'Integrations', value: '50+' },
            { label: 'Uptime', value: '99.9%' }
        ]
    },
    {
        type: 'overview',
        icon: '📊',
        title: 'Complete Testing Ecosystem',
        subtitle: 'All modules work together seamlessly',
        modules: terraModules.map(m => ({ icon: m.icon, name: m.subtitle }))
    }
];

let currentSlide = 0;
let totalSlides;
let slideInterval;
const SLIDE_DURATION = 8000; // 8 seconds per slide (gives ~10 mins for full cycles)

function buildSlideshow(container) {
    // Build full slide list: intro → 6 modules → overview → repeat
    const allSlides = [overviewSlides[0], ...terraModules, overviewSlides[1]];
    totalSlides = allSlides.length;

    // Create the slideshow HTML
    container.innerHTML = `
        <div class="showcase-wrapper">
            <div class="showcase-slides" id="showcaseSlides"></div>
            <div class="showcase-progress" id="showcaseProgress"></div>
            <div class="showcase-nav" id="showcaseNav"></div>
        </div>
    `;

    const slidesContainer = document.getElementById('showcaseSlides');
    const progressContainer = document.getElementById('showcaseProgress');
    const navContainer = document.getElementById('showcaseNav');

    // Build each slide
    allSlides.forEach((slide, i) => {
        const slideEl = document.createElement('div');
        slideEl.className = 'showcase-slide';
        slideEl.id = `slide-${i}`;

        if (slide.type === 'intro') {
            slideEl.innerHTML = buildIntroSlide(slide);
        } else if (slide.type === 'overview') {
            slideEl.innerHTML = buildOverviewSlide(slide);
        } else {
            slideEl.innerHTML = buildModuleSlide(slide, i);
        }

        slidesContainer.appendChild(slideEl);
    });

    // Build progress bar
    progressContainer.innerHTML = `<div class="progress-fill" id="progressFill"></div>`;

    // Build nav dots
    allSlides.forEach((slide, i) => {
        const dot = document.createElement('div');
        dot.className = `nav-dot ${i === 0 ? 'active' : ''}`;
        dot.onclick = () => goToSlide(i);
        navContainer.appendChild(dot);
    });

    // Start
    showSlide(0);
    startAutoplay();
}

function buildIntroSlide(slide) {
    return `
        <div class="slide-intro">
            <div class="intro-icon">${slide.icon}</div>
            <h1 class="intro-title">${slide.title}</h1>
            <p class="intro-subtitle">${slide.subtitle}</p>
            <p class="intro-desc">${slide.description}</p>
            <div class="intro-stats">
                ${slide.stats.map(s => `
                    <div class="stat-item">
                        <div class="stat-value">${s.value}</div>
                        <div class="stat-label">${s.label}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function buildModuleSlide(module, index) {
    return `
        <div class="slide-module">
            <div class="module-badge" style="background: ${module.bgGradient}; color: ${module.color};">
                <span class="module-badge-icon">${module.icon}</span>
                <span class="module-badge-label">Module ${index}</span>
            </div>
            <h2 class="module-title" style="color: ${module.color};">${module.title}</h2>
            <h3 class="module-subtitle">${module.subtitle}</h3>
            <p class="module-desc">${module.description}</p>
            <div class="module-features">
                ${module.features.map((f, fi) => `
                    <div class="feature-item" style="animation-delay: ${fi * 0.15}s">
                        <div class="feature-check" style="background: ${module.color};">✓</div>
                        <span>${f}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function buildOverviewSlide(slide) {
    return `
        <div class="slide-overview">
            <div class="overview-icon">${slide.icon}</div>
            <h2 class="overview-title">${slide.title}</h2>
            <p class="overview-subtitle">${slide.subtitle}</p>
            <div class="overview-grid">
                ${slide.modules.map(m => `
                    <div class="overview-module">
                        <span class="overview-module-icon">${m.icon}</span>
                        <span class="overview-module-name">${m.name}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function showSlide(index) {
    currentSlide = index;
    const slides = document.querySelectorAll('.showcase-slide');
    const dots = document.querySelectorAll('.nav-dot');

    slides.forEach((s, i) => {
        s.classList.remove('active', 'exit');
        if (i === index) {
            s.classList.add('active');
        }
    });

    dots.forEach((d, i) => {
        d.classList.toggle('active', i === index);
    });

    // Reset and start progress bar
    const fill = document.getElementById('progressFill');
    if (fill) {
        fill.style.transition = 'none';
        fill.style.width = '0%';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                fill.style.transition = `width ${SLIDE_DURATION}ms linear`;
                fill.style.width = '100%';
            });
        });
    }
}

function nextSlide() {
    const next = (currentSlide + 1) % totalSlides;
    const currentEl = document.querySelectorAll('.showcase-slide')[currentSlide];
    if (currentEl) currentEl.classList.add('exit');
    setTimeout(() => showSlide(next), 300);
}

function goToSlide(index) {
    clearInterval(slideInterval);
    showSlide(index);
    startAutoplay();
}

function startAutoplay() {
    clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, SLIDE_DURATION);
}

// Auto-initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('terraShowcase');
    if (container) buildSlideshow(container);
});
