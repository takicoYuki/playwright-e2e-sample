const form = document.getElementById('login-form');
const errorBox = document.getElementById('login-error');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorBox.hidden = true;

  const data = Object.fromEntries(new FormData(form));
  if (!data.username || !data.password) {
    showError('ユーザー名とパスワードを入力してください');
    return;
  }

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    showError(body.detail ?? 'ログインに失敗しました');
    return;
  }

  const { token, username } = await res.json();
  sessionStorage.setItem('token', token);
  sessionStorage.setItem('username', username);
  location.href = '/documents.html';
});

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}
