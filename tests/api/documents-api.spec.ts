import { test, expect, type APIRequestContext } from '@playwright/test';
import { DEMO_USER, uniqueFileName } from '../fixtures';

// 画面を通さず、APIを直接テストする
test.describe('書類API', () => {
  let token: string;

  test.beforeAll(async ({ playwright, baseURL }) => {
    const request = await playwright.request.newContext({ baseURL });
    const res = await request.post('/api/login', { data: DEMO_USER });
    expect(res.ok()).toBeTruthy();
    token = (await res.json()).token;
    await request.dispose();
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  async function createDocument(request: APIRequestContext, data: object) {
    return request.post('/api/documents', { data, headers: auth() });
  }

  test('登録すると201とLocationヘッダを返す', async ({ request }) => {
    const fileName = uniqueFileName();
    const res = await createDocument(request, { fileName, content: '請求書' });

    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({ fileName, status: 'RECEIVED' });
    expect(res.headers()['location']).toBe(`/api/documents/${body.id}`);
  });

  test('入力エラーは400と項目ごとのエラーを返す', async ({ request }) => {
    const res = await createDocument(request, { fileName: 'memo.txt', content: '' });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.title).toBe('Validation Error');
    expect(Object.keys(body.errors).sort()).toEqual(['content', 'fileName']);
  });

  test('トークンがないと401を返す', async ({ request }) => {
    const res = await request.get('/api/documents');

    expect(res.status()).toBe(401);
  });

  test('ログインに失敗すると401を返す', async ({ request }) => {
    const res = await request.post('/api/login', { data: { username: 'demo', password: 'x' } });

    expect(res.status()).toBe(401);
  });
});
