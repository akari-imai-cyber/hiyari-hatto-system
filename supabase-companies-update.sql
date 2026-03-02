-- ============================================
-- companiesテーブルに連絡先情報追加
-- ============================================

-- 連絡先メールアドレス追加
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- 連絡先電話番号追加
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_companies_email ON companies(contact_email);

-- 確認
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'companies'
ORDER BY ordinal_position;

-- サンプルデータ更新（既存データに連絡先追加）
UPDATE companies
SET 
    contact_email = company_code || '@example.com',
    contact_phone = '090-XXXX-XXXX'
WHERE contact_email IS NULL;

-- 確認
SELECT company_code, company_name, contact_email, contact_phone FROM companies;

COMMENT ON COLUMN companies.contact_email IS '企業の連絡先メールアドレス';
COMMENT ON COLUMN companies.contact_phone IS '企業の連絡先電話番号';
