# Supabaseで直接ユーザーを作成する方法

## 🎯 推奨方法

管理者がユーザーを作成する場合、以下の2ステップで行います：

1. **Supabase Authentication** でユーザーを作成
2. **profiles テーブル** にレコードを追加

---

## 📋 手順

### ステップ1: Supabase Authentication でユーザーを作成

1. https://supabase.com にログイン
2. プロジェクトを選択
3. 左サイドバー **「Authentication」** → **「Users」** タブ
4. 右上の **「Add user」** → **「Create new user」** をクリック

5. 以下を入力：
   - **Email**: `driver1@nlp-test.com`
   - **Password**: `Driver123!`（8文字以上）
   - **✅ Auto Confirm User**: チェックを入れる（重要！）
   
6. **「Create user」** をクリック

7. 作成されたユーザーの **User UID（UUID）** をコピー
   - 例: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

---

### ステップ2: profiles テーブルにレコードを追加

Supabase の **SQL Editor** で以下を実行：

```sql
-- ユーザーIDと企業IDを確認
SELECT id, company_code FROM public.companies WHERE company_code = 'nlp-test';
-- 結果の company_id をコピー

-- profilesテーブルに追加
INSERT INTO public.profiles (id, email, role, company_id, full_name, created_at)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',  -- ステップ1でコピーしたUser UID
    'driver1@nlp-test.com',
    'company_user',  -- または 'company_admin'
    'e0c97ee5-3139-4a05-a719-c627a942bc81',  -- NLP物流のcompany_id
    'ドライバー1号',  -- 氏名（任意）
    NOW()
);

-- 確認
SELECT * FROM public.profiles WHERE email = 'driver1@nlp-test.com';
```

---

## ✅ 作成後の確認

### ログインテスト

1. https://stellular-profiterole-2ff0a2.netlify.app/index.html
2. 以下でログイン：
   - 企業コード: `nlp-test`
   - メール: `driver1@nlp-test.com`
   - パスワード: `Driver123!`

---

## 🔄 複数ユーザーを一括作成

### SQL で一括作成する方法

```sql
-- まず Supabase Authentication で各ユーザーを手動作成（Auto Confirm にチェック）
-- 作成したら以下のSQLで profiles に一括追加

-- 企業IDを取得
SELECT id FROM public.companies WHERE company_code = 'nlp-test';
-- 結果: e0c97ee5-3139-4a05-a719-c627a942bc81

-- 複数ユーザーを一括追加
INSERT INTO public.profiles (id, email, role, company_id, full_name, created_at)
VALUES 
    ('uuid1', 'driver1@nlp-test.com', 'company_user', 'e0c97ee5-3139-4a05-a719-c627a942bc81', 'ドライバー1号', NOW()),
    ('uuid2', 'driver2@nlp-test.com', 'company_user', 'e0c97ee5-3139-4a05-a719-c627a942bc81', 'ドライバー2号', NOW()),
    ('uuid3', 'manager@nlp-test.com', 'company_admin', 'e0c97ee5-3139-4a05-a719-c627a942bc81', 'マネージャー', NOW());
```

---

## 📝 テンプレート（コピー用）

### 1. Supabase Authentication で作成
```
Email: ________@nlp-test.com
Password: ________________
✅ Auto Confirm User
```

### 2. User UID をコピー
```
User UID: ____________________
```

### 3. SQL で profiles に追加
```sql
INSERT INTO public.profiles (id, email, role, company_id, full_name, created_at)
VALUES (
    '____________________',  -- User UID
    '________@nlp-test.com',
    'company_user',  -- または company_admin
    'e0c97ee5-3139-4a05-a719-c627a942bc81',  -- NLP物流のID
    '________',  -- 氏名
    NOW()
);
```

---

## 🚨 重要な注意点

### Auto Confirm User を必ずチェック

- ✅ チェックあり: すぐにログイン可能
- ❌ チェックなし: メール確認が必要（ログインできない）

### User UID と profile.id を一致させる

- `auth.users.id` と `profiles.id` は**同じUUID**である必要があります
- コピー&ペーストで確実に一致させてください

---

## 📊 企業別の company_id 一覧

```sql
-- すべての企業IDを確認
SELECT id, company_code, company_name FROM public.companies ORDER BY company_code;
```

| company_code | company_id | company_name |
|--------------|-----------|--------------|
| nlp-test | e0c97ee5-3139-4a05-a719-c627a942bc81 | NLP物流株式会社 |
| abc-logistics | （UUID） | ABC物流 |
| xyz-transport | （UUID） | XYZ運輸 |
| 1111-company | （UUID） | 1111企業 |

---

## 🎉 まとめ

**推奨フロー**:
1. Supabase Authentication でユーザー作成（Auto Confirm ✓）
2. User UID をコピー
3. SQL で profiles に追加
4. ユーザー管理画面で確認

この方法なら **100% 確実にユーザーを作成**できます。

---

**最終更新**: 2026年3月1日  
**推奨**: この手順で全ユーザーを作成してください
