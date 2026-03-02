-- ============================================
-- 修正依頼機能のためのテーブル拡張
-- ============================================

-- incidents テーブルに修正依頼関連のカラムを追加
ALTER TABLE public.incidents 
ADD COLUMN IF NOT EXISTS edit_request BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS edit_request_message TEXT,
ADD COLUMN IF NOT EXISTS edit_request_date TIMESTAMP WITH TIME ZONE;

-- インデックスを追加（修正依頼がある報告を素早く検索）
CREATE INDEX IF NOT EXISTS idx_incidents_edit_request 
ON public.incidents(edit_request) 
WHERE edit_request = TRUE;

-- コメント追加
COMMENT ON COLUMN public.incidents.edit_request IS 'ドライバーからの修正依頼フラグ';
COMMENT ON COLUMN public.incidents.edit_request_message IS '修正依頼の内容';
COMMENT ON COLUMN public.incidents.edit_request_date IS '修正依頼の送信日時';

-- 確認クエリ
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'incidents' 
  AND column_name IN ('edit_request', 'edit_request_message', 'edit_request_date')
ORDER BY column_name;

-- テスト: 修正依頼がある報告を検索
SELECT 
    id,
    reporter_name,
    occurred_at,
    edit_request,
    edit_request_message,
    edit_request_date
FROM public.incidents
WHERE edit_request = TRUE
ORDER BY edit_request_date DESC
LIMIT 10;
