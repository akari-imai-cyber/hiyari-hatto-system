-- ===================================
-- ヒヤリハット報告システム - 完全版スキーマ
-- ===================================

-- 既存のテーブルを削除（クリーンインストール）
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS offices CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;

-- 営業所マスタテーブル
CREATE TABLE offices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    office_code VARCHAR(50) UNIQUE NOT NULL,
    office_name VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 従業員マスタテーブル
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    office VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 車両マスタテーブル
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_number VARCHAR(50) UNIQUE NOT NULL,
    vehicle_type VARCHAR(50),
    office_id UUID REFERENCES offices(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ヒヤリハット報告テーブル（メイン）
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- STEP1: 基本情報
    report_type TEXT NOT NULL DEFAULT 'hiyari', -- 'hiyari' or 'accident'
    reporter_name TEXT NOT NULL,
    reporter_id TEXT,
    office TEXT,
    occurred_at TIMESTAMPTZ NOT NULL,
    location_text TEXT,
    location_lat FLOAT,
    location_lng FLOAT,
    incident_type TEXT NOT NULL, -- 'driving' or 'loading'
    categories TEXT[], -- 複数選択カテゴリ
    memo TEXT, -- カテゴリの補足メモ（50文字以内）
    photo_url TEXT, -- Base64形式の画像
    
    -- STEP2: 詳細情報（走行中）
    detail_weather TEXT,
    detail_road TEXT,
    detail_situation TEXT,
    detail_counterpart TEXT,
    road_surface TEXT,
    dashcam BOOLEAN,
    
    -- STEP2: 詳細情報（荷役中）
    work_phase TEXT,
    equipment_used TEXT,
    load_status TEXT,
    load_collapse TEXT,
    temperature_zone TEXT,
    
    -- STEP2: 原因分析
    direct_causes TEXT[], -- 直接原因（複数選択）
    cause_detail JSONB, -- 詳細原因（rush, fatigue, unfamiliar, vehicle）
    
    -- STEP2: 対策・フォロー
    own_action TEXT, -- 即時対処
    prevention TEXT, -- 再発防止提案
    severity INTEGER, -- 重大度（1-5）
    order_id TEXT,
    
    -- ステータス管理
    status TEXT DEFAULT 'step1_complete', -- 'step1_complete' or 'step2_complete'
    
    -- 管理者対応
    admin_comment TEXT,
    manager_comment TEXT,
    interview_date DATE,
    interviewer TEXT,
    interview_content TEXT,
    agreed_prevention TEXT,
    followup_date DATE,
    broadcast_flag BOOLEAN DEFAULT FALSE
);

-- インデックス作成
CREATE INDEX idx_incidents_reporter_name ON incidents(reporter_name);
CREATE INDEX idx_incidents_occurred_at ON incidents(occurred_at);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_incident_type ON incidents(incident_type);
CREATE INDEX idx_incidents_report_type ON incidents(report_type);
CREATE INDEX idx_incidents_created_at ON incidents(created_at);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_incidents_updated_at 
    BEFORE UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at 
    BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) の有効化
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- RLSポリシー（全ユーザーがアクセス可能）
CREATE POLICY "Enable all access for incidents" ON incidents
    FOR ALL USING (true);

CREATE POLICY "Enable read access for employees" ON employees
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for offices" ON offices
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for vehicles" ON vehicles
    FOR SELECT USING (true);

-- サンプルデータの挿入
INSERT INTO offices (office_code, office_name, address, phone) VALUES
    ('TK01', '東京第一営業所', '東京都江東区○○1-2-3', '03-1234-5678'),
    ('OS01', '大阪営業所', '大阪府大阪市○○区△△2-3-4', '06-1234-5678'),
    ('NG01', '名古屋営業所', '愛知県名古屋市○○区□□3-4-5', '052-123-4567')
ON CONFLICT (office_code) DO NOTHING;

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE 'テーブル作成完了！incidents テーブルにデータを入力できます。';
END $$;
