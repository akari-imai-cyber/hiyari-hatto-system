// ============================================
// アクセスログ閲覧画面
// ============================================

let allLogs = [];
let companies = [];

// Supabase初期化
async function initializeApp() {
    if (!window.supabaseClient) {
        console.log('🔧 Supabaseクライアントを初期化中...');
        window.supabaseClient = supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey
        );
        console.log('✅ Supabase クライアント:', window.supabaseClient);
    }
}

// ログデータ読み込み
async function loadLogs() {
    try {
        console.log('📊 ログを読み込み中...');
        
        // 企業一覧取得
        const { data: companiesData, error: companiesError } = await window.supabaseClient
            .from('companies')
            .select('id, company_code, company_name')
            .order('company_name');
        
        if (companiesError) throw companiesError;
        companies = companiesData || [];
        
        // フィルタ用ドロップダウン更新
        updateCompanyFilter();
        
        // ログ取得
        const { data, error } = await window.supabaseClient
            .from('access_logs')
            .select(`
                *,
                companies:company_id (
                    company_code,
                    company_name
                )
            `)
            .order('created_at', { ascending: false })
            .limit(500);
        
        if (error) throw error;
        
        allLogs = data || [];
        console.log(`✅ ${allLogs.length} 件のログを読み込みました`);
        
        updateStats();
        displayLogs(allLogs);
        
    } catch (error) {
        console.error('❌ ログ読み込みエラー:', error);
        alert(`ログの読み込みに失敗しました\n${error.message}`);
    }
}

// 企業フィルタ更新
function updateCompanyFilter() {
    const select = document.getElementById('filter-company');
    select.innerHTML = '<option value="">すべての企業</option>';
    
    companies.forEach(company => {
        const option = document.createElement('option');
        option.value = company.id;
        option.textContent = `${company.company_name} (${company.company_code})`;
        select.appendChild(option);
    });
}

// 統計情報更新
function updateStats() {
    const totalLogs = allLogs.length;
    const successLogs = allLogs.filter(log => log.status === 'success').length;
    const failedLogs = allLogs.filter(log => log.status === 'failed' || log.status === 'error').length;
    const loginAttempts = allLogs.filter(log => log.action === 'login').length;
    
    document.getElementById('total-logs').textContent = totalLogs;
    document.getElementById('success-logs').textContent = successLogs;
    document.getElementById('failed-logs').textContent = failedLogs;
    document.getElementById('login-attempts').textContent = loginAttempts;
}

// ログ表示
function displayLogs(logs) {
    const tbody = document.getElementById('logs-list');
    
    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">📊 ログがありません</td></tr>';
        return;
    }
    
    tbody.innerHTML = logs.map(log => {
        const companyName = log.companies?.company_name || '不明';
        const statusClass = log.status === 'success' ? 'status-confirmed' : 
                           log.status === 'failed' ? 'status-pending' : 'status-deleted';
        const actionLabel = getActionLabel(log.action);
        const resourceLabel = getResourceLabel(log.resource);
        
        return `
            <tr>
                <td>${formatDateTime(log.created_at)}</td>
                <td>${companyName}</td>
                <td>${log.user_identifier || '-'}</td>
                <td>${actionLabel}</td>
                <td>${resourceLabel}</td>
                <td>${log.ip_address || '-'}</td>
                <td><span class="status-badge ${statusClass}">${log.status}</span></td>
                <td>${log.error_message || '-'}</td>
            </tr>
        `;
    }).join('');
}

// 操作ラベル変換
function getActionLabel(action) {
    const labels = {
        'login': 'ログイン',
        'logout': 'ログアウト',
        'page_view': 'ページ閲覧',
        'create_report': '報告作成',
        'update_report': '報告更新',
        'delete_report': '報告削除',
        'add_company': '企業追加',
        'delete_company': '企業削除'
    };
    return labels[action] || action;
}

// リソースラベル変換
function getResourceLabel(resource) {
    const labels = {
        'authentication': '認証',
        'report_form': '報告フォーム',
        'dashboard': 'ダッシュボード',
        'analytics': '分析画面',
        'admin_panel': '管理画面',
        'incidents': '報告データ',
        'companies': '企業データ'
    };
    return labels[resource] || resource || '-';
}

// 日時フォーマット
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// フィルター適用
function applyFilter() {
    const companyId = document.getElementById('filter-company').value;
    const action = document.getElementById('filter-action').value;
    const status = document.getElementById('filter-status').value;
    const date = document.getElementById('filter-date').value;
    
    let filteredLogs = [...allLogs];
    
    if (companyId) {
        filteredLogs = filteredLogs.filter(log => log.company_id === companyId);
    }
    
    if (action) {
        filteredLogs = filteredLogs.filter(log => log.action === action);
    }
    
    if (status) {
        filteredLogs = filteredLogs.filter(log => log.status === status);
    }
    
    if (date) {
        filteredLogs = filteredLogs.filter(log => {
            const logDate = new Date(log.created_at).toISOString().split('T')[0];
            return logDate === date;
        });
    }
    
    console.log(`🔍 フィルター適用: ${filteredLogs.length}件`);
    displayLogs(filteredLogs);
}

// フィルタークリア
function clearFilter() {
    document.getElementById('filter-company').value = '';
    document.getElementById('filter-action').value = '';
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-date').value = '';
    displayLogs(allLogs);
}

// CSV出力
function exportToCSV() {
    const headers = ['日時', '企業コード', '企業名', 'ユーザー', '操作', '対象', 'IPアドレス', 'ステータス', '詳細'];
    
    const rows = allLogs.map(log => [
        formatDateTime(log.created_at),
        log.companies?.company_code || '',
        log.companies?.company_name || '',
        log.user_identifier || '',
        getActionLabel(log.action),
        getResourceLabel(log.resource),
        log.ip_address || '',
        log.status,
        log.error_message || ''
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `access_logs_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('✅ CSVファイルをダウンロードしました');
}

// ログアウト
function logout() {
    if (confirm('ログアウトしますか？')) {
        sessionStorage.removeItem('admin_authenticated');
        window.location.href = 'index.html';
    }
}

// イベントリスナー設定
document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
    await loadLogs();
    
    document.getElementById('refresh-btn').addEventListener('click', loadLogs);
    document.getElementById('export-csv-btn').addEventListener('click', exportToCSV);
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.getElementById('apply-filter-btn').addEventListener('click', applyFilter);
    document.getElementById('clear-filter-btn').addEventListener('click', clearFilter);
});
