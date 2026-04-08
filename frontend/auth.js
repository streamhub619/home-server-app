const BASE_URL = 'http://127.0.0.1:3000';

// toggle login/signup
function toggleForms() {
  document.getElementById('login-form').classList.toggle('hidden');
  document.getElementById('signup-form').classList.toggle('hidden');
}

// LOGIN
async function login() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // 🔥 IMPORTANT for sessions
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (res.ok) {
    document.getElementById('login-msg').textContent = 'Login successful!';
    
    // redirect to main app
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);

  } else {
    document.getElementById('login-msg').textContent = data.error;
    document.getElementById('login-msg').classList.add('error');
  }
}

// SIGNUP
async function signup() {
  const username = document.getElementById('signup-username').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  const res = await fetch(`${BASE_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });

  const data = await res.json();

  if (res.ok) {
    document.getElementById('signup-msg').textContent = 'Signup successful! You can now login.';
  } else {
    document.getElementById('signup-msg').textContent = data.error;
    document.getElementById('signup-msg').classList.add('error');
  }
}