// ============================================
// Supabase Auth 認証システム
// ============================================

// 現在の認証情報
let currentAuth = {
    userId: null,
    email: null,
    companyCode: null,
    companyId: null,
    companyName: null,
    role: null,
    authenticated: false
};

// 認証チェック
async function checkAuthentication() {
    console.log('🔐 認証チェック開始');
    
    // Supabase クライアント初期化
    if (!window.supabaseClient) {
        console.error('❌ Supabase クライアントが未初期化');
        if (typeof initializeApp === 'function') {
            initializeApp();
        }
    }
    
    if (!window.supabaseClient) {
        alert('システムエラー: 初期化に失敗しました');
        return false;
    }
    
    // 既存のセッションを確認
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    
    if (session) {
        console.log('✅ セッション存在:', session.user.email);
        
        // プロフィール情報を取得
        const { data: profile, error } = await window.supabaseClient
            .from('profiles')
            .select('role, company_id, email')
            .eq('id', session.user.id)
            .single();
        
        if (error || !profile) {
            console.error('❌ プロフィール取得エラー:', error);
            await window.supabaseClient.auth.signOut();
            showLoginDialog();
            return false;
        }
        
        // 🔑 管理者の場合（先にチェック）
        if (profile.role === 'admin') {
            currentAuth = {
                userId: session.user.id,
                email: session.user.email,
                companyCode: null,
                companyId: null,
                companyName: '管理者',
                role: 'admin',
                authenticated: true
            };
            
            console.log('✅ 管理者認証済み:', currentAuth);
            window.dispatchEvent(new CustomEvent('authComplete', { detail: currentAuth }));
            return true;
        }
        
        // 👥 企業ユーザーの場合（company_id が必要）
        if (profile.company_id) {
            const { data: company } = await window.supabaseClient
                .from('companies')
                .select('company_code, company_name')
                .eq('id', profile.company_id)
                .single();
            
            if (company) {
                currentAuth = {
                    userId: session.user.id,
                    email: session.user.email,
                    companyCode: company.company_code,
                    companyId: profile.company_id,
                    companyName: company.company_name,
                    role: profile.role,
                    authenticated: true
                };
                
                console.log('✅ 認証済み:', currentAuth);
                
                // カスタムイベントを発火
                window.dispatchEvent(new CustomEvent('authComplete', { detail: currentAuth }));
                
                return true;
            }
        }
        
        console.error('❌ 企業情報が不完全');
        await window.supabaseClient.auth.signOut();
        showLoginDialog();
        return false;
    }
    
    // セッションが無い場合はログインダイアログ
    showLoginDialog();
    return false;
}

// ログインダイアログを表示
function showLoginDialog() {
    // ログインフォームを表示
    const loginOverlay = document.getElementById('login-overlay');
    if (loginOverlay) {
        loginOverlay.style.display = 'flex';
    }
}

