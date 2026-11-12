import { test, expect, uniqueFileName } from './fixtures';

test.describe('書類の登録', () => {
  test('登録すると完了メッセージが出て一覧に RECEIVED で表示される', async ({ loggedIn }) => {
    const fileName = uniqueFileName();

    await loggedIn.register(fileName, '請求書 No.123');

    await expect(loggedIn.message).toContainText(`「${fileName}」を登録しました`);
    await expect(loggedIn.row(fileName)).toContainText('RECEIVED');
    await expect(loggedIn.fileName).toHaveValue('');
  });

  // 入力チェックはパターンが多いので、データ駆動で書く
  const invalidCases = [
    { title: 'ファイル名が空', fileName: '', content: '本文', field: 'fileName', message: 'ファイル名を入力してください' },
    { title: '対応外の拡張子', fileName: 'memo.txt', content: '本文', field: 'fileName', message: '対応している拡張子は' },
    { title: '本文が空', fileName: 'a.pdf', content: '', field: 'content', message: '本文を入力してください' },
    { title: '本文が空白のみ', fileName: 'a.pdf', content: '   ', field: 'content', message: '本文を入力してください' },
  ] as const;

  for (const c of invalidCases) {
    test(`入力エラー: ${c.title}`, async ({ loggedIn }) => {
      await loggedIn.register(c.fileName, c.content);

      const error = c.field === 'fileName' ? loggedIn.fileNameError : loggedIn.contentError;
      await expect(error).toBeVisible();
      await expect(error).toContainText(c.message);
      await expect(loggedIn.message).toBeHidden();
    });
  }

  test('大文字の拡張子も受け付ける', async ({ loggedIn }) => {
    const fileName = uniqueFileName('PDF');

    await loggedIn.register(fileName, 'scan');

    await expect(loggedIn.row(fileName)).toBeVisible();
  });
});

test.describe('APIの異常系（ネットワークをモック）', () => {
  test('書類が0件なら空のメッセージを表示する', async ({ page, loginPage, documentsPage }) => {
    await page.route('**/api/documents', (route) =>
      route.request().method() === 'GET' ? route.fulfill({ json: [] }) : route.continue(),
    );
    await loginPage.goto();
    await loginPage.login('demo', 'demo-pass');

    await expect(documentsPage.emptyMessage).toBeVisible();
    await expect(documentsPage.table).toBeHidden();
  });

  test('登録APIが500を返したらエラーメッセージを表示し、入力内容は残す', async ({ page, loggedIn }) => {
    await page.route('**/api/documents', (route) =>
      route.request().method() === 'POST'
        ? route.fulfill({ status: 500, json: { title: 'Internal Server Error' } })
        : route.continue(),
    );

    await loggedIn.register('invoice.pdf', '請求書');

    await expect(loggedIn.message).toHaveText('登録に失敗しました。時間をおいて再度お試しください');
    await expect(loggedIn.fileName).toHaveValue('invoice.pdf');
  });

  test('一覧APIが失敗したらエラーメッセージを表示する', async ({ page, loginPage, documentsPage }) => {
    await page.route('**/api/documents', (route) => route.fulfill({ status: 503 }));
    await loginPage.goto();
    await loginPage.login('demo', 'demo-pass');

    await expect(documentsPage.message).toHaveText('書類一覧の取得に失敗しました');
  });
});
