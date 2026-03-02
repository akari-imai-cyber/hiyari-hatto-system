-- ============================================
-- 企業管理者（company_admin）作成用SQL
-- ============================================

-- 使い方:
-- 1. 既存のユーザーを企業管理者に昇格させる場合
-- 2. 新しい企業管理者を作成する場合

-- ============================================
-- 方法1: 既存ユーザーを企業管理者に昇格
-- ============================================

-- 例: nlp-test@company.local を企業管理者にする
UPDATE public.profiles
SET role = 'company_admin'
WHERE email = 'nlp-test@company.local';

-- 確認
SELECT 
    p.id,
    p.email,
    p.role,
    c.company_name,
    c.company_code
FROM public.profiles p
JOIN public.companies c ON p.company_id = c.id
WHERE p.email = 'nlp-test@company.local';


-- ============================================
-- 方法2: 既存の全4社に企業管理者を作成する（テスト用）
-- ============================================

-- Step 1: 各企業の既存ユーザーを確認
SELECT 
    c.company_code,
    c.company_name,
    p.email,
    p.role
FROM public.companies c
LEFT JOIN public.profiles p ON c.id = p.company_id
ORDER BY c.company_code, p.email;

-- Step 2: 各企業の1人目を企業管理者に昇格（例）
-- nlp-test の企業管理者
UPDATE public.profiles
SET role = 'company_admin'
WHERE email = 'nlp-test@company.local';

-- 1111-company の企業管理者
UPDATE public.profiles
SET role = 'company_admin'
WHERE email = '1111-company@company.local';

-- abc-logistics の企業管理者
UPDATE public.profiles
SET role = 'company_admin'
WHERE email = 'abc-logistics@company.local';

-- xyz-transport の企業管理者
UPDATE public.profiles
SET role = 'company_admin'
WHERE email = 'xyz-transport@company.local';


-- ============================================
-- 方法3: 新しい企業管理者ユーザーを追加
-- ============================================

-- 注意: この方法は Supabase Auth でユーザーを先に作成してから実行

-- 例: ABC物流に新しい企業管理者「manager@abc-logistics.com」を追加

-- Step 1: Supabase Authentication で以下のユーザーを作成
--   Email: manager@abc-logistics.com
--   Password: （任意の強力なパスワード）

-- Step 2: profiles テーブルにレコードを作成
-- （company_id は abc-logistics の ID に置き換える）
/*
INSERT INTO public.profiles (id, email, role, company_id)
VALUES (
    '（Supabase Authで作成したユーザーのUUID）',
    'manager@abc-logistics.com',
    'company_admin',
    '（abc-logistics の company_id）'
);
*/

-- 企業IDを取得する方法
SELECT id, company_code, company_name 
FROM public.companies 
WHERE company_code = 'abc-logistics';


-- ============================================
-- 確認クエリ
-- ============================================

-- すべての企業管理者を確認
SELECT 
    c.company_name,
    c.company_code,
    p.email,
    p.role,
    p.created_at
FROM public.profiles p
JOIN public.companies c ON p.company_id = c.id
WHERE p.role = 'company_admin'
ORDER BY c.company_name, p.email;

-- 企業別のユーザー数と管理者数を確認
SELECT 
    c.company_name,
    c.company_code,
    COUNT(*) AS total_users,
    SUM(CASE WHEN p.role = 'company_admin' THEN 1 ELSE 0 END) AS admin_count,
    SUM(CASE WHEN p.role = 'company_user' THEN 1 ELSE 0 END) AS user_count
FROM public.companies c
LEFT JOIN public.profiles p ON c.id = p.company_id
GROUP BY c.company_name, c.company_code
ORDER BY c.company_name;


-- ============================================
-- ロールバック（間違えた場合）
-- ============================================

-- 企業管理者を一般ユーザーに戻す
UPDATE public.profiles
SET role = 'company_user'
WHERE email = 'nlp-test@company.local';


-- ============================================
-- 推奨設定（4社に1人ずつ企業管理者を作成）
-- ============================================

-- 以下をまとめて実行すると、4社すべてに企業管理者が作成されます
BEGIN;

UPDATE public.profiles SET role = 'company_admin' WHERE email = 'nlp-test@company.local';
UPDATE public.profiles SET role = 'company_admin' WHERE email = '1111-company@company.local';
UPDATE public.profiles SET role = 'company_admin' WHERE email = 'abc-logistics@company.local';
UPDATE public.profiles SET role = 'company_admin' WHERE email = 'xyz-transport@company.local';

COMMIT;

-- 確認
SELECT 
    c.company_name,
    c.company_code,
    p.email,
    p.role
FROM public.profiles p
JOIN public.companies c ON p.company_id = c.id
WHERE p.role = 'company_admin'
ORDER BY c.company_name;
