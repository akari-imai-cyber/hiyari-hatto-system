// AI一括データ修正機能
console.log('🔧 AI一括データ修正ページ初期化');

// グローバル変数
let currentUser = null;
let fixStats = {
    stores: 0,
    severity: 0,
    cargo: 0,
    category: 0
};

// ページ初期化
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📊 データ修正ページ読み込み開始');
    
    try {
        // Supabase初期化確認
        if (typeof window.supabaseClient === 'undefined') {
            await window.initializeApp();
        }

        // 認証チェック
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) {
            alert('ログインが必要です');
            window.location.href = 'login.html';
            return;
        }

        currentUser = session.user;

        // ユーザー情報取得
        const { data: profile } = await window.supabaseClient
            .from('users')
            .select('role, company_id, companies(name)')
            .eq('id', session.user.id)
            .single();

        if (!profile) {
            alert('ユーザー情報の取得に失敗しました');
            return;
        }

        // 管理者権限チェック
        if (profile.role !== 'admin' && profile.role !== 'company_admin') {
            alert('この機能は管理者のみ利用できます');
            window.location.href = 'dashboard.html';
            return;
        }

        // ユーザー情報表示
        document.getElementById('user-email').textContent = session.user.email;
        if (profile.companies) {
            document.getElementById('company-name').textContent = profile.companies.name;
        }

        // ナビゲーション表示制御
        if (profile.role === 'admin') {
            document.getElementById('admin-link').style.display = 'inline-block';
            document.getElementById('admin-reports-link').style.display = 'inline-block';
            document.getElementById('admin-users-link').style.display = 'inline-block';
            document.getElementById('import-data-link').style.display = 'inline-block';
            document.getElementById('data-fix-link').style.display = 'inline-block';
        } else if (profile.role === 'company_admin') {
            document.getElementById('admin-reports-link').style.display = 'inline-block';
            document.getElementById('admin-users-link').style.display = 'inline-block';
            document.getElementById('import-data-link').style.display = 'inline-block';
            document.getElementById('data-fix-link').style.display = 'inline-block';
        }

        // 統計情報を取得
        await loadStats();

        console.log('✅ データ修正ページ初期化完了');
    } catch (error) {
        console.error('❌ 初期化エラー:', error);
        alert('初期化に失敗しました: ' + error.message);
    }
});

// 統計情報を取得
async function loadStats() {
    console.log('📊 統計情報取得開始');

    try {
        // 店舗名チェック（住所っぽくない）
        const { count: storeCount } = await window.supabaseClient
            .from('incidents')
            .select('*', { count: 'exact', head: true })
            .not('location_text', 'like', '%県%')
            .not('location_text', 'like', '%市%')
            .not('location_text', 'like', '%区%')
            .not('location_text', 'like', '%町%')
            .not('location_text', 'like', '%丁目%')
            .not('location_text', 'is', null)
            .neq('location_text', '');

        // 重大度NULL
        const { count: severityCount } = await window.supabaseClient
            .from('incidents')
            .select('*', { count: 'exact', head: true })
            .or('severity.is.null,severity.eq.0');

        // 荷物情報NULL
        const { count: cargoCount } = await window.supabaseClient
            .from('incidents')
            .select('*', { count: 'exact', head: true })
            .or('cargo_info.is.null,cargo_info.eq.');

        // 事象カテゴリ空
        const { count: categoryCount } = await window.supabaseClient
            .from('incidents')
            .select('*', { count: 'exact', head: true })
            .or('incident_type.is.null,incident_type.eq.');

        // 統計を更新
        fixStats = {
            stores: storeCount || 0,
            severity: severityCount || 0,
            cargo: cargoCount || 0,
            category: categoryCount || 0
        };

        // UI更新
        document.getElementById('stat-stores').textContent = fixStats.stores;
        document.getElementById('stat-severity').textContent = fixStats.severity;
        document.getElementById('stat-cargo').textContent = fixStats.cargo;
        document.getElementById('stat-category').textContent = fixStats.category;

        document.getElementById('badge-stores').textContent = `${fixStats.stores}件`;
        document.getElementById('badge-severity').textContent = `${fixStats.severity}件`;
        document.getElementById('badge-cargo').textContent = `${fixStats.cargo}件`;
        document.getElementById('badge-category').textContent = `${fixStats.category}件`;

        console.log('✅ 統計情報取得完了:', fixStats);
    } catch (error) {
        console.error('❌ 統計情報取得エラー:', error);
        alert('統計情報の取得に失敗しました');
    }
}

