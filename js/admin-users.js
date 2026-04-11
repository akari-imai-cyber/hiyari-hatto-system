/**
 * ユーザー管理画面のロジック
 */

// グローバル変数
let currentCompanyId = null;
let currentUserRole = null;

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('👤 ユーザー管理画面: 初期化開始');
    
    // Supabase初期化
    if (typeof initializeApp === 'function') {
        await initializeApp();
    }
    
    // 認証が完了するまで待つ
    if (typeof checkAuthentication === 'function') {
        const authResult = await checkAuthentication();
        if (!authResult) {
            console.error('❌ 認証失敗');
            return;
        }
    }
    
    // authComplete イベントを待つ
    const waitForAuth = () => {
        return new Promise((resolve) => {
            // 既に認証済みの場合
            const auth = window.getCurrentAuth ? window.getCurrentAuth() : null;
            if (auth && auth.authenticated) {
                console.log('✅ 認証済み:', auth);
                resolve(auth);
                return;
            }
            
            // authComplete イベントを待つ
            window.addEventListener('authComplete', (event) => {
                console.log('✅ authComplete イベント受信:', event.detail);
                resolve(event.detail);
            });
            
            // タイムアウト（5秒）
            setTimeout(() => {
                console.error('❌ 認証タイムアウト');
                window.location.href = 'index.html';
            }, 5000);
        });
    };
    
    const auth = await waitForAuth();
    
    // 管理者権限チェック
    if (auth.role !== 'company_admin' && auth.role !== 'admin') {
        alert('❌ この画面にアクセスする権限がありません。');
        window.location.href = 'index.html';
        return;
    }
    
    currentCompanyId = auth.companyId;
    currentUserRole = auth.role;
    
    console.log('👤 現在の権限:', { companyId: currentCompanyId, role: currentUserRole });
    
    // ユーザー一覧を読み込み
    await loadUsers();
});

// ユーザー一覧を読み込み
async function loadUsers() {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">読み込み中...</td></tr>';
    
    try {
        const supabaseClient = window.supabaseClient || window.supabase;
        
    // profiles テーブルからユーザーを取得
let query = supabaseClient
    .from('profiles')
    .select('*');

// admin でない場合のみ company_id でフィルタリング
if (currentUserRole !== 'admin' && currentCompanyId) {
    query = query.eq('company_id', currentCompanyId);
}

const { data: users, error } = await query.order('created_at', { ascending: false });

        
        if (error) throw error;
        
        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">ユーザーが登録されていません</td></tr>';
            return;
        }
        
        // テーブルに表示
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.email || '未設定'}</td>
                <td>
                    <span class="badge ${user.role === 'company_admin' ? 'badge-admin' : 'badge-user'}">
                        ${user.role === 'company_admin' ? '管理者' : '一般ユーザー'}
                    </span>
                </td>
                <td>${new Date(user.created_at).toLocaleDateString('ja-JP')}</td>
                <td>
                    ${user.role !== 'company_admin' ? `<button class="btn-delete" onclick="deleteUser('${user.id}', '${user.email}')">削除</button>` : ''}
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('❌ ユーザー読み込みエラー:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #ef4444;">ユーザーの読み込みに失敗しました</td></tr>';
    }
}

// モーダルを開く
function openAddUserModal() {
    const modal = document.getElementById('add-user-modal');
    modal.classList.add('active');
    
    // フォームをリセット
    document.getElementById('add-user-form').reset();
    document.getElementById('success-message').classList.remove('active');
}

// モーダルを閉じる
function closeAddUserModal() {
    const modal = document.getElementById('add-user-modal');
    modal.classList.remove('active');
}

// ユーザー追加フォーム送信
document.getElementById('add-user-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submit-btn');
    const email = document.getElementById('user-email').value.trim();
    const password = document.getElementById('user-password').value.trim();
    const role = document.getElementById('user-role').value;
    
    // バリデーション
    if (!email || !password) {
        alert('❌ すべてのフィールドを入力してください。');
        return;
    }
    
    // パスワード強度チェック
    if (password.length < 8) {
        alert('❌ パスワードは8文字以上にしてください。');
        return;
    }
    
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        alert('❌ パスワードは英大文字・小文字・数字を含む必要があります。');
        return;
    }
    
    // ボタン無効化
    submitBtn.disabled = true;
    submitBtn.textContent = '登録中...';
    
    try {
        const supabaseClient = window.supabaseClient || window.supabase;
        
        // 1. Supabase Auth でユーザーを作成
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: `${window.location.origin}/index.html`,
                data: {
                    role: role,
                    company_id: currentCompanyId
                }
            }
        });
        
        if (authError) {
            console.error('❌ Auth登録エラー:', authError);
            
            let errorMessage = '登録に失敗しました。';
            if (authError.message.includes('already registered')) {
                errorMessage = 'このメールアドレスは既に登録されています。';
            }
            alert(`❌ ${errorMessage}`);
            
            submitBtn.disabled = false;
            submitBtn.textContent = '登録する';
            return;
        }
        
        console.log('✅ Auth登録成功:', authData);
        
        // 2. profiles テーブルにユーザー情報を登録
        const { data: profileData, error: profileError } = await supabaseClient
            .from('profiles')
            .insert({
                id: authData.user.id,
                email: email,
                role: role,
                company_id: currentCompanyId
            })
            .select()
            .single();
        
        if (profileError) {
            console.error('❌ プロフィール登録エラー:', profileError);
            alert('❌ ユーザー情報の登録に失敗しました。');
            
            submitBtn.disabled = false;
            submitBtn.textContent = '登録する';
            return;
        }
        
        console.log('✅ プロフィール登録成功:', profileData);
        
        // 成功メッセージを表示
        const successMessage = document.getElementById('success-message');
        const loginInfo = document.getElementById('login-info');
        
        loginInfo.innerHTML = `
            <p><strong>メールアドレス:</strong> ${email}</p>
            <p><strong>初期パスワード:</strong> ${password}</p>
            <p><strong>ロール:</strong> ${role === 'company_admin' ? '管理者' : '一般ユーザー'}</p>
        `;
        
        successMessage.classList.add('active');
        
        // フォームを非表示
        document.getElementById('add-user-form').style.display = 'none';
        
        // ユーザー一覧を再読み込み
        await loadUsers();
        
        // 3秒後にモーダルを閉じる
        setTimeout(() => {
            closeAddUserModal();
            document.getElementById('add-user-form').style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = '登録する';
        }, 5000);
        
    } catch (error) {
        console.error('❌ 予期しないエラー:', error);
        alert(`❌ 予期しないエラーが発生しました: ${error.message}`);
        
        submitBtn.disabled = false;
        submitBtn.textContent = '登録する';
    }
});

// ユーザー削除
async function deleteUser(userId, userEmail) {
    if (!confirm(`${userEmail} を削除してもよろしいですか？\n\nこの操作は取り消せません。`)) {
        return;
    }
    
    try {
        const supabaseClient = window.supabaseClient || window.supabase;
        
        // profiles テーブルから削除
        const { error: profileError } = await supabaseClient
            .from('profiles')
            .delete()
            .eq('id', userId);
        
        if (profileError) throw profileError;
        
        // Auth ユーザーは削除しない（管理者権限が必要なため）
        // 実運用では Supabase の Admin API を使用して削除可能
        
        alert('✅ ユーザーを削除しました。');
        await loadUsers();
        
    } catch (error) {
        console.error('❌ ユーザー削除エラー:', error);
        alert('❌ ユーザーの削除に失敗しました。');
    }
}

console.log('✅ admin-users.js loaded');
