// ============================================
// 動的マルチテナント認証システム（Supabase Auth）
// ============================================

// 現在の認証情報
let currentAuth = {
    companyCode: null,
    companyId: null,
    companyName: null,
    authenticated: false
};

/**
 * 企業コード + パスワードで認証
 * @param {string} companyCode - 企業コード
 * @param {string} password - パスワード
 * @returns {Promise<boolean>} - 認証成功/失敗
 */
async function authenticateCompany(companyCode, password) {
    try {
        console.log('🔐 認証開始:', companyCode);
        
        // Supabaseから企業情報を取得
        if (!window.supabaseClient) {
            console.error('❌ Supabaseクライアントが初期化されていません');
            return false;
        }
        
        const { data, error } = await window.supabaseClient
            .from('companies')
            .select('id, company_code, company_name')
            .eq('company_code', companyCode)
            .single();
        
        if (error || !data) {
            console.error('❌ 企業が見つかりません:', companyCode);
            showAccessDenied('企業コードが正しくありません。');
            return false;
        }
        
        console.log('✅ 企業情報取得成功:', data);
        
        // LocalStorage からパスワードを取得
        const savedPasswords = JSON.parse(localStorage.getItem('company_passwords') || '{}');
        const savedPassword = savedPasswords[companyCode];
        
        if (!savedPassword) {
            console.error('❌ パスワードが見つかりません:', companyCode);
            showAccessDenied('この企業のパスワードが設定されていません。\n管理者にお問い合わせください。');
            return false;
        }
        
        // パスワード検証
        if (password !== savedPassword) {
            console.error('❌ パスワードが間違っています');
            showAccessDenied('パスワードが間違っています。');
            return false;
        }
        
        console.log('✅ パスワード検証成功');
        
        // 認証情報を保存
        currentAuth = {
            companyCode: data.company_code,
            companyId: data.id,
            companyName: data.company_name,
            authenticated: true
        };
        
        console.log('📝 認証情報を作成:', currentAuth);
        
        // Session Storage に保存
        try {
            sessionStorage.setItem('company_auth', JSON.stringify(currentAuth));
            console.log('✅ セッション保存成功:', currentAuth);
        } catch (storageError) {
            console.error('❌ セッション保存エラー:', storageError);
        }
        
        alert(`ログインしました\n企業: ${currentAuth.companyName}`);
        console.log('✅ ログイン成功:', currentAuth);
        
        return true;
        
    } catch (error) {
        console.error('❌ 認証エラー:', error);
        showAccessDenied('認証処理でエラーが発生しました。\nもう一度お試しください。');
        return false;
    }
}

/**
 * セッション認証チェック
 * @returns {Promise<boolean>}
 */
async function checkAuthentication() {
    try {
        // Session Storage から認証情報を取得
        const authData = sessionStorage.getItem('company_auth');
        
        if (authData) {
            currentAuth = JSON.parse(authData);
            console.log('✅ セッション認証成功:', currentAuth);
            return true;
        }
        
        console.log('❌ セッション認証情報なし');
        showAccessDenied('ログインが必要です。');
        return false;
        
    } catch (error) {
        console.error('❌ セッション認証エラー:', error);
        showAccessDenied('認証情報の取得に失敗しました。');
        return false;
    }
}

/**
 * アクセス拒否画面表示
 */
function showAccessDenied(message = 'この画面にアクセスするにはログインが必要です。') {
    alert(message);
    
    // ログイン画面にリダイレクト
    if (window.location.pathname !== '/index.html' && 
        !window.location.pathname.endsWith('index.html')) {
        window.location.href = 'index.html';
    }
}

/**
 * 現在の認証情報を取得
 */
function getCurrentAuth() {
    return currentAuth;
}

/**
 * ログアウト
 */
function logout() {
    sessionStorage.removeItem('company_auth');
    currentAuth = {
        companyCode: null,
        companyId: null,
        companyName: null,
        authenticated: false
    };
    window.location.href = 'index.html';
}

// グローバル関数として公開
if (typeof window !== 'undefined') {
    window.authenticateCompany = authenticateCompany;
    window.checkAuthentication = checkAuthentication;
    window.getCurrentAuth = getCurrentAuth;
    window.logout = logout;
}
