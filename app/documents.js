const token = sessionStorage.getItem('token');
if (!token) location.replace('/');

const form = document.getElementById('document-form');
const message = document.getElementById('message');
const table = document.getElementById('document-table');
const empty = document.getElementById('empty');

document.getElementById('current-user').textContent = sessionStorage.getItem('username') ?? '';
document.getElementById('logout').addEventListener('click', () => {
  sessionStorage.clear();
  location.href = '/';
});

function api(path, options = {}) {
  return fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
  });
}

function showMessage(text, isError = false) {
  message.textContent = text;
  message.className = isError ? 'error' : 'success';
  message.hidden = false;
}

function clearFieldErrors() {
  for (const el of document.querySelectorAll('.field-error')) {
    el.hidden = true;
    el.textContent = '';
  }
}

async function loadDocuments() {
  const res = await api('/api/documents');
  if (!res.ok) {
    showMessage('書類一覧の取得に失敗しました', true);
    return;
  }
  const docs = await res.json();
  const tbody = table.querySelector('tbody');
  tbody.replaceChildren(
    ...docs.map((d) => {
      const tr = document.createElement('tr');
      for (const value of [d.id, d.fileName, d.status]) {
        const td = document.createElement('td');
        td.textContent = value;
        tr.append(td);
      }
      return tr;
    }),
  );
  table.hidden = docs.length === 0;
  empty.hidden = docs.length > 0;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearFieldErrors();
  message.hidden = true;

  const res = await api('/api/documents', {
    method: 'POST',
    body: JSON.stringify(Object.fromEntries(new FormData(form))),
  });

  if (res.status === 400) {
    const body = await res.json();
    for (const [field, text] of Object.entries(body.errors ?? {})) {
      const el = document.getElementById(`${field}-error`);
      if (el) {
        el.textContent = text;
        el.hidden = false;
      }
    }
    return;
  }
  if (!res.ok) {
    showMessage('登録に失敗しました。時間をおいて再度お試しください', true);
    return;
  }

  const doc = await res.json();
  form.reset();
  showMessage(`「${doc.fileName}」を登録しました（ID: ${doc.id}）`);
  await loadDocuments();
});

loadDocuments();
