-- ============================================
-- マルチテナント対応：データベース構造の拡張
-- ============================================

-- 1. 企業マスタテーブルの作成
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_code TEXT UNIQUE NOT NULL,  -- 企業コード（nlp-test など）
    company_name TEXT NOT NULL,          -- 企業名
    industry TEXT,                       -- 業種
    plan TEXT DEFAULT 'free',            -- プラン（free/basic/premium）
    max_users INTEGER DEFAULT 10,        -- 最大ユーザー数
    is_active BOOLEAN DEFAULT true,      -- 有効/無効
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. incidents テーブルに company_id カラムを追加
ALTER TABLE incidents 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- 3. 既存データに company_id を設定（デフォルト企業を作成）
INSERT INTO companies (company_code, company_name, industry, plan)
VALUES ('nlp-test', 'NLP物流株式会社', '物流業', 'free')
ON CONFLICT (company_code) DO NOTHING;

-- 既存データに company_id を自動設定
UPDATE incidents 
SET company_id = (SELECT id FROM companies WHERE company_code = 'nlp-test' LIMIT 1)
WHERE company_id IS NULL;

-- 4. インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_incidents_company_id ON incidents(company_id);
CREATE INDEX IF NOT EXISTS idx_incidents_company_date ON incidents(company_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_company_status ON incidents(company_id, status);

-- ============================================
-- Row Level Security (RLS) の設定
-- ============================================

-- 5. RLS を有効化
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- 6. 現在のポリシーを削除（既存がある場合）
DROP POLICY IF EXISTS "incidents_select_policy" ON incidents;
DROP POLICY IF EXISTS "incidents_insert_policy" ON incidents;
DROP POLICY IF EXISTS "incidents_update_policy" ON incidents;
DROP POLICY IF EXISTS "incidents_delete_policy" ON incidents;
DROP POLICY IF EXISTS "companies_select_policy" ON companies;

-- 7. incidents テーブルのポリシー設定

-- 📖 SELECT: 自社データのみ閲覧可能
CREATE POLICY "incidents_select_policy" ON incidents
FOR SELECT
USING (
    -- 認証済みユーザーで、かつ自社データのみ
    auth.jwt() ->> 'company_id' IS NOT NULL 
    AND company_id::text = auth.jwt() ->> 'company_id'
);

-- ✍️ INSERT: 自社データのみ作成可能
CREATE POLICY "incidents_insert_policy" ON incidents
FOR INSERT
WITH CHECK (
    auth.jwt() ->> 'company_id' IS NOT NULL 
    AND company_id::text = auth.jwt() ->> 'company_id'
);

-- 🔄 UPDATE: 自社データのみ更新可能
CREATE POLICY "incidents_update_policy" ON incidents
FOR UPDATE
USING (
    auth.jwt() ->> 'company_id' IS NOT NULL 
    AND company_id::text = auth.jwt() ->> 'company_id'
)
WITH CHECK (
    auth.jwt() ->> 'company_id' IS NOT NULL 
    AND company_id::text = auth.jwt() ->> 'company_id'
);

-- 🗑️ DELETE: 自社データのみ削除可能
CREATE POLICY "incidents_delete_policy" ON incidents
FOR DELETE
USING (
    auth.jwt() ->> 'company_id' IS NOT NULL 
    AND company_id::text = auth.jwt() ->> 'company_id'
);

-- 8. companies テーブルのポリシー設定

-- 📖 SELECT: 自社情報のみ閲覧可能
CREATE POLICY "companies_select_policy" ON companies
FOR SELECT
USING (
    auth.jwt() ->> 'company_id' IS NOT NULL 
    AND id::text = auth.jwt() ->> 'company_id'
);

-- ============================================
-- テスト用企業データの追加
-- ============================================

-- 9. テスト用の企業を追加
INSERT INTO companies (company_code, company_name, industry, plan)
VALUES 
    ('abc-logistics', 'ABC物流株式会社', '物流業', 'free'),
    ('xyz-transport', 'XYZ運送株式会社', '運送業', 'free')
ON CONFLICT (company_code) DO NOTHING;

-- ============================================
-- 確認用クエリ
-- ============================================

-- 企業一覧の確認
SELECT 
    id,
    company_code,
    company_name,
    industry,
    plan,
    is_active,
    created_at
FROM companies
ORDER BY created_at DESC;

-- incidents テーブルの company_id 設定状況確認
SELECT 
    COUNT(*) as total_records,
    COUNT(company_id) as with_company_id,
    COUNT(*) - COUNT(company_id) as without_company_id
FROM incidents;

-- 企業別のレコード数
SELECT 
    c.company_name,
    COUNT(i.id) as report_count
FROM companies c
LEFT JOIN incidents i ON i.company_id = c.id
GROUP BY c.company_name
ORDER BY report_count DESC;

-- ============================================
-- 完了メッセージ
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ マルチテナント設定が完了しました！';
    RAISE NOTICE '📊 企業テーブル作成完了';
    RAISE NOTICE '🔒 RLS ポリシー設定完了';
    RAISE NOTICE '📈 インデックス作成完了';
END $$;
