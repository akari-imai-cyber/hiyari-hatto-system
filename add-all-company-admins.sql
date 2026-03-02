-- ============================================
-- すべての企業に管理者を追加するSQL
-- ============================================

-- Step 1: 現在の企業とユーザーを確認
SELECT 
    c.company_code,
    c.company_name,
    p.email,
    p.role,
    CASE 
        WHEN p.role = 'company_admin' THEN '✅ 既に企業管理者'
        WHEN p.role = 'company_user' THEN '👉 管理者に昇格可能'
        WHEN p.role = 'admin' THEN '🔧 システム管理者'
        ELSE '❓ 不明なロール'
    END as status
FROM public.companies c
LEFT JOIN public.profiles p ON c.id = p.company_id
ORDER BY c.company_code, p.email;


-- ============================================
-- Step 2: すべての企業の最初のユーザーを管理者に昇格
-- ============================================

BEGIN;

-- nlp-test （既に完了）
UPDATE public.profiles
SET role = 'company_admin'
WHERE email = 'nlp-test@company.local';

-- 1111-company
UPDATE public.profiles
SET role = 'company_admin'
WHERE email = '1111-company@company.local';

-- abc-logistics
UPDATE public.profiles
SET role = 'company_admin'
WHERE email = 'abc-logistics@company.local';

-- xyz-transport
UPDATE public.profiles
SET role = 'company_admin'
WHERE email = 'xyz-transport@company.local';

COMMIT;


-- ============================================
-- Step 3: すべての企業管理者を確認
-- ============================================

SELECT 
    c.company_name,
    c.company_code,
    p.email,
    p.role,
    '✅ 管理者' as status
FROM public.profiles p
JOIN public.companies c ON p.company_id = c.id
WHERE p.role = 'company_admin'
ORDER BY c.company_name;


-- ============================================
-- Step 4: 企業別のユーザー数と管理者数を確認
-- ============================================

SELECT 
    c.company_name,
    c.company_code,
    COUNT(*) AS total_users,
    SUM(CASE WHEN p.role = 'company_admin' THEN 1 ELSE 0 END) AS admin_count,
    SUM(CASE WHEN p.role = 'company_user' THEN 1 ELSE 0 END) AS user_count,
    SUM(CASE WHEN p.role = 'admin' THEN 1 ELSE 0 END) AS system_admin_count
FROM public.companies c
LEFT JOIN public.profiles p ON c.id = p.company_id
GROUP BY c.company_name, c.company_code
ORDER BY c.company_name;


-- ============================================
-- 個別企業の管理者を追加する場合（例）
-- ============================================

-- 例1: ABC物流に追加の管理者を作成
-- （まず Supabase Authentication でユーザーを作成してから）
/*
INSERT INTO public.profiles (id, email, role, company_id, created_at)
VALUES (
    '（Supabase Authで作成したユーザーのUUID）',
    'manager@abc-logistics.com',
    'company_admin',
    (SELECT id FROM public.companies WHERE company_code = 'abc-logistics'),
    NOW()
);
*/

-- 例2: 既存のユーザーを管理者に昇格
/*
UPDATE public.profiles
SET role = 'company_admin'
WHERE email = 'existing-user@abc-logistics.com';
*/


-- ============================================
-- ロールバック（間違えた場合）
-- ============================================

-- 特定のユーザーを一般ユーザーに戻す
/*
UPDATE public.profiles
SET role = 'company_user'
WHERE email = 'nlp-test@company.local';
*/

-- すべての企業管理者を一般ユーザーに戻す（注意！）
/*
UPDATE public.profiles
SET role = 'company_user'
WHERE role = 'company_admin';
*/
