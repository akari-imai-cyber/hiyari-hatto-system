# 🛠️ ヒヤリハット報告システム 管理者マニュアル（改訂版）

<div style="background: #fef3c7; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0;">

**対象**: システム管理者  
**最終更新日**: 2026年3月1日  
**重要度**: ⭐⭐⭐ （このマニュアルを必ず読んでください）

</div>

---

## 📋 目次

| セクション | 概要 | 頻度 |
|-----------|------|------|
| [1. 管理者権限](#1-管理者権限) | 管理者アカウントと権限 | - |
| [2. 日常作業（毎週）](#2-日常作業毎週) | バックアップ・ログ確認 | **毎週** |
| [3. 企業管理](#3-企業管理) | 企業追加・編集・削除 | 必要時 |
| [4. データ管理](#4-データ管理) | 報告データの確認・エクスポート | 必要時 |
| [5. 匿名化データ](#5-匿名化データ) | データ販売用エクスポート | 月次 |
| [6. トラブル対応](#6-トラブル対応) | よくある問題の解決方法 | 必要時 |

---

## 1. 管理者権限

<div style="background: #e0f2fe; padding: 20px; border-radius: 8px;">

### 🔑 管理者アカウント

- **メール**: `akari-imai@tehara.co.jp`
- **パスワード**: `tehara0425`
- **権限**: `admin`（最高権限）

</div>

### ✅ 管理者の権限一覧

| 機能 | 説明 |
|------|------|
| 🏢 **企業管理** | 企業の追加・編集・削除 |
| 📄 **全データ閲覧** | 全企業の報告データを閲覧・編集・削除 |
| 📋 **匿名化エクスポート** | データ販売用のCSVエクスポート |
| 🔍 **ログ確認** | アクセスログ、レート制限ログの閲覧 |
| 📊 **システム統計** | DB全体の統計情報 |
| 🔒 **セキュリティ設定** | RLSポリシー、レート制限の調整 |

---

## 2. 日常作業（毎週）

<div style="background: #fee2e2; padding: 20px; border-left: 4px solid #ef4444; margin: 20px 0;">

### ⚠️ 必ずやること（データ保護のため）

**📅 毎週日曜日**: バックアップ（約10分）  
**🔍 毎週月曜日**: アクセスログ確認（約5分）

</div>

---

### 📋 バックアップ手順（毎週日曜日・約10分）

**Step 1: Supabase にログイン**
1. https://supabase.com を開く
2. プロジェクト **「NLP運行状況DB」** を選択

**Step 2: 統計クエリを実行**
1. SQL Editor を開く
2. 以下のSQLを実行し結果をスクリーンショット保存

```sql
-- バックアップ統計（コピーして実行）
SELECT '✅ バックアップ日時: ' || NOW()::TEXT
UNION ALL SELECT '企業数: ' || COUNT(*)::TEXT FROM public.companies
UNION ALL SELECT '報告数: ' || COUNT(*)::TEXT FROM public.incidents;
```

3. 結果を `backup_log_2026-03-02.png` として保存

**Step 3: 主要テーブルCSVエクスポート**

```sql
-- companies テーブル
SELECT * FROM public.companies ORDER BY created_at DESC;
-- Results → Export → CSV → backup_companies_2026-03-02.csv

-- incidents テーブル
SELECT * FROM public.incidents ORDER BY created_at DESC;
-- Results → Export → CSV → backup_incidents_2026-03-02.csv
```

**Step 4: Google Drive / Dropbox にアップロード**
- フォルダ名: `backup_2026-03-02`
- 最低 **3世代（3週間分）** を保持

---

### 🔍 アクセスログ確認（毎週月曜日・約5分）

**アクセス方法:**
```
https://stellular-profiterole-2ff0a2.netlify.app/audit-logs.html
```

**確認項目:**
- ✅ 短時間に大量のログイン失敗がないか
- ✅ 深夜の不審なアクセスがないか
- ✅ 異常なIPアドレスからのアクセスがないか

**異常検知時:**
1. 該当企業に連絡
2. パスワードをリセット
3. ログを記録しておく

---

## 3. 企業管理

### 💼 管理画面アクセス

**URL:**
```
https://stellular-profiterole-2ff0a2.netlify.app/admin.html
```

**ログイン:**
- メール: `akari-imai@tehara.co.jp`
- パスワード: `tehara0425`

---

### 🏢 企業一覧の確認

管理画面トップに表示される情報：

| 項目 | 説明 |
|------|------|
| 🏯 **企業コード** | ログイン用ID（例: `abc-logistics`） |
| 🏢 **企業名** | 正式名称 |
| 📊 **報告数** | 登録されている報告件数 |
| 📅 **登録日** | 企業登録日 |
| ✏️ / 🗑️ **操作** | 編集・削除ボタン |

---

### ➕ 新規企業の追加（3ステップ）

<div style="background: #f0fdf4; padding: 15px; border-radius: 8px;">

**1. 「➡️ 新しい企業を追加」ボタンをクリック**

**2. 必須情報を入力:**
- 🏯 企業コード: `abc-logistics`（英数字・ハイフンのみ）
- 🏢 企業名: 株式会社ABCロジスティクス
- 💼 業界: 物流 / 運送 / 製造
- 🔑 パスワード: 8文字以上推奨
- 📧 メール: `abc-logistics@company.local`（推奨形式）

**3. 「保存」ボタン → 自動登録完了**
- Supabase にユーザー、プロフィール、企業情報が作成されます

</div>

<div style="background: #fef3c7; padding: 10px; border-radius: 5px; margin: 10px 0;">

⚠️ **注意**: 企業コードは重複不可。パスワードはSupabaseでハッシュ化され保存されます。

</div>

---

### ✏️ 企業情報の編集

**手順:**
1. 企業一覧から 「✏️ 編集」 ボタンをクリック
2. 情報を変更（企業名、業界、プラン、メール、電話）
3. 「保存」ボタンをクリック

<div style="background: #fee2e2; padding: 10px; border-radius: 5px;">

⚠️ **制限事項**:
- 🚫 企業コードは変更不可（変更する場合は削除→再登録）
- 🔑 パスワード変更はSupabaseコンソールで実施

</div>

---

### 🗑️ 企業の削除（慎重に！）

<div style="background: #fee2e2; padding: 20px; border-left: 4px solid #dc2626; margin: 20px 0;">

### ⚠️ 削除前の必須確認

- ✅ バックアップ取得済み
- ✅ 匿名化データエクスポート済み
- ✅ 企業に削除通知済み

**削除されるデータ**:
- 🏢 `companies` テーブルの企業情報
- 📄 該当企業の全報告データ（`incidents`）
- 👤 ユーザー情報（`profiles`）
- 🚫 **削除は復元不可能**

</div>

**手順:**
1. 企業一覧から 「🗑️ 削除」 ボタンをクリック
2. 確認ダイアログで企業名を確認
3. 「削除」をクリック

---

## 4. データ管理

### 📊 報告データの閲覧

```
https://stellular-profiterole-2ff0a2.netlify.app/dashboard.html
```

管理者は**全企業のデータ**を閲覧できます。

---

### 📥 CSVエクスポート（全データ）

1. ダッシュボードでフィルターを設定
2. 「📥 CSVエクスポート」ボタンをクリック
3. **39カラムの完全なCSV**がダウンロードされます

---

## 5. 匿名化データ

### 📋 匿名化データエクスポートの目的

個人・企業を特定できない形式でデータを第三者（学術機関、データ販売、AI学習）に提供するため。

---

### 🔒 匿名化内容（23カラム）

<table style="width: 100%; border-collapse: collapse;">
<tr style="background: #f9fafb;">
<th style="padding: 10px;">元データ</th>
<th style="padding: 10px;">匿名化後</th>
</tr>
<tr>
<td style="padding: 10px;">企業コード： `abc-logistics`</td>
<td style="padding: 10px;"><code>Company_12ab34cd</code>（MD5ハッシュ）</td>
</tr>
<tr style="background: #f9fafb;">
<td style="padding: 10px;">報告者名： 山田太郎</td>
<td style="padding: 10px;"><code>Reporter_56ef78gh</code>（MD5ハッシュ）</td>
</tr>
<tr>
<td style="padding: 10px;">発生日時： 2026-02-15 14:30</td>
<td style="padding: 10px;"><code>2026-02</code>（月単位）</td>
</tr>
<tr style="background: #f9fafb;">
<td style="padding: 10px;">GPS： 緯度35.6762, 経度139.6503</td>
<td style="padding: 10px;"><code>関東地方</code>（都道府県レベル）</td>
</tr>
<tr>
<td style="padding: 10px;">車両ID： ABC-1234</td>
<td style="padding: 10px;"><code>Vehicle_9abc12</code>（MD5ハッシュ）</td>
</tr>
<tr style="background: #f9fafb;">
<td style="padding: 10px;">写真URL、注文ID</td>
<td style="padding: 10px;"><code>削除</code></td>
</tr>
</table>

---

### 📥 エクスポート手順（3ステップ）

<div style="background: #f0fdf4; padding: 15px; border-radius: 8px;">

**1. 管理画面にログイン**
```
https://stellular-profiterole-2ff0a2.netlify.app/admin.html
```

**2. 「📊 匿名化データをエクスポート」ボタンをクリック**

**3. ダウンロード完了**
- ファイル名: `匿名化データ_2026-03-01.csv`
- カラム数: 23カラム
- 用途: データ販売、学術研究、AI学習

</div>

---

### 🎯 匿名化データの用途

- 📈 業界統計データとして販売
- 🎓 学術研究機関への提供
- 🏢 公的機関への報告
- 🤖 AIトレーニングデータ

---

## 6. トラブル対応

### ❓ よくある問題と解決策

<table style="width: 100%; border-collapse: collapse;">
<tr style="background: #f9fafb;">
<th style="padding: 10px; text-align: left;">問題</th>
<th style="padding: 10px; text-align: left;">原因</th>
<th style="padding: 10px; text-align: left;">解決策</th>
</tr>
<tr>
<td style="padding: 10px;">🚫 ユーザーがログインできない</td>
<td style="padding: 10px;">ユーザー未作成 / パスワード間違い</td>
<td style="padding: 10px;">1. Supabase Authentication → Users でユーザー存在確認<br>2. パスワードリセット / ユーザー再作成</td>
</tr>
<tr style="background: #f9fafb;">
<td style="padding: 10px;">📄 データが表示されない</td>
<td style="padding: 10px;">RLSポリシー / company_id不一致</td>
<td style="padding: 10px;">以下SQLでJWT確認:<br><code>SELECT u.email, u.raw_user_meta_data->>'company_id', p.company_id FROM auth.users u JOIN profiles p ON u.id=p.id;</code></td>
</tr>
<tr>
<td style="padding: 10px;">⚡ レート制限エラー頻発</td>
<td style="padding: 10px;">短時間に大量アクセス</td>
<td style="padding: 10px;">ログ確認後、以下SQLで解除:<br><code>DELETE FROM rate_limits WHERE user_id=(SELECT id FROM auth.users WHERE email='xxx');</code></td>
</tr>
<tr style="background: #f9fafb;">
<td style="padding: 10px;">🌐 匿名化データの地域が「不明」</td>
<td style="padding: 10px;">GPSデータがNULL / location_textに都道府県名がない</td>
<td style="padding: 10px;">1. 入力時にGPS取得を促す<br>2. location_textに都道府県名を含めるよう指導</td>
</tr>
<tr>
<td style="padding: 10px;">🛠️ システムが重い</td>
<td style="padding: 10px;">ログデータ大量留保</td>
<td style="padding: 10px;">月次メンテで古いログ削除:<br><code>DELETE FROM access_logs WHERE created_at < NOW()-INTERVAL '3 months';</code></td>
</tr>
</table>

---

### 📞 緊急時の連絡先

<div style="background: #fef3c7; padding: 15px; border-radius: 8px;">

**🆘 システム障害時:**
1. Netlifyステータスを確認: https://www.netlifystatus.com/
2. Supabaseステータスを確認: https://status.supabase.com/
3. 開発者に連絡: [連絡先を記載]

**🔒 セキュリティインシデント:**
1. 直ちに全ユーザーのパスワードをリセット
2. アクセスログをエクスポートして保存
3. Supabaseサポートに連絡
4. 関係先企業に通知

</div>

---

## 🗓️ メンテナンスカレンダー

<div style="background: #e0f2fe; padding: 20px; border-radius: 8px;">

| 頻度 | タスク | 所要時間 |
|------|------|----------|
| **📅 毎週日曜** | バックアップ | 10分 |
| **📅 毎週月曜** | アクセスログ確認 | 5分 |
| **📊 月次** | 古いログ削除 | 10分 |
| **🔑 3ヶ月毎** | パスワード変更 | 5分 |
| **🛡️ 半年毎** | セキュリティ監査 | 30分 |

</div>

---

### 🗑️ 月次メンテナンス（古いログ削除）

```sql
-- 3ヶ月以上前のアクセスログを削除
DELETE FROM public.access_logs
WHERE created_at < NOW() - INTERVAL '3 months';

-- 1週間以上前のレート制限ログを削除
DELETE FROM public.rate_limits
WHERE created_at < NOW() - INTERVAL '7 days';
```

---

<div style="text-align: center; color: #6b7280; margin-top: 40px;">

**最終更新日**: 2026年3月1日 | **バージョン**: 1.0 | **運営**: [運営会社名を記載]

</div>
