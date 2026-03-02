// ============================================
// マルチテナント認証システム
// ============================================

// 企業別認証情報
const COMPANY_CREDENTIALS = {
    '1111-company': {
        password: '1111',
        companyId: null,  // Supabaseから取得
        companyName: '1111株式会社'
    },
    'nlp-test': {
        password: 'nlp2026',
        companyId: null,
        companyName: 'NLP物流株式会社'
    },
    'abc-logistics': {
        password: 'abc2026',
        companyId: null,
        companyName: 'ABC物流株式会社'
    },
    'xyz-transport': {
        password: 'xyz2026',
        companyId: null,
        companyName: 'XYZ運送株式会社'
    }
};

// 現在の認証情報
let currentAuth = {
    companyCode: null,
    companyId: null,
    companyName: null,
    authenticated: false
};

// 認証チェック（既存の認証コードを置き換え）
async function checkAuthentication() {
    // セッションストレージから認証情報を取得
    const savedAuth = sessionStorage.getItem('company_auth');
    
    if (savedAuth) {
        currentAuth = JSON.parse(savedAuth);
        console.log('✅ 既存セッション:', currentAuth.companyName);
        
        // カスタムイベントを発火して認証完了を通知
        window.dispatchEvent(new CustomEvent('authComplete', { detail: currentAuth }));
        console.log('📢 authComplete イベント発火（セッション復元）');
        
        return true;
    }
    
    // 認証ダイアログ表示
    let companyCode = prompt('企業コードを入力してください\n\n例:\n- nlp-test\n- 1111-company\n- 登録時に発行されたコード');
    
    if (!companyCode || companyCode.trim() === '') {
        showAccessDenied('企業コードが入力されていません。');
        return false;
    }
    
    companyCode = companyCode.trim().toLowerCase();
    
    // パスワード確認（企業名はSupabaseから取得予定）
    let password = prompt(`パスワードを入力してください\n企業コード: ${companyCode}`);
    
    if (!password || password.trim() === '') {
        showAccessDenied('パスワードが入力されていません。');
        return false;
    }
    
    // Supabaseから企業情報を取得
    try {
        console.log('🔍 企業情報取得開始:', companyCode);
        
        // Supabaseクライアント初期化チェック
        if (!window.supabaseClient) {
            console.error('❌ Supabaseクライアントが未初期化');
            if (typeof initializeApp === 'function') {
                console.log('🔧 Supabaseクライアントを初期化中...');
                initializeApp();
            }
        }
        
        if (!window.supabaseClient) {
            console.error('❌ Supabaseクライアントの初期化に失敗');
            alert('システムエラー: データベース接続に失敗しました。\nページを再読み込みしてください。');
            return false;
        }
        
        // Supabaseから企業データ取得
        const { data: companyData, error: companyError } = await window.supabaseClient
            .from('companies')
            .select('id, company_code, company_name')
            .eq('company_code', companyCode)
            .single();
        
        if (companyError || !companyData) {
            console.error('❌ 企業が見つかりません:', companyCode, companyError);
            showAccessDenied('企業コードが正しくありません。');
            return false;
        }
        
        console.log('✅ 企業情報取得成功:', companyData);
        
        // パスワード検証（2段階：COMPANY_CREDENTIALS → LocalStorage）
        let isPasswordValid = false;
        
        // 方法1: COMPANY_CREDENTIALS（既存企業用）
        if (COMPANY_CREDENTIALS[companyCode] && COMPANY_CREDENTIALS[companyCode].password === password) {
            isPasswordValid = true;
            console.log('✅ COMPANY_CREDENTIALS でパスワード検証成功');
        }
        
        // 方法2: LocalStorage（新規登録企業用）
        if (!isPasswordValid) {
            const savedPasswords = JSON.parse(localStorage.getItem('company_passwords') || '{}');
            if (savedPasswords[companyCode] === password) {
                isPasswordValid = true;
                console.log('✅ LocalStorage でパスワード検証成功');
            }
        }
        
        if (!isPasswordValid) {
            console.error('❌ パスワードが間違っています');
            showAccessDenied('パスワードが間違っています。');
            return false;
        }
        
        // 認証情報を保存
        currentAuth = {
            companyCode: companyData.company_code,
            companyId: companyData.id,
            companyName: companyData.company_name,
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
        
        // カスタムイベントを発火して認証完了を通知
        window.dispatchEvent(new CustomEvent('authComplete', { detail: currentAuth }));
        console.log('📢 authComplete イベント発火');
        
        return true;
        
    } catch (error) {
        console.error('❌ 認証処理エラー:', error);
        console.error('エラー詳細:', error.message, error.stack);
        
        // 認証情報が設定されている場合はセッションを保存してから続行
        if (currentAuth && currentAuth.authenticated) {
            console.log('⚠️ エラーが発生しましたが、認証は成功しています');
            try {
                sessionStorage.setItem('company_auth', JSON.stringify(currentAuth));
                console.log('✅ セッション保存成功（エラー後）:', currentAuth);
            } catch (storageError) {
                console.error('❌ セッション保存エラー:', storageError);
            }
            return true;
        }
        
        // 認証情報が設定されていない場合のみエラーを表示
        alert(`認証処理中にエラーが発生しました。\n\nエラー内容: ${error.message}\n\nコンソールを確認してください。`);
        console.error('🚨 認証完全失敗');
        console.error('🚨 エラースタック:', error.stack);
        return false;
    }
}

// Supabaseから企業IDを取得
async function getCompanyId(companyCode) {
    try {
        // supabaseClient がまだ初期化されていない場合は初期化
        if (!window.supabaseClient) {
            console.log('🔧 Supabaseクライアントを初期化中...');
            if (typeof initializeApp === 'function') {
                const result = initializeApp();
                console.log('🔧 initializeApp() 実行結果:', result);
                
                // 初期化後に再度確認
                if (!window.supabaseClient) {
                    console.error('❌ Supabaseクライアントの初期化に失敗しました');
                    console.error('❌ window.supabaseClient is still undefined');
                    console.error('❌ SUPABASE_CONFIG:', window.SUPABASE_CONFIG);
                    console.error('❌ window.supabase:', window.supabase);
                    return null;
                }
            } else {
                console.error('❌ initializeApp関数が見つかりません');
                return null;
            }
        }
        
        console.log('📡 Supabaseクエリ実行中... company_code:', companyCode);
        console.log('📡 supabaseClient:', window.supabaseClient);
        
        const { data, error } = await window.supabaseClient
            .from('companies')
            .select('id')
            .eq('company_code', companyCode)
            .single();
        
        if (error) {
            console.error('❌ Supabaseエラー:', error);
            console.error('❌ エラー詳細:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });
            return null;
        }
        
        if (!data) {
            console.error('❌ 企業データが見つかりません:', companyCode);
            return null;
        }
        
        console.log('✅ 企業ID取得成功:', data.id);
        return data.id;
        
    } catch (error) {
        console.error('❌ 企業ID取得エラー:', error);
        console.error('❌ エラー詳細:', error.message, error.stack);
        return null;
    }
}

// アクセス拒否画面を表示
function showAccessDenied(message) {
    console.log('❌ アクセス拒否:', message);
    alert(message);
    
    // ページがすでに読み込まれている場合は即座に実行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', replacePageWithDeniedMessage);
    } else {
        replacePageWithDeniedMessage();
    }
    
    function replacePageWithDeniedMessage() {
        document.body.innerHTML = `
            <div style="text-align:center;padding:50px;font-family:'Noto Sans JP',sans-serif;">
                <h1 style="color:#d32f2f;">🔒 アクセスが拒否されました</h1>
                <p style="color:#666;font-size:18px;">${message}</p>
                <p style="color:#999;margin-top:20px;">正しい企業コード/パスワードでアクセスしてください。</p>
                <p style="margin-top:30px;">
                    <a href="${window.location.href}" 
                       style="background:#00ad9f;color:white;padding:15px 30px;text-decoration:none;border-radius:5px;display:inline-block;">
                        再試行
                    </a>
                </p>
            </div>
        `;
    }
    
    throw new Error('Access denied');
}

// 現在の認証情報を取得
function getCurrentAuth() {
    return currentAuth;
}

// ログアウト
function logout() {
    sessionStorage.removeItem('company_auth');
    currentAuth = {
        companyCode: null,
        companyId: null,
        companyName: null,
        authenticated: false
    };
    window.location.reload();
}

// グローバルに公開
window.checkAuthentication = checkAuthentication;
window.getCurrentAuth = getCurrentAuth;
window.logout = logout;
