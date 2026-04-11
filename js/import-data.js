// グローバル変数
let excelData = null;
let headers = [];
let mappedData = [];

// システムフィールド定義
const systemFields = [
    { key: 'occurred_at', label: '発生日時', required: true },
    { key: 'reporter_name', label: '報告者名', required: false },
    { key: 'location_text', label: '発生場所', required: true },
    { key: 'area_detail', label: 'エリア詳細', required: false },
    { key: 'vehicle_type', label: '車両種別', required: true },
    { key: 'vehicle_detail', label: '車両詳細（車番など）', required: false },
    { key: 'cargo_type', label: '荷物の種類', required: false },
    { key: 'cargo_info', label: '荷物情報', required: false },
    { key: 'what_happened', label: '詳しい状況を説明してください', required: true, note: 'この内容からAIが自動分類します' },
    { key: 'immediate_action', label: '即時対応', required: false },
    { key: 'prevention', label: '再発防止策', required: false },
    { key: 'severity', label: '重大度(1-5)', required: false, note: '未入力の場合AIが推測します' }
];

// 注意: 以下のフィールドは自動設定されます
// - report_type: 常に 'accident'（事故データ）
// - incident_type: AIが「詳しい状況」から推測（driving/loading）
// - categories: AIが「詳しい状況」から推測
// - accident_damage: 損傷個所以降の列を自動結合

// ページ初期化
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📋 インポートページ初期化開始');
    
    // XLSXライブラリの確認
    if (typeof XLSX === 'undefined') {
        console.error('❌ XLSXライブラリが読み込まれていません');
        alert('システムエラー: Excelライブラリの読み込みに失敗しました。\n\nページをリロード(Ctrl+F5)してください。');
        return;
    }
    console.log('✅ XLSXライブラリ確認完了');
    
    // Supabaseクライアント初期化を待つ
    if (typeof initializeApp === 'function') {
        try {
            await initializeApp();
            console.log('✅ Supabase初期化完了');
        } catch (error) {
            console.error('❌ Supabase初期化エラー:', error);
            alert('システムエラー: Supabaseの初期化に失敗しました。\n\nページをリロードしてください。');
            return;
        }
    }
    
    // Supabaseクライアント確認
    if (!window.supabaseClient) {
        console.error('❌ Supabaseクライアントが見つかりません');
        alert('システムエラー: データベース接続に失敗しました。\n\nページをリロードしてください。');
        return;
    }
    
    console.log('✅ Supabaseクライアント確認完了');
    
    // 認証チェック
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) {
        console.log('❌ 認証失敗: ログインページへリダイレクト');
        window.location.href = 'index.html';
        return;
    }
    
    const auth = getCurrentAuth();
    console.log('✅ 認証情報:', auth);
    
    if (!auth || (auth.role !== 'admin' && auth.role !== 'company_admin')) {
        alert('この機能は管理者のみ利用できます');
        window.location.href = 'dashboard.html';
        return;
    }
    
    // user-displayは存在しないため削除
    // document.getElementById('user-display').textContent = auth.email;
    
    // ドラッグ&ドロップ設定
    console.log('🔧 ドラッグ&ドロップ設定中...');
    setupDragAndDrop();
    
    // ファイル選択イベント
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
        console.log('✅ ファイル選択イベント設定完了');
    } else {
        console.error('❌ file-input要素が見つかりません');
    }
    
    console.log('✅ インポートページ初期化完了');
});

// ドラッグ&ドロップ設定
function setupDragAndDrop() {
    const uploadArea = document.getElementById('upload-area');
    
    if (!uploadArea) {
        console.error('❌ upload-area要素が見つかりません');
        return;
    }
    
    console.log('✅ upload-area要素確認完了');
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
        console.log('📋 ドラッグオーバー');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
        console.log('📋 ドラッグリーブ');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        console.log('📋 ドロップイベント発火');
        
        const files = e.dataTransfer.files;
        console.log('ドロップされたファイル数:', files.length);
        if (files.length > 0) {
            console.log('ファイル情報:', {
                name: files[0].name,
                size: files[0].size,
                type: files[0].type
            });
            handleFile(files[0]);
        } else {
            console.warn('⚠️ ドロップされたファイルがありません');
        }
    });
    
    console.log('✅ ドラッグ&ドロップイベント設定完了');
}