// ログイン処理
async function performLogin(emailInput, password) {
    try {
        console.log('🔐 ログイン試行:', emailInput);
        
        // 企業コードの場合は @company.local を追加
        let email = emailInput;
        if (!emailInput.includes('@')) {
            email = emailInput + '@company.local';
            console.log('📧 メールアドレスに変換:', email);
        }
        
        // Supabase Auth でログイン
        const { data: authData, error: authError } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (authError) {
            console.error('❌ 認証エラー:', authError);
            alert('認証に失敗しました。\n企業コード または パスワードが正しくありません。');
            showAccessDenied('企業コード または パスワードが正しくありません。');
            return;
        }
        
        console.log('✅ 認証成功:', authData.user.email);
        
        // プロフィール情報を取得
        const { data: profile, error: profileError } = await window.supabaseClient
            .from('profiles')
            .select('role, company_id')
            .eq('id', authData.user.id)
            .single();
        
        if (profileError || !profile) {
            console.error('❌ プロフィール取得エラー:', profileError);
            await window.supabaseClient.auth.signOut();
            alert('ユーザー情報の取得に失敗しました。');
            showAccessDenied('ユーザー情報の取得に失敗しました。');
            return;
        }
        
        // 🔑 管理者の場合（先にチェック）
        if (profile.role === 'admin') {
            showLoginMessage('✅ 管理者としてログインしました。画面を読み込み中...', 'success');
            console.log('✅ 管理者ログイン成功:', authData.user.email);
            setTimeout(() => {
                location.reload(); // ページをリロードして認証状態を反映
            }, 1000);
            return;
        }
        
        // 👥 企業ユーザーの場合（company_id が必要）
        if (profile.company_id) {
            const { data: company } = await window.supabaseClient
                .from('companies')
                .select('company_code, company_name')
                .eq('id', profile.company_id)
                .single();
            
            if (company) {
                showLoginMessage(`✅ ログインしました（企業: ${company.company_name}）画面を読み込み中...`, 'success');
                console.log('✅ ログイン成功:', company.company_name);
                setTimeout(() => {
                    location.reload(); // ページをリロードして認証状態を反映
                }, 1000);
                return;
            }
        }

        
        console.error('❌ 企業情報が見つかりません');
        await window.supabaseClient.auth.signOut();
        alert('企業情報の取得に失敗しました。');
        showAccessDenied('企業情報の取得に失敗しました。');
    } catch (error) {
        console.error('❌ ログインエラー:', error);
        showLoginMessage('ログイン処理中にエラーが発生しました。', 'error');
    }


// フォームからのログイン処理
async function handleLoginSubmit(event) {
    event.preventDefault();
    
    const emailInput = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('login-submit-btn');
    const messageEl = document.getElementById('login-message');
    
    if (!emailInput || !password) {
        showLoginMessage('メールアドレスとパスワードを入力してください', 'error');
        return;
    }
    
    // ボタンを無効化
    submitBtn.disabled = true;
    submitBtn.textContent = 'ログイン中...';
    
    // ログイン実行
    await performLogin(emailInput, password);
}

// パスワードリセット処理
async function handlePasswordReset(event) {
    event.preventDefault();
    
    const resetEmail = document.getElementById('reset-email').value.trim();
    const submitBtn = document.getElementById('reset-submit-btn');
    const messageEl = document.getElementById('reset-message');
    
    if (!resetEmail) {
        showResetMessage('メールアドレスを入力してください', 'error');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = '送信中...';
    
    try {
        // Supabase パスワードリセットメール送信
        const { error } = await window.supabaseClient.auth.resetPasswordForEmail(resetEmail, {
            redirectTo: `${window.location.origin}/reset-password.html`
        });
        
        if (error) throw error;
        
        showResetMessage('✅ パスワードリセットメールを送信しました。メールをご確認ください。', 'success');
        
        // 3秒後にログイン画面に戻る
        setTimeout(() => {
            showLoginForm();
        }, 3000);
        
    } catch (error) {
        console.error('パスワードリセットエラー:', error);
        showResetMessage('❌ メール送信に失敗しました: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'リセットメールを送信';
    }
}

// ログインメッセージ表示
function showLoginMessage(text, type) {
    const messageEl = document.getElementById('login-message');
    if (messageEl) {
        messageEl.textContent = text;
        messageEl.className = `message ${type} show`;
    }
}

// リセットメッセージ表示
function showResetMessage(text, type) {
    const messageEl = document.getElementById('reset-message');
    if (messageEl) {
        messageEl.textContent = text;
        messageEl.className = `message ${type} show`;
    }
}

// ログインフォーム表示
function showLoginForm() {
    document.getElementById('login-form-container').style.display = 'block';
    document.getElementById('reset-form-container').style.display = 'none';
    document.getElementById('login-message').className = 'message';
}

// パスワードリセットフォーム表示
function showResetForm() {
    document.getElementById('login-form-container').style.display = 'none';
    document.getElementById('reset-form-container').style.display = 'block';
    document.getElementById('reset-message').className = 'message';
        
    } catch (error) {
        console.error('❌ ログインエラー:', error);
        alert('ログイン処理中にエラーが発生しました。');
        showAccessDenied('ログイン処理中にエラーが発生しました。');
    }
}

// アクセス拒否画面を表示
function showAccessDenied(message) {
    console.log('❌ アクセス拒否:', message);
    document.body.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <div style="text-align: center; color: white; padding: 40px; background: rgba(255,255,255,0.1); border-radius: 20px;">
                <div style="font-size: 80px; margin-bottom: 20px;">🔒</div>
                <h1 style="font-size: 2rem; margin-bottom: 10px;">アクセスが拒否されました</h1>
                <p style="font-size: 1.1rem; margin-bottom: 30px;">${message}</p>
                <button onclick="location.reload()" style="padding: 15px 30px; font-size: 1rem; background: white; color: #667eea; border: none; border-radius: 10px; cursor: pointer; font-weight: 600;">再試行</button>
            </div>
        </div>
    `;
}

// 現在の認証情報を取得
function getCurrentAuth() {
    return currentAuth;
}

// ログアウト
async function logout() {
    await window.supabaseClient.auth.signOut();
    currentAuth = {
        userId: null,
        email: null,
        companyCode: null,
        companyId: null,
        companyName: null,
        role: null,
        authenticated: false
    };
    location.reload();
}

// グローバルに公開
window.checkAuthentication = checkAuthentication;
window.getCurrentAuth = getCurrentAuth;
window.logout = logout;
