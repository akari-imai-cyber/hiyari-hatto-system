# マルチテナント対応セットアップガイド

## 📋 概要

このガイドでは、ヒヤリハット報告システムを複数企業で利用できるようにするための設定手順を説明します。

---

## 🎯 Phase 1: Supabase RLS の設定

### ステップ1：データベース構造の拡張

1. Supabase ダッシュボードにログイン
2. **SQL Editor** を開く
3. `supabase-multitenancy-setup.sql` の内容を実行

**期待される結果：**
```
✅ マルチテナント設定が完了しました！
📊 企業テーブル作成完了
🔒 RLS ポリシー設定完了
📈 インデックス作成完了
```

### ステップ2：企業マスタの確認

```sql
SELECT * FROM companies;
```

**デフォルトで作成される企業：**
- `nlp-test` (NLP物流株式会社)
- `abc-logistics` (ABC物流株式会社)
- `xyz-transport` (XYZ運送株式会社)

---

## 🎯 Phase 2: フロントエンドの更新

### アップロードが必要なファイル

1. **`js/auth-multitenancy.js`** (新規)
2. **`js/main.js`** (修正済み)
3. **`js/dashboard.js`** (修正済み)
4. **`js/analytics.js`** (修正済み)
5. **`index.html`** (修正済み)
6. **`dashboard.html`** (修正済み)
7. **`analytics.html`** (修正済み)

### Netlify へのアップロード手順

1. AI チャット画面で **「📥 Download files」** をクリック
2. ZIP を解凍
3. Netlify の Deploys タブを開く
4. フォルダ全体をドラッグ&ドロップ

---

## 🔐 企業別ログイン情報

| 企業コード | パスワード | 企業名 |
|-----------|-----------|--------|
| nlp-test | nlp2026 | NLP物流株式会社 |
| abc-logistics | abc2026 | ABC物流株式会社 |
| xyz-transport | xyz2026 | XYZ運送株式会社 |

---

## ✅ 動作確認手順

### テスト1：企業A でログイン

1. シークレットモードで https://stellular-profiterole-2ff0a2.netlify.app/index.html を開く
2. 企業コード: `nlp-test` / パスワード: `nlp2026`
3. ヒヤリハット報告を1件作成
4. ダッシュボードで報告が表示されることを確認

### テスト2：企業B でログイン

1. 別のシークレットウィンドウを開く
2. 企業コード: `abc-logistics` / パスワード: `abc2026`
3. ヒヤリハット報告を1件作成
4. **企業Aのデータが表示されないことを確認**

### テスト3：データ分離の確認

```sql
-- Supabase SQL Editor で実行
SELECT 
    c.company_name,
    COUNT(i.id) as report_count
FROM companies c
LEFT JOIN incidents i ON i.company_id = c.id
GROUP BY c.company_name
ORDER BY report_count DESC;
```

**期待される結果：**
- 各企業のデータが正しく分離されている
- 企業Aのユーザーは企業Bのデータを見ることができない

---

## 🚀 新規企業の追加方法

### ステップ1：Supabase に企業を追加

```sql
INSERT INTO companies (company_code, company_name, industry, plan)
VALUES ('new-company', '新規物流株式会社', '物流業', 'free');
```

### ステップ2：認証情報を追加

`js/auth-multitenancy.js` を編集：

```javascript
const COMPANY_CREDENTIALS = {
    // ... 既存の企業 ...
    
    'new-company': {
        password: 'new2026',
        companyId: null,
        companyName: '新規物流株式会社'
    }
};
```

### ステップ3：Netlify に再デプロイ

修正した `js/auth-multitenancy.js` をアップロード

---

## 🔧 トラブルシューティング

### 問題1：「企業IDが取得できません」エラー

**原因：** `companies` テーブルに企業コードが登録されていない

**解決策：**
```sql
SELECT * FROM companies WHERE company_code = '[該当の企業コード]';
```
結果が0件の場合、企業を追加してください。

### 問題2：他社のデータが見える

**原因：** RLS が正しく設定されていない

**解決策：**
```sql
-- RLS が有効か確認
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'incidents';
```
`rowsecurity` が `false` の場合、RLS を有効化してください。

### 問題3：データが保存されない

**原因：** `company_id` が NULL

**解決策：**
- ブラウザの開発者ツール（F12）→ Console を確認
- `✅ company_id を設定:` のログが表示されているか確認

---

## 📊 監視とメンテナンス

### 定期的に確認すべき項目

1. **データ容量**
```sql
SELECT 
    pg_size_pretty(pg_total_relation_size('incidents')) as incidents_size,
    pg_size_pretty(pg_total_relation_size('companies')) as companies_size;
```

2. **企業別データ数**
```sql
SELECT 
    c.company_name,
    COUNT(i.id) as total_reports,
    COUNT(CASE WHEN i.report_type = 'hiyari' THEN 1 END) as hiyari_count,
    COUNT(CASE WHEN i.report_type = 'accident' THEN 1 END) as accident_count
FROM companies c
LEFT JOIN incidents i ON i.company_id = c.id
GROUP BY c.company_name;
```

3. **古いデータの削除**（3年以上前）
```sql
DELETE FROM incidents 
WHERE occurred_at < NOW() - INTERVAL '3 years';
```

---

## 🛡️ セキュリティチェックリスト

- [ ] RLS が有効化されている
- [ ] すべての incidents レコードに company_id が設定されている
- [ ] Supabase API キーが公開されていない（環境変数化推奨）
- [ ] HTTPS 通信が有効
- [ ] 定期バックアップが設定されている
- [ ] パスワードが定期的に変更されている

---

## 📞 サポート

問題が解決しない場合は、以下の情報を添えてお問い合わせください：

1. エラーメッセージのスクリーンショット
2. ブラウザの開発者ツール（F12）の Console ログ
3. Supabase の SQL クエリ結果
4. 再現手順

---

## 🎉 完了！

すべての設定が正しく完了すれば、複数企業が同じシステムを安全に利用できるようになります。
