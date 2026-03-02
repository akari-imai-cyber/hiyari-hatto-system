-- ===================================
-- ヒヤリハット報告システム
-- Supabase データベーススキーマ
-- ===================================

-- 従業員マスタテーブル
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    office VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    birthdate DATE,
    blood_type VARCHAR(5),
    license_type VARCHAR(50),
    hire_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 営業所マスタテーブル
CREATE TABLE IF NOT EXISTS offices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    office_code VARCHAR(50) UNIQUE NOT NULL,
    office_name VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 車両マスタテーブル
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_number VARCHAR(50) UNIQUE NOT NULL,
    vehicle_type VARCHAR(50),
    office_id UUID REFERENCES offices(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ヒヤリハット報告テーブル（メイン）
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 基本情報
    report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('hiyari', 'accident')),
    employee_name VARCHAR(100) NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id),
    
    -- STEP1: 必須項目
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    location_text TEXT NOT NULL,
    location_gps_lat DECIMAL(10, 8),
    location_gps_lng DECIMAL(11, 8),
    incident_category VARCHAR(50) NOT NULL CHECK (incident_category IN ('driving', 'loading')),
    what_happened_category TEXT,
    category_memo VARCHAR(50),
    what_happened_text TEXT NOT NULL,
    photo_urls TEXT[], -- 配列で複数の写真URLまたはBase64を保存
    
    -- STEP2: 詳細情報（走行中）
    driving_situation VARCHAR(50),
    road_type VARCHAR(50),
    other_party VARCHAR(50),
    weather VARCHAR(20),
    road_surface VARCHAR(20),
    dashcam_available BOOLEAN,
    
    -- STEP2: 詳細情報（荷役中）
    work_phase VARCHAR(50),
    equipment_used VARCHAR(50),
    load_status VARCHAR(30),
    load_collapse VARCHAR(50),
    temperature_zone VARCHAR(20),
    
    -- 原因分析
    direct_causes TEXT[], -- 配列で複数選択可能
    cause_detail_rush TEXT[],
    cause_detail_fatigue TEXT[],
    cause_detail_unfamiliar TEXT[],
    cause_detail_vehicle TEXT[],
    
    -- 対策・フォロー
    immediate_action TEXT,
    prevention_proposal TEXT,
    severity_rating INTEGER CHECK (severity_rating BETWEEN 1 AND 5),
    order_id VARCHAR(100),
    
    -- 管理者対応
    manager_comment TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed')),
    share_with_all BOOLEAN DEFAULT false,
    
    -- タイムスタンプ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    step2_completed_at TIMESTAMP WITH TIME ZONE
);

-- インデックス作成（検索パフォーマンス向上）
CREATE INDEX idx_incidents_employee_name ON incidents(employee_name);
CREATE INDEX idx_incidents_occurred_at ON incidents(occurred_at);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_category ON incidents(incident_category);
CREATE INDEX idx_incidents_report_type ON incidents(report_type);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) の有効化
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- 基本的なRLSポリシー（認証済みユーザーは全データアクセス可能）
CREATE POLICY "Enable read access for authenticated users" ON employees
    FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Enable insert access for authenticated users" ON employees
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Enable read access for authenticated users" ON offices
    FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Enable read access for authenticated users" ON vehicles
    FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Enable all access for incidents" ON incidents
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- サンプルデータの挿入
INSERT INTO offices (office_code, office_name, address, phone) VALUES
    ('TK01', '東京第一営業所', '東京都江東区○○1-2-3', '03-1234-5678'),
    ('OS01', '大阪営業所', '大阪府大阪市○○区△△2-3-4', '06-1234-5678'),
    ('NG01', '名古屋営業所', '愛知県名古屋市○○区□□3-4-5', '052-123-4567')
ON CONFLICT (office_code) DO NOTHING;

-- サンプル従業員データ
INSERT INTO employees (employee_code, name, office, phone, email, birthdate, blood_type, license_type, hire_date) VALUES
    ('EMP-001', '田中 一郎', '東京第一営業所', '090-1234-5678', 'tanaka@example.com', '1985-04-15', 'A', '大型一種', '2015-04-01'),
    ('EMP-002', '佐藤 花子', '東京第一営業所', '090-2345-6789', 'sato@example.com', '1990-08-20', 'O', '中型', '2018-10-01'),
    ('EMP-003', '鈴木 太郎', '大阪営業所', '090-3456-7890', 'suzuki@example.com', '1982-12-10', 'B', '大型一種', '2012-06-15')
ON CONFLICT (employee_code) DO NOTHING;

-- サンプル車両データ
INSERT INTO vehicles (vehicle_number, vehicle_type, office_id) VALUES
    ('品川 100 あ 1234', '4トン', (SELECT id FROM offices WHERE office_code = 'TK01' LIMIT 1)),
    ('品川 100 あ 5678', '2トン', (SELECT id FROM offices WHERE office_code = 'TK01' LIMIT 1)),
    ('大阪 200 か 9012', '10トン', (SELECT id FROM offices WHERE office_code = 'OS01' LIMIT 1))
ON CONFLICT (vehicle_number) DO NOTHING;
