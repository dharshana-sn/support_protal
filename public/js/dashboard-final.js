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
let currentSearch = '';
let currentProject = '';

function getStatusBadgeHtml(status) {
    status = status || 'Open';
    let bg = '#dbeafe'; let color = '#1e40af'; // Open/Blue
    if (status === 'New')         { bg = '#e0e7ff'; color = '#3730a3'; } // Indigo
    if (status === 'In Progress') { bg = '#fef08a'; color = '#854d0e'; } // Yellow
    if (status === 'Resolved')    { bg = '#bbf7d0'; color = '#166534'; } // Green
    if (status === 'Closed')      { bg = '#fecaca'; color = '#991b1b'; } // Red
    if (status === 'Reopened')    { bg = '#fed7aa'; color = '#9a3412'; } // Orange

    let displayText = status;

    return `<span class="badge" style="background:${bg};color:${color};padding:5px 10px;border-radius:12px;font-size:0.75rem;font-weight:700;">${displayText}</span>`;
}

document.addEventListener('DOMContentLoaded', () => {
    const token = checkAuth();
    if (!token) return;

    const username = localStorage.getItem('username') || '';
    // Top-bar user info
    const userInfoEl = document.getElementById('userInfo');
    if (userInfoEl) userInfoEl.textContent = `Welcome, ${username}`;
    // Sidebar username
    const sidebarName = document.getElementById('sidebarUserName');
    if (sidebarName) sidebarName.textContent = username;
    
    // Set default date
    document.getElementById('dateReported').valueAsDate = new Date();

    populateSLATable();
    fetchTickets(1);

    // Open the first accordion by default
    const firstSection = document.querySelector('.accordion-section');
    if (firstSection) firstSection.classList.add('open');

    document.getElementById('supportForm').addEventListener('submit', handleFormSubmit);

    // Init Notification polling
    fetchNotifications();
    notificationInterval = setInterval(fetchNotifications, 10000); 

    // Search Input Listener
    // Project Filter Listener
    const projectSelect = document.getElementById('projectFilterSelect');
    if (projectSelect) {
        projectSelect.addEventListener('change', (e) => {
            currentProject = e.target.value;
            fetchTickets(1);
        });
        fetchProjectList();
    }
});

