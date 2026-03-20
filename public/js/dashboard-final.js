console.log("TerrA Dashboard JS V3 (Fixed Pagination) Loaded");

const slaData = [
    ["Previously Working – Now Broken (No External Change)", "Functionality was stable earlier and failed without any client/application/backend change.", "Internal regression due to TerrA update.", "2 Days"],
    ["Application Inconsistency Handling", "Client application behaves inconsistently across environments or flows; TerrA requires adjustment to handle variability.", "Format variations, optional elements appearing inconsistently.", "3–5 Days"],
    ["Client Application Change Impact", "Client system change affects existing automation logic.", "Field structure modified, encoding changed, response format updated.", "3–5 Days"],
    ["New Application Change (Small Scope)", "Minor logic enhancement within existing TerrA functionality.", "Small rule adjustment, validation tweak.", "1–2 Days"],
    ["Framework / Core Engine Change", "Change impacting shared automation framework or core logic.", "Parser refactor, engine logic adjustment.", "3 Days"],
    ["New Feature / Enhancement", "Introduction of new capability or workflow.", "New module, new automation capability.", "Effort-based (High ETA – Requires Estimation)"],
    ["Cosmetic / Non-Functional Issue", "UI/report formatting issues without logic impact.", "Alignment, label correction, formatting updates.", "Based on TerrA dev team SLA"]
];

let currentTicketPage = 1;

document.addEventListener('DOMContentLoaded', () => {
    const token = checkAuth();
    if (!token) return;

    document.getElementById('userInfo').textContent = `Welcome, ${localStorage.getItem('username')}`;
    
    // Set default date
    document.getElementById('dateReported').valueAsDate = new Date();

    populateSLATable();
    fetchTickets(1);

    // Open the first accordion by default
    const firstSection = document.querySelector('.accordion-section');
    if (firstSection) firstSection.classList.add('open');

    document.getElementById('supportForm').addEventListener('submit', handleFormSubmit);
});

function toggleAccordion(header) {
    const section = header.parentElement;
    section.classList.toggle('open');
}

function populateSLATable() {
    const tbody = document.querySelector('#slaTable tbody');
    slaData.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach((cell, index) => {
            const td = document.createElement('td');
            if (index === row.length - 1) {
                // ETA column — render as highlighted badge
                const badge = document.createElement('span');
                badge.className = 'eta-badge';
                badge.textContent = cell;
                td.appendChild(badge);
            } else {
                td.textContent = cell;
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

// ─── Toast Notification ───────────────────────────────────────
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);

    // Trigger entrance animation
    requestAnimationFrame(() => toast.classList.add('toast-visible'));

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// ─── Tickets Table with Pagination ────────────────────────────
async function fetchTickets(page = 1) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(CONFIG.API_BASE_URL + `/api/support-request?page=${page}&limit=5&_=${Date.now()}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true' }
        });

        if (response.status === 401) {
            // Token invalid or expired
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            window.location.href = 'index.html';
            return;
        }

        if (!response.ok) throw new Error('Failed to fetch tickets');

        const data = await response.json();
        const rows = data.rows || [];
        const count = data.count || 0;
        const totalPages = data.totalPages || 1;
        const respPage = data.currentPage || 1;
        currentTicketPage = respPage;

        renderTicketsTable(rows, respPage, count);
        renderPagination(respPage, totalPages);

        // Update badge count
        const label = `${count} ticket${count !== 1 ? 's' : ''}`;
        document.getElementById('ticketCountBadge').textContent = label;
        const heroBadge = document.getElementById('heroTicketCount');
        if (heroBadge) heroBadge.textContent = label + ' submitted';
    } catch (err) {
        console.error('Error fetching tickets:', err);
    }
}

function renderTicketsTable(rows, currentPage, totalCount) {
    const tbody = document.querySelector('#ticketsTable tbody');
    const tableContainer = document.getElementById('ticketsTableContainer');
    const emptyState = document.getElementById('ticketsEmpty');

    tbody.innerHTML = '';

    if (!Array.isArray(rows) || rows.length === 0) {
        tableContainer.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    tableContainer.style.display = '';
    emptyState.style.display = 'none';

    const startIndex = (currentPage - 1) * 5;

    rows.forEach((ticket, i) => {
        const tr = document.createElement('tr');

        const numTd = document.createElement('td');
        numTd.textContent = totalCount - startIndex - i;
        numTd.className = 'ticket-num';

        const summaryTd = document.createElement('td');
        summaryTd.textContent = ticket.summary || '—';
        summaryTd.className = 'ticket-summary';

        const projectTd = document.createElement('td');
        projectTd.textContent = ticket.projectName || '—';

        const envTd = document.createElement('td');
        envTd.textContent = ticket.environment || '—';

        const dateTd = document.createElement('td');
        dateTd.textContent = ticket.dateReported
            ? new Date(ticket.dateReported).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—';

        tr.append(numTd, summaryTd, projectTd, envTd, dateTd);
        tbody.appendChild(tr);
    });
}

function renderPagination(currentPage, totalPages) {
    const controls = document.getElementById('paginationControls');
    controls.innerHTML = '';

    if (totalPages <= 1) return;

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.textContent = '← Prev';
    prevBtn.disabled = currentPage <= 1;
    prevBtn.onclick = () => fetchTickets(currentPage - 1);
    controls.appendChild(prevBtn);

    // Page number buttons
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
        controls.appendChild(createPageBtn(1, currentPage));
        if (startPage > 2) {
            const dots = document.createElement('span');
            dots.className = 'page-dots';
            dots.textContent = '…';
            controls.appendChild(dots);
        }
    }

    for (let p = startPage; p <= endPage; p++) {
        controls.appendChild(createPageBtn(p, currentPage));
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const dots = document.createElement('span');
            dots.className = 'page-dots';
            dots.textContent = '…';
            controls.appendChild(dots);
        }
        controls.appendChild(createPageBtn(totalPages, currentPage));
    }

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.onclick = () => fetchTickets(currentPage + 1);
    controls.appendChild(nextBtn);
}

function createPageBtn(page, currentPage) {
    const btn = document.createElement('button');
    btn.className = `page-btn ${page === currentPage ? 'page-btn-active' : ''}`;
    btn.textContent = page;
    btn.onclick = () => fetchTickets(page);
    return btn;
}

// ─── Form Submission ──────────────────────────────────────────
async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const btn = form.querySelector('button');

    btn.disabled = true;
    btn.textContent = 'Submitting...';

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(CONFIG.API_BASE_URL + '/api/support-request', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify(data)
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            window.location.href = 'index.html';
            return;
        }

        if (response.ok) {
            showToast('Support request submitted successfully! Email notification sent.', 'success');
            form.reset();
            document.getElementById('dateReported').valueAsDate = new Date();
            // Refresh the tickets table to show the new ticket
            fetchTickets(1);
        } else {
            const result = await response.json();
            showToast(result.message || 'Submission failed. Please try again.', 'error');
        }
    } catch (err) {
        showToast('An error occurred. Please try again.', 'error');
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Submit Support Request';
    }
}