// ログ追加関数
function addLog(containerId, message, type = 'info') {
    const logContainer = document.getElementById(containerId);
    logContainer.style.display = 'block';
    
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    const timestamp = new Date().toLocaleTimeString('ja-JP');
    logEntry.textContent = `[${timestamp}] ${message}`;
    
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

// プログレスバー更新
function updateProgress(prefix, current, total) {
    const percentage = Math.round((current / total) * 100);
    const fillElement = document.getElementById(`progress-fill-${prefix}`);
    const infoElement = document.getElementById(`progress-info-${prefix}`);
    
    fillElement.style.width = `${percentage}%`;
    fillElement.textContent = `${percentage}%`;
    infoElement.textContent = `処理中: ${current} / ${total} 件`;
}

// 結果表示
function showResult(containerId, success, message, details = null) {
    const resultContainer = document.getElementById(containerId);
    resultContainer.style.display = 'block';
    resultContainer.className = `result-container ${success ? 'result-success' : 'result-error'}`;
    
    let html = `<strong>${success ? '✅ 成功' : '❌ エラー'}</strong>: ${message}`;
    if (details) {
        html += `<div class="result-details">${details}</div>`;
    }
    
    resultContainer.innerHTML = html;
}

// 1. 店舗名→住所変換（模擬モード）
async function fixStoreNames() {
    console.log('🏪 店舗名→住所変換開始');
    
    const button = event.target;
    button.disabled = true;
    
    const progressContainer = document.getElementById('progress-stores');
    progressContainer.style.display = 'block';
    
    const logContainer = document.getElementById('log-stores');
    logContainer.innerHTML = '';
    logContainer.style.display = 'block';
    
    try {
        // 対象データ取得
        const { data: incidents, error } = await window.supabaseClient
            .from('incidents')
            .select('*')
            .not('location_text', 'like', '%県%')
            .not('location_text', 'like', '%市%')
            .not('location_text', 'like', '%区%')
            .not('location_text', 'like', '%町%')
            .not('location_text', 'like', '%丁目%')
            .not('location_text', 'is', null)
            .neq('location_text', '');

        if (error) throw error;

        if (incidents.length === 0) {
            showResult('result-stores', true, '修正対象のデータがありません');
            button.disabled = false;
            return;
        }

        addLog('log-stores', `対象データ: ${incidents.length}件`, 'info');

        let successCount = 0;
        let errorCount = 0;

        // 1件ずつ処理（模擬モード）
        for (let i = 0; i < incidents.length; i++) {
            const incident = incidents[i];
            updateProgress('stores', i + 1, incidents.length);

            try {
                // 模擬的な住所変換（実際にはGoogle Places APIを使用）
                const storeName = incident.location_text;
                const mockAddress = `${storeName}の住所（模擬データ）`;
                
                // データベース更新
                const { error: updateError } = await window.supabaseClient
                    .from('incidents')
                    .update({
                        location_text: mockAddress,
                        area_detail: incident.area_detail 
                            ? `${incident.area_detail} | ${storeName}` 
                            : storeName
                    })
                    .eq('id', incident.id);

                if (updateError) throw updateError;

                successCount++;
                addLog('log-stores', `✓ ${storeName} → ${mockAddress}`, 'success');

            } catch (err) {
                errorCount++;
                addLog('log-stores', `✗ ID:${incident.id} エラー: ${err.message}`, 'error');
            }

            // API制限回避（1件ごとに200ms待機）
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // 結果表示
        showResult(
            'result-stores', 
            errorCount === 0,
            `処理完了`,
            `成功: ${successCount}件、失敗: ${errorCount}件<br><br><strong>⚠️ 注意: これは模擬モードです。実際の住所変換にはGoogle Places APIの設定が必要です。</strong>`
        );

        // 統計再読み込み
        await loadStats();

    } catch (error) {
        console.error('❌ 店舗名変換エラー:', error);
        showResult('result-stores', false, error.message);
        addLog('log-stores', `致命的エラー: ${error.message}`, 'error');
    } finally {
        button.disabled = false;
    }
}

// 2. 重大度AI判定
async function fixSeverity() {
    console.log('🔢 重大度AI判定開始');
    
    const button = event.target;
    button.disabled = true;
    
    const progressContainer = document.getElementById('progress-severity');
    progressContainer.style.display = 'block';
    
    const logContainer = document.getElementById('log-severity');
    logContainer.innerHTML = '';
    logContainer.style.display = 'block';
    
    try {
        // 対象データ取得
        const { data: incidents, error } = await window.supabaseClient
            .from('incidents')
            .select('*')
            .or('severity.is.null,severity.eq.0');

        if (error) throw error;

        if (incidents.length === 0) {
            showResult('result-severity', true, '修正対象のデータがありません');
            button.disabled = false;
            return;
        }

        addLog('log-severity', `対象データ: ${incidents.length}件`, 'info');

        let successCount = 0;
        let errorCount = 0;

        // 1件ずつ処理
        for (let i = 0; i < incidents.length; i++) {
            const incident = incidents[i];
            updateProgress('severity', i + 1, incidents.length);

            try {
                // AI判定（簡易ルールベース）
                const severity = estimateSeverity(incident);
                
                // データベース更新
                const { error: updateError } = await window.supabaseClient
                    .from('incidents')
                    .update({ severity })
                    .eq('id', incident.id);

                if (updateError) throw updateError;

                successCount++;
                addLog('log-severity', `✓ ID:${incident.id} → 重大度: ${severity}`, 'success');

            } catch (err) {
                errorCount++;
                addLog('log-severity', `✗ ID:${incident.id} エラー: ${err.message}`, 'error');
            }

            // API制限回避
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // 結果表示
        showResult(
            'result-severity', 
            errorCount === 0,
            `処理完了`,
            `成功: ${successCount}件、失敗: ${errorCount}件`
        );

        // 統計再読み込み
        await loadStats();

    } catch (error) {
        console.error('❌ 重大度判定エラー:', error);
        showResult('result-severity', false, error.message);
        addLog('log-severity', `致命的エラー: ${error.message}`, 'error');
    } finally {
        button.disabled = false;
    }
}

// 重大度推定（簡易ルールベース）
function estimateSeverity(incident) {
    const text = `${incident.what_happened || ''} ${incident.memo || ''} ${incident.accident_damage || ''}`.toLowerCase();
    
    // 最重要キーワード
    if (text.includes('死亡') || text.includes('重傷') || text.includes('入院')) {
        return 5;
    }
    
    // 重要キーワード
    if (text.includes('骨折') || text.includes('大破') || text.includes('全損')) {
        return 4;
    }
    
    // 中程度キーワード
    if (text.includes('怪我') || text.includes('負傷') || text.includes('破損')) {
        return 3;
    }
    
    // 低キーワード
    if (text.includes('接触') || text.includes('擦り傷') || text.includes('凹み')) {
        return 2;
    }
    
    // デフォルト（ヒヤリハットレベル）
    return incident.report_type === 'hiyari' ? 1 : 2;
}

// 3. 荷物情報補完
async function fixCargoInfo() {
    console.log('📦 荷物情報補完開始');
    
    const button = event.target;
    button.disabled = true;
    
    const progressContainer = document.getElementById('progress-cargo');
    progressContainer.style.display = 'block';
    
    const logContainer = document.getElementById('log-cargo');
    logContainer.innerHTML = '';
    logContainer.style.display = 'block';
    
    try {
        // 対象データ取得
        const { data: incidents, error } = await window.supabaseClient
            .from('incidents')
            .select('*')
            .or('cargo_info.is.null,cargo_info.eq.');

        if (error) throw error;

        if (incidents.length === 0) {
            showResult('result-cargo', true, '修正対象のデータがありません');
            button.disabled = false;
            return;
        }

        addLog('log-cargo', `対象データ: ${incidents.length}件`, 'info');

        let successCount = 0;
        let errorCount = 0;

        // 1件ずつ処理
        for (let i = 0; i < incidents.length; i++) {
            const incident = incidents[i];
            updateProgress('cargo', i + 1, incidents.length);

            try {
                // 荷物情報推測
                const cargoInfo = extractCargoInfo(incident);
                
                if (cargoInfo) {
                    // データベース更新
                    const { error: updateError } = await window.supabaseClient
                        .from('incidents')
                        .update({ cargo_info: cargoInfo })
                        .eq('id', incident.id);

                    if (updateError) throw updateError;

                    successCount++;
                    addLog('log-cargo', `✓ ID:${incident.id} → ${cargoInfo}`, 'success');
                } else {
                    addLog('log-cargo', `- ID:${incident.id} 推測不可`, 'info');
                }

            } catch (err) {
                errorCount++;
                addLog('log-cargo', `✗ ID:${incident.id} エラー: ${err.message}`, 'error');
            }

            // API制限回避
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // 結果表示
        showResult(
            'result-cargo', 
            errorCount === 0,
            `処理完了`,
            `成功: ${successCount}件、失敗: ${errorCount}件`
        );

        // 統計再読み込み
        await loadStats();

    } catch (error) {
        console.error('❌ 荷物情報補完エラー:', error);
        showResult('result-cargo', false, error.message);
        addLog('log-cargo', `致命的エラー: ${error.message}`, 'error');
    } finally {
        button.disabled = false;
    }
}

// 荷物情報抽出（簡易パターンマッチング）
function extractCargoInfo(incident) {
    const text = `${incident.what_happened || ''} ${incident.memo || ''}`;
    
    // 一般的な荷物キーワード
    const patterns = [
        /([冷凍冷蔵]?[^\s]{1,10}[キkgKG\d]+)/,
        /(パレット[\d]+[枚個]?)/,
        /(段ボール[\d]+[個箱]?)/,
        /(コンテナ|荷物|貨物|商品)/
    ];
    
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            return match[1];
        }
    }
    
    // cargo_typeがあればそれを使用
    if (incident.cargo_type && incident.cargo_type !== 'その他') {
        return incident.cargo_type;
    }
    
    return null;
}

// 4. 事象カテゴリ判定
async function fixIncidentType() {
    console.log('📍 事象カテゴリ判定開始');
    
    const button = event.target;
    button.disabled = true;
    
    const progressContainer = document.getElementById('progress-category');
    progressContainer.style.display = 'block';
    
    const logContainer = document.getElementById('log-category');
    logContainer.innerHTML = '';
    logContainer.style.display = 'block';
    
    try {
        // 対象データ取得
        const { data: incidents, error } = await window.supabaseClient
            .from('incidents')
            .select('*')
            .or('incident_type.is.null,incident_type.eq.');

        if (error) throw error;

        if (incidents.length === 0) {
            showResult('result-category', true, '修正対象のデータがありません');
            button.disabled = false;
            return;
        }

        addLog('log-category', `対象データ: ${incidents.length}件`, 'info');

        let successCount = 0;
        let errorCount = 0;

        // 1件ずつ処理
        for (let i = 0; i < incidents.length; i++) {
            const incident = incidents[i];
            updateProgress('category', i + 1, incidents.length);

            try {
                // 事象カテゴリ判定
                const incidentType = determineIncidentType(incident);
                
                // データベース更新
                const { error: updateError } = await window.supabaseClient
                    .from('incidents')
                    .update({ incident_type: incidentType })
                    .eq('id', incident.id);

                if (updateError) throw updateError;

                successCount++;
                addLog('log-category', `✓ ID:${incident.id} → ${incidentType}`, 'success');

            } catch (err) {
                errorCount++;
                addLog('log-category', `✗ ID:${incident.id} エラー: ${err.message}`, 'error');
            }

            // API制限回避
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // 結果表示
        showResult(
            'result-category', 
            errorCount === 0,
            `処理完了`,
            `成功: ${successCount}件、失敗: ${errorCount}件`
        );

        // 統計再読み込み
        await loadStats();

    } catch (error) {
        console.error('❌ 事象カテゴリ判定エラー:', error);
        showResult('result-category', false, error.message);
        addLog('log-category', `致命的エラー: ${error.message}`, 'error');
    } finally {
        button.disabled = false;
    }
}

// 事象カテゴリ判定
function determineIncidentType(incident) {
    const text = `${incident.what_happened || ''} ${incident.memo || ''}`.toLowerCase();
    
    // 荷役・作業中キーワード
    const loadingKeywords = ['荷役', '積み', '降ろし', '作業', 'フォークリフト', 'パレット', '倉庫'];
    for (const keyword of loadingKeywords) {
        if (text.includes(keyword)) {
            return 'loading';
        }
    }
    
    // 走行中キーワード
    const drivingKeywords = ['走行', '運転', '追突', 'バック', '車線', '道路', '交差点'];
    for (const keyword of drivingKeywords) {
        if (text.includes(keyword)) {
            return 'driving';
        }
    }
    
    // デフォルト
    return 'driving';
}

// 一括実行
async function fixAll() {
    if (!confirm('すべての修正処理を実行しますか？\n（数分かかる場合があります）')) {
        return;
    }
    
    console.log('⚡ 一括修正開始');
    
    try {
        // 順番に実行
        if (fixStats.stores > 0) {
            await fixStoreNames();
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        if (fixStats.severity > 0) {
            await fixSeverity();
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        if (fixStats.cargo > 0) {
            await fixCargoInfo();
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        if (fixStats.category > 0) {
            await fixIncidentType();
        }
        
        alert('✅ すべての修正処理が完了しました！');
        
        // 統計再読み込み
        await loadStats();
        
    } catch (error) {
        console.error('❌ 一括修正エラー:', error);
        alert('一括修正中にエラーが発生しました: ' + error.message);
    }
}

// ログアウト
function logout() {
    window.supabaseClient.auth.signOut();
    window.location.href = 'login.html';
}
