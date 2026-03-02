# 企業管理者（company_admin）設定ガイド

**実施日**: 2026年3月1日  
**目的**: 各企業に管理者を設定し、自社の報告を編集できるようにする

---

## 📌 権限の種類

| 権限 | 名称 | できること |
|------|------|-----------|
| `company_user` | 一般ドライバー | 報告入力、自社報告の閲覧 |
| `company_admin` | **企業管理者** | 自社報告の編集、修正依頼の対応 |
| `admin` | システム管理者 | 全企業の報告編集、企業管理 |

---

## 🚀 設定手順（Supabase）

### Step 1: Supabase にログイン

1. https://supabase.com にアクセス
2. プロジェクト「NLP運行状況DB」を開く
3. 左サイドバー → **SQL Editor** をクリック

---

### Step 2: 既存の4社に企業管理者を作成（推奨）

以下のSQLをコピーして、SQL Editorに貼り付けて実行してください。

```sql
-- 既存の4社それぞれに1人の企業管理者を作成
BEGIN;

UPDATE public.profiles SET role = 'company_admin' WHERE email = 'nlp-test@company.local';
UPDATE public.profiles SET role = 'company_admin' WHERE email = '1111-company@company.local';
UPDATE public.profiles SET role = 'company_admin' WHERE email = 'abc-logistics@company.local';
UPDATE public.profiles SET role = 'company_admin' WHERE email = 'xyz-transport@company.local';

COMMIT;
```

**「Run」ボタンをクリック**

---

### Step 3: 確認

以下のSQLを実行して、企業管理者が作成されたことを確認します。

```sql
-- 企業管理者の一覧を確認
SELECT 
    c.company_name AS 企業名,
    c.company_code AS 企業コード,
    p.email AS メールアドレス,
    p.role AS 権限
FROM public.profiles p
JOIN public.companies c ON p.company_id = c.id
WHERE p.role = 'company_admin'
ORDER BY c.company_name;
```

**期待される結果:**
```
企業名                  | 企業コード      | メールアドレス                | 権限
------------------------|----------------|------------------------------|-------------
株式会社ABC物流         | abc-logistics  | abc-logistics@company.local  | company_admin
XYZ運輸株式会社         | xyz-transport  | xyz-transport@company.local  | company_admin
...                     | ...            | ...                          | company_admin
```

---

## ✅ 動作確認

### 企業管理者でログイン

1. **報告管理画面にアクセス**
   ```
   https://stellular-profiterole-2ff0a2.netlify.app/admin-reports.html
   ```

2. **企業管理者でログイン**
   - メール: `abc-logistics@company.local`
   - パスワード: `password123`

3. **自社の報告のみ表示されることを確認**
   - ABC物流の報告のみが一覧に表示される
   - 他社の報告は表示されない
   - 企業フィルターは非表示になっている

4. **報告を編集してみる**
   - 「✏️ 編集」ボタンをクリック
   - 内容を変更
   - 「💾 保存」ボタンをクリック
   - 「✅ 報告を保存しました」と表示されればOK

---

## 🔄 ロールバック（元に戻す）

間違えて企業管理者にしてしまった場合、以下のSQLで元に戻せます。

```sql
-- 企業管理者を一般ユーザーに戻す
UPDATE public.profiles
SET role = 'company_user'
WHERE email = 'abc-logistics@company.local';
```

---

## 📋 企業管理者の追加・変更

### パターン1: 既存ユーザーを企業管理者に昇格

```sql
-- 例: nlp-test@company.local を企業管理者にする
UPDATE public.profiles
SET role = 'company_admin'
WHERE email = 'nlp-test@company.local';
```

### パターン2: 新しい企業管理者を追加

1. **Supabase Authentication でユーザーを作成**
   - Supabase → Authentication → Users → 「Add user」
   - Email: `manager@abc-logistics.com`
   - Password: （強力なパスワード）
   - 「Create user」をクリック

2. **ユーザーIDを取得**
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'manager@abc-logistics.com';
   ```

3. **profiles テーブルにレコードを作成**
   ```sql
   -- 企業IDを取得
   SELECT id FROM public.companies WHERE company_code = 'abc-logistics';
   
   -- profiles に追加（UUIDと company_id を実際の値に置き換える）
   INSERT INTO public.profiles (id, email, role, company_id)
   VALUES (
       '（Step 2で取得したユーザーID）',
       'manager@abc-logistics.com',
       'company_admin',
       '（abc-logistics の company_id）'
   );
   ```

---

## 📊 企業別ユーザー統計

企業ごとのユーザー数と管理者数を確認できます。

```sql
SELECT 
    c.company_name AS 企業名,
    c.company_code AS 企業コード,
    COUNT(*) AS 総ユーザー数,
    SUM(CASE WHEN p.role = 'company_admin' THEN 1 ELSE 0 END) AS 企業管理者数,
    SUM(CASE WHEN p.role = 'company_user' THEN 1 ELSE 0 END) AS 一般ユーザー数
FROM public.companies c
LEFT JOIN public.profiles p ON c.id = p.company_id
GROUP BY c.company_name, c.company_code
ORDER BY c.company_name;
```

**期待される結果:**
```
企業名            | 企業コード     | 総ユーザー数 | 企業管理者数 | 一般ユーザー数
------------------|---------------|-------------|-------------|-------------
株式会社ABC物流    | abc-logistics |      1      |      1      |      0
XYZ運輸株式会社    | xyz-transport |      1      |      1      |      0
...
```

---

## 💡 よくある質問

### Q1. 1つの企業に複数の管理者を設定できますか？

**A**: はい、できます。同じ企業の複数のユーザーを `company_admin` に設定できます。

```sql
-- 例: ABC物流に2人目の企業管理者を追加
UPDATE public.profiles
SET role = 'company_admin'
WHERE email = 'manager2@abc-logistics.com';
```

---

### Q2. 企業管理者はどの画面にアクセスできますか？

**A**: 以下の画面にアクセスできます：
- ✅ 報告入力（index.html）
- ✅ ダッシュボード（dashboard.html）
- ✅ 分析（analytics.html）
- ✅ **報告管理（admin-reports.html）** ← 企業管理者専用

ナビゲーションバーに「**報告管理**」リンクが表示されます。

---

### Q3. システム管理者との違いは？

| 項目 | 企業管理者 | システム管理者 |
|------|-----------|---------------|
| 自社の報告編集 | ✅ | ✅ |
| 他社の報告編集 | ❌ | ✅ |
| 企業の追加・削除 | ❌ | ✅ |
| 企業フィルター | 非表示 | 表示 |
| 匿名化データエクスポート | ❌ | ✅ |

---

### Q4. 企業管理者が報告を削除できますか？

**A**: 現在、削除機能は実装されていません。編集のみ可能です。

---

### Q5. ドライバーから修正依頼が来たらどうなりますか？

**A**: 
1. ドライバーがダッシュボードで「📝 修正依頼を送信」をクリック
2. 報告に「修正依頼あり」バッジが表示される
3. 企業管理者が `admin-reports.html` で確認
4. 「✏️ 編集」ボタンで内容を修正
5. 「修正依頼フラグをクリア」にチェックして保存

---

## 🔗 関連ドキュメント

- [REPORT_EDIT_GUIDE.md](REPORT_EDIT_GUIDE.md) - 報告編集機能の使い方
- [ADMIN_MANUAL.md](ADMIN_MANUAL.md) - システム管理者マニュアル
- [README.md](README.md) - システム全体の概要

---

**最終更新日**: 2026年3月1日  
**バージョン**: 1.0  
**次回レビュー予定**: 2026年4月1日