// ファイル選択ハンドラ
function handleFileSelect(e) {
    console.log('📁 ファイル選択イベント発火');
    const files = e.target.files;
    console.log('選択されたファイル数:', files.length);
    if (files.length > 0) {
        console.log('ファイル情報:', {
            name: files[0].name,
            size: files[0].size,
            type: files[0].type
        });
        handleFile(files[0]);
    } else {
        console.warn('⚠️ ファイルが選択されていません');
    }
}

// ファイル処理
async function handleFile(file) {
    console.log('🔄 ファイル処理開始:', file.name);
    
    const fileName = file.name;
    const fileExt = fileName.split('.').pop().toLowerCase();
    
    console.log('ファイル拡張子:', fileExt);
    
    if (!['xlsx', 'xls', 'csv'].includes(fileExt)) {
        console.error('❌ 対応していないファイル形式:', fileExt);
        alert('対応していないファイル形式です。Excel (.xlsx, .xls) または CSV (.csv) ファイルを選択してください。');
        return;
    }
    
    console.log('✅ ファイル形式チェックOK');
    
    try {
        console.log('📖 ファイル読み込み開始...');
        const data = await readFile(file);
        console.log('📖 ファイル読み込み完了。データ件数:', data ? data.length : 0);
        excelData = data;
        
        if (!data || data.length === 0) {
            alert('データが読み取れませんでした。ファイルを確認してください。');
            return;
        }
        
        headers = Object.keys(data[0]);
        
        // デバッグ: 読み込まれた列名をコンソールに表示
        console.log('===== 読み込まれた列名 =====');
        headers.forEach((header, index) => {
            console.log(`${index + 1}. ${header}`);
        });
        console.log('=========================');
        
        // ファイル情報表示
        document.getElementById('file-name').textContent = fileName;
        document.getElementById('row-count').textContent = data.length;
        document.getElementById('column-count').textContent = headers.length;
        document.getElementById('file-info').style.display = 'block';
        
        // ヘッダー名も表示
        const headerList = document.createElement('p');
        headerList.innerHTML = '<strong>検出された列名:</strong><br>' + headers.map((h, i) => `${i + 1}. ${h}`).join('<br>');
        headerList.style.fontSize = '12px';
        headerList.style.color = '#6c757d';
        headerList.style.marginTop = '10px';
        headerList.style.maxHeight = '150px';
        headerList.style.overflow = 'auto';
        headerList.style.padding = '10px';
        headerList.style.background = '#f8f9fa';
        headerList.style.borderRadius = '4px';
        const fileInfo = document.getElementById('file-info').querySelector('div');
        // 既存の列名表示を削除
        const existingHeaderList = fileInfo.querySelector('.header-list');
        if (existingHeaderList) {
            existingHeaderList.remove();
        }
        headerList.className = 'header-list';
        fileInfo.appendChild(headerList);
        
        // マッピングテーブル生成
        generateMappingTable();
        
        document.getElementById('mapping-section').style.display = 'block';
        
        console.log('✅ ファイル読み込み完了:', data.length, '件');
        
    } catch (error) {
        console.error('ファイル読み込みエラー:', error);
        alert('ファイルの読み込みに失敗しました: ' + error.message);
    }
}

// ファイル読み込み
function readFile(file) {
    return new Promise((resolve, reject) => {
        const fileName = file.name;
        const fileExt = fileName.split('.').pop().toLowerCase();
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                let workbook;
                
                if (fileExt === 'csv') {
                    // CSVの場合：テキストとして読み込み（文字化け対策）
                    const text = e.target.result;
                    console.log('📄 CSV読み込み（UTF-8）:', text.substring(0, 100));
                    workbook = XLSX.read(text, { type: 'string', raw: false });
                } else {
                    // Excel（.xlsx, .xls）の場合：バイナリで読み込み
                    const data = new Uint8Array(e.target.result);
                    workbook = XLSX.read(data, { type: 'array' });
                }
                
                // 最初のシートを取得
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // JSONに変換
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                console.log('✅ JSON変換完了:', jsonData.length, '件');
                if (jsonData.length > 0) {
                    console.log('サンプルデータ:', jsonData[0]);
                }
                
                resolve(jsonData);
            } catch (error) {
                console.error('❌ ファイル解析エラー:', error);
                reject(error);
            }
        };
        
        reader.onerror = () => {
            reject(new Error('ファイル読み込みエラー'));
        };
        
        // CSVの場合はテキストとして読み込み、それ以外はバイナリ
        if (fileExt === 'csv') {
            reader.readAsText(file, 'UTF-8');
        } else {
            reader.readAsArrayBuffer(file);
        }
    });
}

