# ヒヤリハットナビ

物流業界向けのヒヤリハット（ニアミス）報告・管理システムです。

**運営**: [NLP協同組合](https://nlp-coop.org/)  
**お問い合わせ**: [https://nlp-coop.org/contact/](https://nlp-coop.org/contact/)

---

## 🎯 システム概要

**ヒヤリハットナビ**は、NLP協同組合が運営する物流企業向けのヒヤリハット（ニアミス）報告・管理システムです。
企業がヒヤリハット事例を報告・共有し、事故を未然に防ぐためのWebアプリケーションです。

---

## 📚 ドキュメント一覧

### 🎯 新しいマニュアル（2026年3月1日追加）✨

| マニュアル | 対象 | 形式 | 内容 |
|-----------|------|------|------|
| [📘 DRIVER_MANUAL](DRIVER_MANUAL.html) | **ドライバー** | HTML / [MD](DRIVER_MANUAL.md) | ログイン、報告入力、修正依頼の送り方 |
| [📗 COMPANY_ADMIN_COMPLETE_GUIDE](COMPANY_ADMIN_COMPLETE_GUIDE.html) | **企業管理者** | HTML / [MD](COMPANY_ADMIN_COMPLETE_GUIDE.md) | ユーザー管理、報告管理、修正依頼対応 |
| [📙 QUICK_REFERENCE](QUICK_REFERENCE.html) | **全員** | HTML（印刷可） | ログイン情報、操作フロー、トラブル解決 |

**🌟 おすすめの使い方**:
- **印刷して配布**: QUICK_REFERENCE.html を印刷してドライバーに配布
- **オンライン閲覧**: HTML版をブラウザで開いて操作しながら確認
- **編集可能**: MD（Markdown）版をダウンロードしてカスタマイズ

### 📖 既存ドキュメント

| ドキュメント | 対象 | 内容 |
|-------------|------|------|
| [USER_MANUAL.md](USER_MANUAL.md) | **一般ユーザー** | ログイン、報告入力、ダッシュボード使い方 |
| [ADMIN_MANUAL.md](ADMIN_MANUAL.md) | **管理者** | 企業管理、バックアップ、トラブル対応 |
| [SECURITY_COMPLIANCE_REPORT.md](SECURITY_COMPLIANCE_REPORT.md) | **監査担当者** | セキュリティ評価、コンプライアンス |
| [URL_LIST.md](URL_LIST.md) | **全員** | 本番URL、管理画面、API、テストアカウント |
| [USER_MANAGEMENT_GUIDE.md](USER_MANAGEMENT_GUIDE.md) | **システム管理者** | ユーザー管理機能の使い方 |
| [USER_MANAGEMENT_COMPANY_ADMIN.md](USER_MANAGEMENT_COMPANY_ADMIN.md) | **企業管理者** | 自社ユーザー管理の使い方 |
| [COMPANY_ADMIN_GUIDE.md](COMPANY_ADMIN_GUIDE.md) | **企業管理者** | 報告編集機能の使い方 |

**📖 今すぐ読むべきマニュアル**:
- **ドライバー（初めての方）** → [📘 DRIVER_MANUAL.html](DRIVER_MANUAL.html) を開く
- **企業管理者（初めての方）** → [📗 COMPANY_ADMIN_COMPLETE_GUIDE.html](COMPANY_ADMIN_COMPLETE_GUIDE.html) を開く
- **クイックリファレンス** → [📙 QUICK_REFERENCE.html](QUICK_REFERENCE.html) を印刷して配布
- **システム管理者** → [ADMIN_MANUAL.md](ADMIN_MANUAL.md) を開く（毎週のバックアップ手順あり）

---

## ✨ 最新更新（2026年4月11日）

### 1. パスワード変更機能を実装 🔑 **NEW!**

すべてのユーザーが自分でパスワードを変更できる機能を追加しました。

**主な機能:**
- ✅ **パスワード変更画面**: 専用画面で安全にパスワード変更
- ✅ **セキュリティチェック**:
  - 現在のパスワードで再認証
  - 8文字以上の制限
  - 現在と同じパスワードは拒否
- ✅ **UX機能**:
  - パスワード強度表示（弱/中/強）
  - リアルタイムパスワード一致確認
  - 成功後3秒でダッシュボードにリダイレクト
- ✅ **アクセス方法**: 全ページのヘッダー右上に🔑ボタンを追加

**アクセス:**
- https://hiyari-hatto-system.vercel.app/change-password.html
- または、ヘッダーの🔑ボタンをクリック

**新規ファイル:**
- `change-password.html` - パスワード変更画面

**影響範囲:**
- `css/style.css` - パスワード変更ボタンスタイル追加
- `js/common-navigation.js` - 全ページに🔑ボタン自動追加

---

### 2. ナビゲーションメニューの統一 🧭

すべてのページでロール（権限）に応じた正しいナビゲーションメニューが表示されるようになりました。

**修正内容:**
- ✅ **8つの全ページでナビゲーション統一**: index.html, dashboard.html, analytics.html, admin.html, admin-reports.html, admin-users.html, import-data.html, admin-data-fix.html
- ✅ **ロール別の表示制御を実装**:
  - **admin（システム管理者）**: ①報告入力 ②ダッシュボード ③分析 ④企業管理 ⑤報告管理 ⑥ユーザー管理 ⑦データインポート ⑧データ修正 - **すべて表示**
  - **company_admin（企業管理者）**: ④企業管理と⑤報告管理を非表示 → ①②③⑥⑦⑧ を表示
  - **company_user（一般ユーザー）**: ①②③のみ表示
- ✅ **⑦⑧ページでログイン情報を表示**: import-data.html と admin-data-fix.html にユーザー情報パネルを追加
- ✅ **common-navigation.js を活用**: 統一されたナビゲーション管理ロジックですべてのページを制御

**影響範囲:**
- `index.html` - ナビゲーションHTMLのinline style削除
- `dashboard.html` - ナビゲーションHTMLのinline style削除
- `analytics.html` - ナビゲーションHTMLのinline style削除
- `admin.html` - 独自構造のため変更なし（全メニュー表示）
- `admin-reports.html` - ナビゲーションHTMLのinline style削除
- `admin-users.html` - ナビゲーションHTMLのinline style削除
- `import-data.html` - authCompleteイベントリスナー追加、ユーザー情報表示実装
- `admin-data-fix.html` - authCompleteイベントリスナー追加、ユーザー情報表示実装
- `js/common-navigation.js` - コメント改善（権限設定を明確化）

**以前の更新（2026年3月10日）**

### 1. ブランド名を「ヒヤリハットナビ」に変更 🎉 **NEW!**

**運営組織**: NLP協同組合（https://nlp-coop.org/）

**主な変更点:**
- ✅ アプリ名: 「ヒヤリハット報告システム」→「ヒヤリハットナビ」
- ✅ © 表記: 「© 2026 NLP協同組合. All rights reserved.」
- ✅ お問い合わせ: https://nlp-coop.org/contact/ （電話は受け付けていません）
- ✅ 利用規約・プライバシーポリシー: NLP協同組合運営に更新

### 2. ランディングページ登録機能

無料でヒヤリハットナビを始められるランディングページを提供しています。

**主な機能:**
- 📝 **無料登録フォーム**: 企業名・メールアドレス・電話番号を入力するだけで登録完了
- 🔐 **自動パスワード生成**: セキュアなパスワードを自動生成し、メールで送信
- 📧 **Supabase Auth 連携**: 認証メールを自動送信、メールアドレスがログインIDに
- 🖼️ **デモ体験**: 159件のサンプルデータで実際の画面を確認可能（デモアカウント: demo@example.com / demo123）
- 📱 **実際の画面紹介**: 報告入力画面・ダッシュボード・アナリティクスの機能を詳しく説明

**アクセス方法:**
- ランディングページ: https://hiyari-hatto-system.vercel.app/landing.html

**登録フロー:**
1. ランディングページで企業名・メールアドレス・電話番号を入力
2. 利用規約およびプライバシーポリシーに同意
3. 「いますぐ始める」ボタンをクリック
4. 自動生成されたパスワードが表示され、確認メールも送信される
5. メールアドレスとパスワードでログイン → システムを利用開始

**新規ファイル:**
- `landing.html` - ランディングページ（更新）
- `css/landing.css` - ランディングページスタイル（デモセクション追加）
- `js/landing.js` - 登録フォーム機能（Supabase Auth 連携）

**変更内容:**
- ❌ 削除: 実績統計（導入企業数・報告数・削減率）、料金プラン（無料のみ提供）、お客様の声、FAQ
- ➕ 追加: 写真付き報告機能の説明、デモアカウント情報、実際の画面紹介
- 🔄 変更: CTA文言を「完全無料」に修正、登録フォームをSupabase Auth対応

**⚠️ 注意事項:**
- Supabase Auth のメール送信機能を使用（確認メールが送信されます）
- パスワードは必ずメモしてください（再発行機能は今後実装予定）

---

### 2. AI一括データ修正機能を追加 🤖

AIを使用してデータの品質を自動的に改善する機能を追加しました。

**主な機能:**
- 🏪 **店舗名→住所変換**: 発生場所に店舗名が入っている場合、住所に変換（元の店舗名はエリア詳細に移動）
- 🔢 **重大度AI判定**: 重大度が未設定のレコードを、AIが内容から1-5で自動判定
- 📦 **荷物情報補完**: 荷物情報が空のレコードを、状況説明から推測して補完
- 📍 **事象カテゴリ判定**: 事象カテゴリが空のレコードを、内容から自動判定

**処理内容:**
- **88件**: 店舗名→住所変換が必要
- **12件**: 重大度が未設定
- **157件**: 荷物情報が空
- **1件**: 事象カテゴリが空

**アクセス方法:**
- 管理者向けページ: https://hiyari-hatto-system.vercel.app/admin-data-fix.html
- ダッシュボード → 「🔧 データ修正」

**権限:**
- システム管理者（admin）: すべてのデータを修正可能
- 企業管理者（company_admin）: 自社のデータのみ修正可能

**新規ファイル:**
- `admin-data-fix.html` - AI一括データ修正画面
- `js/admin-data-fix.js` - AI一括データ修正ロジック

**重大度判定基準:**
- **5（最重要）**: 死亡事故、重傷、重大な損害
- **4（重要）**: 入院レベルの怪我、高額な損害
- **3（中程度）**: 軽傷、中程度の損害
- **2（低）**: 軽微な接触、小さな損害
- **1（軽微）**: ヒヤリハット、損害なし

**⚠️ 注意事項:**
- 店舗名→住所変換は現在**模擬モード**です（実際の住所変換にはGoogle Places APIの設定が必要）
- 処理には数分かかる場合があります（Supabase APIのレート制限対応済み）
- バッチ処理で順次実行されます（10件ごとに6秒待機）

---

### 2. Excelデータインポート機能を追加 📥 **UPDATED!**

過去の事故データをExcelファイルから一括インポートできる機能を追加しました。

**主な機能:**
- ドラッグ&ドロップでExcelファイル（.xlsx/.xls）またはCSVをアップロード
- 自動列マッピング（手動調整可能）
- 最初の10件をプレビュー表示
- 進行状況バー付きで一括インポート
- Supabase APIレート制限対応（10件/分）

**対応フィールド:**
- 発生日時、報告者名、発生場所、エリア詳細
- 車両種別、車両詳細、荷物の種類、荷物情報
- 詳しい状況、即時対応、再発防止策、重大度

**AI自動処理:**
- 報告種別: 自動的に「事故」に設定
- 事象カテゴリ: 「詳しい状況」から自動判定（走行中/荷役・作業中）
- 何が起きたか: 内容から自動分類（接触・衝突・バック事故等）
- 事故損害: 損傷関連列を自動結合

**使用手順:**
1. ダッシュボード → 「📥 データインポート」
2. Excelファイルをアップロード
3. 列マッピングを確認・調整
4. プレビューで内容確認
5. 「✅ データをインポート」で一括登録

**実績:**
- 51件の過去事故データを成功インポート
- Supabaseレート制限エラーを解決（バッチ処理実装）

**新規ファイル:**
- `import-data.html` - データインポート画面
- `js/import-data.js` - データインポートロジック（AI分類機能付き）

---

### 3. ユーザー管理機能を追加 👥

システム管理者が**GUIで**ユーザーを管理できる機能を追加しました。**SQLは不要**です。

**主な機能:**
- 📋 企業ごとのユーザー一覧表示
- ⬆️ 一般ユーザー → 企業管理者に昇格（ボタン1クリック）
- ⬇️ 企業管理者 → 一般ユーザーに降格
- ➕ 新しいユーザーを追加（メール、パスワード、ロールを設定）
- ✏️ ユーザー情報の編集（氏名、ロール）
- 🗑️ ユーザーの削除（2回確認）

**アクセス方法:**
- **システム管理者**: 管理画面（admin.html）→ 「ユーザー管理」
- **企業管理者**: ダッシュボード（dashboard.html）→ 「ユーザー管理」
- 直接URL: https://hiyari-hatto-system.vercel.app/admin-users.html

**使い方:**
1. **システム管理者**: 企業を選択 → ユーザー一覧表示
2. **企業管理者**: 自動的に自社のユーザー一覧を表示
3. 「⬆️ 管理者に昇格」ボタンで即座にロール変更
4. または「✏️ 編集」で詳細を変更

**権限:**
- システム管理者（admin）: すべての企業のユーザーを管理可能
- 企業管理者（company_admin）: 自社のユーザーのみ管理可能

**メリット:**
- ✅ SQLの知識が不要
- ✅ ボタン1クリックで昇格・降格
- ✅ 視覚的にわかりやすい
- ✅ 誤操作を防げる（確認ダイアログ）

**新規ファイル:**
- `admin-users.html` - ユーザー管理画面
- `js/admin-users.js` - ユーザー管理ロジック（企業管理者は自社のみフィルタ）
- `css/admin-users.css` - ユーザー管理スタイル
- `USER_MANAGEMENT_GUIDE.md` - システム管理者向けガイド
- `USER_MANAGEMENT_COMPANY_ADMIN.md` - 企業管理者向けガイド

---

### 2. ユーザー情報表示機能を追加 🎉

全画面のヘッダー部に**ログイン中のユーザー情報**を表示する機能を追加しました。

**表示内容:**
- 企業名（または企業コード）
- メールアドレス
- ログアウトボタン（🚪アイコン）

**対応画面:**
- ✅ 報告入力画面（index.html）
- ✅ ダッシュボード（dashboard.html）
- ✅ 分析画面（analytics.html）
- ✅ 管理画面（admin.html）- 管理者メールアドレス表示

---

### 3. 企業管理者機能を追加 📝

ドライバーが入力した報告を**企業ごとの管理者**が編集できる機能を追加しました。

#### 👥 ロール（権限）の種類

| ロール | 説明 | 権限 |
|--------|------|------|
| **company_user** | ドライバー | 報告作成、自分の報告閲覧、修正依頼送信 |
| **company_admin** | 企業管理者 | **自社の報告**を閲覧・編集・削除、修正依頼対応 |
| **admin** | システム管理者 | **全企業の報告**を閲覧・編集、企業管理、匿名化データエクスポート |

#### 👨‍💼 企業管理者向け機能

- **新しい管理画面**: `admin-reports.html` - 自社の報告を閲覧・編集
  - ナビゲーションに **「📋 報告管理」** リンクが表示される
  - **自社の報告のみ**表示（他社の報告は見えません）
- **編集可能な項目**: 報告者名、発生日時、場所、報告種別、詳細情報、ステータス、管理者コメント
- **フィルター機能**: ステータス別・カテゴリ別に絞り込み
- **修正依頼の確認**: ドライバーからの修正依頼に **「🔴 修正依頼あり」** バッジが表示

#### 🚛 ドライバー向け機能

- **修正依頼ボタン**: ダッシュボードの報告詳細から修正依頼を送信可能
- **依頼内容の記入**: 何を修正してほしいか具体的に記入
- **依頼状態の確認**: 修正依頼済みの報告には「修正依頼送信済み」と表示

#### 🔄 修正依頼フロー

1. **ドライバー（company_user）**: ダッシュボード → 報告詳細 → 「修正依頼」セクションに内容記入 → 「📤 修正依頼を送信」
2. **企業管理者（company_admin）**: 「📋 報告管理」→ 🔴バッジの報告を確認 → 「✏️ 編集」→ 修正 → 「💾 保存」
3. 保存すると修正依頼バッジが自動的に消える

#### 🔧 企業管理者の作成方法

既存のユーザーを企業管理者に昇格：

```sql
-- 例: nlp-test@company.local を企業管理者にする
UPDATE public.profiles
SET role = 'company_admin'
WHERE email = 'nlp-test@company.local';

-- 確認
SELECT 
    c.company_name,
    c.company_code,
    p.email,
    p.role
FROM public.profiles p
JOIN public.companies c ON p.company_id = c.id
WHERE p.email = 'nlp-test@company.local';
```

#### 📊 データベース変更

**incidents テーブルに以下のカラムを追加:**
- `edit_request` (BOOLEAN): 修正依頼フラグ
- `edit_request_message` (TEXT): 修正依頼内容
- `edit_request_date` (TIMESTAMP): 修正依頼日時

**RLSポリシー追加:**
- 企業管理者は自社の報告のみ閲覧・編集可能
- システム管理者は全企業の報告を閲覧・編集可能

#### 📁 新規ファイル

- `admin-reports.html` - 報告管理画面（企業管理者・システム管理者用）
- `js/admin-reports.js` - 報告管理ロジック（企業フィルタリング機能付き）
- `css/admin-reports.css` - 報告管理スタイル
- `supabase-edit-request.sql` - テーブル拡張SQL
- `supabase-company-admin.sql` - 企業管理者作成用SQL
- `COMPANY_ADMIN_GUIDE.md` - 企業管理者向けガイド
- `REPORT_EDIT_GUIDE.md` - 報告編集機能ガイド

---

### 主要機能

#### 1. **マルチテナント対応**
- 企業ごとにデータを完全分離（Supabase RLS）
- JWT トークンベースの認証
- 企業管理者と一般ユーザーの権限管理

#### 2. **2段階報告フォーム**
- **Step1**: 基本情報（報告者、発生日時、場所、カテゴリ）
- **Step2**: 詳細情報（原因分析、対策、写真添付）
- GPS 位置情報の自動取得

#### 3. **管理画面・ダッシュボード**
- 報告一覧・詳細閲覧
- ステータス管理（未確認 → 確認済み → 対応完了）
- フィルタリング（ステータス・カテゴリ別）
- CSVエクスポート（39カラム、フィルタ適用可能）
- 管理者コメント機能

#### 4. **分析機能**
- カテゴリ別グラフ（Chart.js）
- 月次トレンド分析
- 地域別統計
- 重大度分布

#### 5. **セキュリティ機能**
- **Supabase Auth**: メール＋パスワード認証
- **RLS（Row Level Security）**: 企業別データ分離
- **Rate Limiting**: DoS攻撃対策（PostgreSQL Trigger）
  - 報告登録: 1分間に最大10件
  - 報告更新: 1分間に最大20件
  - 企業登録: 1時間に最大3件
- **パスワードハッシュ化**: Supabase Auth による自動暗号化

#### 6. **データ匿名化機能** ✨ NEW
- 個人・企業を特定できない形式でデータを提供
- 匿名化ビュー（`incidents_anonymized`）
- データ販売・第三者提供用
- 匿名化内容:
  - 企業名・企業コード → `Company_xxxxxxxx`
  - 報告者名 → `Reporter_xxxxxxxx`
  - GPS位置 → 都道府県レベル（例：`関東地方`）
  - 車両ID → `Vehicle_xxxxxx`
  - 日時 → 月単位に丸める
- 管理画面から CSV エクスポート可能

---

## 🚀 公開URL

### ✨ 本番環境（Vercel - 2026年3月2日より）

**新しいURL**: `https://hiyari-hatto-system.vercel.app`

#### ユーザー向けページ
- **ランディングページ**: https://hiyari-hatto-system.vercel.app/landing.html
- **企業登録**: https://hiyari-hatto-system.vercel.app/landing.html#register
- **ログイン**: https://hiyari-hatto-system.vercel.app/index.html
- **ダッシュボード**: https://hiyari-hatto-system.vercel.app/dashboard.html
- **分析画面**: https://hiyari-hatto-system.vercel.app/analytics.html

#### 管理者向けページ
- **企業管理画面**: https://hiyari-hatto-system.vercel.app/admin.html
- **報告管理**: https://hiyari-hatto-system.vercel.app/admin-reports.html
- **ユーザー管理**: https://hiyari-hatto-system.vercel.app/admin-users.html
- **データインポート**: https://hiyari-hatto-system.vercel.app/import-data.html
- **データ修正（AI）**: https://hiyari-hatto-system.vercel.app/admin-data-fix.html
- **アクセスログ監視**: https://hiyari-hatto-system.vercel.app/audit-logs.html

#### 法的文書
- **利用規約**: https://hiyari-hatto-system.vercel.app/terms-of-service.html
- **プライバシーポリシー**: https://hiyari-hatto-system.vercel.app/privacy-policy.html

### 📝 移行履歴
- **旧環境（Netlify）**: `https://stellular-profiterole-2ff0a2.netlify.app` - 帯域幅制限により停止（2026年3月2日）
- **新環境（Vercel）**: `https://hiyari-hatto-system.vercel.app` - 2026年3月2日より稼働中

---

## 🔐 テストアカウント

### 一般企業ユーザー

| 企業コード | メールアドレス | パスワード | 企業名 | 報告件数 |
|-----------|--------------|----------|--------|---------|
| `nlp-test` | nlp-test@company.local | `nlp2026` | NLP物流株式会社 | 5件 |
| `1111-company` | 1111-company@company.local | `1111` | 1111株式会社 | 1件 |
| `abc-logistics` | abc-logistics@company.local | `abc2026` | ABC物流株式会社 | 0件 |
| `xyz-transport` | xyz-transport@company.local | `xyz2026` | XYZ運送株式会社 | 0件 |

### 管理者アカウント

| メールアドレス | パスワード |
|--------------|----------|
| `akari-imai@tehara.co.jp` | `tehara0425` |

---

## 📊 データベース構成

### Supabase テーブル

#### 1. `auth.users`
- Supabase Auth が管理するユーザーテーブル
- `raw_user_meta_data` に `company_id` を格納（JWT トークンに含まれる）

#### 2. `public.profiles`
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  role TEXT NOT NULL DEFAULT 'company_user',
  company_id UUID REFERENCES public.companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. `public.companies`
```sql
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_code TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  industry TEXT,
  plan TEXT DEFAULT 'free',
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. `public.incidents`
- ヒヤリハット報告データ（39カラム）
- `company_id` で企業を識別
- RLS により `company_id` に基づいてアクセス制限

#### 5. `public.access_logs`
```sql
CREATE TABLE public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_code TEXT NOT NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 6. `public.rate_limits` ✨ NEW
```sql
CREATE TABLE public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 7. `public.incidents_anonymized` ✨ NEW
- ビュー（View）として実装
- 個人・企業情報を自動匿名化
- データ販売・第三者提供用

### RLS ポリシー

| テーブル | ポリシー | 条件 |
|---------|---------|-----|
| `companies` | SELECT | すべてのユーザー |
| `companies` | INSERT/UPDATE/DELETE | 管理者のみ |
| `incidents` | SELECT | 自社データのみ、または管理者 |
| `incidents` | INSERT | 自社データのみ |
| `incidents` | UPDATE | 自社データのみ、または管理者 |
| `incidents` | DELETE | 自社データのみ、または管理者 |
| `profiles` | SELECT | 全ユーザー |
| `profiles` | UPDATE | 自分のプロフィールのみ |
| `access_logs` | SELECT | 管理者のみ |
| `access_logs` | INSERT | 認証済みユーザー |
| `rate_limits` | SELECT | 管理者のみ |

---

## 🛠️ 技術スタック

### フロントエンド
- HTML5 / CSS3 / JavaScript (ES6+)
- Chart.js（グラフ描画）
- Google Fonts (Noto Sans JP)
- Responsive Design

### バックエンド
- **Supabase** (PostgreSQL + Authentication + Realtime + Storage)
- **Supabase RLS** (Row Level Security)
- **PostgreSQL Triggers** (レート制限)
- **PostgreSQL Views** (匿名化データ)

### ホスティング
- **Netlify** (静的サイトホスティング)
- **Supabase** (データベース・認証)

---

## 📁 プロジェクト構成

```
.
├── index.html                  # 報告入力フォーム（ログイン画面兼用）
├── dashboard.html              # ダッシュボード（報告一覧）
├── analytics.html              # 分析画面（グラフ・統計）
├── admin.html                  # 企業管理画面（管理者専用）
├── admin-reports.html          # 報告管理画面（企業管理者・システム管理者専用）
├── admin-users.html            # ユーザー管理画面（管理者専用）
├── import-data.html            # データインポート画面（管理者専用）✨ NEW
├── admin-data-fix.html         # AI一括データ修正画面（管理者専用）✨ NEW
├── audit-logs.html             # アクセスログ監視（管理者専用）
├── landing.html                # ランディングページ（企業登録）
├── terms-of-service.html       # 利用規約
├── privacy-policy.html         # プライバシーポリシー
├── css/
│   ├── style.css              # 共通スタイル
│   ├── dashboard.css          # ダッシュボード用スタイル
│   ├── analytics.css          # 分析画面用スタイル
│   ├── admin.css              # 管理画面用スタイル
│   ├── admin-reports.css      # 報告管理用スタイル
│   ├── admin-users.css        # ユーザー管理用スタイル
│   └── landing.css            # ランディングページ用スタイル
├── js/
│   ├── config.js              # Supabase 接続設定
│   ├── auth-supabase.js       # Supabase Auth 認証処理
│   ├── main.js                # 報告入力フォーム
│   ├── dashboard.js           # ダッシュボード機能
│   ├── analytics.js           # 分析機能
│   ├── admin.js               # 企業管理機能
│   ├── admin-reports.js       # 報告管理機能
│   ├── admin-users.js         # ユーザー管理機能
│   ├── import-data.js         # データインポート機能 ✨ NEW
│   ├── admin-data-fix.js      # AI一括データ修正機能 ✨ NEW
│   └── audit-logs.js          # アクセスログ表示
├── supabase-schema.sql        # データベーススキーマ
├── supabase-multitenancy-setup.sql  # マルチテナント設定
├── supabase-audit-log.sql     # アクセスログ設定
├── supabase-edit-request.sql  # 修正依頼機能設定
├── supabase-company-admin.sql # 企業管理者作成用SQL
└── README.md                  # このファイル
```

---

## 🔒 セキュリティ対策

### 実装済み
1. ✅ **Supabase Auth**（メール＋パスワード認証）
2. ✅ **RLS（Row Level Security）**（企業別データ分離）
3. ✅ **JWT トークンベース認証**（`company_id` を含む）
4. ✅ **Rate Limiting**（DoS攻撃対策）
5. ✅ **パスワードハッシュ化**（Supabase Auth）
6. ✅ **HTTPS 強制**（Vercel）
7. ✅ **アクセスログ監視**
8. ✅ **データ匿名化機能**（個人情報保護）

### 今後の対応
- ⏳ **自動バックアップ・PITR**（Point-in-Time Recovery）
- ⏳ **Email 通知機能**（EmailJS または Supabase Functions）
- ⏳ **2要素認証（2FA）**
- ⏳ **GDPR対応**（EU圏からのアクセスがある場合）

---

## 📜 法的文書

### 利用規約（terms-of-service.html）
- データの二次利用（匿名化後の販売・提供）について明記
- データ閲覧サービスの料金設定権限
- 退会時のデータ取扱い（個別データは30日以内に削除、匿名化データは保持）

### プライバシーポリシー（privacy-policy.html）
- 個人情報の収集項目と利用目的
- 第三者提供の条件（匿名化データのみ）
- データ保存期間（報告から3年、自動削除）
- Cookie・ローカルストレージの使用について

---

## 📈 データビジネス対応

### データ販売・提供の流れ

1. **データ収集**: 企業が報告を入力
2. **匿名化処理**: `incidents_anonymized` ビューで自動匿名化
   - 企業名・報告者名 → ハッシュ化
   - GPS位置 → 都道府県レベル
   - 日時 → 月単位に丸める
3. **データ提供**: 管理画面から CSV エクスポート
4. **販売**: 第三者（研究機関、データ分析会社等）に提供

### 匿名化データの用途
- 業界別・地域別のヒヤリハット統計データ
- 事故・ヒヤリハット傾向分析レポート
- リスク予測モデル・AI トレーニングデータ
- 学術研究機関・公的機関への研究用データ提供

---

## 🚀 デプロイ手順

### Netlify へのデプロイ

1. プロジェクトファイルをダウンロード（ZIP形式）
2. https://app.netlify.com にログイン
3. サイト **stellular-profiterole-2ff0a2** を選択
4. **Deploys** タブを開く
5. フォルダをドラッグ&ドロップ
6. 緑の **Published** が表示されるまで待つ（2-3分）

---

## 📋 運用ガイド

### 新規企業登録

**方法1: ランディングページから**
1. https://stellular-profiterole-2ff0a2.netlify.app/landing.html にアクセス
2. 企業情報を入力して登録

**方法2: 管理画面から**
1. 管理画面にログイン（`akari-imai@tehara.co.jp` / `tehara0425`）
2. **➕ 新しい企業を追加** ボタンをクリック
3. 企業情報とパスワードを入力

### CSV エクスポート（通常データ）

1. ダッシュボードにログイン
2. フィルタを設定（オプション）
3. **📥 CSVエクスポート** ボタンをクリック
4. ダウンロードされる CSV ファイル（39カラム）

### CSV エクスポート（匿名化データ）✨ NEW

1. 管理画面にログイン（`akari-imai@tehara.co.jp` / `tehara0425`）
2. **📊 匿名化データをエクスポート** ボタンをクリック
3. ダウンロードされる CSV ファイル（15カラム、匿名化済み）

### CSV 出力項目（匿名化データ）

| カラム | 内容 | 匿名化 |
|-------|------|--------|
| ID | レコードID | - |
| 企業コード（匿名） | `Company_xxxxxxxx` | ✅ |
| 報告者名（匿名） | `Reporter_xxxxxxxx` | ✅ |
| 発生月 | `2026-02` 形式 | ✅（月単位） |
| 地域 | `関東地方` など | ✅（都道府県レベル） |
| 報告種別 | `hiyari` / `accident` | - |
| インシデント種別 | カテゴリ名 | - |
| カテゴリ | 複数カテゴリ | - |
| メモ | 報告内容 | - |
| 重大度 | 1-5 | - |
| 直接原因 | 原因リスト | - |
| 対応策 | 実施した対策 | - |
| 予防策 | 今後の予防策 | - |
| ステータス | `confirmed` 等 | - |
| 車両ID（匿名） | `Vehicle_xxxxxx` | ✅ |

---

## 🐛 トラブルシューティング

### Q1. ログインできない
- **原因**: パスワードが間違っている、またはユーザーが存在しない
- **対処**: 
  - 管理画面で企業が登録されているか確認
  - パスワードを再設定（管理者に依頼）

### Q2. ダッシュボードにデータが表示されない
- **原因**: 認証情報が取得できていない、または RLS エラー
- **対処**: 
  - ブラウザのコンソール（F12）を開いてエラーを確認
  - ページをリロード
  - ログアウト→再ログイン

### Q3. CSV エクスポートができない
- **原因**: データが0件、またはフィルタが厳しすぎる
- **対処**: 
  - フィルタを「すべて」に戻す
  - コンソールでエラーを確認

### Q4. レート制限エラーが出る
- **原因**: 短時間に大量のリクエストを送信した
- **対処**: 
  - 1分間待ってから再試行
  - 管理者に連絡してログを確認

### Q5. 匿名化データが取得できない
- **原因**: ステータスが `confirmed` 等でない報告が多い
- **対処**: 
  - ダッシュボードで報告のステータスを更新
  - SQL で直接 `incidents_anonymized` ビューを確認

---

## 📝 変更履歴

### 2026-04-11
- ✅ **全ページでナビゲーションメニューを統一**（ロール別に表示制御）
- ✅ **全ページでヘッダーレイアウトを統一**（左寄せ配置、一貫性向上）
- ✅ **パスワード変更機能を実装**（🔑ボタンで全ページからアクセス可能）
- ✅ **企業管理画面に🔑パスワード変更ボタンを追加**
- ✅ **データインポート・データ修正画面のユーザー情報表示を修正**

### 2026-03-03
- ✅ **AI一括データ修正機能を実装**（店舗名→住所、重大度判定、荷物情報補完、カテゴリ判定）
- ✅ **Excelデータインポート機能を実装**（過去データ一括登録、AI自動分類）
- ✅ **Supabase レート制限対応**（バッチ処理実装、10件/6秒ペース）
- ✅ **データ品質チェック機能を実装**（統計情報表示、修正対象の自動抽出）

### 2026-03-01
- ✅ **レート制限機能を実装**（PostgreSQL Trigger）
- ✅ **データ匿名化機能を実装**（PostgreSQL View）
- ✅ **管理画面に匿名化データエクスポート機能を追加**

### 2026-02-28
- ✅ Supabase Auth に管理者認証を移行
- ✅ 企業ユーザーを Supabase Auth に移行
- ✅ RLS ポリシーを JWT トークンベースに変更
- ✅ 利用規約・プライバシーポリシーをデータビジネス対応

### 2026-02-27
- ✅ CSV エクスポート機能にフィルタ対応
- ✅ アクセスログ監視機能を実装

### 2026-02-26
- ✅ マルチテナント対応完了
- ✅ 企業管理画面を実装

---

## 🎯 次のステップ

### Phase 1: セキュリティ・法的基盤（完了分）
1. ✅ Supabase Auth 移行
2. ✅ RLS 強化（JWT トークンベース）
3. ✅ 利用規約・プライバシーポリシー整備
4. ✅ Rate Limiting 実装
5. ✅ データ匿名化機能実装

### Phase 1: セキュリティ・法的基盤（残り）
- ⏳ 自動バックアップ・PITR 有効化

### Phase 2: スケーラビリティ・運用
- ⏳ Email 通知機能（EmailJS / Supabase Functions）
- ⏳ 監視ダッシュボード（エラーレート、パフォーマンス）
- ⏳ Stripe 決済統合（有料プラン）
- ⏳ データ販売用 API 設計

### Phase 3: UI/UX・マーケティング
- ⏳ ランディングページ最適化
- ⏳ PWA 対応（モバイルアプリ化）
- ⏳ SEO・OGP 設定

---

## 📞 サポート

- **運営会社**: [運営会社名を記載]
- **サポートメール**: [サポートメールアドレスを記載]
- **公式サイト**: https://hiyari-hatto-system.vercel.app

---

## 📄 ライセンス

© 2026 [運営会社名]. All rights reserved.
