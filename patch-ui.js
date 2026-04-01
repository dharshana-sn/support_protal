const fs = require('fs');
const path = require('path');

// ── 1. Patch dashboard.html ────────────────────────────────────
const htmlPath = path.join(__dirname, 'public', 'dashboard.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Replace the entire userActionSection block (buttons → dropdown)
// Use a regex so encoding doesn't matter
html = html.replace(
  /<!-- ▸ User: Reopen \/ Close (?:actions|dropdown) -->[\s\S]*?<\/div>\s*<\/div>\s*(?=\s*<div class="ticket-details-body")/,
  `<!-- ▸ User: Reopen / Close dropdown -->
            <div id="userActionSection" style="display:none;margin-bottom:16px;padding:15px;background:#fefce8;border:1px solid #fde68a;border-radius:8px;flex-wrap:wrap;gap:12px;align-items:center;">
                <label for="userStatusSelect" style="font-weight:600;color:#92400e;margin:0;">Update Status:</label>
                <div style="display:flex;gap:10px;flex-grow:1;max-width:340px;">
                    <select id="userStatusSelect" style="flex-grow:1;padding:8px 12px;border-radius:6px;border:1px solid #fcd34d;font-family:inherit;font-size:0.95rem;width:auto;background:#fffbeb;color:#92400e;">
                        <option value="Reopened">Reopen</option>
                        <option value="Closed">Closed</option>
                    </select>
                    <button onclick="setUserTicketStatus()" class="btn btn-primary" style="padding:8px 20px;font-size:0.95rem;border-radius:6px;white-space:nowrap;margin:0;">Save</button>
                </div>
            </div>
            `
);

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('✅ dashboard.html patched (userActionSection → dropdown)');

// ── 2. Patch dashboard-final.js ────────────────────────────────
const jsPath = path.join(__dirname, 'public', 'js', 'dashboard-final.js');
let js = fs.readFileSync(jsPath, 'utf8');

// 2a. Fix openTicketModal – remove btnReopen/btnClose logic, use userStatusSelect instead
js = js.replace(
  /\/\/ Ticket Owner: show Reopen \/ Close buttons[\s\S]*?\/\/ Only show section if at least one button is visible\s*[\s\S]*?}\s*}\s*}/,
  `// Ticket Owner: show Reopen / Close dropdown
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
        }`
);

// 2b. Fix setUserTicketStatus – read from dropdown, no parameter
js = js.replace(
  /async function setUserTicketStatus\(status\) \{[\s\S]*?}\s*}\s*\}\s*\n\n\/\/ --- Notifications/,
  `async function setUserTicketStatus() {
    if (!currentTicketId) return;
    const status = document.getElementById('userStatusSelect').value;
    const token = localStorage.getItem('token');

    const saveBtn = document.querySelector('#userActionSection button');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving...'; }

    try {
        const response = await fetch(CONFIG.API_BASE_URL + \`/api/support-request/\${currentTicketId}/status\`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': \`Bearer \${token}\`,
                'ngrok-skip-browser-warning': 'true',
                'Bypass-Tunnel-Reminder': 'true'
            },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            const emoji = status === 'Reopened' ? 'Reopened' : 'Closed';
            showToast(\`Ticket \${emoji}! Support team has been notified and an email has been sent.\`, 'success');
            fetchTickets(currentTicketPage || 1);
            openTicketModal(currentTicketId); // Refresh modal
        } else {
            const err = await response.json();
            showToast(err.message || 'Failed to update ticket', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Error updating ticket status', 'error');
    } finally {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save'; }
    }
}

// --- Notifications`
);

fs.writeFileSync(jsPath, js, 'utf8');
console.log('✅ dashboard-final.js patched (setUserTicketStatus dropdown + isOwner Number fix)');

// ── 3. Patch routes/supportRequest.js – fix isOwner type + email logging ──
const routePath = path.join(__dirname, 'routes', 'supportRequest.js');
let route = fs.readFileSync(routePath, 'utf8');

// Fix isOwner comparison (int vs int — ensure Number cast)
route = route.replace(
  'const isOwner  = request.userId === req.user.id;',
  'const isOwner  = Number(request.userId) === Number(req.user.id);'
);

// Add console.log before SMTP check for debugging
route = route.replace(
  '      // --- Email alert ---\n      if (process.env.SMTP_USER && process.env.SMTP_PASS) {',
  `      // --- Email alert ---
      console.log('[Status Change] Sending email. SMTP_USER:', process.env.SMTP_USER ? 'Set' : 'Missing', '| SMTP_PASS:', process.env.SMTP_PASS ? 'Set' : 'Missing');
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {`
);

fs.writeFileSync(routePath, route, 'utf8');
console.log('✅ supportRequest.js patched (isOwner Number cast + email debug log)');

console.log('\nAll patches applied. Restart server to apply backend changes.');