// マッピングテーブル生成
function generateMappingTable() {
    const tbody = document.getElementById('mapping-tbody');
    tbody.innerHTML = '';
    
    systemFields.forEach(field => {
        const tr = document.createElement('tr');
        
        // システムフィールド名
        const td1 = document.createElement('td');
        td1.innerHTML = `
            <strong>${field.label}</strong>
            ${field.required ? '<span style="color: red;">*</span>' : ''}
            <br>
            <small style="color: #6c757d;">${field.key}</small>
            ${field.note ? `<br><small style="color: #3498db;">ℹ️ ${field.note}</small>` : ''}
        `;
        
        // 選択ドロップダウン
        const td2 = document.createElement('td');
        const select = document.createElement('select');
        select.id = `map-${field.key}`;
        select.className = 'mapping-select';
        
        // オプション追加
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '-- 選択なし --';
        select.appendChild(defaultOption);
        
        headers.forEach(header => {
            const option = document.createElement('option');
            option.value = header;
            option.textContent = header;
            
            // 自動マッチング（簡易版）
            if (autoMatch(field.key, header)) {
                option.selected = true;
            }
            
            select.appendChild(option);
        });
        
        td2.appendChild(select);
        
        // プレビュー
        const td3 = document.createElement('td');
        td3.id = `preview-${field.key}`;
        td3.style.fontSize = '13px';
        td3.style.color = '#6c757d';
        td3.textContent = '-';
        
        // プレビュー更新
        select.addEventListener('change', () => {
            updatePreview(field.key);
        });
        
        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(td3);
        tbody.appendChild(tr);
    });
    
    // AI自動分類の説明を追加
    const infoRow = document.createElement('tr');
    infoRow.innerHTML = `
        <td colspan="3" style="background: #e7f3ff; padding: 15px; border-left: 4px solid #3498db;">
            <h4 style="margin: 0 0 10px 0;">🤖 AI自動分類について</h4>
            <ul style="margin: 0; padding-left: 20px;">
                <li><strong>報告種別</strong>: すべて「事故」として登録されます</li>
                <li><strong>事象カテゴリ</strong>: 「詳しい状況」から走行中/荷役中を自動判定</li>
                <li><strong>何が起きたか</strong>: 「詳しい状況」から具体的な事象を自動分類</li>
                <li><strong>重大度</strong>: 未入力の場合、「詳しい状況」から1〜5を自動推測</li>
                <li><strong>事故損害</strong>: 「損傷個所」以降の列を自動的にまとめて格納</li>
            </ul>
        </td>
    `;
    tbody.appendChild(infoRow);
    
    // 初期プレビュー更新
    systemFields.forEach(field => updatePreview(field.key));
}

// 自動マッチング（簡易版）
function autoMatch(systemKey, excelHeader) {
    const matchMap = {
        'occurred_at': ['発生日時', '日時', '発生日', '日付', 'date', 'occurred', '年月日'],
        'reporter_name': ['報告者', '氏名', '名前', 'reporter', 'name', '担当者'],
        'location_text': ['発生場所', '場所', '地点', 'location', 'place', '現場'],
        'area_detail': ['エリア', 'エリア詳細', 'area', '詳細場所'],
        'vehicle_type': ['車両種別', '車両', 'vehicle', '車種'],
        'vehicle_detail': ['車両詳細', '車番', 'vehicle_detail', 'ナンバー', '車両番号'],
        'cargo_type': ['荷物の種類', '荷物', 'cargo', '貨物', '品目'],
        'cargo_info': ['荷物情報', '荷物詳細', 'cargo_info', '貨物詳細'],
        'what_happened': ['詳しい状況', '状況を説明', '状況', '内容', '事象', '事故内容', '詳細', '説明'],
        'immediate_action': ['即時対応', '対応', 'action', '応急処置', '処置'],
        'prevention': ['再発防止', '防止策', 'prevention', '対策', '改善'],
        'severity': ['重大度', '重要度', 'severity', '深刻度']
    };
    
    const keywords = matchMap[systemKey] || [];
    const lowerHeader = excelHeader.toLowerCase();
    
    return keywords.some(keyword => 
        lowerHeader.includes(keyword.toLowerCase()) || 
        keyword.toLowerCase().includes(lowerHeader) ||
        excelHeader.includes(keyword)
    );
}

