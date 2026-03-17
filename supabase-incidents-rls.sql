-- ============================================
-- Incidents テーブルの Row-Level Security (RLS) ポリシー設定
-- ============================================
-- このSQLは、incidentsテーブルのデータアクセスを制限し、
-- 企業管理者は自社データのみ、システム管理者は全データを閲覧できるようにします。
-- ============================================

-- 1. RLS を有効化
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- 2. 既存のポリシーを削除（もしあれば）
DROP POLICY IF EXISTS "Company admin can view own incidents" ON incidents;
DROP POLICY IF EXISTS "System admin can view all incidents" ON incidents;
DROP POLICY IF EXISTS "Company admin can insert own incidents" ON incidents;
DROP POLICY IF EXISTS "Company admin can update own incidents" ON incidents;
DROP POLICY IF EXISTS "Company admin can delete own incidents" ON incidents;

-- 3. SELECT ポリシー: 企業管理者は自社データのみ閲覧可能
CREATE POLICY "Company admin can view own incidents"
ON incidents
FOR SELECT
TO authenticated
USING (
    -- システム管理者は全データを閲覧可能
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
    OR
    -- 企業管理者は自社データのみ閲覧可能
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.company_id = incidents.company_id
        AND profiles.role IN ('company_admin', 'company_user')
    )
);

-- 4. INSERT ポリシー: 認証済みユーザーは自社データを追加可能
CREATE POLICY "Company admin can insert own incidents"
ON incidents
FOR INSERT
TO authenticated
WITH CHECK (
    -- システム管理者は全データを追加可能
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
    OR
    -- 企業ユーザーは自社データのみ追加可能
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.company_id = incidents.company_id
    )
);

-- 5. UPDATE ポリシー: 認証済みユーザーは自社データを更新可能
CREATE POLICY "Company admin can update own incidents"
ON incidents
FOR UPDATE
TO authenticated
USING (
    -- システム管理者は全データを更新可能
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
    OR
    -- 企業ユーザーは自社データのみ更新可能
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.company_id = incidents.company_id
    )
);

-- 6. DELETE ポリシー: 企業管理者とシステム管理者のみ削除可能
CREATE POLICY "Company admin can delete own incidents"
ON incidents
FOR DELETE
TO authenticated
USING (
    -- システム管理者は全データを削除可能
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
    OR
    -- 企業管理者は自社データのみ削除可能
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.company_id = incidents.company_id
        AND profiles.role = 'company_admin'
    )
);

-- 7. 匿名ユーザー向けのポリシー（必要に応じて）
-- 新規登録時にincidentsテーブルへの書き込みが必要な場合のみ
-- DROP POLICY IF EXISTS "Allow anon insert for new incidents" ON incidents;
-- CREATE POLICY "Allow anon insert for new incidents"
-- ON incidents
-- FOR INSERT
-- TO anon
-- WITH CHECK (true);

-- ============================================
-- 確認用クエリ
-- ============================================

-- 現在のポリシーを確認
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies
WHERE tablename = 'incidents';

-- RLS が有効かどうか確認
SELECT 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'incidents' AND schemaname = 'public';

-- ============================================
-- 実行手順
-- ============================================
-- 1. Supabase ダッシュボードを開く
--    https://supabase.com/dashboard/project/yimeoggmsubtcmxddyat/sql/new
-- 
-- 2. SQL Editor で上記のSQLを実行
-- 
-- 3. 実行後、以下を確認:
--    - システム管理者 (admin) でログイン → 全データが見える
--    - 企業管理者 (company_admin) でログイン → 自社データのみ見える
-- 
-- 4. テスト:
--    - https://hiyari-hatto-system.vercel.app/admin-reports.html にアクセス
--    - 企業管理者でログインして、自社データのみ表示されるか確認
-- ============================================
