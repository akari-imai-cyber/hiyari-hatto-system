// ============================================
// アクセスログ・監査ログシステム
// ============================================

/**
 * アクセスログを記録
 * @param {string} action - 操作種別（login, logout, view_dashboard, create_report, etc.）
 * @param {string} resource - 操作対象（reports, dashboard, analytics, admin）
 * @param {string} status - 結果（success, failed, error）
 * @param {string} errorMessage - エラーメッセージ（オプション）
 */
async function logAccess(action, resource = null, status = 'success', errorMessage = null) {
    try {
        // 現在の認証情報取得
        const auth = JSON.parse(sessionStorage.getItem('company_auth') || '{}');
        
        // IPアドレス取得（外部API使用）
        let ipAddress = 'unknown';
        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            ipAddress = ipData.ip;
        } catch (e) {
            console.warn('IP取得失敗:', e);
        }
        
        // ログデータ作成
        const logData = {
            company_id: auth.companyId || null,
            user_identifier: auth.companyCode || 'anonymous',
            action: action,
            resource: resource,
            ip_address: ipAddress,
            user_agent: navigator.userAgent,
            status: status,
            error_message: errorMessage,
            created_at: new Date().toISOString()
        };
        
        console.log('📊 アクセスログ記録:', action, status);
        
        // Supabaseに保存
        if (window.supabaseClient) {
            const { error } = await window.supabaseClient
                .from('access_logs')
                .insert([logData]);
            
            if (error) {
                console.error('❌ ログ記録失敗:', error);
            } else {
                console.log('✅ ログ記録成功');
            }
        }
        
    } catch (error) {
        console.error('❌ ログ記録エラー:', error);
    }
}

/**
 * ログイン成功時
 */
function logLogin(companyCode) {
    logAccess('login', 'authentication', 'success');
}

/**
 * ログイン失敗時
 */
function logLoginFailed(companyCode, reason) {
    logAccess('login', 'authentication', 'failed', reason);
}

/**
 * ログアウト時
 */
function logLogout() {
    logAccess('logout', 'authentication', 'success');
}

/**
 * ページ閲覧時
 */
function logPageView(pageName) {
    const resourceMap = {
        'index.html': 'report_form',
        'dashboard.html': 'dashboard',
        'analytics.html': 'analytics',
        'admin.html': 'admin_panel'
    };
    logAccess('page_view', resourceMap[pageName] || pageName, 'success');
}

/**
 * 報告作成時
 */
function logCreateReport(reportType) {
    logAccess('create_report', 'incidents', 'success', `Type: ${reportType}`);
}

/**
 * 報告更新時
 */
function logUpdateReport(reportId) {
    logAccess('update_report', 'incidents', 'success', `ID: ${reportId}`);
}

/**
 * 報告削除時
 */
function logDeleteReport(reportId) {
    logAccess('delete_report', 'incidents', 'success', `ID: ${reportId}`);
}

/**
 * 企業追加時（管理者）
 */
function logAddCompany(companyCode) {
    logAccess('add_company', 'companies', 'success', `Code: ${companyCode}`);
}

/**
 * 企業削除時（管理者）
 */
function logDeleteCompany(companyCode) {
    logAccess('delete_company', 'companies', 'success', `Code: ${companyCode}`);
}

/**
 * エラー発生時
 */
function logError(action, resource, errorMessage) {
    logAccess(action, resource, 'error', errorMessage);
}

// ページ読み込み時に自動でページビューを記録
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        const pageName = window.location.pathname.split('/').pop() || 'index.html';
        logPageView(pageName);
    });
}
