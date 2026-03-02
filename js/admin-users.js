// ============================================
// ユーザー管理システム
// ============================================

let currentCompanyId = null;
let currentCompanyCode = null;
let currentCompanyName = null;
let users = [];

// ページ読み込み時に企業一覧を取得
window.addEventListener('load', async function() {
    // ユーザーの認証情報が読み込まれるまで少し待つ
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (window.currentUserRole === 'company_admin') {
        // 企業管理者の場合は自社のみ表示
        await loadCompaniesForCompanyAdmin();
    } else {
        // システム管理者の場合はすべての企業を表示
        await loadCompanies();
    }
});

// 企業一覧を読み込む（システム管理者用）
async function loadCompanies() {
    try {
        console.log('📋 企業一覧を読み込み中（システム管理者）...');
        
        const { data: companies, error } = await supabaseClient
            .from('companies')
            .select('id, company_code, company_name')
            .order('company_name');
        
        if (error) {
            console.error('❌ 企業読み込みエラー:', error);
            alert('企業一覧の読み込みに失敗しました');
            return;
        }
        
        const select = document.getElementById('company-select');
        select.innerHTML = '<option value="">企業を選択してください...</option>';
        
        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = `${company.company_name} (${company.company_code})`;
            option.dataset.code = company.company_code;
            option.dataset.name = company.company_name;
            select.appendChild(option);
        });
        
        console.log(`✅ ${companies.length}社を読み込みました`);
        
    } catch (error) {
        console.error('❌ 予期しないエラー:', error);
        alert('企業一覧の読み込み中にエラーが発生しました');
    }
}

// 企業一覧を読み込む（企業管理者用 - 自社のみ）
async function loadCompaniesForCompanyAdmin() {
    try {
        console.log('📋 自社情報を読み込み中（企業管理者）...');
        
        const { data: company, error } = await supabaseClient
            .from('companies')
            .select('id, company_code, company_name')
            .eq('id', window.currentUserCompanyId)
            .single();
        
        if (error) {
            console.error('❌ 企業読み込みエラー:', error);
            alert('企業情報の読み込みに失敗しました');
            return;
        }
        
        const select = document.getElementById('company-select');
        
        // 企業管理者は選択肢が1つだけなので、自動選択してドロップダウンを無効化
        select.innerHTML = '';
        const option = document.createElement('option');
        option.value = company.id;
        option.textContent = `${company.company_name} (${company.company_code})`;
        option.dataset.code = company.company_code;
        option.dataset.name = company.company_name;
        option.selected = true;
        select.appendChild(option);
        select.disabled = true; // 変更不可
        
        console.log(`✅ 自社を読み込みました: ${company.company_name}`);
        
        // 自動的にユーザー一覧を読み込む
        await loadUsers();
        
    } catch (error) {
        console.error('❌ 予期しないエラー:', error);
        alert('企業情報の読み込み中にエラーが発生しました');
    }
}

// ユーザー一覧を読み込む
async function loadUsers() {
    const select = document.getElementById('company-select');
    const companyId = select.value;
    
    if (!companyId) {
        document.getElementById('users-card').style.display = 'none';
        return;
    }
    
    currentCompanyId = companyId;
    currentCompanyCode = select.options[select.selectedIndex].dataset.code;
    currentCompanyName = select.options[select.selectedIndex].dataset.name;
    
    // UI表示
    document.getElementById('users-card').style.display = 'block';
    document.getElementById('company-name-display').textContent = 
        `${currentCompanyName} (${currentCompanyCode}) のユーザー`;
    
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('users-table').style.display = 'none';
    document.getElementById('no-users').style.display = 'none';
    
    try {
        console.log(`📋 企業ID ${companyId} のユーザーを読み込み中...`);
        
        // profilesとauth.usersを結合して取得
        const { data: profiles, error } = await supabaseClient
            .from('profiles')
            .select('id, email, role, created_at')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ ユーザー読み込みエラー:', error);
            alert('ユーザー一覧の読み込みに失敗しました');
            document.getElementById('loading').style.display = 'none';
            return;
        }
        
        users = profiles || [];
        console.log(`✅ ${users.length}人のユーザーを読み込みました`);
        
        displayUsers();
        
    } catch (error) {
        console.error('❌ 予期しないエラー:', error);
        alert('ユーザー一覧の読み込み中にエラーが発生しました');
        document.getElementById('loading').style.display = 'none';
    }
}

