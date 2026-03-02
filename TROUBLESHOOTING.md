# カテゴリ選択機能 - トラブルシューティングガイド

## 🔍 デバッグ方法

### 1. デバッグページで確認
`debug-category.html` を開いてください。
- カテゴリ配列が正しく表示されるか
- ボタンをクリックでカテゴリが表示されるか
- 複数選択できるか

### 2. ブラウザコンソールで確認

F12キーを押してデベロッパーツールを開き、Consoleタブで以下を確認:

```javascript
// カテゴリ配列の確認
DRIVING_CATEGORIES
LOADING_CATEGORIES

// 関数の確認
selectCategory
updateWhatHappenedOptions

// 要素の確認
document.getElementById('what-category-buttons')
document.getElementById('what-category-group')
```

### 3. 実際の動作確認

1. `index.html`を開く
2. 「ヒヤリハット」を選択
3. 発生日時、報告者、場所を入力
4. 「🚛 走行中」ボタンをクリック
5. **8個のカテゴリボタンが表示されるはず**

## ✅ 実装内容

### 修正したファイル

1. **js/config.js**
   - カテゴリ配列を更新
   - `window.DRIVING_CATEGORIES`として明示的にグローバル化

2. **js/main.js**
   - `selectCategory()`関数
   - `updateWhatHappenedOptions()`関数
   - `updateWhatCategoryValue()`関数
   - `window.selectCategory`として明示的にグローバル化
   - DOMContentLoadedでデバッグログ追加

3. **index.html**
   - カテゴリボタンコンテナ追加
   - 補足メモ欄追加

4. **css/style.css**
   - `.category-button-grid`スタイル
   - `.category-select-btn`スタイル
   - レスポンシブ対応

## 🚨 よくある問題と解決方法

### 問題1: ボタンをクリックしても何も起きない

**原因**: JavaScriptが読み込まれていない、またはエラーが発生

**解決方法**:
1. F12でコンソールを開く
2. エラーメッセージを確認
3. `selectCategory`が定義されているか確認:
   ```javascript
   typeof selectCategory
   // "function"と表示されればOK
   ```

### 問題2: カテゴリボタンが表示されない

**原因**: 要素が見つからない、またはCSSで非表示

**解決方法**:
1. 要素の存在確認:
   ```javascript
   document.getElementById('what-category-buttons')
   ```
2. 表示状態確認:
   ```javascript
   document.getElementById('what-category-group').style.display
   // "block"になっているはずです
   ```

### 問題3: カテゴリ配列が空

**原因**: config.jsが読み込まれていない

**解決方法**:
1. HTMLで`<script src="js/config.js"></script>`が`main.js`の前にあるか確認
2. コンソールで確認:
   ```javascript
   DRIVING_CATEGORIES
   // 配列が表示されればOK
   ```

## 🔧 強制リロード方法

キャッシュが原因の場合があります:

- **Windows/Linux**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`
- **または**: デベロッパーツールを開いた状態でリロードボタンを右クリック → 「キャッシュの消去とハード再読み込み」

## 📝 手動テスト手順

1. ブラウザで`index.html`を開く
2. F12でコンソールを開く
3. 以下を順番に実行:

```javascript
// 1. カテゴリ配列の確認
console.log('走行中:', DRIVING_CATEGORIES);
console.log('荷役中:', LOADING_CATEGORIES);

// 2. 手動でカテゴリ選択を実行
selectCategory('driving');

// 3. ボタンが表示されたか確認
console.log('ボタン数:', document.querySelectorAll('.category-select-btn').length);
// 8と表示されればOK

// 4. 表示状態の確認
console.log('表示:', document.getElementById('what-category-group').style.display);
// "block"と表示されればOK
```

## 🎯 期待される動作

### 走行中を選択した場合
8個のボタンが表示:
1. 急ブレーキ・急ハンドル
2. 車両との接触寸前
3. 歩行者・自転車との接触寸前
4. 見落とし・確認ミス
5. バック・方向転換時のニアミス
6. 車線変更・合流ヒヤリ
7. 踏切・交差点ヒヤリ
8. その他

### 荷役中を選択した場合
6個のボタンが表示:
1. 荷崩れ・落下寸前
2. 転倒・つまずき・滑り
3. 挟まれ・巻き込まれ寸前
4. 機材との接触
5. 荷物の破損寸前
6. その他

### ボタンクリック時
- クリックで青色にハイライト
- もう一度クリックで解除
- 複数選択可能
- 選択内容がカンマ区切りで保存

## 📤 Netlifyデプロイ後の確認

1. 全ファイルをアップロード
2. ブラウザのキャッシュをクリア
3. サイトにアクセス
4. Ctrl+Shift+Rで強制リロード
5. 動作確認

## 💡 それでも動かない場合

以下の情報を提供してください:
1. ブラウザのコンソールに表示されるエラー
2. `typeof selectCategory`の結果
3. `DRIVING_CATEGORIES`の結果
4. ボタンをクリックした後のコンソールログ

これらの情報で問題を特定できます。