function debounce(func, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}


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
    currentTicketPage = page;
    
    // Add Search & Project Query if present
    const searchParam = currentSearch ? `&search=${encodeURIComponent(currentSearch)}` : '';
    const projectParam = currentProject ? `&project=${encodeURIComponent(currentProject)}` : '';
    
    try {
        const response = await fetch(CONFIG.API_BASE_URL + `/api/support-request?page=${page}&limit=5${searchParam}${projectParam}&_=${Date.now()}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true', 'Bypass-Tunnel-Reminder': 'true' }
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

        // Update badge counts
        const label = `${count} ticket${count !== 1 ? 's' : ''}`;
        const ticketCountEl = document.getElementById('ticketCountBadge');
        if (ticketCountEl) ticketCountEl.textContent = label;
        const heroBadge = document.getElementById('heroTicketCount');
        if (heroBadge) heroBadge.textContent = label + ' submitted';
        // Update sidebar badge
        const sbBadge = document.getElementById('sidebarBadge');
        if (sbBadge) sbBadge.textContent = count;
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

    const role = localStorage.getItem('role') || 'user';
    const headerRow = document.querySelector('#ticketsTable thead tr');
    if (role === 'support' && !document.getElementById('th-created-by')) {
        const th = document.createElement('th');
        th.id = 'th-created-by';
        th.textContent = 'Sys Account';
        headerRow.insertBefore(th, headerRow.children[1]);
    }

    const startIndex = (currentPage - 1) * 5;

    rows.forEach((ticket, i) => {
        const tr = document.createElement('tr');

        const numTd = document.createElement('td');
        
        const authorTd = document.createElement('td');
        authorTd.textContent = ticket.User ? ticket.User.username : '—';
        authorTd.style.color = 'var(--accent-indigo)';
        authorTd.style.fontWeight = '600';
        numTd.textContent = totalCount - startIndex - i;
        numTd.className = 'ticket-num';

        const summaryTd = document.createElement('td');
        summaryTd.textContent = ticket.summary || '—';
        summaryTd.className = 'ticket-summary';

        const projectTd = document.createElement('td');
        projectTd.textContent = ticket.projectName || '—';

        const envTd = document.createElement('td');
        envTd.textContent = ticket.environment || '—';

        const statusTd = document.createElement('td');
        statusTd.innerHTML = getStatusBadgeHtml(ticket.status);

        const dateTd = document.createElement('td');
        dateTd.textContent = ticket.dateReported
            ? new Date(ticket.dateReported).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—';

        tr.className = 'clickable-row';
        tr.onclick = () => openTicketModal(ticket.id);

        if (role === 'support') {
            tr.append(numTd, authorTd, summaryTd, projectTd, envTd, statusTd, dateTd);
        } else {
            tr.append(numTd, summaryTd, projectTd, envTd, statusTd, dateTd);
        }
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

    // ─── Custom Validation: check all required fields ───
    const requiredFields = form.querySelectorAll('[data-error]');
    const emptyFields = [];
    requiredFields.forEach(field => {
        if (!field.value || !field.value.trim()) {
            emptyFields.push(field);
        }
    });

    if (emptyFields.length > 0) {
        const firstEmpty = emptyFields[0];
        
        // Use the custom data-error attribute, falling back to a generic message
        const errorMessage = firstEmpty.getAttribute('data-error') || "Please fill in all required fields.";
        
        showToast(errorMessage, 'error');

        // Open accordion and scroll
        const accordion = firstEmpty.closest('.accordion-section');
        if (accordion && !accordion.classList.contains('open')) {
            accordion.classList.add('open');
        }
        setTimeout(() => firstEmpty.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
        firstEmpty.focus({ preventScroll: true });
        return;
    }

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
                'ngrok-skip-browser-warning': 'true',
                'Bypass-Tunnel-Reminder': 'true'
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

// ─── Ticket Details Modal & Comments ──────────────────────────
let currentTicketId = null;

async function openTicketModal(id) {
    currentTicketId = id;
    const modal = document.getElementById('ticketModal');
    const role = localStorage.getItem('role') || 'user';
    const userId = parseInt(localStorage.getItem('userId') || '0');
    const token = localStorage.getItem('token');

    // Reset modal
    document.getElementById('modalTicketSummary').textContent = 'Loading...';
    document.getElementById('modalTicketBody').innerHTML = '';
    document.getElementById('modalCommentsList').innerHTML = '<p style="color:#94a3b8;">Loading comments...</p>';
    document.getElementById('statusUpdateSection').style.display = 'none';
    document.getElementById('userActionSection').style.display = 'none';

    modal.style.display = 'block';

    try {
        const response = await fetch(CONFIG.API_BASE_URL + `/api/support-request/${id}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true', 'Bypass-Tunnel-Reminder': 'true' }
        });

        if (!response.ok) throw new Error('Failed to load ticket details');
        const ticket = await response.json();

        document.getElementById('modalTicketSummary').textContent = `#${ticket.id} - ${ticket.summary}`;

        const statusContainer = document.getElementById('modalTicketStatus');
        statusContainer.innerHTML = getStatusBadgeHtml(ticket.status);
        statusContainer.style.background = 'transparent';
        statusContainer.style.padding = '0';

        let bodyHtml = '';
        if (role === 'support') {
            bodyHtml += `<p style="background:var(--light-blue);padding:8px 12px;border-radius:6px;color:initial;font-weight:600;margin-bottom:12px;border-left:3px solid var(--accent-indigo);">User Account: <span style="color:var(--accent-indigo)">${ticket.User ? ticket.User.username : 'Unknown'}</span></p>`;
        }
        bodyHtml += `<p><strong>Form Reported By:</strong> ${ticket.reportedBy} | <strong>Project:</strong> ${ticket.projectName}</p>`;
        bodyHtml += `<p><strong>Description:</strong><br>${(ticket.detailedDescription || '').replace(/\n/g, '<br>')}</p>`;
        if (ticket.step1 || ticket.expectedResult) {
            bodyHtml += `<p><strong>Steps:</strong><br>1. ${ticket.step1 || ''}<br>2. ${ticket.step2 || ''}<br>3. ${ticket.step3 || ''}</p>`;
            bodyHtml += `<p><strong>Expected:</strong> ${ticket.expectedResult || ''}<br><strong>Actual:</strong> ${ticket.actualResult || ''}</p>`;
        }
        document.getElementById('modalTicketBody').innerHTML = bodyHtml;

        // Support: show status dropdown (New / Open / In Progress / Resolved)
        if (role === 'support') {
            document.getElementById('statusUpdateSection').style.display = 'flex';
            document.getElementById('statusSelect').value = ticket.status || 'Open';
        }

        // Ticket Owner: show Reopen / Close dropdown
        const isOwner = Number(ticket.userId) === Number(userId);
        if (isOwner && role !== 'support') {
            const userSection = document.getElementById('userActionSection');
            const sel = document.getElementById('userStatusSelect');
            const currentStatus = ticket.status || 'Open';
            // Pre-select the most logical action
            if (currentStatus === 'Closed' || currentStatus === 'Resolved') {
                sel.value = 'Reopened';
            } else {
                sel.value = 'Closed';
            }
            userSection.style.display = 'flex';
        }

        renderComments(ticket.Comments);
    } catch (err) {
        console.error('Error in openTicketModal:', err);
        document.getElementById('modalTicketBody').innerHTML = `<p style="color:red; background:#fee2e2; padding:10px; border-radius:5px; border: 1px solid #ef4444;">Error loading ticket details: ${err.message}</p>`;
    }
}