// プレビュー更新
function updatePreview(fieldKey) {
    const select = document.getElementById(`map-${fieldKey}`);
    const preview = document.getElementById(`preview-${fieldKey}`);
    const excelColumn = select.value;
    
    if (!excelColumn || !excelData || excelData.length === 0) {
        preview.textContent = '-';
        return;
    }
    
    let sampleValue = excelData[0][excelColumn];
    
    // 発生日時フィールドの場合、Excel日付を変換してプレビュー
    if (fieldKey === 'occurred_at' && sampleValue) {
        if (typeof sampleValue === 'number') {
            // Excel日付シリアル値を変換
            try {
                const date = XLSX.SSF.parse_date_code(sampleValue);
                sampleValue = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')} ${String(date.H).padStart(2, '0')}:${String(date.M).padStart(2, '0')}:00`;
            } catch (e) {
                console.warn('日付変換エラー:', sampleValue);
            }
        }
    }
    
    preview.textContent = sampleValue ? String(sampleValue).substring(0, 50) : '(空)';
}

// データプレビュー表示
function previewData() {
    const mapping = getMappingConfig();
    
    // マッピング検証
    const requiredFields = systemFields.filter(f => f.required);
    const missingFields = requiredFields.filter(f => !mapping[f.key]);
    
    if (missingFields.length > 0) {
        alert('必須フィールドのマッピングが不足しています:\n' + 
              missingFields.map(f => f.label).join(', '));
        return;
    }
    
    // プレビューデータ生成
    const previewData = excelData.slice(0, 10).map(row => {
        const mapped = {};
        Object.keys(mapping).forEach(key => {
            const excelCol = mapping[key];
            if (excelCol) {
                let value = row[excelCol];
                
                // 発生日時フィールドの場合、Excel日付を変換
                if (key === 'occurred_at' && typeof value === 'number') {
                    try {
                        const date = XLSX.SSF.parse_date_code(value);
                        value = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')} ${String(date.H).padStart(2, '0')}:${String(date.M).padStart(2, '0')}:00`;
                    } catch (e) {
                        console.warn('日付変換エラー:', value);
                    }
                }
                
                mapped[key] = value;
            }
        });
        return mapped;
    });
    
    // プレビューテーブル表示
    const table = document.getElementById('preview-table');
    table.innerHTML = '';
    
    // ヘッダー
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    Object.keys(mapping).forEach(key => {
        if (mapping[key]) {
            const th = document.createElement('th');
            const field = systemFields.find(f => f.key === key);
            th.textContent = field ? field.label : key;
            headerRow.appendChild(th);
        }
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // ボディ
    const tbody = document.createElement('tbody');
    previewData.forEach(row => {
        const tr = document.createElement('tr');
        Object.keys(mapping).forEach(key => {
            if (mapping[key]) {
                const td = document.createElement('td');
                td.textContent = row[key] || '-';
                tr.appendChild(td);
            }
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    
    document.getElementById('preview-section').style.display = 'block';
    
    // プレビューセクションまでスクロール
    document.getElementById('preview-section').scrollIntoView({ behavior: 'smooth' });
}

// マッピング設定取得
function getMappingConfig() {
    const mapping = {};
    systemFields.forEach(field => {
        const select = document.getElementById(`map-${field.key}`);
        if (select && select.value) {
            mapping[field.key] = select.value;
        }
    });
    return mapping;
}

// データインポート
async function importData() {
    if (!confirm(`${excelData.length} 件のデータをインポートします。よろしいですか？`)) {
        return;
    }
    
    const mapping = getMappingConfig();
    const auth = getCurrentAuth();
    
    console.log('=== データインポート開始 ===');
    console.log('件数:', excelData.length);
    console.log('マッピング:', mapping);
    
    const progressBar = document.getElementById('progress-bar');
    const progressFill = document.getElementById('progress-fill');
    const statusMessage = document.getElementById('status-message');
    
    progressBar.style.display = 'block';
    statusMessage.style.display = 'none';
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // バッチサイズ（Supabase レート制限: 10件/分）
    const BATCH_SIZE = 10;
    const BATCH_DELAY = 6000; // 6秒待機（10件/分 = 6秒/件のペース）
    const totalBatches = Math.ceil(excelData.length / BATCH_SIZE);
    
    console.log(`=== スマートバッチ処理開始 ===`);
    console.log(`総件数: ${excelData.length} 件`);
    console.log(`バッチ数: ${totalBatches} バッチ（各 ${BATCH_SIZE} 件まで）`);
    console.log(`推定所要時間: 約 ${Math.ceil(totalBatches * BATCH_DELAY / 1000)} 秒`);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIndex = batchIndex * BATCH_SIZE;
        const endIndex = Math.min(startIndex + BATCH_SIZE, excelData.length);
        const batchRows = excelData.slice(startIndex, endIndex);
        
        console.log(`\nバッチ ${batchIndex + 1}/${totalBatches}: 行 ${startIndex + 1}〜${endIndex}`);
        
        // バッチ内のデータを変換
        const batchIncidents = [];
        
        for (let i = 0; i < batchRows.length; i++) {
            const rowIndex = startIndex + i;
            const row = batchRows[i];
            
            try {
                // データ変換
                const incident = convertToIncident(row, mapping, auth);
                batchIncidents.push(incident);
            } catch (error) {
                console.error(`行 ${rowIndex + 1} の変換エラー:`, error);
                errors.push({ row: rowIndex + 1, error: error.message });
                errorCount++;
            }
        }
        
        // バッチ一括登録
        if (batchIncidents.length > 0) {
            try {
                const { data, error } = await window.supabaseClient
                    .from('incidents')
                    .insert(batchIncidents)
                    .select();
                
                if (error) {
                    throw error;
                }
                
                successCount += batchIncidents.length;
                console.log(`✅ バッチ ${batchIndex + 1} 成功: ${batchIncidents.length} 件`);
                
            } catch (error) {
                console.error(`❌ バッチ ${batchIndex + 1} 登録エラー:`, error);
                
                // エラーを記録
                for (let i = 0; i < batchIncidents.length; i++) {
                    const rowIndex = startIndex + i;
                    errorCount++;
                    errors.push({ row: rowIndex + 1, error: error.message });
                }
            }
        }
        
        // 進行状況更新
        const progress = Math.round((endIndex / excelData.length) * 100);
        progressFill.style.width = progress + '%';
        
        // 残り時間を計算
        const remainingBatches = totalBatches - batchIndex - 1;
        const remainingSeconds = Math.ceil(remainingBatches * BATCH_DELAY / 1000);
        
        if (remainingBatches > 0) {
            progressFill.textContent = `${progress}% (残り約 ${remainingSeconds} 秒)`;
        } else {
            progressFill.textContent = `${progress}%`;
        }
        
        // 次のバッチまで待機（最後のバッチ以外）
        if (batchIndex < totalBatches - 1) {
            console.log(`⏳ ${BATCH_DELAY / 1000} 秒待機中...`);
            await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
    }
    
    console.log('=== インポート完了 ===');
    console.log('成功:', successCount);
    console.log('失敗:', errorCount);
    
    // 結果表示
    statusMessage.className = 'status-message ' + (errorCount === 0 ? 'success' : 'error');
    statusMessage.innerHTML = `
        <h4>インポート完了</h4>
        <p>✅ 成功: ${successCount} 件</p>
        ${errorCount > 0 ? `<p>❌ 失敗: ${errorCount} 件</p>` : ''}
        ${errors.length > 0 ? `
            <details style="margin-top: 10px;">
                <summary>エラー詳細</summary>
                <ul style="margin-top: 10px;">
                    ${errors.slice(0, 20).map(e => `<li>行 ${e.row}: ${e.error}</li>`).join('')}
                    ${errors.length > 20 ? `<li>...他 ${errors.length - 20} 件</li>` : ''}
                </ul>
            </details>
        ` : ''}
        <p style="margin-top: 15px;">
            <a href="dashboard.html" class="btn btn-primary">ダッシュボードで確認</a>
        </p>
    `;
    statusMessage.style.display = 'block';
    
    statusMessage.scrollIntoView({ behavior: 'smooth' });
}

// Excelデータをincidentオブジェクトに変換
function convertToIncident(row, mapping, auth) {
    const incident = {
        company_id: auth.companyId || null,
        status: 'pending',
        report_type: 'accident'  // すべて事故データ
    };
    
    let situationText = '';  // 詳しい状況
    let damageFields = [];   // 損傷個所以降のフィールド
    
    // マッピングに従ってデータ変換
    Object.keys(mapping).forEach(key => {
        const excelCol = mapping[key];
        let value = row[excelCol];
        
        // 値の変換・正規化
        if (key === 'occurred_at') {
            // 日時フォーマット変換
            incident.occurred_at = parseDateTime(value);
        } else if (key === 'report_type') {
            // 報告種別は常に 'accident'
            incident.report_type = 'accident';
        } else if (key === 'what_happened') {
            // 詳しい状況を保存（後でAI分析）
            situationText = String(value || '');
            incident.memo = situationText;
        } else if (key === 'severity') {
            // 重大度を数値に変換
            incident.severity = parseSeverity(value);
        } else {
            // その他のフィールド
            incident[key] = value ? String(value) : null;
        }
    });
    
    // 損傷個所以降のフィールドを収集
    const allColumns = Object.keys(row);
    const mappedColumns = Object.values(mapping);
    
    allColumns.forEach(col => {
        // マッピングされていない列、または「損傷」を含む列
        if (!mappedColumns.includes(col) || col.includes('損傷') || col.includes('損害')) {
            const value = row[col];
            if (value) {
                damageFields.push(`${col}: ${value}`);
            }
        }
    });
    
    // 損傷情報をまとめて accident_damage に格納
    if (damageFields.length > 0) {
        incident.accident_damage = damageFields.join('\n');
    }
    
    // AI分析: 状況テキストから事象カテゴリと何が起きたかを推測
    if (situationText) {
        const analysis = analyzeIncidentText(situationText);
        incident.incident_type = analysis.incident_type;
        incident.categories = analysis.categories;
        
        // 重大度が未設定の場合、AI推測値を使用
        if (!incident.severity) {
            incident.severity = analysis.severity;
        }
    }
    
    // デフォルト値設定
    if (!incident.reporter_name) {
        incident.reporter_name = auth.email || '未入力';
    }
    
    if (!incident.vehicle_type) {
        incident.vehicle_type = 'その他';
    }
    
    if (!incident.incident_type) {
        incident.incident_type = 'driving';
    }
    
    if (!incident.categories || incident.categories.length === 0) {
        incident.categories = ['その他'];
    }
    
    return incident;
}

// AI分析: テキストから事象カテゴリと内容を推測
function analyzeIncidentText(text) {
    const lowerText = text.toLowerCase();
    
    // 事象カテゴリの判定
    let incident_type = 'driving';  // デフォルトは走行中
    
    const loadingKeywords = [
        '荷役', '積み込み', '積込', '荷降ろし', '荷下ろし', 'フォークリフト',
        '積載', '荷積み', '作業中', 'パレット', '荷物', '台車', '手作業',
        '倉庫', '搬入', '搬出', '積み上げ', 'リフト'
    ];
    
    if (loadingKeywords.some(kw => text.includes(kw))) {
        incident_type = 'loading';
    }
    
    // 何が起きたかの分類
    const categories = [];
    
    // 走行中の分類
    const drivingPatterns = {
        '接触・衝突': ['接触', '衝突', 'ぶつかり', 'ぶつけ', '当たり', '当て', 'こすり', '擦り'],
        'バック事故': ['バック', '後退', '後進', 'バックで'],
        '右左折事故': ['右折', '左折', '曲がり', 'カーブ'],
        '追突': ['追突', 'ブレーキが間に合わ'],
        '横転': ['横転', '転倒', 'ひっくり'],
        'すり抜け': ['すり抜け', '幅寄せ'],
        '巻き込み': ['巻き込み', '巻込'],
        'その他走行': ['走行', '運転', 'スピード', '速度']
    };
    
    // 荷役中の分類
    const loadingPatterns = {
        '荷崩れ': ['荷崩れ', '崩れ', '落下', '転落'],
        'フォーク接触': ['フォークリフト', 'フォーク', 'リフト'],
        '挟まれ': ['挟まれ', 'はさまれ', '挟み'],
        '転倒': ['転倒', '倒れ'],
        '切り傷': ['切り', '切れ', 'カット'],
        '打撲': ['打撲', 'ぶつけ', '打ち'],
        'その他荷役': ['積み', '降ろ', '運搬', '移動']
    };
    
    // パターンマッチング
    const patterns = incident_type === 'driving' ? drivingPatterns : loadingPatterns;
    
    for (const [category, keywords] of Object.entries(patterns)) {
        if (keywords.some(kw => text.includes(kw))) {
            categories.push(category);
        }
    }
    
    // 重大度の推測
    let severity = 3;  // デフォルトは中程度
    
    const highSeverityKeywords = ['重傷', '骨折', '入院', '救急', '死亡', '大破', '全損'];
    const mediumSeverityKeywords = ['軽傷', '打撲', 'かすり傷', '擦過傷', '凹み', '傷'];
    const lowSeverityKeywords = ['無傷', '怪我なし', 'ケガなし', 'ヒヤリ'];
    
    if (highSeverityKeywords.some(kw => text.includes(kw))) {
        severity = 5;
    } else if (mediumSeverityKeywords.some(kw => text.includes(kw))) {
        severity = 3;
    } else if (lowSeverityKeywords.some(kw => text.includes(kw))) {
        severity = 1;
    } else {
        // 損害額から推測
        const damageMatch = text.match(/(\d+)万円|(\d+)円/);
        if (damageMatch) {
            const amount = parseInt(damageMatch[1] || damageMatch[2]);
            if (amount > 100 || (damageMatch[1] && amount > 10)) {
                severity = 5;
            } else if (amount > 10) {
                severity = 4;
            }
        }
    }
    
    return {
        incident_type: incident_type,
        categories: categories.length > 0 ? categories : ['その他'],
        severity: severity
    };
}

// 日時パース
function parseDateTime(value) {
    if (!value) return new Date().toISOString();
    
    // Excel日付（シリアル値）の場合
    if (typeof value === 'number') {
        const date = XLSX.SSF.parse_date_code(value);
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')} ${String(date.H).padStart(2, '0')}:${String(date.M).padStart(2, '0')}:00`;
    }
    
    // 文字列の場合
    try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date.toISOString().replace('T', ' ').substring(0, 19);
        }
    } catch (e) {
        console.warn('日時パースエラー:', value);
    }
    
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

// 報告種別の正規化
function normalizeReportType(value) {
    if (!value) return 'hiyari';
    
    const str = String(value).toLowerCase();
    if (str.includes('事故') || str.includes('accident')) {
        return 'accident';
    }
    return 'hiyari';
}

// 事象カテゴリの正規化
function normalizeIncidentType(value) {
    if (!value) return 'driving';
    
    const str = String(value).toLowerCase();
    if (str.includes('荷役') || str.includes('作業') || str.includes('loading')) {
        return 'loading';
    }
    return 'driving';
}

// 重大度パース
function parseSeverity(value) {
    if (!value) return 3;
    
    if (typeof value === 'number') {
        return Math.max(1, Math.min(5, Math.round(value)));
    }
    
    const str = String(value);
    const match = str.match(/(\d+)/);
    if (match) {
        return Math.max(1, Math.min(5, parseInt(match[1])));
    }
    
    // ★の数をカウント
    const stars = (str.match(/★|☆/g) || []).length;
    if (stars > 0) {
        return Math.max(1, Math.min(5, stars));
    }
    
    return 3;
}

// リセット
function resetImport() {
    if (!confirm('インポート設定をリセットしますか？')) {
        return;
    }
    
    excelData = null;
    headers = [];
    mappedData = [];
    
    document.getElementById('file-input').value = '';
    document.getElementById('file-info').style.display = 'none';
    document.getElementById('mapping-section').style.display = 'none';
    document.getElementById('preview-section').style.display = 'none';
    document.getElementById('progress-bar').style.display = 'none';
    document.getElementById('status-message').style.display = 'none';
}
