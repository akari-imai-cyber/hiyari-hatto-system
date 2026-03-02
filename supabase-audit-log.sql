-- ============================================
-- アクセスログ・監査ログテーブル
-- ============================================

-- アクセスログテーブル作成
CREATE TABLE IF NOT EXISTS access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_identifier TEXT,  -- 企業コードまたはメールアドレス
    action TEXT NOT NULL,  -- login, logout, view_dashboard, create_report, etc.
    resource TEXT,         -- 操作対象（reports, dashboard, analytics, admin）
    ip_address TEXT,       -- IPアドレス（クライアント側で取得）
    user_agent TEXT,       -- ブラウザ情報
    status TEXT,           -- success, failed, error
    error_message TEXT,    -- エラー時のメッセージ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成（パフォーマンス向上）
CREATE INDEX idx_access_logs_company_id ON access_logs(company_id);
CREATE INDEX idx_access_logs_created_at ON access_logs(created_at DESC);
CREATE INDEX idx_access_logs_action ON access_logs(action);
CREATE INDEX idx_access_logs_status ON access_logs(status);

-- RLS 有効化
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- 自社のログのみ閲覧可能
CREATE POLICY "access_logs_select_policy" ON access_logs
FOR SELECT
USING (
    company_id = (current_setting('request.jwt.claims', true)::json->>'company_id')::uuid
);

-- ログ挿入は全員可能（匿名ユーザー含む）
CREATE POLICY "access_logs_insert_policy" ON access_logs
FOR INSERT
WITH CHECK (true);

-- 管理者用：全ログ閲覧ビュー
CREATE OR REPLACE VIEW admin_access_logs AS
SELECT 
    al.id,
    c.company_code,
    c.company_name,
    al.user_identifier,
    al.action,
    al.resource,
    al.ip_address,
    al.status,
    al.error_message,
    al.created_at
FROM access_logs al
LEFT JOIN companies c ON al.company_id = c.id
ORDER BY al.created_at DESC;

COMMENT ON TABLE access_logs IS 'ユーザーのアクセスログと操作履歴';
COMMENT ON VIEW admin_access_logs IS '管理者用：全企業のアクセスログ統合ビュー';
