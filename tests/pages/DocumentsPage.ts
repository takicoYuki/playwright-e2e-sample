import { type Locator, type Page } from '@playwright/test';

export class DocumentsPage {
  readonly heading: Locator;
  readonly currentUser: Locator;
  readonly logoutButton: Locator;
  readonly fileName: Locator;
  readonly content: Locator;
  readonly submit: Locator;
  readonly message: Locator;
  readonly fileNameError: Locator;
  readonly contentError: Locator;
  readonly table: Locator;
  readonly emptyMessage: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: '書類の登録' });
    this.currentUser = page.locator('#current-user');
    this.logoutButton = page.getByRole('button', { name: 'ログアウト' });
    this.fileName = page.getByLabel('ファイル名');
    this.content = page.getByLabel('本文');
    this.submit = page.getByRole('button', { name: '登録する' });
    this.message = page.getByRole('status');
    this.fileNameError = page.locator('#fileName-error');
    this.contentError = page.locator('#content-error');
    this.table = page.locator('#document-table');
    this.emptyMessage = page.getByText('登録済みの書類はありません');
  }

  async goto() {
    await this.page.goto('/documents.html');
  }

  async register(fileName: string, content: string) {
    await this.fileName.fill(fileName);
    await this.content.fill(content);
    await this.submit.click();
  }

  row(fileName: string): Locator {
    return this.table.getByRole('row').filter({ hasText: fileName });
  }
}
