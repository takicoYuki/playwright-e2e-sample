import { test, expect, DEMO_USER } from './fixtures';

test.describe('ログイン', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('正しいアカウントでログインすると書類一覧に遷移する', async ({ page, loginPage, documentsPage }) => {
    await loginPage.login(DEMO_USER.username, DEMO_USER.password);

    await expect(page).toHaveURL(/\/documents\.html$/);
    await expect(documentsPage.currentUser).toHaveText(DEMO_USER.username);
  });

  test('パスワードが違うとエラーを表示して画面に留まる', async ({ page, loginPage }) => {
    await loginPage.login(DEMO_USER.username, 'wrong-password');

    await expect(loginPage.error).toHaveText('ユーザー名またはパスワードが違います');
    await expect(page).toHaveURL(/\/$/);
  });

  test('未入力のままではAPIを呼ばずにエラーを表示する', async ({ page, loginPage }) => {
    let called = false;
    await page.route('**/api/login', (route) => {
      called = true;
      return route.continue();
    });

    await loginPage.submit.click();

    await expect(loginPage.error).toHaveText('ユーザー名とパスワードを入力してください');
    expect(called).toBe(false);
  });

  test('未ログインで書類一覧を開くとログイン画面に戻される', async ({ page, documentsPage }) => {
    await documentsPage.goto();

    await expect(page).toHaveURL(/\/$/);
  });

  test('ログアウトするとログイン画面に戻る', async ({ page, loginPage, documentsPage }) => {
    await loginPage.login(DEMO_USER.username, DEMO_USER.password);
    await documentsPage.logoutButton.click();

    await expect(page).toHaveURL(/\/$/);
    await documentsPage.goto();
    await expect(page).toHaveURL(/\/$/);
  });
});
