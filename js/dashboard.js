// ===================================
// ダッシュボード JavaScript
// ===================================

let allReports = [];
let filteredReports = []; // フィルター後のデータ（CSV出力用）
let currentReport = null;

// ページ読み込み時
document.addEventListener('DOMContentLoaded', function() {
    if (!initializeApp()) {
        return;
    }
    
    // 認証完了イベントをリッスン
    window.addEventListener('authComplete', function(e) {
        console.log('📢 authComplete イベント受信:', e.detail);
        loadReports();
    });
    
    // 既にセッションが存在する場合のために少し待ってから実行
    setTimeout(() => {
        const auth = window.getCurrentAuth ? window.getCurrentAuth() : null;
        if (auth && (auth.companyId || auth.role === 'admin')) {
            console.log('✅ 認証済み（遅延チェック）:', auth);
            loadReports();
        }
    }, 500);
    
    // フィルター変更時
    document.getElementById('status-filter').addEventListener('change', filterReports);
    document.getElementById('category-filter').addEventListener('change', filterReports);
});

// 報告一覧読み込み
async function loadReports() {
    try {
        console.log('=== 報告読み込み開始 ===');
        console.log('supabaseClient:', window.supabaseClient);
        
        // 認証情報から company_id を取得（最大5秒待機）
        let auth = window.getCurrentAuth ? window.getCurrentAuth() : null;
        let retries = 0;
        
        // 認証情報が取得できるまで待機（最大5回、合計5秒）
        while ((!auth || (!auth.companyId && auth.role !== 'admin')) && retries < 5) {
            console.log(`⏳ 認証情報待機中... (${retries + 1}/5)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            auth = window.getCurrentAuth ? window.getCurrentAuth() : null;
            retries++;
        }
        
        const companyId = auth ? auth.companyId : null;
        const role = auth ? auth.role : null;
        
        console.log('✅ 認証情報取得:', { companyId, role });
        
        if (!companyId && role !== 'admin') {
            console.error('❌ 企業IDが取得できません');
            alert('認証情報が取得できません。再度ログインしてください。');
            return;
        }
        
        // データ取得クエリを構築
        let query = supabaseClient
            .from('incidents')
            .select('*')
            .order('created_at', { ascending: false });
        
        // 一般ユーザーまたは企業管理者の場合は自社データのみ
        if (role !== 'admin' && companyId) {
            console.log('✅ 企業IDでフィルタリング:', companyId);
            query = query.eq('company_id', companyId);
        } else if (role === 'admin') {
            console.log('✅ システム管理者: 全企業のデータを取得');
        }
        
        const { data, error} = await query;
        
        console.log('取得データ:', data);
        console.log('エラー:', error);
        
        if (error) throw error;
        
        allReports = data || [];
        filteredReports = allReports; // 初回読み込み時はフィルター済み=全データ
        console.log('allReports件数:', allReports.length);
        
        updateSummary();
        displayReports(allReports);
        
    } catch (error) {
        console.error('報告読み込みエラー:', error);
        alert('データの読み込みに失敗しました: ' + error.message);
        document.getElementById('reports-list').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <p>データの読み込みに失敗しました</p>
                <p style="color: red; font-size: 12px;">${error.message}</p>
            </div>
        `;
    }
}

// サマリー更新
function updateSummary() {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    console.log('=== サマリー更新 ===');
    console.log('allReports:', allReports);
    
    // 総報告数
    document.getElementById('total-reports').textContent = allReports.length;
    
    // 未確認（status が step1_complete または pending）
    const pending = allReports.filter(r => r.status === 'pending' || r.status === 'step1_complete').length;
    document.getElementById('pending-reports').textContent = pending;
    
    // 重大度★★★以上（severity または severity_rating）
    const highSeverity = allReports.filter(r => {
        const sev = r.severity || r.severity_rating || 0;
        return sev >= 3;
    }).length;
    document.getElementById('high-severity').textContent = highSeverity;
    
    // 今月の完了（status が completed または step2_complete）
    const completed = allReports.filter(r => {
        if ((r.status !== 'completed' && r.status !== 'step2_complete') || !r.updated_at) return false;
        const date = new Date(r.updated_at);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    }).length;
    document.getElementById('completed-reports').textContent = completed;
    
    console.log('総報告数:', allReports.length);
    console.log('未確認:', pending);
    console.log('重大度高:', highSeverity);
    console.log('今月完了:', completed);
}

// 報告表示
function displayReports(reports) {
    const container = document.getElementById('reports-list');
    
    if (reports.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <p>表示する報告がありません</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = reports.map(report => createReportCard(report)).join('');
}

// 報告カード作成
function createReportCard(report) {
    const reportType = report.report_type === 'hiyari' ? 'ヒヤリハット' : '事故';
    const reportTypeBadge = report.report_type === 'hiyari' ? 'badge-hiyari' : 'badge-accident';
    
    // incident_type（新）またはincident_category（旧）に対応
    const incidentType = report.incident_type || report.incident_category;
    const category = incidentType === 'driving' ? '走行中' : '荷役中';
    const categoryBadge = incidentType === 'driving' ? 'badge-driving' : 'badge-loading';
    
    const statusText = getStatusText(report.status);
    const statusClass = `status-${report.status}`;
    
    // severity（新）またはseverity_rating（旧）に対応
    const severityValue = report.severity || report.severity_rating;
    const severity = severityValue ? '★'.repeat(severityValue) + '☆'.repeat(5 - severityValue) : '未評価';
    
    // 日付を日本時間で表示
    // SupabaseのタイムゾーンがAsia/Tokyoに設定されていれば、
    // 保存されている値はすでに日本時間なので、そのまま表示
    let occurredDate;
    try {
        const date = new Date(report.occurred_at);
        occurredDate = date.toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        console.log('元データ:', report.occurred_at, '→ 表示:', occurredDate);
    } catch (e) {
        console.error('日付変換エラー:', e);
        occurredDate = report.occurred_at;
    }
    
    // reporter_name（新）またはemployees.name（旧）に対応
    const employeeName = report.reporter_name || report.employee_name || report.employees?.name || '不明';
    
    // categories（新）またはwhat_happened_category（旧）に対応
    const categoryText = Array.isArray(report.categories) 
        ? report.categories.join(', ') 
        : (report.what_happened_category || '-');
    
    // detail_situation（新）またはwhat_happened_text（旧）に対応
    const situationText = report.detail_situation || report.what_happened_text || '-';
    
    return `
        <div class="report-item" onclick="showDetail('${report.id}')">
            <div class="report-header-row">
                <div class="report-meta">
                    <span class="report-badge ${reportTypeBadge}">${reportType}</span>
                    <span class="report-badge ${categoryBadge}">${category}</span>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="severity-stars">${severity}</div>
            </div>
            <div class="report-info">
                <div><strong>発生日時:</strong> ${occurredDate}</div>
                <div><strong>報告者:</strong> ${employeeName}</div>
                <div><strong>場所:</strong> ${report.location_text}</div>
                ${report.area_detail ? `<div><strong>エリア詳細:</strong> ${report.area_detail}</div>` : ''}
                <div><strong>車両種別:</strong> ${report.vehicle_type || '-'}</div>
                ${report.vehicle_detail ? `<div><strong>車両詳細:</strong> ${report.vehicle_detail}</div>` : ''}
                <div><strong>荷物の種類:</strong> ${report.cargo_type || '-'}</div>
                ${report.cargo_info ? `<div><strong>荷物情報:</strong> ${report.cargo_info}</div>` : ''}
                <div><strong>カテゴリ:</strong> ${categoryText}</div>
            </div>
            <div class="report-text">
                ${situationText}
            </div>
        </div>
    `;
}

// ステータステキスト取得
function getStatusText(status) {
    const statusMap = {
        'pending': '未確認',
        'confirmed': '確認済',
        'in_progress': '対応中',
        'completed': '完了',
        'step1_complete': '基本情報のみ',
        'step2_complete': '詳細入力済'
    };
    return statusMap[status] || status;
}

// フィルター適用
function filterReports() {
    const statusFilter = document.getElementById('status-filter').value;
    const categoryFilter = document.getElementById('category-filter').value;
    
    let filtered = allReports;
    
    if (statusFilter) {
        filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    if (categoryFilter) {
        // incident_type（新）またはincident_category（旧）に対応
        filtered = filtered.filter(r => {
            const incidentType = r.incident_type || r.incident_category;
            return incidentType === categoryFilter;
        });
    }
    
    // フィルター済みデータをグローバル変数に保存（CSV出力用）
    filteredReports = filtered;
    console.log('📊 フィルター適用:', { 
        全データ件数: allReports.length, 
        フィルター後: filteredReports.length,
        ステータス: statusFilter || 'すべて',
        カテゴリ: categoryFilter || 'すべて'
    });
    
    displayReports(filtered);
}

// 詳細表示
async function showDetail(reportId) {
    try {
        const { data, error } = await supabaseClient
            .from('incidents')
            .select('*')
            .eq('id', reportId)
            .single();
        
        if (error) throw error;
        
        currentReport = data;
        
        // モーダル内容作成
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = createDetailContent(data);
        
        // モーダル表示
        document.getElementById('detail-modal').classList.remove('hidden');
        
    } catch (error) {
        console.error('詳細読み込みエラー:', error);
        alert('詳細情報の読み込みに失敗しました: ' + error.message);
    }
}

// 詳細コンテンツ作成
function createDetailContent(report) {
    const reportType = report.report_type === 'hiyari' ? 'ヒヤリハット' : '事故';
    
    // incident_type（新）またはincident_category（旧）に対応
    const incidentType = report.incident_type || report.incident_category;
    const category = incidentType === 'driving' ? '走行中' : '荷役中';
    
    const statusText = getStatusText(report.status);
    
    // severity（新）またはseverity_rating（旧）に対応
    const severityValue = report.severity || report.severity_rating;
    const severity = severityValue ? '★'.repeat(severityValue) : '未評価';
    
    let html = `
        <div class="detail-section">
            <h3>基本情報</h3>
            <div class="detail-row">
                <div class="detail-label">報告種別</div>
                <div class="detail-value">${reportType}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">カテゴリ</div>
                <div class="detail-value">${category}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">ステータス</div>
                <div class="detail-value">
                    <select id="status-update" class="form-control" style="width: auto;">
                        <option value="step1_complete" ${report.status === 'step1_complete' ? 'selected' : ''}>基本情報のみ</option>
                        <option value="step2_complete" ${report.status === 'step2_complete' ? 'selected' : ''}>詳細入力済</option>
                        <option value="confirmed" ${report.status === 'confirmed' ? 'selected' : ''}>確認済</option>
                        <option value="in_progress" ${report.status === 'in_progress' ? 'selected' : ''}>対応中</option>
                        <option value="completed" ${report.status === 'completed' ? 'selected' : ''}>完了</option>
                    </select>
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-label">重大度</div>
                <div class="detail-value">${severity}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">発生日時</div>
                <div class="detail-value">${new Date(report.occurred_at).toLocaleString('ja-JP')}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">報告日時</div>
                <div class="detail-value">${new Date(report.created_at).toLocaleString('ja-JP')}</div>
            </div>
        </div>

        <div class="detail-section">
            <h3>報告者情報</h3>
            <div class="detail-row">
                <div class="detail-label">氏名</div>
                <div class="detail-value">${report.reporter_name || report.employee_name || '-'}</div>
            </div>
        </div>
        </div>

        <div class="detail-section">
            <h3>事象の内容</h3>
            <div class="detail-row">
                <div class="detail-label">発生場所</div>
                <div class="detail-value">${report.location_text}</div>
            </div>
            ${report.area_detail ? `
            <div class="detail-row">
                <div class="detail-label">エリア詳細</div>
                <div class="detail-value">${report.area_detail}</div>
            </div>
            ` : ''}
            <div class="detail-row">
                <div class="detail-label">車両種別</div>
                <div class="detail-value">${report.vehicle_type || '-'}</div>
            </div>
            ${report.vehicle_detail ? `
            <div class="detail-row">
                <div class="detail-label">車両詳細</div>
                <div class="detail-value">${report.vehicle_detail}</div>
            </div>
            ` : ''}
            <div class="detail-row">
                <div class="detail-label">荷物の種類</div>
                <div class="detail-value">${report.cargo_type || '-'}</div>
            </div>
            ${report.cargo_info ? `
            <div class="detail-row">
                <div class="detail-label">荷物情報</div>
                <div class="detail-value">${report.cargo_info}</div>
            </div>
            ` : ''}
            ${report.accident_damage ? `
            <div class="detail-row">
                <div class="detail-label">事故損害</div>
                <div class="detail-value">${report.accident_damage}</div>
            </div>
            ` : ''}
            <div class="detail-row">
                <div class="detail-label">事象</div>
                <div class="detail-value">${report.what_happened_category || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">詳細</div>
                <div class="detail-value">${report.what_happened_text}</div>
            </div>
        </div>
    `;
    
    // 走行中の詳細
    if (report.incident_category === 'driving') {
        html += `
            <div class="detail-section">
                <h3>走行状況</h3>
                ${report.driving_situation ? `
                    <div class="detail-row">
                        <div class="detail-label">走行状況</div>
                        <div class="detail-value">${report.driving_situation}</div>
                    </div>
                ` : ''}
                ${report.road_type ? `
                    <div class="detail-row">
                        <div class="detail-label">道路形状</div>
                        <div class="detail-value">${report.road_type}</div>
                    </div>
                ` : ''}
                ${report.other_party ? `
                    <div class="detail-row">
                        <div class="detail-label">相手</div>
                        <div class="detail-value">${report.other_party}</div>
                    </div>
                ` : ''}
                ${report.weather ? `
                    <div class="detail-row">
                        <div class="detail-label">天候</div>
                        <div class="detail-value">${report.weather}</div>
                    </div>
                ` : ''}
                ${report.road_surface ? `
                    <div class="detail-row">
                        <div class="detail-label">路面</div>
                        <div class="detail-value">${report.road_surface}</div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // 荷役中の詳細
    if (report.incident_category === 'loading') {
        html += `
            <div class="detail-section">
                <h3>作業状況</h3>
                ${report.work_phase ? `
                    <div class="detail-row">
                        <div class="detail-label">作業フェーズ</div>
                        <div class="detail-value">${report.work_phase}</div>
                    </div>
                ` : ''}
                ${report.equipment_used ? `
                    <div class="detail-row">
                        <div class="detail-label">使用機材</div>
                        <div class="detail-value">${report.equipment_used}</div>
                    </div>
                ` : ''}
                ${report.load_status ? `
                    <div class="detail-row">
                        <div class="detail-label">積載状態</div>
                        <div class="detail-value">${report.load_status}</div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // 原因分析
    if (report.direct_causes && report.direct_causes.length > 0) {
        html += `
            <div class="detail-section">
                <h3>原因分析</h3>
                <div class="detail-row">
                    <div class="detail-label">直接原因</div>
                    <div class="detail-value">${report.direct_causes.join(', ')}</div>
                </div>
            </div>
        `;
    }
    
    // 対策
    if (report.immediate_action || report.prevention_proposal) {
        html += `
            <div class="detail-section">
                <h3>対策・フォロー</h3>
                ${report.immediate_action ? `
                    <div class="detail-row">
                        <div class="detail-label">即時対処</div>
                        <div class="detail-value">${report.immediate_action}</div>
                    </div>
                ` : ''}
                ${report.prevention_proposal ? `
                    <div class="detail-row">
                        <div class="detail-label">再発防止提案</div>
                        <div class="detail-value">${report.prevention_proposal}</div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // 管理者コメント
    html += `
        <div class="detail-section">
            <h3>管理者コメント</h3>
            <textarea id="manager-comment" class="form-control" rows="4" readonly>${report.manager_comment || '（コメントなし）'}</textarea>
        </div>
        
        <div class="detail-section">
            <h3>修正依頼</h3>
            ${report.edit_request ? `
                <div class="alert alert-warning">
                    ⚠️ この報告には修正依頼が送信されています。管理者が対応します。
                </div>
            ` : `
                <p style="font-size: 0.875rem; color: #64748b; margin-bottom: 1rem;">
                    報告内容に誤りがある場合、修正依頼を送信できます。管理者が確認して修正します。
                </p>
                <div class="form-group">
                    <label>修正依頼内容（必須）</label>
                    <textarea id="edit-request-message" class="form-control" rows="3" 
                              placeholder="例: 発生日時が間違っています。正しくは2月15日14時です。"></textarea>
                </div>
                <button class="btn btn-warning" onclick="sendEditRequest()">
                    📝 修正依頼を送信
                </button>
            `}
        </div>
    `;
    
    // 写真
    if (report.photo_urls && report.photo_urls.length > 0) {
        html += `
            <div class="detail-section">
                <h3>写真</h3>
                <div class="photo-gallery">
                    ${report.photo_urls.map(url => `
                        <div class="photo-item">
                            <img src="${url}" alt="報告写真" onclick="window.open('${url}', '_blank')">
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    return html;
}

// モーダルを閉じる
function closeModal() {
    document.getElementById('detail-modal').classList.add('hidden');
    currentReport = null;
}

// ステータス更新
async function updateStatus() {
    if (!currentReport) return;
    
    const newStatus = document.getElementById('status-update').value;
    const managerComment = document.getElementById('manager-comment').value;
    
    try {
        const { error } = await supabaseClient
            .from('incidents')
            .update({
                status: newStatus,
                manager_comment: managerComment
            })
            .eq('id', currentReport.id);
        
        if (error) throw error;
        
        alert('更新しました');
        closeModal();
        loadReports();
        
    } catch (error) {
        console.error('更新エラー:', error);
        alert('更新に失敗しました');
    }
}

// 修正依頼を送信
async function sendEditRequest() {
    if (!currentReport) return;
    
    const message = document.getElementById('edit-request-message').value;
    
    if (!message || message.trim() === '') {
        alert('修正依頼内容を入力してください');
        return;
    }
    
    if (!confirm('修正依頼を送信しますか？\n\n管理者が確認して対応します。')) {
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('incidents')
            .update({
                edit_request: true,
                edit_request_message: message,
                edit_request_date: new Date().toISOString()
            })
            .eq('id', currentReport.id);
        
        if (error) throw error;
        
        alert('✅ 修正依頼を送信しました。\n\n管理者が確認次第、対応します。');
        closeModal();
        loadReports();
        
    } catch (error) {
        console.error('修正依頼送信エラー:', error);
        alert('修正依頼の送信に失敗しました: ' + error.message);
    }
}

// 更新ボタン
function refreshReports() {
    loadReports();
}

// 高度なフィルタ適用
function applyAdvancedFilter() {
    const statusFilter = document.getElementById('status-filter').value;
    const categoryFilter = document.getElementById('category-filter').value;
    const severityFilter = document.getElementById('severity-filter').value;
    const dateFromFilter = document.getElementById('date-from-filter').value;
    const dateToFilter = document.getElementById('date-to-filter').value;
    const reporterFilter = document.getElementById('reporter-filter').value.trim().toLowerCase();
    
    console.log('🔍 高度なフィルタ適用:', { statusFilter, categoryFilter, severityFilter, dateFromFilter, dateToFilter, reporterFilter });
    
    filteredReports = allReports.filter(report => {
        // ステータスフィルタ
        if (statusFilter && report.status !== statusFilter) {
            return false;
        }
        
        // カテゴリフィルタ
        if (categoryFilter && report.incident_type !== categoryFilter && report.incident_category !== categoryFilter) {
            return false;
        }
        
        // 重大度フィルタ
        if (severityFilter && String(report.severity_rating) !== severityFilter) {
            return false;
        }
        
        // 日付範囲フィルタ（開始日）
        if (dateFromFilter) {
            const reportDate = new Date(report.occurred_at);
            const fromDate = new Date(dateFromFilter);
            fromDate.setHours(0, 0, 0, 0);
            if (reportDate < fromDate) {
                return false;
            }
        }
        
        // 日付範囲フィルタ（終了日）
        if (dateToFilter) {
            const reportDate = new Date(report.occurred_at);
            const toDate = new Date(dateToFilter);
            toDate.setHours(23, 59, 59, 999);
            if (reportDate > toDate) {
                return false;
            }
        }
        
        // 報告者名フィルタ
        if (reporterFilter) {
            const reporterName = (report.reporter_name || report.employee_name || '').toLowerCase();
            if (!reporterName.includes(reporterFilter)) {
                return false;
            }
        }
        
        return true;
    });
    
    console.log('✅ フィルタ結果:', `${filteredReports.length}/${allReports.length}件`);
    
    // テーブルを再描画
    renderReportsTable(filteredReports);
    
    // サマリーカードを更新
    updateSummaryCards(filteredReports);
    
    // フィルタが適用されたことを通知
    const activeFiltersCount = [statusFilter, categoryFilter, severityFilter, dateFromFilter, dateToFilter, reporterFilter].filter(f => f).length;
    if (activeFiltersCount > 0) {
        showToast(`✅ ${activeFiltersCount}つのフィルタを適用しました（${filteredReports.length}件表示）`);
    }
}

// すべてのフィルタをリセット
function resetAllFilters() {
    document.getElementById('status-filter').value = '';
    document.getElementById('category-filter').value = '';
    document.getElementById('severity-filter').value = '';
    document.getElementById('date-from-filter').value = '';
    document.getElementById('date-to-filter').value = '';
    document.getElementById('reporter-filter').value = '';
    
    // フィルタをクリア
    filteredReports = [];
    
    // テーブルを再描画
    renderReportsTable(allReports);
    
    // サマリーカードを更新
    updateSummaryCards(allReports);
    
    console.log('🔄 フィルタをリセットしました');
    showToast('🔄 フィルタをリセットしました');
}

// トースト通知を表示
function showToast(message) {
    // 既存のトーストがあれば削除
    const existingToast = document.getElementById('toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    // トースト要素を作成
    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-size: 14px;
        animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // 3秒後に自動削除
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// アニメーション用のスタイルを追加
if (!document.getElementById('toast-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-animation-styles';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// CSVエクスポート（フィルター後のデータを出力）
function exportToCSV() {
    // フィルター済みデータが存在すればそれを使用、なければ全データ
    const dataToExport = filteredReports.length > 0 ? filteredReports : allReports;
    
    if (dataToExport.length === 0) {
        alert('エクスポートするデータがありません');
        return;
    }
    
    console.log('📊 CSVエクスポート開始:', { 
        全データ件数: allReports.length, 
        フィルター後件数: filteredReports.length,
        出力件数: dataToExport.length 
    });
    
    // CSVヘッダー（全カラム）
    const headers = [
        '報告ID',
        '企業ID',
        '報告種別',
        '報告者名',
        '発生日時',
        '発生場所（テキスト）',
        'GPS緯度',
        'GPS経度',
        'エリア詳細',  // ← 追加
        '車両種別',
        '車両詳細',  // ← 追加
        '荷物の種類',
        '荷物情報',
        '事象カテゴリ',
        '何が起きたか（カテゴリ）',
        'カテゴリ補足メモ',
        '写真URL',
        // 走行中詳細
        '天気',
        '道路種別',
        '走行状況',
        '相手方',
        '路面状態',
        'ドラレコ有無',
        // 荷役中詳細
        '作業フェーズ',
        '使用機器',
        '積載状態',
        '荷崩れ',
        '温度帯',
        // 原因分析
        '直接原因',
        '詳細原因（焦り）',
        '詳細原因（疲労）',
        '詳細原因（不慣れ）',
        '詳細原因（車両）',
        // 対策
        '即時対応',
        '再発防止策',
        '重大度',
        '受注ID',
        '事故損害',  // ← 追加
        // 管理者対応
        '管理者コメント',
        'ステータス',
        '全体共有',
        // タイムスタンプ
        '登録日時',
        '更新日時',
        'STEP2完了日時'
    ];
    
    // CSVデータ（フィルター後のデータを使用）
    const rows = dataToExport.map(report => [
        report.id || '',
        report.company_id || '',
        report.report_type === 'near-miss' ? 'ヒヤリハット' : report.report_type === 'accident' ? '事故' : report.report_type || '',
        report.reporter_name || report.employee_name || '',
        formatDateTimeForCSV(report.occurred_at),
        report.location_text || report.location || '',
        report.location_lat || report.location_gps_lat || '',
        report.location_lng || report.location_gps_lng || '',
        report.area_detail || '',  // ← 追加
        report.vehicle_type || '',
        report.vehicle_detail || '',  // ← 追加
        report.cargo_type || '',
        report.cargo_info || '',
        report.incident_type || report.incident_category || '',
        Array.isArray(report.categories) ? report.categories.join('; ') : (report.what_happened_category || ''),
        report.memo || report.category_memo || '',
        report.photo_url || (Array.isArray(report.photo_urls) ? report.photo_urls.join('; ') : ''),
        // 走行中詳細
        report.detail_weather || report.weather || '',
        report.detail_road || report.road_type || '',
        report.detail_situation || report.driving_situation || '',
        report.detail_counterpart || report.other_party || '',
        report.road_surface || '',
        report.dashcam !== null && report.dashcam !== undefined ? (report.dashcam ? 'あり' : 'なし') : 
            (report.dashcam_available !== null && report.dashcam_available !== undefined ? (report.dashcam_available ? 'あり' : 'なし') : ''),
        // 荷役中詳細
        report.work_phase || '',
        report.equipment_used || '',
        report.load_status || '',
        report.load_collapse || '',
        report.temperature_zone || '',
        // 原因分析
        Array.isArray(report.direct_causes) ? report.direct_causes.join('; ') : '',
        report.cause_detail_rush ? JSON.stringify(report.cause_detail_rush) : '',
        report.cause_detail_fatigue ? JSON.stringify(report.cause_detail_fatigue) : '',
        report.cause_detail_unfamiliar ? JSON.stringify(report.cause_detail_unfamiliar) : '',
        report.cause_detail_vehicle ? JSON.stringify(report.cause_detail_vehicle) : '',
        // 対策
        report.immediate_action || '',
        report.prevention_proposal || '',
        report.severity_rating || '',
        report.order_id || '',
        report.accident_damage || '',  // ← 追加
        // 管理者対応
        report.manager_comment || '',
        getStatusLabel(report.status),
        report.share_with_all !== null && report.share_with_all !== undefined ? (report.share_with_all ? 'する' : 'しない') : '',
        // タイムスタンプ
        formatDateTimeForCSV(report.created_at),
        formatDateTimeForCSV(report.updated_at),
        formatDateTimeForCSV(report.step2_completed_at)
    ]);
    
    // CSV文字列作成
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // BOM付きでダウンロード（Excel対応）
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().split('T')[0];
    const auth = window.getCurrentAuth ? window.getCurrentAuth() : {};
    const companyName = auth.companyName || '報告データ';
    
    // フィルター情報をファイル名に追加
    const statusFilter = document.getElementById('status-filter').value;
    const categoryFilter = document.getElementById('category-filter').value;
    let filterSuffix = '';
    if (statusFilter || categoryFilter) {
        filterSuffix = '_フィルター済';
    }
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${companyName}_${timestamp}${filterSuffix}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('✅ CSVエクスポート完了:', `${dataToExport.length}件`);
    alert(`✅ CSVファイルをダウンロードしました（${dataToExport.length}件）`);
}

// Excelエクスポート関数
function exportToExcel() {
    // フィルター済みデータが存在すればそれを使用、なければ全データ
    const dataToExport = filteredReports.length > 0 ? filteredReports : allReports;
    
    if (dataToExport.length === 0) {
        alert('エクスポートするデータがありません');
        return;
    }
    
    console.log('📊 Excelエクスポート開始:', { 
        全データ件数: allReports.length, 
        フィルター後件数: filteredReports.length,
        出力件数: dataToExport.length 
    });
    
    // ヘッダー定義（CSVと同じ）
    const headers = [
        '報告ID', '企業ID', '報告種別', '報告者名', '発生日時',
        '発生場所（テキスト）', 'GPS緯度', 'GPS経度', 'エリア詳細',
        '車両種別', '車両詳細', '荷物の種類', '荷物情報',
        '事象カテゴリ', '何が起きたか（カテゴリ）', 'カテゴリ補足メモ', '写真URL',
        // 走行中詳細
        '天気', '道路種別', '走行状況', '相手方', '路面状態', 'ドラレコ有無',
        // 荷役中詳細
        '作業フェーズ', '使用機器', '積載状態', '荷崩れ', '温度帯',
        // 原因分析
        '直接原因', '詳細原因（焦り）', '詳細原因（疲労）', '詳細原因（不慣れ）', '詳細原因（車両）',
        // 対策
        '即時対応', '再発防止策', '重大度', '受注ID', '事故損害',
        // 管理者対応
        '管理者コメント', 'ステータス', '全体共有',
        // タイムスタンプ
        '登録日時', '更新日時', 'STEP2完了日時'
    ];
    
    // データ行作成（CSVと同じロジック）
    const rows = dataToExport.map(report => [
        report.id || '',
        report.company_id || '',
        report.report_type === 'near-miss' ? 'ヒヤリハット' : report.report_type === 'accident' ? '事故' : report.report_type || '',
        report.reporter_name || report.employee_name || '',
        formatDateTimeForCSV(report.occurred_at),
        report.location_text || report.location || '',
        report.location_lat || report.location_gps_lat || '',
        report.location_lng || report.location_gps_lng || '',
        report.area_detail || '',
        report.vehicle_type || '',
        report.vehicle_detail || '',
        report.cargo_type || '',
        report.cargo_info || '',
        report.incident_type || report.incident_category || '',
        Array.isArray(report.categories) ? report.categories.join('; ') : (report.what_happened_category || ''),
        report.memo || report.category_memo || '',
        report.photo_url || (Array.isArray(report.photo_urls) ? report.photo_urls.join('; ') : ''),
        // 走行中詳細
        report.detail_weather || report.weather || '',
        report.detail_road || report.road_type || '',
        report.detail_situation || report.driving_situation || '',
        report.detail_counterpart || report.other_party || '',
        report.road_surface || '',
        report.dashcam !== null && report.dashcam !== undefined ? (report.dashcam ? 'あり' : 'なし') : 
            (report.dashcam_available !== null && report.dashcam_available !== undefined ? (report.dashcam_available ? 'あり' : 'なし') : ''),
        // 荷役中詳細
        report.work_phase || '',
        report.equipment_used || '',
        report.load_status || '',
        report.load_collapse || '',
        report.temperature_zone || '',
        // 原因分析
        Array.isArray(report.direct_causes) ? report.direct_causes.join('; ') : '',
        report.cause_detail_rush ? JSON.stringify(report.cause_detail_rush) : '',
        report.cause_detail_fatigue ? JSON.stringify(report.cause_detail_fatigue) : '',
        report.cause_detail_unfamiliar ? JSON.stringify(report.cause_detail_unfamiliar) : '',
        report.cause_detail_vehicle ? JSON.stringify(report.cause_detail_vehicle) : '',
        // 対策
        report.immediate_action || '',
        report.prevention_proposal || '',
        report.severity_rating || '',
        report.order_id || '',
        report.accident_damage || '',
        // 管理者対応
        report.manager_comment || '',
        getStatusLabel(report.status),
        report.share_with_all !== null && report.share_with_all !== undefined ? (report.share_with_all ? 'する' : 'しない') : '',
        // タイムスタンプ
        formatDateTimeForCSV(report.created_at),
        formatDateTimeForCSV(report.updated_at),
        formatDateTimeForCSV(report.step2_completed_at)
    ]);
    
    // ワークブック作成
    const wb = XLSX.utils.book_new();
    
    // データシート作成
    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // 列幅自動調整
    const colWidths = headers.map((header, i) => {
        const maxLength = Math.max(
            header.length,
            ...rows.map(row => String(row[i] || '').length)
        );
        return { wch: Math.min(maxLength + 2, 50) }; // 最大50文字
    });
    ws['!cols'] = colWidths;
    
    // ヘッダー行のスタイル設定
    const headerRange = XLSX.utils.decode_range(ws['!ref']);
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + "1";
        if (!ws[address]) continue;
        ws[address].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "2563EB" } },
            alignment: { horizontal: "center", vertical: "center" }
        };
    }
    
    XLSX.utils.book_append_sheet(wb, ws, "報告データ");
    
    // サマリーシート作成
    const summaryData = [
        ['項目', '値'],
        ['総報告数', dataToExport.length],
        ['ヒヤリハット', dataToExport.filter(r => r.report_type === 'near-miss').length],
        ['事故', dataToExport.filter(r => r.report_type === 'accident').length],
        ['走行中', dataToExport.filter(r => r.incident_type === 'driving').length],
        ['荷役中', dataToExport.filter(r => r.incident_type === 'loading').length],
        ['エクスポート日時', new Date().toLocaleString('ja-JP')]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 20 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "サマリー");
    
    // ファイル名生成
    const timestamp = new Date().toISOString().split('T')[0];
    const auth = window.getCurrentAuth ? window.getCurrentAuth() : {};
    const companyName = auth.companyName || '報告データ';
    
    const statusFilter = document.getElementById('status-filter').value;
    const categoryFilter = document.getElementById('category-filter').value;
    let filterSuffix = '';
    if (statusFilter || categoryFilter) {
        filterSuffix = '_フィルター済';
    }
    
    const filename = `${companyName}_${timestamp}${filterSuffix}.xlsx`;
    
    // ファイルダウンロード
    XLSX.writeFile(wb, filename);
    
    console.log('✅ Excelエクスポート完了:', `${dataToExport.length}件`);
    alert(`✅ Excelファイルをダウンロードしました（${dataToExport.length}件）\n\nシート構成:\n・報告データ: 全${dataToExport.length}件\n・サマリー: 統計情報`);
}

// CSV用日時フォーマット
function formatDateTimeForCSV(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ステータスラベル取得
function getStatusLabel(status) {
    const labels = {
        'step1_complete': '基本情報のみ',
        'step2_complete': '詳細入力済',
        'confirmed': '確認済',
        'in_progress': '対応中',
        'completed': '完了'
    };
    return labels[status] || status;
}

// モーダル外クリックで閉じる
document.getElementById('detail-modal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// ==========================================
// カスタム列選択機能
// ==========================================

// 全列定義
const ALL_COLUMNS = [
    { key: 'id', label: '報告ID', category: 'basic' },
    { key: 'company_id', label: '企業ID', category: 'basic' },
    { key: 'report_type', label: '報告種別', category: 'basic' },
    { key: 'reporter_name', label: '報告者名', category: 'basic' },
    { key: 'occurred_at', label: '発生日時', category: 'basic' },
    { key: 'location_text', label: '発生場所（テキスト）', category: 'basic' },
    { key: 'location_lat', label: 'GPS緯度', category: 'detailed' },
    { key: 'location_lng', label: 'GPS経度', category: 'detailed' },
    { key: 'area_detail', label: 'エリア詳細', category: 'detailed' },
    { key: 'vehicle_type', label: '車両種別', category: 'basic' },
    { key: 'vehicle_detail', label: '車両詳細', category: 'detailed' },
    { key: 'cargo_type', label: '荷物の種類', category: 'basic' },
    { key: 'cargo_info', label: '荷物情報', category: 'detailed' },
    { key: 'incident_type', label: '事象カテゴリ', category: 'basic' },
    { key: 'categories', label: '何が起きたか（カテゴリ）', category: 'basic' },
    { key: 'memo', label: 'カテゴリ補足メモ', category: 'detailed' },
    { key: 'photo_url', label: '写真URL', category: 'detailed' },
    { key: 'weather', label: '天気', category: 'detailed' },
    { key: 'road_type', label: '道路種別', category: 'detailed' },
    { key: 'driving_situation', label: '走行状況', category: 'detailed' },
    { key: 'other_party', label: '相手方', category: 'detailed' },
    { key: 'road_surface', label: '路面状態', category: 'detailed' },
    { key: 'dashcam', label: 'ドラレコ有無', category: 'detailed' },
    { key: 'work_phase', label: '作業フェーズ', category: 'detailed' },
    { key: 'equipment_used', label: '使用機器', category: 'detailed' },
    { key: 'load_status', label: '積載状態', category: 'detailed' },
    { key: 'load_collapse', label: '荷崩れ', category: 'detailed' },
    { key: 'temperature_zone', label: '温度帯', category: 'detailed' },
    { key: 'direct_causes', label: '直接原因', category: 'basic' },
    { key: 'cause_detail_rush', label: '詳細原因（焦り）', category: 'detailed' },
    { key: 'cause_detail_fatigue', label: '詳細原因（疲労）', category: 'detailed' },
    { key: 'cause_detail_unfamiliar', label: '詳細原因（不慣れ）', category: 'detailed' },
    { key: 'cause_detail_vehicle', label: '詳細原因（車両）', category: 'detailed' },
    { key: 'immediate_action', label: '即時対応', category: 'basic' },
    { key: 'prevention_proposal', label: '再発防止策', category: 'basic' },
    { key: 'severity_rating', label: '重大度', category: 'basic' },
    { key: 'order_id', label: '受注ID', category: 'detailed' },
    { key: 'accident_damage', label: '事故損害', category: 'detailed' },
    { key: 'manager_comment', label: '管理者コメント', category: 'detailed' },
    { key: 'status', label: 'ステータス', category: 'basic' },
    { key: 'share_with_all', label: '全体共有', category: 'basic' },
    { key: 'created_at', label: '登録日時', category: 'basic' },
    { key: 'updated_at', label: '更新日時', category: 'detailed' },
    { key: 'step2_completed_at', label: 'STEP2完了日時', category: 'detailed' }
];

// 選択された列を保存
let selectedColumns = [];

// カスタム列選択モーダルを開く
function openExportColumnsModal() {
    const modal = document.getElementById('export-columns-modal');
    const checkboxesContainer = document.getElementById('columns-checkboxes');
    
    // LocalStorageから前回の選択を復元
    const savedColumns = localStorage.getItem('exportColumns');
    if (savedColumns) {
        selectedColumns = JSON.parse(savedColumns);
    } else {
        // 初回はすべて選択
        selectedColumns = ALL_COLUMNS.map(col => col.key);
    }
    
    // チェックボックスを生成
    checkboxesContainer.innerHTML = ALL_COLUMNS.map(col => `
        <label style="display: flex; align-items: center; padding: 8px; border-radius: 4px; cursor: pointer; background: #f9fafb;">
            <input 
                type="checkbox" 
                value="${col.key}" 
                ${selectedColumns.includes(col.key) ? 'checked' : ''}
                onchange="toggleColumn('${col.key}')"
                style="margin-right: 8px; cursor: pointer;"
            >
            <span style="font-size: 14px;">${col.label}</span>
        </label>
    `).join('');
    
    modal.style.display = 'flex';
}

// カスタム列選択モーダルを閉じる
function closeExportColumnsModal() {
    document.getElementById('export-columns-modal').style.display = 'none';
}

// 列の選択/解除をトグル
function toggleColumn(key) {
    if (selectedColumns.includes(key)) {
        selectedColumns = selectedColumns.filter(k => k !== key);
    } else {
        selectedColumns.push(key);
    }
    // LocalStorageに保存
    localStorage.setItem('exportColumns', JSON.stringify(selectedColumns));
}

// プリセット選択
function selectPreset(preset) {
    switch(preset) {
        case 'basic':
            selectedColumns = ALL_COLUMNS.filter(col => col.category === 'basic').map(col => col.key);
            break;
        case 'detailed':
            selectedColumns = ALL_COLUMNS.map(col => col.key);
            break;
        case 'all':
            selectedColumns = ALL_COLUMNS.map(col => col.key);
            break;
        case 'none':
            selectedColumns = [];
            break;
    }
    
    // チェックボックスを更新
    ALL_COLUMNS.forEach(col => {
        const checkbox = document.querySelector(`input[value="${col.key}"]`);
        if (checkbox) {
            checkbox.checked = selectedColumns.includes(col.key);
        }
    });
    
    // LocalStorageに保存
    localStorage.setItem('exportColumns', JSON.stringify(selectedColumns));
}

// 選択した列でエクスポート実行
function executeExportWithColumns(format) {
    if (selectedColumns.length === 0) {
        alert('エクスポートする列を選択してください');
        return;
    }
    
    closeExportColumnsModal();
    
    // フォーマットに応じてエクスポート
    if (format === 'csv') {
        exportToCSVWithColumns();
    } else if (format === 'excel') {
        exportToExcelWithColumns();
    } else if (format === 'pdf') {
        exportToPDFWithColumns();
    }
}

// 列選択対応のCSVエクスポート
function exportToCSVWithColumns() {
    const dataToExport = filteredReports.length > 0 ? filteredReports : allReports;
    
    if (dataToExport.length === 0) {
        alert('エクスポートするデータがありません');
        return;
    }
    
    // 選択された列のみのヘッダーとデータを生成
    const selectedColumnDefs = ALL_COLUMNS.filter(col => selectedColumns.includes(col.key));
    const headers = selectedColumnDefs.map(col => col.label);
    
    const rows = dataToExport.map(report => 
        selectedColumnDefs.map(col => getColumnValue(report, col.key))
    );
    
    // CSV文字列作成
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // BOM付きでダウンロード
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const filename = generateFilename('csv');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('✅ CSVエクスポート完了:', `${dataToExport.length}件、${selectedColumns.length}列`);
    alert(`✅ CSVファイルをダウンロードしました（${dataToExport.length}件、${selectedColumns.length}列）`);
}

// 列選択対応のExcelエクスポート
function exportToExcelWithColumns() {
    const dataToExport = filteredReports.length > 0 ? filteredReports : allReports;
    
    if (dataToExport.length === 0) {
        alert('エクスポートするデータがありません');
        return;
    }
    
    // 選択された列のみのヘッダーとデータを生成
    const selectedColumnDefs = ALL_COLUMNS.filter(col => selectedColumns.includes(col.key));
    const headers = selectedColumnDefs.map(col => col.label);
    
    const rows = dataToExport.map(report => 
        selectedColumnDefs.map(col => getColumnValue(report, col.key))
    );
    
    // ワークブック作成
    const wb = XLSX.utils.book_new();
    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // 列幅自動調整
    const colWidths = headers.map((header, i) => {
        const maxLength = Math.max(
            header.length,
            ...rows.map(row => String(row[i] || '').length)
        );
        return { wch: Math.min(maxLength + 2, 50) };
    });
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, "報告データ");
    
    // サマリーシート
    const summaryData = [
        ['項目', '値'],
        ['総報告数', dataToExport.length],
        ['出力列数', selectedColumns.length],
        ['エクスポート日時', new Date().toLocaleString('ja-JP')]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 20 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "サマリー");
    
    const filename = generateFilename('xlsx');
    XLSX.writeFile(wb, filename);
    
    console.log('✅ Excelエクスポート完了:', `${dataToExport.length}件、${selectedColumns.length}列`);
    alert(`✅ Excelファイルをダウンロードしました（${dataToExport.length}件、${selectedColumns.length}列）`);
}

// 列選択対応のPDFエクスポート
function exportToPDFWithColumns() {
    const dataToExport = filteredReports.length > 0 ? filteredReports : allReports;
    
    if (dataToExport.length === 0) {
        alert('エクスポートするデータがありません');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    // 日本語フォント設定（簡易版）
    doc.setFont('helvetica');
    
    // タイトル
    const auth = window.getCurrentAuth ? window.getCurrentAuth() : {};
    const companyName = auth.companyName || '報告データ';
    doc.setFontSize(16);
    doc.text(`${companyName} - ヒヤリハット報告`, 14, 15);
    
    // 選択された列のみのヘッダーとデータを生成
    const selectedColumnDefs = ALL_COLUMNS.filter(col => selectedColumns.includes(col.key));
    const headers = selectedColumnDefs.map(col => col.label);
    
    const rows = dataToExport.map(report => 
        selectedColumnDefs.map(col => getColumnValue(report, col.key))
    );
    
    // テーブル生成
    doc.autoTable({
        head: [headers],
        body: rows,
        startY: 25,
        styles: {
            font: 'helvetica',
            fontSize: 8,
            cellPadding: 2
        },
        headStyles: {
            fillColor: [37, 99, 235],
            textColor: 255,
            fontStyle: 'bold'
        },
        columnStyles: headers.reduce((acc, _, i) => {
            acc[i] = { cellWidth: 'auto' };
            return acc;
        }, {}),
        margin: { top: 25 }
    });
    
    const filename = generateFilename('pdf');
    doc.save(filename);
    
    console.log('✅ PDFエクスポート完了:', `${dataToExport.length}件、${selectedColumns.length}列`);
    alert(`✅ PDFファイルをダウンロードしました（${dataToExport.length}件、${selectedColumns.length}列）`);
}

// 列の値を取得
function getColumnValue(report, key) {
    switch(key) {
        case 'id': return report.id || '';
        case 'company_id': return report.company_id || '';
        case 'report_type': 
            return report.report_type === 'near-miss' ? 'ヒヤリハット' : 
                   report.report_type === 'accident' ? '事故' : report.report_type || '';
        case 'reporter_name': return report.reporter_name || report.employee_name || '';
        case 'occurred_at': return formatDateTimeForCSV(report.occurred_at);
        case 'location_text': return report.location_text || report.location || '';
        case 'location_lat': return report.location_lat || report.location_gps_lat || '';
        case 'location_lng': return report.location_lng || report.location_gps_lng || '';
        case 'area_detail': return report.area_detail || '';
        case 'vehicle_type': return report.vehicle_type || '';
        case 'vehicle_detail': return report.vehicle_detail || '';
        case 'cargo_type': return report.cargo_type || '';
        case 'cargo_info': return report.cargo_info || '';
        case 'incident_type': return report.incident_type || report.incident_category || '';
        case 'categories': 
            return Array.isArray(report.categories) ? report.categories.join('; ') : 
                   (report.what_happened_category || '');
        case 'memo': return report.memo || report.category_memo || '';
        case 'photo_url': 
            return report.photo_url || 
                   (Array.isArray(report.photo_urls) ? report.photo_urls.join('; ') : '');
        case 'weather': return report.detail_weather || report.weather || '';
        case 'road_type': return report.detail_road || report.road_type || '';
        case 'driving_situation': return report.detail_situation || report.driving_situation || '';
        case 'other_party': return report.detail_counterpart || report.other_party || '';
        case 'road_surface': return report.road_surface || '';
        case 'dashcam': 
            return report.dashcam !== null && report.dashcam !== undefined ? 
                   (report.dashcam ? 'あり' : 'なし') : 
                   (report.dashcam_available !== null && report.dashcam_available !== undefined ? 
                    (report.dashcam_available ? 'あり' : 'なし') : '');
        case 'work_phase': return report.work_phase || '';
        case 'equipment_used': return report.equipment_used || '';
        case 'load_status': return report.load_status || '';
        case 'load_collapse': return report.load_collapse || '';
        case 'temperature_zone': return report.temperature_zone || '';
        case 'direct_causes': 
            return Array.isArray(report.direct_causes) ? report.direct_causes.join('; ') : '';
        case 'cause_detail_rush': 
            return report.cause_detail_rush ? JSON.stringify(report.cause_detail_rush) : '';
        case 'cause_detail_fatigue': 
            return report.cause_detail_fatigue ? JSON.stringify(report.cause_detail_fatigue) : '';
        case 'cause_detail_unfamiliar': 
            return report.cause_detail_unfamiliar ? JSON.stringify(report.cause_detail_unfamiliar) : '';
        case 'cause_detail_vehicle': 
            return report.cause_detail_vehicle ? JSON.stringify(report.cause_detail_vehicle) : '';
        case 'immediate_action': return report.immediate_action || '';
        case 'prevention_proposal': return report.prevention_proposal || '';
        case 'severity_rating': return report.severity_rating || '';
        case 'order_id': return report.order_id || '';
        case 'accident_damage': return report.accident_damage || '';
        case 'manager_comment': return report.manager_comment || '';
        case 'status': return getStatusLabel(report.status);
        case 'share_with_all': 
            return report.share_with_all !== null && report.share_with_all !== undefined ? 
                   (report.share_with_all ? 'する' : 'しない') : '';
        case 'created_at': return formatDateTimeForCSV(report.created_at);
        case 'updated_at': return formatDateTimeForCSV(report.updated_at);
        case 'step2_completed_at': return formatDateTimeForCSV(report.step2_completed_at);
        default: return '';
    }
}

// ファイル名生成
function generateFilename(extension) {
    const timestamp = new Date().toISOString().split('T')[0];
    const auth = window.getCurrentAuth ? window.getCurrentAuth() : {};
    const companyName = auth.companyName || '報告データ';
    
    const statusFilter = document.getElementById('status-filter').value;
    const categoryFilter = document.getElementById('category-filter').value;
    let filterSuffix = '';
    if (statusFilter || categoryFilter) {
        filterSuffix = '_フィルター済';
    }
    
    return `${companyName}_${timestamp}${filterSuffix}.${extension}`;
}

// モーダル外クリックで閉じる
document.getElementById('export-columns-modal')?.addEventListener('click', function(e) {
    if (e.target === this) {
        closeExportColumnsModal();
    }
});