function closeTicketModal() {
    document.getElementById('ticketModal').style.display = 'none';
    document.getElementById('statusUpdateSection').style.display = 'none';
    document.getElementById('userActionSection').style.display = 'none';
    currentTicketId = null;
}

// ─── User Actions: Reopen / Close (dropdown) ─────────────
async function setUserTicketStatus() {
    if (!currentTicketId) return;
    const status = document.getElementById('userStatusSelect').value;
    const token = localStorage.getItem('token');

    const saveBtn = document.querySelector('#userActionSection button');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving...'; }

    try {
        const response = await fetch(CONFIG.API_BASE_URL + `/api/support-request/${currentTicketId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            showToast(`Ticket status updated to ${status}!`, 'success');
            fetchTickets(currentTicketPage || 1);
            openTicketModal(currentTicketId); // Local refresh
        } else {
            const err = await response.json();
            showToast(err.message || 'Status update failed', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Error updating status', 'error');
    } finally {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save'; }
    }
}

async function updateTicketStatus() {
    if (!currentTicketId) return;
    const status = document.getElementById('statusSelect').value;
    const token = localStorage.getItem('token');
    
    const saveBtn = document.querySelector('#statusUpdateSection button');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving...'; }

    try {
        const response = await fetch(CONFIG.API_BASE_URL + `/api/support-request/${currentTicketId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        if (response.ok) {
            showToast(`Status updated to ${status}!`, 'success');
            fetchTickets(currentTicketPage || 1);
            openTicketModal(currentTicketId);
        } else {
            const err = await response.json();
            showToast(err.message || 'Failed to update status', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Error updating status', 'error');
    } finally {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save'; }
    }
}

function renderComments(comments) {
    const list = document.getElementById('modalCommentsList');
    if (!comments || comments.length === 0) {
        list.innerHTML = '<p style="color:#64748b; font-style:italic; font-size:0.95rem;">No comments yet.</p>';
        return;
    }

    list.innerHTML = comments.map(c => `
        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:12px 15px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                <span style="font-weight:700; color:var(--navy); font-size:0.9rem;">${c.authorName || (c.User ? c.User.username : 'Unknown')}</span>
                <span style="color:#94a3b8; font-size:0.8rem;">${new Date(c.createdAt).toLocaleString()}</span>
            </div>
            <div style="color:#334155; font-size:0.95rem; line-height:1.5;">${c.text.replace(/\n/g, '<br>')}</div>
        </div>
    `).join('');
}

async function submitComment() {
    const textEl = document.getElementById('newCommentText');
    const text = textEl.value.trim();
    if (!text || !currentTicketId) return;

    const btn = document.querySelector('button[onclick="submitComment()"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Posting...'; }

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(CONFIG.API_BASE_URL + `/api/support-request/${currentTicketId}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ text })
        });

        if (response.ok) {
            textEl.value = '';
            openTicketModal(currentTicketId);
        } else {
            showToast('Failed to post comment', 'error');
        }
    } catch (err) {
        console.error('Comment error:', err);
        showToast('Error posting comment', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Post Comment'; }
    }
}


// --- Notifications System ---
let notificationInterval;
let previousNotificationCount = 0;
let isFirstNotificationFetch = true;

async function fetchNotifications() {
    const role = localStorage.getItem('role') || 'user';
    
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(CONFIG.API_BASE_URL + '/api/notifications', {
            headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true', 'Bypass-Tunnel-Reminder': 'true' }
        });
        if (!response.ok) return;
        const notifications = await response.json();
        
        // Spawn a toast if new unread notifications arrived while the user was idling
        if (!isFirstNotificationFetch && notifications.length > previousNotificationCount) {
             const newAlerts = notifications.length - previousNotificationCount;
             // Ensure showToast exists and is globally available
             if (typeof showToast === 'function') {
                 showToast(`You have ${newAlerts} new unread Support alert(s)! 🔔`, 'success');
             }
        }
        
        previousNotificationCount = notifications.length;
        isFirstNotificationFetch = false;
        
        renderNotifications(notifications);
    } catch (err) { console.error('Error fetching notifications:', err); }
}

async function fetchProjectList() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(CONFIG.API_BASE_URL + '/api/support-request/projects', {
            headers: { 'Authorization': `Bearer ${token}`, 'ngrok-skip-browser-warning': 'true', 'Bypass-Tunnel-Reminder': 'true' }
        });
        if (!response.ok) return;
        const projects = await response.json();
        const select = document.getElementById('projectFilterSelect');
        if (!select) return;
        
        // Preserve current selection if possible
        const existingVal = select.value;
        select.innerHTML = '<option value="">All Projects</option>';
        projects.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p;
            opt.textContent = p;
            select.appendChild(opt);
        });
        select.value = existingVal;
    } catch (err) { console.error('Error fetching project list:', err); }
}

function renderNotifications(notifications) {
    const container = document.getElementById('notificationContainer');
    if (container) container.style.display = 'inline-flex';
    
    const badge = document.getElementById('notificationBadge');
    const list = document.getElementById('notificationList');
    
    if (!badge || !list) return;

    if (notifications.length > 0) {
        badge.style.display = 'flex';
        badge.textContent = notifications.length > 9 ? '9+' : notifications.length;
        
        list.innerHTML = notifications.map(n => `
            <div class="notif-item ${n.read ? '' : 'unread'}" onclick="handleNotificationClick(event, ${n.id}, ${n.SupportRequestId})">
                <div class="notif-item-title">${n.message}</div>
                <div class="notif-item-time">${new Date(n.createdAt).toLocaleString()}</div>
            </div>
        `).join('');
    } else {
        badge.style.display = 'none';
        list.innerHTML = '<div class="notif-empty">No new notifications</div>';
    }
}

function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

document.addEventListener('click', (e) => {
    const container = document.getElementById('notificationContainer');
    const dropdown = document.getElementById('notificationDropdown');
    if (container && dropdown && !container.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

async function markAllNotificationsRead(e) {
    if (e) e.stopPropagation();
    const token = localStorage.getItem('token');
    try {
        await fetch(CONFIG.API_BASE_URL + '/api/notifications/read-all', {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchNotifications();
    } catch (err) { console.error(err); }
}

async function handleNotificationClick(e, notificationId, ticketId) {
    if (e) e.stopPropagation();
    const token = localStorage.getItem('token');
    try {
        await fetch(CONFIG.API_BASE_URL + `/api/notifications/${notificationId}/read`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchNotifications();
        
        if (ticketId) openTicketModal(ticketId);
        document.getElementById('notificationDropdown').style.display = 'none';
    } catch (err) { console.error(err); }
}
