/**
 * ユーザー管理画面のロジック
 */

// グローバル変数
let currentCompanyId = null;
let currentUserRole = null;
let allUsers = []; // 全ユーザーデータを保持
let filteredUsers = []; // フィルタ後のユーザーデータ

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
        
        // グローバル変数に保存
        allUsers = users || [];
        filteredUsers = allUsers;
        
        // テーブルに表示
        displayUsers(filteredUsers);
        
        // カウント更新
        updateUserCount();
        
    } catch (error) {
        console.error('❌ ユーザー読み込みエラー:', error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #ef4444;">ユーザーの読み込みに失敗しました</td></tr>';
    }
}

// ユーザーを表示
function displayUsers(users) {
    const tbody = document.getElementById('users-table-body');
    
    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">ユーザーが登録されていません</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td style="text-align: center;">
                <input type="checkbox" class="user-checkbox" data-user-id="${user.id}" data-user-role="${user.role}" onchange="updateBulkActionsBar()">
            </td>
            <td>
                <strong style="cursor: pointer; color: #2563eb; text-decoration: underline;" onclick="openDetailUserModal(&quot;${user.id}&quot;)" title="クリックで詳細表示">
                    ${user.full_name || '未設定'}
                </strong>
            </td>
            <td>${user.email || '未設定'}</td>
            <td>${user.department || '-'}</td>
            <td>
                <span class="badge ${getRoleBadgeClass(user.role)}">
                    ${getRoleLabel(user.role)}
                </span>
            </td>
            <td>${new Date(user.created_at).toLocaleDateString('ja-JP')}</td>
            <td>
                <button class="btn btn-primary" onclick="openEditUserModal(&quot;${user.id}&quot;)" style="margin-right: 0.5rem; padding: 0.5rem 1rem; font-size: 0.875rem;">編集</button>
                ${user.role !== 'admin' ? `<button class="btn btn-danger" onclick="deleteUser(&quot;${user.id}&quot;, &quot;${user.email}&quot;)" style="padding: 0.5rem 1rem; font-size: 0.875rem;">削除</button>` : ''}
            </td>
        </tr>
    `).join('');
}

// ロールのバッジクラスを取得
function getRoleBadgeClass(role) {
    if (role === 'admin') return 'badge-admin';
    if (role === 'company_admin') return 'badge-admin';
    return 'badge-user';
}

// ロールのラベルを取得
function getRoleLabel(role) {
    if (role === 'admin') return 'システム管理者';
    if (role === 'company_admin') return '企業管理者';
    return '一般ユーザー';
}

// フィルタを適用
function filterUsers() {
    const searchText = document.getElementById('search-input').value.toLowerCase();
    const roleFilter = document.getElementById('role-filter').value;
    
    filteredUsers = allUsers.filter(user => {
        // 氏名・メールアドレス・所属で検索
        const matchesSearch = !searchText || 
            (user.email && user.email.toLowerCase().includes(searchText)) ||
            (user.full_name && user.full_name.toLowerCase().includes(searchText)) ||
            (user.department && user.department.toLowerCase().includes(searchText));
        
        // ロールフィルタ
        const matchesRole = !roleFilter || user.role === roleFilter;
        
        return matchesSearch && matchesRole;
    });
    
    displayUsers(filteredUsers);
    updateUserCount();
}

// フィルタをリセット
function resetFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('role-filter').value = '';
    filteredUsers = allUsers;
    displayUsers(filteredUsers);
    updateUserCount();
}

// ユーザー数を更新
function updateUserCount() {
    const countElement = document.getElementById('user-count');
    if (countElement) {
        countElement.textContent = `${filteredUsers.length} / ${allUsers.length} 件`;
    }
}

// モーダルを開く
async function openAddUserModal() {
    const modal = document.getElementById('add-user-modal');
    modal.classList.add('active');
    
    // フォームをリセット
    document.getElementById('add-user-form').reset();
    document.getElementById('success-message').classList.remove('active');
    
    // システム管理者の場合は企業選択を表示
    const companySelectionGroup = document.getElementById('company-selection-group');
    const companySelect = document.getElementById('user-company');
    
    if (currentUserRole === 'admin') {
        // 企業一覧を読み込み
        try {
            const supabaseClient = window.supabaseClient || window.supabase;
            const { data: companies, error } = await supabaseClient
                .from('companies')
                .select('id, company_name, company_code')
                .order('company_name');
            
            if (error) throw error;
            
            // ドロップダウンを設定
            companySelect.innerHTML = '<option value="">-- 企業を選択してください --</option>';
            companies.forEach(company => {
                const option = document.createElement('option');
                option.value = company.id;
                option.textContent = `${company.company_name} (${company.company_code})`;
                companySelect.appendChild(option);
            });
            
            companySelectionGroup.style.display = 'block';
            companySelect.required = true;
            
        } catch (error) {
            console.error('❌ 企業一覧の読み込みエラー:', error);
            alert('❌ 企業一覧の読み込みに失敗しました。');
        }
    } else {
        // 企業管理者の場合は非表示
        companySelectionGroup.style.display = 'none';
        companySelect.required = false;
    }
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
    const name = document.getElementById('user-name').value.trim();
    const email = document.getElementById('user-email').value.trim();
    const department = document.getElementById('user-department').value.trim();
    const phone = document.getElementById('user-phone').value.trim();
    const password = document.getElementById('user-password').value.trim();
    const role = document.getElementById('user-role').value;
    
    // company_idの決定
    let targetCompanyId;
    if (currentUserRole === 'admin') {
        // システム管理者の場合は選択された企業ID
        targetCompanyId = document.getElementById('user-company').value;
        if (!targetCompanyId) {
            alert('❌ 所属企業を選択してください。');
            return;
        }
    } else {
        // 企業管理者の場合は自分の企業ID
        targetCompanyId = currentCompanyId;
        if (!targetCompanyId) {
            alert('❌ 企業情報が取得できません。再度ログインしてください。');
            return;
        }
    }
    
    // バリデーション
    if (!name || !email || !password) {
        alert('❌ 氏名、メールアドレス、パスワードは必須項目です。');
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
                    company_id: targetCompanyId
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
                full_name: name,
                email: email,
                department: department || null,
                phone: phone || null,
                role: role,
                company_id: targetCompanyId
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
            <p><strong>氏名:</strong> ${name}</p>
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

// グローバル変数: 編集中・詳細表示中のユーザーID
let editingUserId = null;
let detailUserId = null;

// ユーザー詳細モーダルを開く
async function openDetailUserModal(userId) {
    console.log('👤 ユーザー詳細モーダルを開く:', userId);
    detailUserId = userId;
    
    try {
        const supabaseClient = window.supabaseClient || window.supabase;
        
        // ユーザー情報を取得
        const { data: user, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) throw error;
        
        console.log('📋 詳細表示ユーザー:', user);
        
        // このユーザーの報告件数を取得
        const { data: reports, error: reportsError } = await supabaseClient
            .from('reports')
            .select('id', { count: 'exact', head: true })
            .eq('reporter_id', userId);
        
        const reportCount = reportsError ? 0 : (reports || 0);
        
        // 基本情報を設定
        document.getElementById('detail-full-name').textContent = user.full_name || '未設定';
        document.getElementById('detail-email').textContent = user.email || '未設定';
        document.getElementById('detail-department').textContent = user.department || '未設定';
        document.getElementById('detail-phone').textContent = user.phone || '未設定';
        
        // ロールをバッジで表示
        const roleElement = document.getElementById('detail-role');
        const roleLabel = getRoleLabel(user.role);
        const roleBadgeClass = getRoleBadgeClass(user.role);
        roleElement.innerHTML = `<span class="badge ${roleBadgeClass}">${roleLabel}</span>`;
        
        // アカウント情報を設定
        const createdAt = new Date(user.created_at);
        const updatedAt = new Date(user.updated_at);
        
        document.getElementById('detail-created-at').textContent = 
            `${createdAt.toLocaleDateString('ja-JP')} ${createdAt.toLocaleTimeString('ja-JP')}`;
        document.getElementById('detail-updated-at').textContent = 
            `${updatedAt.toLocaleDateString('ja-JP')} ${updatedAt.toLocaleTimeString('ja-JP')}`;
        document.getElementById('detail-user-id').textContent = user.id || '-';
        document.getElementById('detail-company-id').textContent = user.company_id || '未設定';
        
        // 報告件数を設定
        document.getElementById('detail-report-count').textContent = `${reportCount} 件`;
        
        // モーダルを開く
        const modal = document.getElementById('detail-user-modal');
        modal.classList.add('active');
        
    } catch (error) {
        console.error('❌ ユーザー詳細取得エラー:', error);
        alert('❌ ユーザー詳細情報の取得に失敗しました。');
    }
}

// ユーザー詳細モーダルを閉じる
function closeDetailUserModal() {
    const modal = document.getElementById('detail-user-modal');
    modal.classList.remove('active');
    detailUserId = null;
}

// 詳細モーダルから編集モーダルを開く
function openEditUserModalFromDetail() {
    if (!detailUserId) {
        alert('❌ ユーザーIDが見つかりません。');
        return;
    }
    
    // 詳細モーダルを閉じる
    closeDetailUserModal();
    
    // 編集モーダルを開く
    openEditUserModal(detailUserId);
}

// ユーザー編集モーダルを開く
async function openEditUserModal(userId) {
    console.log('✏️ ユーザー編集モーダルを開く:', userId);
    editingUserId = userId;
    
    try {
        const supabaseClient = window.supabaseClient || window.supabase;
        
        // ユーザー情報を取得
        const { data: user, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) throw error;
        
        console.log('📋 編集対象ユーザー:', user);
        
        // フォームに値を設定
        document.getElementById('edit-user-name').value = user.full_name || '';
        document.getElementById('edit-user-email').value = user.email || '';
        document.getElementById('edit-user-department').value = user.department || '';
        document.getElementById('edit-user-phone').value = user.phone || '';
        document.getElementById('edit-user-role').value = user.role || 'company_user';
        
        // パスワードリセットセクションを非表示
        document.getElementById('reset-password-check').checked = false;
        document.getElementById('password-reset-section').style.display = 'none';
        document.getElementById('edit-user-password').value = '';
        
        // ロール変更警告を非表示
        document.getElementById('role-change-warning').style.display = 'none';
        
        // モーダルを開く
        const modal = document.getElementById('edit-user-modal');
        modal.classList.add('active');
        
    } catch (error) {
        console.error('❌ ユーザー情報取得エラー:', error);
        alert('❌ ユーザー情報の取得に失敗しました。');
    }
}

// ユーザー編集モーダルを閉じる
function closeEditUserModal() {
    const modal = document.getElementById('edit-user-modal');
    modal.classList.remove('active');
    editingUserId = null;
}

// パスワードリセットセクションの表示/非表示
function togglePasswordReset() {
    const checkbox = document.getElementById('reset-password-check');
    const section = document.getElementById('password-reset-section');
    const passwordInput = document.getElementById('edit-user-password');
    
    if (checkbox.checked) {
        section.style.display = 'block';
        passwordInput.required = true;
    } else {
        section.style.display = 'none';
        passwordInput.required = false;
        passwordInput.value = '';
    }
}

// ロール変更時の警告表示
document.getElementById('edit-user-role')?.addEventListener('change', function() {
    const warning = document.getElementById('role-change-warning');
    warning.style.display = 'block';
    setTimeout(() => {
        warning.style.display = 'none';
    }, 3000);
});

// ユーザー編集フォーム送信
document.getElementById('edit-user-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!editingUserId) {
        alert('❌ 編集対象のユーザーIDが見つかりません。');
        return;
    }
    
    const submitBtn = document.getElementById('edit-submit-btn');
    const name = document.getElementById('edit-user-name').value.trim();
    const email = document.getElementById('edit-user-email').value.trim();
    const department = document.getElementById('edit-user-department').value.trim();
    const phone = document.getElementById('edit-user-phone').value.trim();
    const role = document.getElementById('edit-user-role').value;
    const resetPassword = document.getElementById('reset-password-check').checked;
    const password = document.getElementById('edit-user-password').value.trim();
    
    // バリデーション
    if (!name || !email || !role) {
        alert('❌ 氏名、メールアドレス、ロールは必須項目です。');
        return;
    }
    
    // パスワードリセットのバリデーション
    if (resetPassword) {
        if (password.length < 8) {
            alert('❌ パスワードは8文字以上にしてください。');
            return;
        }
        
        if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
            alert('❌ パスワードは英大文字・小文字・数字を含む必要があります。');
            return;
        }
    }
    
    // 確認ダイアログ
    const confirmMessage = resetPassword 
        ? `${email} の情報を更新し、パスワードをリセットしますか？`
        : `${email} の情報を更新しますか？`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    // ボタン無効化
    submitBtn.disabled = true;
    submitBtn.textContent = '保存中...';
    
    try {
        const supabaseClient = window.supabaseClient || window.supabase;
        
        // 1. プロフィール情報を更新
        const updateData = {
            full_name: name,
            email: email,
            department: department || null,
            phone: phone || null,
            role: role
        };
        
        const { error: profileError } = await supabaseClient
            .from('profiles')
            .update(updateData)
            .eq('id', editingUserId);
        
        if (profileError) throw profileError;
        
        console.log('✅ プロフィール更新成功');
        
        // 2. パスワードリセット（管理者権限が必要）
        if (resetPassword) {
            // Note: Supabase の管理者APIを使う必要があります
            // ここでは簡易的な実装として、パスワード更新をスキップ
            console.log('⚠️ パスワードリセットは管理者APIが必要です');
            alert('✅ ユーザー情報を更新しました。\n\n⚠️ パスワードリセットは管理者権限が必要なため、別途手動で行ってください。');
        } else {
            alert('✅ ユーザー情報を更新しました。');
        }
        
        // モーダルを閉じる
        closeEditUserModal();
        
        // ユーザー一覧を再読み込み
        await loadUsers();
        
    } catch (error) {
        console.error('❌ ユーザー更新エラー:', error);
        alert(`❌ ユーザー情報の更新に失敗しました: ${error.message}`);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '💾 変更を保存';
    }
});

// ユーザー削除
async function deleteUser(userId, userEmail) {
    if (!confirm(`${userEmail} を削除してもよろしいですか？\n\nこの操作は取り消せません。`)) {
        return;
    }
    
    try {
        const supabaseClient = window.supabaseClient || window.supabase;
        
        // 1. このユーザーに関連する報告データを確認
        const { data: reports, error: reportsCheckError } = await supabaseClient
            .from('reports')
            .select('id', { count: 'exact', head: true })
            .eq('reporter_id', userId);
        
        if (reportsCheckError) {
            console.warn('⚠️ 報告データ確認エラー:', reportsCheckError);
        }
        
        // 2. 報告データがある場合は警告
        const reportCount = reports || 0;
        if (reportCount > 0) {
            const confirmDelete = confirm(
                `⚠️ このユーザーには ${reportCount} 件の報告データが紐付いています。\n\n` +
                `削除すると、これらの報告データも削除される可能性があります。\n\n` +
                `本当に削除しますか？`
            );
            if (!confirmDelete) {
                return;
            }
        }
        
        // 3. profilesテーブルから削除（カスケード削除でreportsも削除される）
        const { error: deleteError } = await supabaseClient
            .from('profiles')
            .delete()
            .eq('id', userId);
        
        if (deleteError) {
            console.error('❌ 削除エラー詳細:', deleteError);
            
            // エラーコード27000の場合は、より詳しいメッセージを表示
            if (deleteError.code === '27000') {
                alert('❌ データベースの制約により削除できません。\n\nこのユーザーに紐付くデータを先に削除してください。');
            } else {
                throw deleteError;
            }
            return;
        }
        
        // Auth ユーザーは削除しない（管理者権限が必要なため）
        // 実運用では Supabase の Admin API を使用して削除可能
        
        alert('✅ ユーザーを削除しました。');
        await loadUsers();
        
    } catch (error) {
        console.error('❌ ユーザー削除エラー:', error);
        alert(`❌ ユーザーの削除に失敗しました。\n\nエラー: ${error.message || '不明なエラー'}`);
    }
}

// ========================================
// 一括操作機能
// ========================================

// 全選択/全解除
function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    const checkboxes = document.querySelectorAll('.user-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllCheckbox.checked;
    });
    
    updateBulkActionsBar();
}

// 一括操作バーの更新
function updateBulkActionsBar() {
    const checkboxes = document.querySelectorAll('.user-checkbox:checked');
    const count = checkboxes.length;
    const bar = document.getElementById('bulk-actions-bar');
    const countElement = document.getElementById('selected-count');
    
    if (count > 0) {
        bar.style.display = 'flex';
        countElement.textContent = `${count} 件選択中`;
    } else {
        bar.style.display = 'none';
    }
    
    // 全選択チェックボックスの状態を更新
    const allCheckboxes = document.querySelectorAll('.user-checkbox');
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    selectAllCheckbox.checked = allCheckboxes.length > 0 && checkboxes.length === allCheckboxes.length;
}

// 選択解除
function clearSelection() {
    const checkboxes = document.querySelectorAll('.user-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    document.getElementById('select-all-checkbox').checked = false;
    updateBulkActionsBar();
}

// 一括削除
async function bulkDeleteUsers() {
    const checkboxes = document.querySelectorAll('.user-checkbox:checked');
    const userIds = Array.from(checkboxes).map(cb => cb.dataset.userId);
    
    if (userIds.length === 0) {
        alert('❌ ユーザーが選択されていません。');
        return;
    }
    
    // adminユーザーが含まれているかチェック
    const adminCheckboxes = Array.from(checkboxes).filter(cb => cb.dataset.userRole === 'admin');
    if (adminCheckboxes.length > 0) {
        alert('❌ システム管理者は削除できません。選択から除外してください。');
        return;
    }
    
    if (!confirm(`選択した ${userIds.length} 件のユーザーを削除してもよろしいですか？\n\nこの操作は取り消せません。`)) {
        return;
    }
    
    try {
        const supabaseClient = window.supabaseClient || window.supabase;
        
        // 各ユーザーを個別に削除（トリガーエラーを回避）
        let successCount = 0;
        let errorCount = 0;
        
        for (const userId of userIds) {
            try {
                const { error } = await supabaseClient
                    .from('profiles')
                    .delete()
                    .eq('id', userId);
                
                if (error) {
                    console.error(`❌ ユーザー削除失敗 (${userId}):`, error);
                    errorCount++;
                } else {
                    successCount++;
                }
            } catch (err) {
                console.error(`❌ 予期しないエラー (${userId}):`, err);
                errorCount++;
            }
        }
        
        // 結果を表示
        if (errorCount === 0) {
            alert(`✅ ${successCount} 件のユーザーを削除しました。`);
        } else {
            alert(`⚠️ ${successCount} 件削除、${errorCount} 件失敗しました。\n\n失敗したユーザーは関連データがある可能性があります。`);
        }
        
        // 選択解除
        clearSelection();
        
        // ユーザー一覧を再読み込み
        await loadUsers();
        
    } catch (error) {
        console.error('❌ 一括削除エラー:', error);
        alert(`❌ ユーザーの削除に失敗しました。\n\nエラー: ${error.message || '不明なエラー'}`);
    }
}

// 一括ロール変更
async function bulkChangeRole() {
    const checkboxes = document.querySelectorAll('.user-checkbox:checked');
    const userIds = Array.from(checkboxes).map(cb => cb.dataset.userId);
    
    if (userIds.length === 0) {
        alert('❌ ユーザーが選択されていません。');
        return;
    }
    
    // adminユーザーが含まれているかチェック
    const adminCheckboxes = Array.from(checkboxes).filter(cb => cb.dataset.userRole === 'admin');
    if (adminCheckboxes.length > 0) {
        alert('❌ システム管理者のロールは変更できません。選択から除外してください。');
        return;
    }
    
    // ロールを選択
    const newRole = prompt(`選択した ${userIds.length} 件のユーザーのロールを変更します。\n\n新しいロールを選択してください:\n\n1. company_user（一般ユーザー）\n2. company_admin（企業管理者）\n\n番号を入力してください（1 または 2）:`);
    
    if (!newRole) {
        return; // キャンセル
    }
    
    let roleValue;
    if (newRole === '1') {
        roleValue = 'company_user';
    } else if (newRole === '2') {
        roleValue = 'company_admin';
    } else {
        alert('❌ 無効な入力です。1 または 2 を入力してください。');
        return;
    }
    
    const roleLabel = roleValue === 'company_admin' ? '企業管理者' : '一般ユーザー';
    
    if (!confirm(`選択した ${userIds.length} 件のユーザーのロールを「${roleLabel}」に変更しますか？`)) {
        return;
    }
    
    try {
        const supabaseClient = window.supabaseClient || window.supabase;
        
        // 一括ロール変更
        const { error } = await supabaseClient
            .from('profiles')
            .update({ role: roleValue })
            .in('id', userIds);
        
        if (error) throw error;
        
        alert(`✅ ${userIds.length} 件のユーザーのロールを「${roleLabel}」に変更しました。`);
        
        // 選択解除
        clearSelection();
        
        // ユーザー一覧を再読み込み
        await loadUsers();
        
    } catch (error) {
        console.error('❌ 一括ロール変更エラー:', error);
        alert('❌ ロールの変更に失敗しました。');
    }
}

console.log('✅ admin-users.js loaded');
