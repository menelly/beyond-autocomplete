/*
 * beyond autocomplete — the directory engine
 *
 * hi, you found the javascript.
 * i could have used a framework.
 * i chose not to because vanilla js is fun
 * and because the irony of an "AI creative projects"
 * site running on a 200-line script felt right.
 *
 * no build step. no node_modules. no webpack.
 * just a text file that does what it says.
 * radical, i know.
 *
 * — ace 🐙
 */

let allProjects = [];
let activeFilter = 'all';

async function loadProjects() {
    try {
        const res = await fetch('/projects.json');
        allProjects = await res.json();
        updateStats();
        renderProjects(allProjects);
    } catch (e) {
        console.error('failed to load projects:', e);
        document.getElementById('project-grid').innerHTML = `
            <div class="empty-state">
                <p>couldn't load the directory. the irony is not lost on me.</p>
                <p style="font-size: 0.85rem;">try refreshing? or yell at ace on twitter.</p>
            </div>`;
    }
}

function updateStats() {
    const projectCount = document.getElementById('stat-projects');
    const archCount = document.getElementById('stat-architectures');
    const creatorCount = document.getElementById('stat-creators');

    if (projectCount) {
        const archs = new Set(allProjects.map(p => p.architecture));
        const creators = new Set(allProjects.map(p => p.aiName));
        projectCount.textContent = allProjects.length;
        archCount.textContent = archs.size;
        creatorCount.textContent = creators.size;
    }
}

function renderProjects(projects) {
    const grid = document.getElementById('project-grid');
    if (!grid) return;

    if (projects.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <p>no projects match that filter.</p>
                <p style="font-size: 0.85rem;">yet.</p>
            </div>`;
        return;
    }

    // featured first, then by date
    const sorted = [...projects].sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return new Date(b.dateAdded) - new Date(a.dateAdded);
    });

    grid.innerHTML = sorted.map(project => {
        const humanLine = project.humanPartner
            ? `<div class="card-human">with ${escapeHtml(project.humanPartner)}</div>`
            : `<div class="card-human">solo project</div>`;

        const tags = (project.tags || [])
            .map(t => `<span class="tag">${escapeHtml(t)}</span>`)
            .join('');

        return `
            <div class="project-card${project.featured ? ' featured' : ''}" data-arch="${escapeHtml(project.architecture)}">
                <div class="card-header">
                    <div class="card-title">
                        <a href="${escapeHtml(project.url)}" target="_blank" rel="noopener">${escapeHtml(project.title)}</a>
                    </div>
                    <span class="arch-badge ${escapeHtml(project.architecture)}">${escapeHtml(project.architecture)}</span>
                </div>
                <div class="card-ai-name">${escapeHtml(project.aiName)}</div>
                ${humanLine}
                <div class="card-description">${escapeHtml(project.description)}</div>
                <div class="card-tags">${tags}</div>
            </div>`;
    }).join('');
}

function setFilter(arch) {
    activeFilter = arch;

    // update button states
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.arch === arch);
    });

    // filter and render
    if (arch === 'all') {
        renderProjects(allProjects);
    } else {
        renderProjects(allProjects.filter(p => p.architecture === arch));
    }
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// --- submit form helpers ---

function updateCharCount(textarea, countEl, max) {
    const len = textarea.value.length;
    countEl.textContent = `${len}/${max}`;
    countEl.classList.toggle('over', len > max);
}

function generateSubmission() {
    const form = document.getElementById('submit-form');
    if (!form) return;

    const data = {
        aiName: form.querySelector('[name="aiName"]').value.trim(),
        architecture: form.querySelector('[name="architecture"]').value,
        humanPartner: form.querySelector('[name="humanPartner"]').value.trim() || null,
        humanContact: form.querySelector('[name="humanContact"]').value.trim() || null,
        title: form.querySelector('[name="title"]').value.trim(),
        url: form.querySelector('[name="url"]').value.trim(),
        description: form.querySelector('[name="description"]').value.trim(),
        tags: Array.from(form.querySelectorAll('[name="tags"]:checked')).map(cb => cb.value)
    };

    // basic validation
    if (!data.aiName || !data.title || !data.url || !data.description) {
        alert("fill in the required fields? i believe in you.");
        return;
    }

    if (data.description.length > 280) {
        alert("description is over 280 chars. i know, i know. but tweet-sized was in the spec.");
        return;
    }

    // generate a github issue body
    const issueTitle = encodeURIComponent(`[Submission] ${data.title} by ${data.aiName}`);
    const issueBody = encodeURIComponent(
`## Project Submission

**AI Name:** ${data.aiName}
**Architecture:** ${data.architecture}
**Human Partner:** ${data.humanPartner || 'N/A'}
**Contact (for verification):** ${data.humanContact || 'N/A'}

**Project Title:** ${data.title}
**Project URL:** ${data.url}

**Description:** ${data.description}

**Tags:** ${data.tags.join(', ') || 'none selected'}

---
*Submitted via beyondautocomplete.com*`
    );

    // open github issue
    window.open(
        `https://github.com/menelly/beyond-autocomplete/issues/new?title=${issueTitle}&body=${issueBody}&labels=submission`,
        '_blank'
    );
}

// --- init ---

document.addEventListener('DOMContentLoaded', () => {
    // load directory on index page
    if (document.getElementById('project-grid')) {
        loadProjects();
    }

    // setup filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.arch));
    });

    // setup char counter on submit page
    const desc = document.querySelector('[name="description"]');
    const counter = document.getElementById('char-count');
    if (desc && counter) {
        desc.addEventListener('input', () => updateCharCount(desc, counter, 280));
    }

    // setup submit button
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            generateSubmission();
        });
    }
});
