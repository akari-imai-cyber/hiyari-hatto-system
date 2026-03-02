// ============================================
// 報告管理画面（管理者専用）
// ============================================

let allReports = [];
let allCompanies = [];
let currentReport = null;

// ページ読み込み時
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📝 報告管理画面を初期化中...');
    
    await loadCompanies();
    await loadReports();
    
    // フィルター変更イベント
    document.getElementById('company-filter').addEventListener('change', filterReports);
    document.getElementById('status-filter').addEventListener('change', filterReports);
});

// 企業一覧読み込み
async function loadCompanies() {
    try {
        let query = window.supabaseClient
            .from('companies')
            .select('id, company_code, company_name');
        
        // 企業管理者の場合は自社のみ
        if (window.currentUserRole === 'company_admin' && window.currentUserCompanyId) {
            query = query.eq('id', window.currentUserCompanyId);
        }
        
        const { data, error } = await query.order('company_name');
        
        if (error) throw error;
        
        allCompanies = data || [];
        
        // フィルター用のセレクトボックスに追加
        const companyFilter = document.getElementById('company-filter');
        
        // 企業管理者の場合はフィルターを非表示
        if (window.currentUserRole === 'company_admin') {
            companyFilter.parentElement.style.display = 'none';
        } else {
            allCompanies.forEach(company => {
                const option = document.createElement('option');
                option.value = company.id;
                option.textContent = `${company.company_name} (${company.company_code})`;
                companyFilter.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('企業読み込みエラー:', error);
    }
}

// 報告一覧読み込み
async function loadReports() {
    try {
        console.log('報告読み込み開始...');
        
        // クエリを構築
        let query = window.supabaseClient
            .from('incidents')
            .select(`
                *,
                companies:company_id (
                    company_code,
                    company_name
                )
            `);
        
        // 企業管理者の場合は自社データのみ
        if (window.currentUserRole === 'company_admin' && window.currentUserCompanyId) {
            console.log('企業管理者: 自社データのみ表示', window.currentUserCompanyId);
            query = query.eq('company_id', window.currentUserCompanyId);
        } else {
            console.log('システム管理者: 全データ表示');
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        
        allReports = data || [];
        console.log('読み込んだ報告数:', allReports.length);
        
        updateStats();
        displayReports(allReports);
        
    } catch (error) {
        console.error('報告読み込みエラー:', error);
        alert('報告の読み込みに失敗しました: ' + error.message);
    }
}

// 統計更新
function updateStats() {
    const totalReports = allReports.length;
    const pendingReports = allReports.filter(r => r.status === 'step1_complete' || r.status === 'step2_complete').length;
    const editRequests = allReports.filter(r => r.edit_request === true).length;
    
    document.getElementById('total-reports').textContent = totalReports;
    document.getElementById('pending-reports').textContent = pendingReports;
    document.getElementById('edit-requests').textContent = editRequests;
}

// フィルター適用
function filterReports() {
    const companyId = document.getElementById('company-filter').value;
    const status = document.getElementById('status-filter').value;
    
    let filtered = allReports;
    
    if (companyId) {
        filtered = filtered.filter(r => r.company_id === companyId);
    }
    
    if (status) {
        filtered = filtered.filter(r => r.status === status);
    }
    
    displayReports(filtered);
}

// 報告表示
function displayReports(reports) {
    const listElement = document.getElementById('reports-list');
    
    if (reports.length === 0) {
        listElement.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <p>該当する報告がありません</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="reports-table">';
    
    reports.forEach(report => {
        const reportType = report.report_type === 'hiyari' ? '🟡 ヒヤリハット' : '🔴 事故';
        const companyName = report.companies?.company_name || '不明';
        const status = getStatusBadge(report.status);
        const editRequestBadge = report.edit_request ? '<span class="badge badge-warning">修正依頼あり</span>' : '';
        const occurredAt = new Date(report.occurred_at).toLocaleDateString('ja-JP');
        
        html += `
            <div class="report-card">
                <div class="report-header">
                    <span class="report-type">${reportType}</span>
                    <span class="report-company">${companyName}</span>
                    ${editRequestBadge}
                    ${status}
                </div>
                <div class="report-body">
                    <div class="report-info">
                        <strong>報告者:</strong> ${report.reporter_name || '-'}
                    </div>
                    <div class="report-info">
                        <strong>発生日:</strong> ${occurredAt}
                    </div>
                    <div class="report-info">
                        <strong>場所:</strong> ${report.location_text || '-'}
                    </div>
                    <div class="report-memo">
                        ${report.memo || '（メモなし）'}
                    </div>
                </div>
                <div class="report-footer">
                    <button class="btn btn-primary btn-small" onclick="editReport('${report.id}')">
                        ✏️ 編集
                    </button>
                    <button class="btn btn-secondary btn-small" onclick="viewDetail('${report.id}')">
                        📄 詳細
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    listElement.innerHTML = html;
}

// ステータスバッジ取得
function getStatusBadge(status) {
    const badges = {
        'step1_complete': '<span class="badge badge-warning">基本情報のみ</span>',
        'step2_complete': '<span class="badge badge-info">詳細入力済</span>',
        'confirmed': '<span class="badge badge-success">確認済</span>',
        'in_progress': '<span class="badge badge-primary">対応中</span>',
        'completed': '<span class="badge badge-success">完了</span>'
    };
    return badges[status] || '<span class="badge">不明</span>';
}

// 報告編集
async function editReport(reportId) {
    try {
        const { data, error } = await window.supabaseClient
            .from('incidents')
            .select('*')
            .eq('id', reportId)
            .single();
        
        if (error) throw error;
        
        currentReport = data;
        
        // 編集フォームを作成
        const modalBody = document.getElementById('edit-modal-body');
        modalBody.innerHTML = createEditForm(data);
        
        // モーダル表示
        document.getElementById('edit-report-modal').classList.remove('hidden');
        
    } catch (error) {
        console.error('報告読み込みエラー:', error);
        alert('報告の読み込みに失敗しました: ' + error.message);
    }
}

// 編集フォーム作成
function createEditForm(report) {
    return `
        <div class="form-section">
            <h3>基本情報</h3>
            
            <div class="form-group">
                <label>報告者名</label>
                <input type="text" id="edit-reporter-name" class="form-control" 
                       value="${report.reporter_name || ''}" required>
            </div>
            
            <div class="form-group">
                <label>発生日時</label>
                <input type="datetime-local" id="edit-occurred-at" class="form-control" 
                       value="${report.occurred_at ? new Date(report.occurred_at).toISOString().slice(0, 16) : ''}" required>
            </div>
            
            <div class="form-group">
                <label>発生場所</label>
                <input type="text" id="edit-location" class="form-control" 
                       value="${report.location_text || ''}" required>
            </div>
            
            <div class="form-group">
                <label>報告種別</label>
                <select id="edit-report-type" class="form-control">
                    <option value="hiyari" ${report.report_type === 'hiyari' ? 'selected' : ''}>ヒヤリハット</option>
                    <option value="accident" ${report.report_type === 'accident' ? 'selected' : ''}>事故</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>インシデント種別</label>
                <select id="edit-incident-type" class="form-control">
                    <option value="driving" ${report.incident_type === 'driving' ? 'selected' : ''}>運転中</option>
                    <option value="loading" ${report.incident_type === 'loading' ? 'selected' : ''}>荷役作業中</option>
                    <option value="other" ${report.incident_type === 'other' ? 'selected' : ''}>その他</option>
                </select>
            </div>
        </div>
        
        <div class="form-section">
            <h3>詳細情報</h3>
            
            <div class="form-group">
                <label>メモ・詳細説明</label>
                <textarea id="edit-memo" class="form-control" rows="4">${report.memo || ''}</textarea>
            </div>
            
            <div class="form-group">
                <label>天候</label>
                <input type="text" id="edit-weather" class="form-control" value="${report.detail_weather || ''}">
            </div>
            
            <div class="form-group">
                <label>路面状況</label>
                <input type="text" id="edit-road" class="form-control" value="${report.detail_road || ''}">
            </div>
            
            <div class="form-group">
                <label>重大度 (1-5)</label>
                <input type="number" id="edit-severity" class="form-control" 
                       min="1" max="5" value="${report.severity || 1}">
            </div>
            
            <div class="form-group">
                <label>ステータス</label>
                <select id="edit-status" class="form-control">
                    <option value="step1_complete" ${report.status === 'step1_complete' ? 'selected' : ''}>基本情報のみ</option>
                    <option value="step2_complete" ${report.status === 'step2_complete' ? 'selected' : ''}>詳細入力済</option>
                    <option value="confirmed" ${report.status === 'confirmed' ? 'selected' : ''}>確認済</option>
                    <option value="in_progress" ${report.status === 'in_progress' ? 'selected' : ''}>対応中</option>
                    <option value="completed" ${report.status === 'completed' ? 'selected' : ''}>完了</option>
                </select>
            </div>
        </div>
        
        <div class="form-section">
            <h3>管理者メモ</h3>
            
            <div class="form-group">
                <label>管理者コメント</label>
                <textarea id="edit-admin-comment" class="form-control" rows="3">${report.manager_comment || ''}</textarea>
            </div>
            
            <div class="form-group">
                <label style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" id="edit-clear-request" ${report.edit_request ? 'checked' : ''}>
                    修正依頼フラグをクリア
                </label>
            </div>
        </div>
    `;
}

// 報告保存
async function saveReport() {
    if (!currentReport) return;
    
    try {
        const updates = {
            reporter_name: document.getElementById('edit-reporter-name').value,
            occurred_at: document.getElementById('edit-occurred-at').value,
            location_text: document.getElementById('edit-location').value,
            report_type: document.getElementById('edit-report-type').value,
            incident_type: document.getElementById('edit-incident-type').value,
            memo: document.getElementById('edit-memo').value,
            detail_weather: document.getElementById('edit-weather').value,
            detail_road: document.getElementById('edit-road').value,
            severity: parseInt(document.getElementById('edit-severity').value),
            status: document.getElementById('edit-status').value,
            manager_comment: document.getElementById('edit-admin-comment').value,
            edit_request: document.getElementById('edit-clear-request').checked ? false : currentReport.edit_request,
            updated_at: new Date().toISOString()
        };
        
        const { data, error } = await window.supabaseClient
            .from('incidents')
            .update(updates)
            .eq('id', currentReport.id);
        
        if (error) throw error;
        
        alert('✅ 報告を保存しました');
        closeEditModal();
        loadReports();
        
    } catch (error) {
        console.error('保存エラー:', error);
        alert('保存に失敗しました: ' + error.message);
    }
}

// モーダルを閉じる
function closeEditModal() {
    document.getElementById('edit-report-modal').classList.add('hidden');
    currentReport = null;
}

// 詳細表示（別ウィンドウ）
function viewDetail(reportId) {
    window.open(`dashboard.html?report=${reportId}`, '_blank');
}
