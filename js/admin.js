// ============================================
// 企業管理画面
// ============================================

let allCompanies = [];
let companyPasswords = {}; // 企業コードとパスワードのマッピング

// LocalStorage からパスワードを読み込み
function loadPasswordsFromStorage() {
    try {
        const stored = localStorage.getItem('company_passwords');
        if (stored) {
            companyPasswords = JSON.parse(stored);
            console.log('✅ パスワードを読み込みました:', Object.keys(companyPasswords).length, '件');
        }
    } catch (error) {
        console.error('❌ パスワード読み込みエラー:', error);
    }
}

// LocalStorage にパスワードを保存
function savePasswordsToStorage() {
    try {
        localStorage.setItem('company_passwords', JSON.stringify(companyPasswords));
        console.log('✅ パスワードを保存しました:', Object.keys(companyPasswords).length, '件');
    } catch (error) {
        console.error('❌ パスワード保存エラー:', error);
    }
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔧 企業管理画面を初期化中...');
    
    // Supabase クライアント初期化
    if (typeof initializeApp === 'function') {
        initializeApp();
    }
    
    if (!window.supabaseClient) {
        alert('Supabase クライアントの初期化に失敗しました。');
        return;
    }
    
    console.log('✅ Supabase クライアント:', window.supabaseClient);
    
    // 管理者情報を表示
    displayAdminInfo();
    
    // 認証が完了するまで待機（最大5秒）
    let retries = 0;
    const maxRetries = 10;
    
    while (retries < maxRetries) {
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        
        if (session && !error) {
            console.log('✅ 管理者認証済み:', session.user.email);
            break;
        }
        
        console.log(`⏳ 認証情報待機中... (${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 500));
        retries++;
        
        if (retries >= maxRetries) {
            console.error('❌ 認証タイムアウト:', error);
            // エラーを表示せず、そのまま続行（HTML側で認証済みのため）
            break;
        }
    }
    
    // パスワードを読み込み
    loadPasswordsFromStorage();
    
    // 企業一覧を読み込み
    await loadCompanies();
    
    // 統計情報を更新
    await updateStats();
    
    // ボタンイベントを設定
    setupButtonEvents();
    
    // モーダルイベントを設定
    setupModalEvents();
    
    // フォームイベントを設定
    setupFormEvents();
});

// ============================================
// ボタンイベントの設定
// ============================================
function setupButtonEvents() {
    console.log('🔘 ボタンイベントを設定中...');
    
    // 新しい企業を追加ボタン
    const btnAdd = document.getElementById('btn-add-company');
    if (btnAdd) {
        btnAdd.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('➕ 新しい企業を追加ボタンがクリックされました');
            openAddModal();
        });
        console.log('✅ 追加ボタンのイベントを設定しました');
    }
    
    // 認証情報をエクスポートボタン
    const btnExport = document.getElementById('btn-export-auth');
    if (btnExport) {
        btnExport.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📥 認証情報をエクスポートボタンがクリックされました');
            exportAuthConfig();
        });
        console.log('✅ エクスポートボタンのイベントを設定しました');
    }
    
    // 匿名化データをエクスポートボタン
    const btnExportAnon = document.getElementById('btn-export-anonymized');
    if (btnExportAnon) {
        btnExportAnon.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📊 匿名化データをエクスポートボタンがクリックされました');
            exportAnonymizedData();
        });
        console.log('✅ 匿名化データエクスポートボタンのイベントを設定しました');
    }
    
    // 更新ボタン
    const btnRefresh = document.getElementById('btn-refresh');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔄 更新ボタンがクリックされました');
            loadCompanies();
        });
        console.log('✅ 更新ボタンのイベントを設定しました');
    }
    
    // ログアウトボタン
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🚪 ログアウトボタンがクリックされました');
            adminLogout();
        });
        console.log('✅ ログアウトボタンのイベントを設定しました');
    }
    
    console.log('✅ すべてのボタンイベントを設定しました');
}

// ============================================
// テーブル内ボタンのイベント設定
// ============================================
function setupTableButtonEvents() {
    console.log('🔘 テーブル内ボタンのイベントを設定中...');
    
    // 編集ボタン
    const editButtons = document.querySelectorAll('.btn-edit');
    editButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const companyId = this.getAttribute('data-company-id');
            console.log('✏️ 編集ボタンがクリックされました:', companyId);
            openEditModal(companyId);
        });
    });
    console.log(`✅ ${editButtons.length} 個の編集ボタンを設定しました`);
    
    // 削除ボタン
    const deleteButtons = document.querySelectorAll('.btn-delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const companyId = this.getAttribute('data-company-id');
            const companyName = this.getAttribute('data-company-name');
            console.log('🗑️ 削除ボタンがクリックされました:', companyId, companyName);
            confirmDelete(companyId, companyName);
        });
    });
    console.log(`✅ ${deleteButtons.length} 個の削除ボタンを設定しました`);
}

// ============================================
// モーダルイベントの設定
// ============================================
function setupModalEvents() {
    console.log('🔘 モーダルイベントを設定中...');
    
    // モーダルを閉じるボタン（×ボタンとキャンセルボタン）
    const closeButtons = document.querySelectorAll('.modal-close, .btn-cancel[data-modal]');
    closeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const modalId = this.getAttribute('data-modal');
            console.log('❌ モーダルを閉じる:', modalId);
            closeModal(modalId);
        });
    });
    console.log(`✅ ${closeButtons.length} 個のモーダル閉じるボタンを設定しました`);
    
    // コピーボタン
    const btnCopy = document.getElementById('btn-copy-clipboard');
    if (btnCopy) {
        btnCopy.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('📋 クリップボードにコピー');
            copyToClipboard();
        });
        console.log('✅ コピーボタンを設定しました');
    }
}

// ============================================
// フォームイベントの設定
// ============================================
function setupFormEvents() {
    console.log('🔘 フォームイベントを設定中...');
    
    // 企業追加フォーム
    const addForm = document.getElementById('add-company-form');
    if (addForm) {
        addForm.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('➕ 企業追加フォーム送信');
            handleAddCompany(e);
        });
        console.log('✅ 企業追加フォームを設定しました');
    }
    
    // 企業編集フォーム
    const editForm = document.getElementById('edit-company-form');
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('✏️ 企業編集フォーム送信');
            handleEditCompany(e);
        });
        console.log('✅ 企業編集フォームを設定しました');
    }
}

// ============================================
// 企業一覧の読み込み
// ============================================
async function loadCompanies() {
    console.log('📊 企業一覧を読み込み中...');
    
    const container = document.getElementById('companies-list');
    container.innerHTML = '<tr><td colspan="6" class="loading"><div class="spinner"></div>読み込み中...</td></tr>';
    
    try {
        const { data, error } = await window.supabaseClient
            .from('companies')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ Supabase エラー:', error);
            container.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#ef4444;">データの読み込みに失敗しました。</td></tr>';
            return;
        }
        
        allCompanies = data;
        console.log(`✅ ${data.length} 件の企業を読み込みました`);
        
        if (data.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="empty-state">
                            <div style="font-size:60px;">🏢</div>
                            <h3>企業が登録されていません</h3>
                            <p>「新しい企業を追加」ボタンから最初の企業を登録してください。</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        // テーブル行を生成
        container.innerHTML = data.map(company => `
            <tr>
                <td><span class="company-code">${company.company_code}</span></td>
                <td><span class="company-name">${company.company_name}</span></td>
                <td>${company.industry || '-'}</td>
                <td><span class="plan-badge plan-${company.plan || 'free'}">${company.plan === 'premium' ? 'Premium' : 'Free'}</span></td>
                <td>${new Date(company.created_at).toLocaleDateString('ja-JP')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-edit" data-company-id="${company.id}">
                            ✏️ 編集
                        </button>
                        <button class="btn-action btn-delete" data-company-id="${company.id}" data-company-name="${company.company_name}">
                            🗑️ 削除
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // テーブル内のボタンにイベントを追加
        setupTableButtonEvents();
        
    } catch (error) {
        console.error('❌ エラー:', error);
        container.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#ef4444;">エラーが発生しました。</td></tr>';
    }
}

// ============================================
// 統計情報の更新
// ============================================
async function updateStats() {
    try {
        // 企業数
        const { count: companyCount } = await window.supabaseClient
            .from('companies')
            .select('*', { count: 'exact', head: true });
        
        document.getElementById('total-companies').textContent = companyCount || 0;
        
        // 報告数
        const { count: reportCount } = await window.supabaseClient
            .from('incidents')
            .select('*', { count: 'exact', head: true });
        
        document.getElementById('total-reports').textContent = reportCount || 0;
        
        // Premium プラン数
        const { count: premiumCount } = await window.supabaseClient
            .from('companies')
            .select('*', { count: 'exact', head: true })
            .eq('plan', 'premium');
        
        document.getElementById('premium-count').textContent = premiumCount || 0;
        
    } catch (error) {
        console.error('❌ 統計情報の取得エラー:', error);
    }
}

// ============================================
// モーダル操作
// ============================================
function openAddModal() {
    document.getElementById('add-modal').classList.add('active');
    document.getElementById('add-company-form').reset();
}

function openEditModal(companyId) {
    const company = allCompanies.find(c => c.id === companyId);
    if (!company) {
        alert('企業が見つかりません');
        return;
    }
    
    document.getElementById('edit-company-id').value = company.id;
    document.getElementById('edit-company-code-old').value = company.company_code;
    document.getElementById('edit-company-code').value = company.company_code;
    document.getElementById('edit-company-name').value = company.company_name;
    document.getElementById('edit-industry').value = company.industry || '';
    document.getElementById('edit-plan').value = company.plan || 'free';
    document.getElementById('edit-password').value = '';
    
    document.getElementById('edit-modal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ============================================
// 企業追加
// ============================================
async function handleAddCompany(event) {
    event.preventDefault();
    
    const companyCode = document.getElementById('add-company-code').value.trim().toLowerCase();
    const companyName = document.getElementById('add-company-name').value.trim();
    const password = document.getElementById('add-password').value.trim();
    const industry = document.getElementById('add-industry').value.trim();
    const plan = document.getElementById('add-plan').value;
    
    if (!companyCode || !companyName || !password) {
        alert('必須項目を入力してください');
        return;
    }
    
    try {
        // Supabase に追加
        const { data, error } = await window.supabaseClient
            .from('companies')
            .insert([{
                company_code: companyCode,
                company_name: companyName,
                industry: industry,
                plan: plan
            }])
            .select();
        
        if (error) {
            console.error('❌ Supabase エラー:', error);
            console.error('❌ エラー詳細:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
                status: error.status
            });
            
            if (error.code === '23505') {
                alert('この企業コードは既に使用されています。');
            } else if (error.message && error.message.includes('Failed to fetch')) {
                alert('Supabase への接続に失敗しました。\n\nネットワーク接続を確認してください。\n\nまたは、Supabase の RLS ポリシーで INSERT が許可されているか確認してください。');
            } else {
                alert('企業の追加に失敗しました:\n\n' + (error.message || 'Unknown error') + '\n\nコンソールで詳細を確認してください。');
            }
            return;
        }
        
        // パスワードを保存（メモリ + LocalStorage）
        companyPasswords[companyCode] = password;
        savePasswordsToStorage();
        
        console.log('✅ 企業を追加しました:', data);
        alert(`企業「${companyName}」を追加しました！\n\n企業コード: ${companyCode}\nパスワード: ${password}\n\n※ パスワードは必ずメモしてください。`);
        
        closeModal('add-modal');
        await loadCompanies();
        await updateStats();
        
    } catch (error) {
        console.error('❌ エラー:', error);
        alert('エラーが発生しました: ' + error.message);
    }
}

// ============================================
// 企業編集
// ============================================
async function handleEditCompany(event) {
    event.preventDefault();
    
    const companyId = document.getElementById('edit-company-id').value;
    const companyCode = document.getElementById('edit-company-code-old').value;
    const companyName = document.getElementById('edit-company-name').value.trim();
    const newPassword = document.getElementById('edit-password').value.trim();
    const industry = document.getElementById('edit-industry').value.trim();
    const plan = document.getElementById('edit-plan').value;
    
    try {
        // Supabase を更新
        const { error } = await window.supabaseClient
            .from('companies')
            .update({
                company_name: companyName,
                industry: industry,
                plan: plan
            })
            .eq('id', companyId);
        
        if (error) {
            console.error('❌ Supabase エラー:', error);
            alert('企業情報の更新に失敗しました: ' + error.message);
            return;
        }
        
        // パスワードが入力されている場合は保存
        if (newPassword) {
            companyPasswords[companyCode] = newPassword;
            savePasswordsToStorage();
            alert(`企業「${companyName}」を更新しました！\n\n新しいパスワード: ${newPassword}\n\n※ パスワードは必ずメモしてください。`);
        } else {
            alert(`企業「${companyName}」を更新しました！`);
        }
        
        console.log('✅ 企業を更新しました');
        
        closeModal('edit-modal');
        await loadCompanies();
        
    } catch (error) {
        console.error('❌ エラー:', error);
        alert('エラーが発生しました: ' + error.message);
    }
}

// ============================================
// 企業削除
// ============================================
function confirmDelete(companyId, companyName) {
    const confirmed = confirm(
        `本当に「${companyName}」を削除しますか？\n\n` +
        `この操作は取り消せません。\n` +
        `※ この企業の報告データも閲覧できなくなります。`
    );
    
    if (!confirmed) return;
    
    const deleteReports = confirm(
        `この企業の報告データも完全に削除しますか？\n\n` +
        `「OK」: 報告データも削除\n` +
        `「キャンセル」: 企業のみ削除（報告データは残る）`
    );
    
    deleteCompany(companyId, deleteReports);
}

async function deleteCompany(companyId, deleteReports) {
    try {
        // 報告データも削除する場合
        if (deleteReports) {
            const { error: reportsError } = await window.supabaseClient
                .from('incidents')
                .delete()
                .eq('company_id', companyId);
            
            if (reportsError) {
                console.error('❌ 報告データの削除エラー:', reportsError);
                alert('報告データの削除に失敗しました: ' + reportsError.message);
                return;
            }
            
            console.log('✅ 報告データを削除しました');
        }
        
        // 企業を削除
        const { error } = await window.supabaseClient
            .from('companies')
            .delete()
            .eq('id', companyId);
        
        if (error) {
            console.error('❌ Supabase エラー:', error);
            alert('企業の削除に失敗しました: ' + error.message);
            return;
        }
        
        console.log('✅ 企業を削除しました');
        alert('企業を削除しました。');
        
        await loadCompanies();
        await updateStats();
        
    } catch (error) {
        console.error('❌ エラー:', error);
        alert('エラーが発生しました: ' + error.message);
    }
}

// ============================================
// 匿名化データエクスポート
// ============================================
async function exportAnonymizedData() {
    console.log('📊 匿名化データをエクスポート中...');
    
    try {
        // 匿名化ビューからデータを取得
        const { data, error } = await window.supabaseClient
            .from('incidents_anonymized')
            .select('*')
            .order('occurred_at_month', { ascending: false });
        
        if (error) {
            console.error('❌ データ取得エラー:', error);
            alert('匿名化データの取得に失敗しました: ' + error.message);
            return;
        }
        
        if (!data || data.length === 0) {
            alert('エクスポートするデータがありません。');
            return;
        }
        
        console.log('✅ 匿名化データを取得:', data.length, '件');
        
        // CSV ヘッダー
        const headers = [
            'ID',
            '企業コード（匿名）',
            '報告者名（匿名）',
            '発生年月',
            '曜日',
            '時間帯',
            '地域',
            '報告種別',
            'インシデント種別',
            'カテゴリ',
            'メモ',
            '天候',
            '路面状況',
            '作業フェーズ',
            '使用機材',
            '積載状況',
            'ドラレコ有無',
            '重大度',
            '直接原因',
            '対応策',
            '予防策',
            'ステータス',
            '車両ID（匿名）'
        ];
        
        // CSV データ行
        const rows = data.map(record => [
            record.id || '',
            record.company_code_anon || '',
            record.reporter_name_anon || '',
            record.occurred_year_month || '',
            record.day_of_week || '',
            record.time_period || '',
            record.location_region || '',
            record.report_type || '',
            record.incident_type || '',
            record.categories_text || '',
            record.memo || '',
            record.weather || '',
            record.road_condition || '',
            record.work_phase || '',
            record.equipment_used || '',
            record.load_status || '',
            record.has_dashcam === true ? 'あり' : record.has_dashcam === false ? 'なし' : '',
            record.severity || '',
            record.direct_causes_text || '',
            record.own_action || '',
            record.prevention || '',
            record.status || '',
            record.vehicle_id_anon || ''
        ]);
        
        // CSV 文字列を生成
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => {
                // セル内の改行・カンマ・ダブルクォートをエスケープ
                const str = String(cell).replace(/"/g, '""');
                return /[,\n"]/.test(str) ? `"${str}"` : str;
            }).join(','))
        ].join('\n');
        
        // BOM付きで出力（Excel対応）
        const bom = '\uFEFF';
        const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
        
        // ダウンロード
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', `匿名化データ_${dateStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert(`✅ 匿名化データをエクスポートしました\n\n件数: ${data.length}件\nファイル名: 匿名化データ_${dateStr}.csv`);
        
    } catch (error) {
        console.error('❌ エクスポートエラー:', error);
        alert('エクスポートに失敗しました: ' + error.message);
    }
}

// ============================================
// 認証情報エクスポート
// ============================================
async function exportAuthConfig() {
    console.log('📥 認証情報をエクスポート中...');
    
    try {
        // すべての企業を取得
        const { data, error } = await window.supabaseClient
            .from('companies')
            .select('*')
            .order('company_code');
        
        if (error) {
            alert('企業情報の取得に失敗しました: ' + error.message);
            return;
        }
        
        // COMPANY_CREDENTIALS 形式で JSON を生成
        const credentials = {};
        
        for (const company of data) {
            credentials[company.company_code] = {
                password: companyPasswords[company.company_code] || '★★★★★★',
                companyId: null,
                companyName: company.company_name
            };
        }
        
        // JSON を整形
        const jsonOutput = JSON.stringify(credentials, null, 4)
            .replace(/\{\n/g, '{\n')
            .replace(/\},\n/g, '},\n')
            .replace(/"([^"]+)":/g, '$1:')  // キーのクォートを削除
            .replace(/: "([^"]+)"/g, ": '$1'");  // 文字列のクォートをシングルに
        
        const output = `const COMPANY_CREDENTIALS = ${jsonOutput};`;
        
        // モーダルに表示
        document.getElementById('json-output').textContent = output;
        document.getElementById('export-modal').classList.add('active');
        
        // パスワードが不明な企業がある場合は警告
        const unknownPasswords = data.filter(c => !companyPasswords[c.company_code]);
        if (unknownPasswords.length > 0) {
            setTimeout(() => {
                alert(
                    '⚠️ 一部の企業のパスワードが不明です:\n\n' +
                    unknownPasswords.map(c => `- ${c.company_name} (${c.company_code})`).join('\n') +
                    '\n\n★★★★★★ の部分を実際のパスワードに置き換えてください。'
                );
            }, 500);
        }
        
    } catch (error) {
        console.error('❌ エラー:', error);
        alert('エラーが発生しました: ' + error.message);
    }
}

