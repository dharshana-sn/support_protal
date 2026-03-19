async function handleAuth(event, type) {
    event.preventDefault();
    const form = event.target;
    const username = form.username.value;
    const password = form.password.value;
    const btn = form.querySelector('button');

    btn.disabled = true;
    btn.textContent = 'Processing...';

    try {
        const response = await fetch(CONFIG.API_BASE_URL + `/api/auth/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            if (type === 'login') {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username);
                window.location.href = 'dashboard.html';
            } else {
                alert('Registration successful! Please login.');
                window.location.href = 'index.html';
            }
        } else {
            alert(data.message || 'Authentication failed');
        }
    } catch (err) {
        alert('An error occurred. Please try again.');
        console.error(err);
    } finally {
        btn.disabled = false;
        btn.textContent = type === 'login' ? 'Login' : 'Register';
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = 'index.html';
}

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token && !window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('register.html')) {
        window.location.href = 'index.html';
    }
    return token;
}
