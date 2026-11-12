import { test as base, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { DocumentsPage } from './pages/DocumentsPage';

export const DEMO_USER = { username: 'demo', password: 'demo-pass' } as const;

type Fixtures = {
  loginPage: LoginPage;
  documentsPage: DocumentsPage;
  /** ログイン済みの状態で書類一覧画面を開く */
  loggedIn: DocumentsPage;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  documentsPage: async ({ page }, use) => {
    await use(new DocumentsPage(page));
  },
  loggedIn: async ({ loginPage, documentsPage }, use) => {
    await loginPage.goto();
    await loginPage.login(DEMO_USER.username, DEMO_USER.password);
    await expect(documentsPage.heading).toBeVisible();
    await use(documentsPage);
  },
});

export { expect };

/** テスト同士が干渉しないよう、ファイル名を一意にする */
export function uniqueFileName(ext = 'pdf') {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}
