# 企業管理者ログイン トラブルシューティング

## 🔍 現在の状況確認

### Supabase側の確認（✅ 完了）
- `nlp-test@company.local` のロールが `company_admin` になっている ✅

### 次に確認すべきこと

## 1️⃣ Supabase Authにユーザーが存在するか確認

Supabaseで以下のSQLを実行：

```sql
-- Authentication テーブルからユーザーを確認
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at
FROM auth.users
WHERE email = 'nlp-test@company.local';
```

### 期待される結果：
| id | email | created_at | last_sign_in_at | email_confirmed_at |
|----|-------|------------|-----------------|-------------------|
| (UUID) | nlp-test@company.local | (日時) | (日時) | (日時) |

### ❌ 結果が空の場合
→ Supabase Authにユーザーが存在しません。以下の手順で作成：

1. Supabase Dashboard → **Authentication** → **Users**
2. **Add user** → **Create new user** をクリック
3. 以下を入力：
   - Email: `nlp-test@company.local`
   - Password: `nlptest123`
   - ✅ Auto Confirm User にチェック
4. **Create user** をクリック

---

## 2️⃣ profiles テーブルとauth.usersのIDが一致するか確認

```sql
-- profilesテーブルとauth.usersのIDを突き合わせ
SELECT 
    au.id as auth_user_id,
    au.email as auth_email,
    p.id as profile_id,
    p.email as profile_email,
    p.role,
    c.company_name,
    c.company_code
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
LEFT JOIN public.companies c ON p.company_id = c.id
WHERE au.email = 'nlp-test@company.local';
```

### 期待される結果：
| auth_user_id | auth_email | profile_id | profile_email | role | company_name | company_code |
|--------------|------------|------------|---------------|------|--------------|--------------|
| (UUID) | nlp-test@company.local | (同じUUID) | nlp-test@company.local | company_admin | NLP物流株式会社 | nlp-test |

### ❌ profile_id が NULL の場合
→ profilesテーブルにレコードがありません。以下で作成：

```sql
-- まず auth.users の UUID を取得
SELECT id FROM auth.users WHERE email = 'nlp-test@company.local';

-- 取得したUUIDを使ってprofilesレコードを作成
INSERT INTO public.profiles (id, email, role, company_id, created_at)
VALUES (
    '(↑で取得したUUID)',
    'nlp-test@company.local',
    'company_admin',
    (SELECT id FROM public.companies WHERE company_code = 'nlp-test'),
    NOW()
);
```

---

## 3️⃣ RLSポリシーの確認

```sql
-- incidents テーブルのポリシーを確認
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'incidents';
```

### 必要なポリシー：
- `company_admin_read_own_company` (SELECT)
- `company_admin_update_own_company` (UPDATE)

### ❌ ポリシーが存在しない場合

```sql
-- incidents テーブルに company_admin 用ポリシーを追加
CREATE POLICY "company_admin_read_own_company"
ON public.incidents FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('company_admin', 'admin')
  )
);

CREATE POLICY "company_admin_update_own_company"
ON public.incidents FOR UPDATE
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('company_admin', 'admin')
  )
);

CREATE POLICY "company_admin_delete_own_company"
ON public.incidents FOR DELETE
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('company_admin', 'admin')
  )
);
```

---

## 4️⃣ Netlifyデプロイの確認

### デプロイ手順：
1. 画面左上の **「Download files」** → `project.zip` をダウンロード
2. ZIPを解凍
3. https://app.netlify.com にログイン
4. サイト `stellular-profiterole-2ff0a2` を選択
5. **Deploys** タブ → 解凍したフォルダをドラッグ&ドロップ
6. 緑の **"Published"** が表示されるまで待つ（2-3分）

### デプロイ完了後：
- ブラウザキャッシュをクリア（Ctrl+Shift+Del）
- またはシークレットモードで開く

---

## 5️⃣ ログインテスト（ブラウザコンソールで確認）

### ログインページで確認：
1. https://stellular-profiterole-2ff0a2.netlify.app/index.html を開く
2. **F12** キーでデベロッパーツールを開く
3. **Console** タブを選択
4. 以下の情報を入力してログイン：
   - 企業コード: `nlp-test`
   - メール: `nlp-test@company.local`
   - パスワード: `nlptest123`

### コンソールに表示されるべきログ：
```
✅ 認証成功: company_admin
✅ 企業情報読み込み成功: NLP物流株式会社 (nlp-test)
```

### ❌ エラーが表示される場合：
コンソールのエラーメッセージをスクリーンショットで共有してください。

---

## 6️⃣ ダッシュボードで「報告管理」リンクが表示されるか確認

ログイン成功後、ダッシュボードのナビゲーションに以下が表示されるはず：

```
🏠 報告入力 | 📊 ダッシュボード | 📈 分析 | 📋 報告管理
```

### ❌ 「報告管理」が表示されない場合：

**デベロッパーツールのConsoleで確認**：

```javascript
// 現在の認証情報を確認
console.log('Role:', window.currentAuth?.role);
console.log('Company:', window.currentAuth?.companyName);
```

期待される出力：
```
Role: company_admin
Company: NLP物流株式会社
```

---

## 📞 次のステップ

上記の **1️⃣〜6️⃣** を順番に実行し、どのステップで問題が発生したか教えてください。

特に重要なのは：
- ✅ **1️⃣**: auth.users にユーザーが存在するか
- ✅ **2️⃣**: profiles と auth.users のIDが一致するか
- ✅ **4️⃣**: Netlifyデプロイが完了しているか
- ✅ **5️⃣**: ブラウザコンソールのエラーメッセージ

スクリーンショットを共有していただければ、さらに詳しく診断できます！
