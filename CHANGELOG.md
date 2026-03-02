# 変更履歴

## 2025-02-25 - メール通知・リマインド機能削除

### 削除された機能
- **EmailJS統合**
  - 報告提出時の管理者へのメール通知
  - EmailJSライブラリの読み込み (`index.html`)
  - EmailJS設定 (`js/config.js`)
  - メール送信関数 (`js/main.js`)
  
- **リマインド機能**
  - 18時・翌朝8時の自動リマインド通知
  - リマインド送信フラグ

### 変更されたファイル
1. **index.html**
   - EmailJSライブラリのscriptタグを削除
   - 成功メッセージから「管理者に通知が送信されました」を削除

2. **js/config.js**
   - `EMAILJS_CONFIG` 設定を削除
   - `ADMIN_EMAILS` 配列を削除
   - `emailjs.init()` の初期化コードを削除

3. **js/main.js**
   - `sendNotification()` 関数を削除
   - フォーム送信処理からメール送信呼び出しを削除

### 理由
- ユーザーの要望により、メール通知機能が不要になった
- リマインド機能も使用しないことが決定された

## 2025-02-25 - Supabaseクライアント修正

### 変更内容
- Supabaseクライアント初期化方法を修正
  - `const supabaseClient = supabase.createClient(...)` に変更
  - `supabase.from()` → `supabaseClient.from()` に全置換

### 変更されたファイル
- `js/config.js`
- `js/main.js`
- `js/dashboard.js`
- `js/analytics.js`

## 2025-02-25 - テーブル名変更

### 変更内容
- テーブル名 `hiyari_reports` → `incidents` に統一
- インデックス名も変更 (`idx_hiyari_*` → `idx_incidents_*`)
- トリガー名も変更

### 必要なSupabase SQL
```sql
ALTER TABLE hiyari_reports RENAME TO incidents;
ALTER INDEX idx_hiyari_employee_name RENAME TO idx_incidents_employee_name;
ALTER INDEX idx_hiyari_occurred_at RENAME TO idx_incidents_occurred_at;
ALTER INDEX idx_hiyari_status RENAME TO idx_incidents_status;
ALTER INDEX idx_hiyari_category RENAME TO idx_incidents_category;
ALTER INDEX idx_hiyari_report_type RENAME TO idx_incidents_report_type;

DROP TRIGGER IF EXISTS update_hiyari_reports_updated_at ON incidents;
CREATE TRIGGER update_incidents_updated_at 
  BEFORE UPDATE ON incidents 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 2025-02-25 - フィールド名調整

### 変更内容
既存テーブルに合わせてJavaScriptのフィールド名を変更：
- `employee_name` → `reporter_name`
- `what_happened_category` → `categories` (配列形式)
- `category_memo` → `memo`
- `incident_category` → `incident_type`
- `what_happened_text` → `detail_situation`
- `photo_urls` → `photo_url` (単一値)

### 変更されたファイル
- `js/main.js`

## 2025-02-25 - カテゴリ選択機能再実装

### 追加内容
- 走行中カテゴリ：8種
- 荷役中カテゴリ：6種
- 複数選択可能なボタン形式
- 50文字以内の補足メモ欄

### 変更されたファイル
- `index.html` (カテゴリ配列をHTMLに直接埋め込み)
- `js/main.js` (カテゴリボタン生成ロジック)
- `css/style.css` (カテゴリボタンのスタイル)

## 2025-02-25 - 報告者入力方式変更

### 変更内容
- 選択式（ドロップダウン）→ テキスト直接入力
- プレースホルダー：「例：田中一郎」

### データベース変更
```sql
ALTER TABLE incidents DROP COLUMN IF EXISTS employee_id;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS employee_name VARCHAR(100);
DROP INDEX IF EXISTS idx_hiyari_employee;
CREATE INDEX IF NOT EXISTS idx_hiyari_employee_name ON incidents(employee_name);
```

## 2025-02-25 - 写真アップロード方式変更

### 変更内容
- Supabase Storage → Base64変換方式
- 5MB以下の画像のみ対応
- エラーハンドリング強化

### 変更されたファイル
- `js/main.js` (写真アップロード処理)

## 次のステップ

### 未実装の機能
- ダッシュボードの実装完成
- 分析画面の実装完成
- 認証機能（Supabase Auth）
- プッシュ通知
- PDF出力機能
- 教育ページ
- AI自動分析

### 推奨される改善
1. エラーハンドリングの強化
2. オフラインモード対応
3. PWA化（スマホアプリのように使える）
4. ダークモード対応
5. 多言語対応（英語・ベトナム語など）
