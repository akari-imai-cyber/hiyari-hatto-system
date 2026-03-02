# テーブル名変更完了: hiyari_reports → incidents

## ✅ 変更完了したファイル

### JavaScriptファイル
1. **js/main.js** (1箇所)
   - `.from('hiyari_reports')` → `.from('incidents')`

2. **js/dashboard.js** (3箇所)
   - すべての `hiyari_reports` を `incidents` に変更

3. **js/analytics.js** (1箇所)
   - `.from('hiyari_reports')` → `.from('incidents')`

### データベースファイル
4. **supabase-schema.sql** (9箇所)
   - テーブル定義: `CREATE TABLE incidents`
   - インデックス: `idx_incidents_*`
   - トリガー: `update_incidents_updated_at`
   - RLS: `ALTER TABLE incidents`
   - ポリシー: `ON incidents`

## 🗄️ Supabaseで必要な作業

既存のテーブル名を変更するか、新しくテーブルを作成してください。

### オプション1: 既存テーブルの名前変更（推奨）

```sql
-- テーブル名を変更
ALTER TABLE hiyari_reports RENAME TO incidents;

-- インデックスの名前変更
ALTER INDEX idx_hiyari_employee_name RENAME TO idx_incidents_employee_name;
ALTER INDEX idx_hiyari_occurred_at RENAME TO idx_incidents_occurred_at;
ALTER INDEX idx_hiyari_status RENAME TO idx_incidents_status;
ALTER INDEX idx_hiyari_category RENAME TO idx_incidents_category;
ALTER INDEX idx_hiyari_report_type RENAME TO idx_incidents_report_type;

-- トリガーの名前変更
DROP TRIGGER IF EXISTS update_hiyari_reports_updated_at ON hiyari_reports;
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLSポリシーの更新
DROP POLICY IF EXISTS "Enable all access for hiyari_reports" ON hiyari_reports;
CREATE POLICY "Enable all access for incidents" ON incidents
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
```

### オプション2: 新規テーブル作成

`supabase-schema.sql` の内容を全て実行してください。
（既にhiyari_reportsテーブルがある場合は、先に削除するか、データを移行してください）

### データ移行が必要な場合

```sql
-- 既存データを新テーブルにコピー
INSERT INTO incidents SELECT * FROM hiyari_reports;

-- 確認
SELECT COUNT(*) FROM incidents;

-- 問題なければ旧テーブルを削除
DROP TABLE hiyari_reports CASCADE;
```

## 🧪 動作確認

### 1. Supabaseでテーブル確認
- Supabaseダッシュボード → Table Editor
- `incidents` テーブルが表示されるか確認

### 2. アプリケーションで確認
1. ページをリロード（Ctrl+Shift+R）
2. フォームを入力して送信
3. Consoleで確認:
   ```
   === データベース保存開始 ===
   保存データ: {...}
   保存成功: [...]
   ```
4. Supabaseでデータが保存されているか確認

### 3. ダッシュボードで確認
1. `dashboard.html` を開く
2. 報告一覧が表示されるか確認

### 4. 分析画面で確認
1. `analytics.html` を開く
2. グラフが表示されるか確認

## ⚠️ 注意事項

- **既存データがある場合**: 必ずデータ移行を行ってください
- **バックアップ**: テーブル名変更前に必ずバックアップを取ってください
- **RLSポリシー**: 新しいテーブルに対してRLSポリシーが正しく設定されているか確認してください

## 📝 変更内容サマリー

| 項目 | 変更前 | 変更後 |
|------|--------|--------|
| テーブル名 | hiyari_reports | incidents |
| インデックス接頭辞 | idx_hiyari_* | idx_incidents_* |
| トリガー名 | update_hiyari_reports_updated_at | update_incidents_updated_at |
| RLSポリシー | Enable all access for hiyari_reports | Enable all access for incidents |

## ✅ 完了

すべてのコード内の `hiyari_reports` を `incidents` に変更しました。

**次のステップ:**
1. Supabaseでテーブル名を変更
2. ページをリロード
3. 動作確認
4. Netlifyに再デプロイ
