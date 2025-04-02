# AppSafeguard - ウェブセキュリティスキャンプラットフォーム

AppSafeguardは、ウェブアプリケーションのセキュリティ脆弱性を検出、分析、修正するための包括的なプラットフォームです。ユーザーフレンドリーなセキュリティ管理と直感的な脅威の可視化に重点を置いています。

## 主な機能

- **高度な脆弱性検出**: XSS、SQLインジェクション、CSRF、安全でないパスワードフィールドなど18種類以上のセキュリティチェック
- **リアルタイム進捗更新**: スキャン中のリアルタイムフィードバック
- **高度なセキュリティメトリクス**: セキュリティスコア、脆弱性タイプの分布、トレンド分析
- **レポート作成ツール**: 詳細なPDFレポート生成機能
- **脆弱性管理**: 詳細な説明と修正ガイダンス付きの脆弱性詳細ページ
- **セキュリティチェック**: 安全なアイテムも「安全」として明示的にマーク

## 技術スタック

- **フロントエンド**: React, TypeScript, TanStack Query, Recharts, Tailwind CSS, Shadcn/UI
- **バックエンド**: Node.js, Express
- **データベース**: PostgreSQL, Drizzle ORM
- **認証**: Passport.js, Express Session
- **レポート生成**: React-PDF

## インストール方法

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/appsafeguard.git
cd appsafeguard

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

## 環境変数

以下の環境変数を `.env` ファイルに設定してください:

```
DATABASE_URL=postgresql://username:password@localhost:5432/appsafeguard
SESSION_SECRET=your_session_secret
```

## データベースセットアップ

```bash
# データベーススキーマを適用
npm run db:push
```

## 使用方法

1. アプリケーションにアクセスし、アカウントを作成またはログイン
2. ダッシュボードから「クイックスキャン」セクションでURLを入力
3. スキャン結果を確認し、検出された脆弱性を表示
4. 脆弱性の詳細ページで説明と修正手順を確認
5. PDFレポートを生成して共有

## ライセンス

MIT