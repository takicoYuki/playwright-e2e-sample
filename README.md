# playwright-e2e-sample

![Playwright Tests](https://github.com/takicoYuki/playwright-e2e-sample/actions/workflows/playwright.yml/badge.svg)

**Playwright（TypeScript）による E2E テストと API テスト** のサンプルです。
テスト対象として、ログインと書類登録だけの小さな Web アプリ（`app/` と `server.js`）を同じリポジトリに入れているので、clone するだけでテストを動かせます。

## 技術スタック

- Playwright Test / TypeScript
- Node.js 22（テスト対象のデモアプリ。外部ライブラリなし）
- GitHub Actions（push ごとにテストを実行し、HTML レポートを成果物として保存）

## このサンプルで示していること

| 観点 | 実装 |
|---|---|
| Page Object Model | `tests/pages/` に画面ごとの操作をまとめ、テスト本体は「何を確認するか」だけを書く |
| カスタムフィクスチャ | `loggedIn` フィクスチャでログイン済みの状態を用意し、前準備の重複をなくす |
| ユーザー視点のロケーター | `getByRole` / `getByLabel` を優先し、CSS セレクタに依存しにくくしている |
| データ駆動テスト | 入力チェックのパターンを配列で定義し、ループでテストを生成 |
| ネットワークのモック | `page.route` で API の 500 / 503 / 0件 を再現し、異常系の画面表示を確認 |
| API テスト | `request` フィクスチャで画面を通さずにステータスコードやレスポンスを検証 |
| テストの独立性 | ファイル名を一意にして、並列実行してもテスト同士が干渉しないようにしている |
| 複数環境 | デスクトップの Chrome と、モバイル（Pixel 7）の2つのプロジェクトで実行 |
| 失敗時の調査 | CI では失敗時にリトライし、トレースとスクリーンショットを残す |

## 動かし方

```bash
npm install
npx playwright install chromium
npm test                 # 全テストを実行
npm run test:headed      # ブラウザを表示して実行
npm run report           # HTMLレポートを開く
```

デモアプリだけを起動する場合は `npm start` を実行して http://localhost:3000 を開いてください（デモ用アカウント：`demo` / `demo-pass`）。

## テストの一覧

```
tests/
├── fixtures.ts               カスタムフィクスチャ（Page Object の注入、ログイン済みの状態）
├── pages/
│   ├── LoginPage.ts
│   └── DocumentsPage.ts
├── login.spec.ts             ログインの成功と失敗、未入力、未ログイン時の遷移、ログアウト
├── documents.spec.ts         書類の登録、入力チェック（データ駆動）、APIの異常系（モック）
└── api/
    └── documents-api.spec.ts 書類APIの 201 / 400 / 401
```

## 関連リポジトリ

- [document-ocr-batch](https://github.com/takicoYuki/document-ocr-batch)：同じ「書類受付」を題材にしたバックエンド（Spring Boot / Spring Batch）
