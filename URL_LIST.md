# ヒヤリハット報告システム URL一覧

**最終更新日**: 2026年3月1日  
**バージョン**: 1.0

---

## 📋 目次

1. [利用者向けURL](#利用者向けurl)
2. [管理者向けURL](#管理者向けurl)
3. [法的文書](#法的文書)
4. [外部サービス](#外部サービス)
5. [開発・運用](#開発運用)

---

## 利用者向けURL

### 🌐 公開ページ

| 用途 | URL | 説明 |
|------|-----|------|
| **ランディングページ** | https://stellular-profiterole-2ff0a2.netlify.app/landing.html | 企業登録・サービス紹介 |
| **企業登録フォーム** | https://stellular-profiterole-2ff0a2.netlify.app/landing.html#register | 新規企業登録 |
| **ログイン** | https://stellular-profiterole-2ff0a2.netlify.app/index.html | 一般ユーザーログイン |

---

### 📝 報告・閲覧

| 用途 | URL | 説明 | 要認証 |
|------|-----|------|--------|
| **報告入力** | https://stellular-profiterole-2ff0a2.netlify.app/index.html | ヒヤリハット・事故報告の入力 | ✅ |
| **ダッシュボード** | https://stellular-profiterole-2ff0a2.netlify.app/dashboard.html | 報告一覧・詳細閲覧・編集 | ✅ |
| **分析画面** | https://stellular-profiterole-2ff0a2.netlify.app/analytics.html | カテゴリ別・月次統計グラフ | ✅ |

---

### 📱 モバイル対応

上記すべてのURLはモバイルブラウザ（iPhone / Android）からアクセス可能です。

**推奨ブラウザ**:
- iPhone: Safari
- Android: Chrome

---

## 管理者向けURL

### 🔐 管理機能

| 用途 | URL | 説明 | 権限 |
|------|-----|------|------|
| **企業管理画面** | https://stellular-profiterole-2ff0a2.netlify.app/admin.html | 企業の追加・編集・削除 | 管理者のみ |
| **アクセスログ監視** | https://stellular-profiterole-2ff0a2.netlify.app/audit-logs.html | アクセス履歴の確認 | 管理者のみ |

---

### 管理者ログイン情報

| 項目 | 値 |
|------|---|
| **メールアドレス** | `akari-imai@tehara.co.jp` |
| **パスワード** | `tehara0425` |
| **権限レベル** | `admin` |

⚠️ **セキュリティ注意**: 定期的にパスワードを変更してください。

---

## 法的文書

### 📜 規約・ポリシー

| 文書名 | URL | 説明 |
|--------|-----|------|
| **利用規約** | https://stellular-profiterole-2ff0a2.netlify.app/terms-of-service.html | サービス利用の規約 |
| **プライバシーポリシー** | https://stellular-profiterole-2ff0a2.netlify.app/privacy-policy.html | 個人情報の取扱い |

---

### 主要条項

#### 利用規約
- **第4条**: データの所有権および利用許諾（二次利用の明記）
- **第4条の2**: データ閲覧サービス（有料提供）
- **第6条**: 退会時のデータ取扱い

#### プライバシーポリシー
- **第2条**: 収集する情報
- **第3条**: 情報の利用目的（匿名化データの販売を含む）
- **第4条**: 情報の第三者提供（匿名化済みデータのみ）

---

## 外部サービス

### 🛠️ バックエンドサービス

| サービス | URL | 用途 |
|---------|-----|------|
| **Supabase ダッシュボード** | https://supabase.com/dashboard/project/yimeoggmsubtcmxddyat | データベース・認証管理 |
| **Netlify ダッシュボード** | https://app.netlify.com/sites/stellular-profiterole-2ff0a2 | ホスティング・デプロイ管理 |

---

### Supabase プロジェクト情報

| 項目 | 値 |
|------|---|
| **プロジェクト名** | NLP運行状況DB |
| **プロジェクトID** | yimeoggmsubtcmxddyat |
| **リージョン** | Asia Pacific (Tokyo) |
| **プラン** | Free Tier |
| **API URL** | https://yimeoggmsubtcmxddyat.supabase.co |

---

### Netlify サイト情報

| 項目 | 値 |
|------|---|
| **サイト名** | stellular-profiterole-2ff0a2 |
| **カスタムドメイン** | （未設定） |
| **プラン** | Free Tier |
| **デプロイ方式** | Manual（手動ドラッグ&ドロップ） |

---

## 開発・運用

### 📊 API エンドポイント

#### Supabase REST API

**ベースURL**: `https://yimeoggmsubtcmxddyat.supabase.co/rest/v1/`

| エンドポイント | メソッド | 説明 |
|--------------|---------|------|
| `/companies` | GET | 企業一覧取得 |
| `/companies` | POST | 企業登録 |
| `/companies/{id}` | GET | 企業詳細取得 |
| `/companies/{id}` | PUT | 企業情報更新 |
| `/companies/{id}` | DELETE | 企業削除 |
| `/incidents` | GET | 報告一覧取得 |
| `/incidents` | POST | 報告登録 |
| `/incidents/{id}` | GET | 報告詳細取得 |
| `/incidents/{id}` | PUT | 報告更新 |
| `/incidents/{id}` | DELETE | 報告削除 |
| `/incidents_anonymized` | GET | 匿名化データ取得 |

**認証ヘッダー**:
```
Authorization: Bearer {JWT_TOKEN}
apikey: {SUPABASE_ANON_KEY}
```

---

### 🔑 API キー

#### Supabase API キー

| キー種別 | 値 | 用途 |
|---------|---|------|
| **anon key（公開）** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpbWVvZ2dtc3VidGNteGRkeWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5OTcwMTcsImV4cCI6MjA4NzU3MzAxN30.wQY_t9umGhqshO1UQJ-aHj3MPUimzJgOso3W9YmKYlA` | フロントエンドで使用 |
| **service_role key（秘密）** | （管理者のみ保持） | サーバーサイド処理用 |

⚠️ **セキュリティ注意**: service_role key は絶対に公開しないでください。

---

### 🗄️ データベース接続情報

| 項目 | 値 |
|------|---|
| **ホスト** | db.yimeoggmsubtcmxddyat.supabase.co |
| **ポート** | 5432 |
| **データベース名** | postgres |
| **ユーザー名** | postgres |
| **パスワード** | （Supabase ダッシュボードで確認） |
| **接続文字列** | `postgresql://postgres:[PASSWORD]@db.yimeoggmsubtcmxddyat.supabase.co:5432/postgres` |

⚠️ **直接接続は推奨しません**: 通常は Supabase REST API を使用してください。

---

## 🧪 テストアカウント

### 一般企業ユーザー

| 企業コード | メールアドレス | パスワード | 企業名 | 報告件数 |
|-----------|--------------|----------|--------|---------|
| `nlp-test` | nlp-test@company.local | `nlp2026` | NLP物流株式会社 | 5件 |
| `1111-company` | 1111-company@company.local | `1111` | 1111株式会社 | 1件 |
| `abc-logistics` | abc-logistics@company.local | `abc2026` | ABC物流株式会社 | 0件 |
| `xyz-transport` | xyz-transport@company.local | `xyz2026` | XYZ運送株式会社 | 0件 |

---

### 管理者アカウント

| メールアドレス | パスワード | 権限 |
|--------------|----------|------|
| `akari-imai@tehara.co.jp` | `tehara0425` | admin |

---

## 📚 ドキュメント

### 内部ドキュメント

| 文書名 | ファイル | 対象 |
|--------|---------|------|
| **利用者マニュアル** | `USER_MANUAL.md` | 一般企業ユーザー |
| **管理者マニュアル** | `ADMIN_MANUAL.md` | システム管理者 |
| **セキュリティ・コンプライアンス報告書** | `SECURITY_COMPLIANCE_REPORT.md` | 監査・問い合わせ対応用 |
| **URL一覧** | `URL_LIST.md` | 本文書 |
| **README** | `README.md` | システム全体概要 |

---

### 外部リンク

| サービス | ドキュメント |
|---------|------------|
| **Supabase** | https://supabase.com/docs |
| **Netlify** | https://docs.netlify.com |
| **PostgreSQL** | https://www.postgresql.org/docs/ |

---

## 🔧 メンテナンス

### デプロイ手順

1. **ファイルをダウンロード**（ZIP形式）
2. https://app.netlify.com にログイン
3. サイト **stellular-profiterole-2ff0a2** を選択
4. **Deploys** タブにフォルダをドラッグ&ドロップ
5. 緑の **Published** が表示されるまで待つ（2-3分）

---

### バックアップ

**手順**: `ADMIN_MANUAL.md` の「バックアップ手順」を参照

**頻度**: 毎週日曜日

**保存先**: Google Drive / Dropbox / OneDrive 等

---

## 📞 サポート

### お問い合わせ先

| 項目 | 連絡先 |
|------|--------|
| **サポートメール** | [サポートメールアドレスを記載] |
| **電話** | [サポート電話番号を記載] |
| **受付時間** | 平日 9:00 - 18:00 |
| **運営会社** | [運営会社名を記載] |

---

### よくある問い合わせ

1. **ログインできない** → パスワードリセット依頼
2. **企業コードを忘れた** → 管理者に連絡
3. **データの削除依頼** → 管理者に連絡
4. **機能の使い方** → 利用者マニュアルを参照

---

## 🔄 更新履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2026-03-01 | 1.0 | 初版作成 |

---

**最終更新日**: 2026年3月1日  
**バージョン**: 1.0  
**管理者**: [管理者名を記載]