// ============================================
// クリップボードにコピー
// ============================================
function copyToClipboard() {
    const output = document.getElementById('json-output').textContent;
    const button = document.getElementById('btn-copy-clipboard');
    
    navigator.clipboard.writeText(output).then(() => {
        const originalText = button.textContent;
        
        button.textContent = '✅ コピーしました！';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
        
    }).catch(err => {
        console.error('❌ コピー失敗:', err);
        alert('クリップボードへのコピーに失敗しました。手動でコピーしてください。');
    });
}

// ============================================
// 管理者情報表示
// ============================================
async function displayAdminInfo() {
    try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session) {
            const adminUserInfo = document.getElementById('admin-user-info');
            const adminEmailDisplay = document.getElementById('admin-display-email');
            
            if (adminEmailDisplay) {
                adminEmailDisplay.textContent = session.user.email || 'メール不明';
            }
            if (adminUserInfo) {
                adminUserInfo.style.display = 'flex';
                
                // 🔑パスワード変更ボタンを追加（まだ存在しない場合）
                if (!document.getElementById('admin-change-password-btn')) {
                    const changePasswordBtn = document.createElement('a');
                    changePasswordBtn.id = 'admin-change-password-btn';
                    changePasswordBtn.href = 'change-password.html';
                    changePasswordBtn.className = 'btn-change-password';
                    changePasswordBtn.textContent = '🔑';
                    changePasswordBtn.title = 'パスワード変更';
                    
                    // ログアウトボタンの前に挿入
                    const logoutBtn = adminUserInfo.querySelector('.btn-admin-logout');
                    if (logoutBtn) {
                        adminUserInfo.insertBefore(changePasswordBtn, logoutBtn);
                    } else {
                        adminUserInfo.appendChild(changePasswordBtn);
                    }
                }
            }
        }
    } catch (error) {
        console.error('❌ 管理者情報表示エラー:', error);
    }
}

// ============================================
// ログアウト
// ============================================
async function adminLogout() {
    const confirmed = confirm('ログアウトしますか？');
    if (!confirmed) return;
    
    try {
        // Supabase Auth からサインアウト
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) throw error;
        
        alert('ログアウトしました。');
        location.href = 'admin.html'; // ログインページにリダイレクト
    } catch (error) {
        console.error('❌ ログアウトエラー:', error);
        alert('ログアウトに失敗しました: ' + error.message);
    }
}

// ============================================
// モーダル外クリックで閉じる
// ============================================
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
});