// ユーザー一覧を表示
function displayUsers() {
    document.getElementById('loading').style.display = 'none';
    
    if (users.length === 0) {
        document.getElementById('no-users').style.display = 'block';
        document.getElementById('users-table').style.display = 'none';
        return;
    }
    
    document.getElementById('no-users').style.display = 'none';
    document.getElementById('users-table').style.display = 'block';
    
    const tbody = document.getElementById('users-tbody');
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        
        // ロール表示
        let roleDisplay = '';
        let roleClass = '';
        if (user.role === 'company_admin') {
            roleDisplay = '👨‍💼 企業管理者';
            roleClass = 'badge-admin';
        } else if (user.role === 'admin') {
            roleDisplay = '🔧 システム管理者';
            roleClass = 'badge-system-admin';
        } else {
            roleDisplay = '👤 一般ユーザー';
            roleClass = 'badge-user';
        }
        
        // 作成日
        const createdDate = new Date(user.created_at).toLocaleDateString('ja-JP');
        
        row.innerHTML = `
            <td>${user.email}</td>
            <td>-</td>
            <td><span class="badge ${roleClass}">${roleDisplay}</span></td>
            <td>${createdDate}</td>
            <td class="actions">
                <button class="btn btn-sm btn-secondary" onclick="editUser('${user.id}')">
                    ✏️ 編集
                </button>
                ${user.role !== 'admin' ? `
                    ${user.role === 'company_admin' 
                        ? `<button class="btn btn-sm btn-warning" onclick="changeRole('${user.id}', 'company_user')">
                               ⬇️ 一般に降格
                           </button>`
                        : `<button class="btn btn-sm btn-success" onclick="changeRole('${user.id}', 'company_admin')">
                               ⬆️ 管理者に昇格
                           </button>`
                    }
                    <button class="btn btn-sm btn-danger" onclick="deleteUser('${user.id}', '${user.email}')">
                        🗑️ 削除
                    </button>
                ` : ''}
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// ロール変更
async function changeRole(userId, newRole) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const roleName = newRole === 'company_admin' ? '企業管理者' : '一般ユーザー';
    
    if (!confirm(`${user.email} を ${roleName} に変更しますか？`)) {
        return;
    }
    
    try {
        console.log(`🔄 ロール変更: ${user.email} → ${newRole}`);
        
        const { error } = await supabaseClient
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);
        
        if (error) {
            console.error('❌ ロール変更エラー:', error);
            alert('ロールの変更に失敗しました: ' + error.message);
            return;
        }
        
        console.log('✅ ロール変更成功');
        alert(`${user.email} を ${roleName} に変更しました`);
        
        // リロード
        await loadUsers();
        
    } catch (error) {
        console.error('❌ 予期しないエラー:', error);
        alert('ロール変更中にエラーが発生しました');
    }
}

// ユーザー編集モーダルを表示
function editUser(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    document.getElementById('edit-user-id').value = user.id;
    document.getElementById('edit-email').value = user.email;
    document.getElementById('edit-fullname').value = '';
    document.getElementById('edit-role').value = user.role;
    
    // システム管理者の場合はロール変更不可
    if (user.role === 'admin') {
        document.getElementById('edit-role').disabled = true;
    } else {
        document.getElementById('edit-role').disabled = false;
    }
    
    document.getElementById('edit-user-modal').style.display = 'flex';
}

// ユーザー編集モーダルを閉じる
function closeEditUserModal() {
    document.getElementById('edit-user-modal').style.display = 'none';
    document.getElementById('edit-user-form').reset();
}

// ユーザー情報を保存
async function saveUser(event) {
    event.preventDefault();
    
    const userId = document.getElementById('edit-user-id').value;
    const fullName = document.getElementById('edit-fullname').value.trim();
    const role = document.getElementById('edit-role').value;
    
    try {
        console.log(`💾 ユーザー情報を保存中: ${userId}`);
        
        const updateData = {
            role: role
        };
        
        // full_name カラムは存在しないためスキップ
        
        const { error } = await supabaseClient
            .from('profiles')
            .update(updateData)
            .eq('id', userId);
        
        if (error) {
            console.error('❌ 保存エラー:', error);
            alert('ユーザー情報の保存に失敗しました: ' + error.message);
            return;
        }
        
        console.log('✅ 保存成功');
        alert('ユーザー情報を保存しました');
        
        closeEditUserModal();
        await loadUsers();
        
    } catch (error) {
        console.error('❌ 予期しないエラー:', error);
        alert('保存中にエラーが発生しました');
    }
}

// 新規ユーザー追加モーダルを表示
function showAddUserModal() {
    if (!currentCompanyId) {
        alert('先に企業を選択してください');
        return;
    }
    
    document.getElementById('add-user-modal').style.display = 'flex';
}

// 新規ユーザー追加モーダルを閉じる
function closeAddUserModal() {
    document.getElementById('add-user-modal').style.display = 'none';
    document.getElementById('add-user-form').reset();
}

// 新規ユーザーを追加
async function addUser(event) {
    event.preventDefault();
    
    const email = document.getElementById('new-email').value.trim();
    const password = document.getElementById('new-password').value;
    const fullName = document.getElementById('new-fullname').value.trim();
    const role = document.getElementById('new-role').value;
    
    if (!email || !password) {
        alert('メールアドレスとパスワードは必須です');
        return;
    }
    
    try {
        console.log(`➕ 新規ユーザーを作成中: ${email}`);
        
        // Step 1: UUIDを生成（クライアント側で生成）
        const userId = crypto.randomUUID();
        console.log('🆔 生成したユーザーID:', userId);
        
        // Step 2: profilesテーブルに直接レコードを作成
        const { error: profileError } = await supabaseClient
            .from('profiles')
            .insert({
                id: userId,
                email: email,
                role: role,
                company_id: currentCompanyId,
                // full_name カラムは存在しないためスキップ
                created_at: new Date().toISOString()
            });
        
        if (profileError) {
            console.error('❌ Profile作成エラー:', profileError);
            alert('プロフィールの作成に失敗しました: ' + profileError.message);
            return;
        }
        
        console.log('✅ Profile作成成功');
        
        // Step 3: Supabase Authに手動でユーザーを登録（バックグラウンド）
        // 注意: この方法ではauth.usersに直接登録できないため、
        // ユーザーには初回ログイン時にパスワードを設定してもらう
        
        console.log('📧 ユーザーに以下の情報を伝えてください:');
        console.log('  - メール:', email);
        console.log('  - 初回ログイン用URL: https://stellular-profiterole-2ff0a2.netlify.app/index.html');
        console.log('  - 企業コード:', (await supabaseClient.from('companies').select('company_code').eq('id', currentCompanyId).single()).data?.company_code);
        
        alert(`ユーザー ${email} をプロフィールに追加しました。\n\nユーザーには以下を伝えてください：\n1. ログインURL: https://stellular-profiterole-2ff0a2.netlify.app/index.html\n2. 初回ログイン時に「パスワードを忘れた場合」からパスワードを設定\n\n※ または管理者が直接 Supabase Authentication でユーザーを作成してください`);
        
        closeAddUserModal();
        await loadUsers();
        
    } catch (error) {
        console.error('❌ 予期しないエラー:', error);
        alert('ユーザー作成中にエラーが発生しました: ' + error.message);
    }
}

// ユーザーを削除
async function deleteUser(userId, email) {
    if (!confirm(`本当に ${email} を削除しますか？\n\nこの操作は取り消せません。`)) {
        return;
    }
    
    // 2回目の確認
    if (!confirm(`最終確認: ${email} を削除します。よろしいですか？`)) {
        return;
    }
    
    try {
        console.log(`🗑️ ユーザー削除中: ${email}`);
        
        // profilesテーブルから削除
        const { error } = await supabaseClient
            .from('profiles')
            .delete()
            .eq('id', userId);
        
        if (error) {
            console.error('❌ 削除エラー:', error);
            alert('ユーザーの削除に失敗しました: ' + error.message);
            return;
        }
        
        console.log('✅ 削除成功');
        alert(`${email} を削除しました`);
        
        await loadUsers();
        
    } catch (error) {
        console.error('❌ 予期しないエラー:', error);
        alert('削除中にエラーが発生しました');
    }
}

// モーダルの外側クリックで閉じる
window.onclick = function(event) {
    const addModal = document.getElementById('add-user-modal');
    const editModal = document.getElementById('edit-user-modal');
    
    if (event.target === addModal) {
        closeAddUserModal();
    }
    if (event.target === editModal) {
        closeEditUserModal();
    }
};
