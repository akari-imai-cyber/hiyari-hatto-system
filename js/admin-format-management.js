/**
 * フォーマット管理画面のロジック
 */

// グローバル変数
let currentUserRole = null;
let reportFormats = [];
let analysisFormats = [];
let editingReportFormatId = null;
let editingAnalysisFormatId = null;

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎨 フォーマット管理画面: 初期化開始');
    
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
            const auth = window.getCurrentAuth ? window.getCurrentAuth() : null;
            if (auth && auth.authenticated) {
                console.log('✅ 認証済み:', auth);
                resolve(auth);
                return;
            }
            
            window.addEventListener('authComplete', (event) => {
                console.log('✅ authComplete イベント受信:', event.detail);
                resolve(event.detail);
            });
            
            setTimeout(() => {
                console.error('❌ 認証タイムアウト');
                window.location.href = 'index.html';
            }, 5000);
        });
    };
    
    const auth = await waitForAuth();
    
    // システム管理者権限チェック
    if (auth.role !== 'admin') {
        alert('❌ この画面にアクセスする権限がありません。\n\nシステム管理者のみアクセス可能です。');
        window.location.href = 'index.html';
        return;
    }
    
    currentUserRole = auth.role;
    console.log('👤 現在の権限:', currentUserRole);
    
    // フォーマット一覧を読み込み
    await loadReportFormats();
    await loadAnalysisFormats();
});

// タブ切り替え
function switchTab(tab) {
    // タブボタンの切り替え
    document.querySelectorAll('.format-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // セクションの切り替え
    document.querySelectorAll('.format-section').forEach(section => {
        section.classList.remove('active');
    });
    
    if (tab === 'report') {
        document.getElementById('report-section').classList.add('active');
    } else {
        document.getElementById('analysis-section').classList.add('active');
    }
}

// ========================================
// 帳票フォーマット管理
// ========================================

// 帳票フォーマット一覧を読み込み
async function loadReportFormats() {
    const container = document.getElementById('report-formats-container');
    container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">読み込み中...</p>';
    
    try {
        const supabaseClient = window.supabaseClient || window.supabase;
        
        const { data: formats, error } = await supabaseClient
            .from('report_formats')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        reportFormats = formats || [];
        displayReportFormats(reportFormats);
        
        console.log('✅ 帳票フォーマット読み込み完了:', reportFormats.length);
        
    } catch (error) {
        console.error('❌ 帳票フォーマット読み込みエラー:', error);
        container.innerHTML = '<p style="text-align: center; color: #ef4444; padding: 2rem;">フォーマットの読み込みに失敗しました</p>';
    }
}

// 帳票フォーマット表示
function displayReportFormats(formats) {
    const container = document.getElementById('report-formats-container');
    
    if (!formats || formats.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">帳票フォーマットが登録されていません</p>';
        return;
    }
    
    container.innerHTML = formats.map(format => `
        <div class="format-card">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                <h3>${format.name}</h3>
                <span class="chart-type-badge badge-${format.format_type}">${format.format_type.toUpperCase()}</span>
            </div>
            <p>${format.description || '説明なし'}</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 0.75rem; color: #9ca3af;">
                    作成日: ${new Date(format.created_at).toLocaleDateString('ja-JP')}
                </div>
                <div class="format-card-actions">
                    <button class="btn btn-primary" onclick="editReportFormat('${format.id}')" style="padding: 0.5rem 1rem; font-size: 0.875rem;">✏️ 編集</button>
                    <button class="btn ${format.is_active ? 'btn-secondary' : 'btn-primary'}" onclick="toggleReportFormatStatus('${format.id}', ${format.is_active})" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                        ${format.is_active ? '🔄 無効化' : '✅ 有効化'}
                    </button>
                    <button class="btn btn-danger" onclick="deleteReportFormat('${format.id}', '${format.name}')" style="padding: 0.5rem 1rem; font-size: 0.875rem;">🗑️ 削除</button>
                </div>
            </div>
        </div>
    `).join('');
}

// 帳票フォーマット追加モーダルを開く
function openAddReportFormatModal() {
    editingReportFormatId = null;
    document.getElementById('report-modal-title').textContent = '帳票フォーマットを追加';
    document.getElementById('report-format-form').reset();
    document.getElementById('report-format-modal').classList.add('active');
}

// 帳票フォーマット編集
async function editReportFormat(formatId) {
    editingReportFormatId = formatId;
    
    try {
        const supabaseClient = window.supabaseClient || window.supabase;
        
        const { data: format, error } = await supabaseClient
            .from('report_formats')
            .select('*')
            .eq('id', formatId)
            .single();
        
        if (error) throw error;
        
        document.getElementById('report-modal-title').textContent = '帳票フォーマットを編集';
        document.getElementById('report-name').value = format.name;
        document.getElementById('report-description').value = format.description || '';
        document.getElementById('report-format-type').value = format.format_type;
        
        document.getElementById('report-format-modal').classList.add('active');
        
    } catch (error) {
        console.error('❌ フォーマット取得エラー:', error);
        alert('❌ フォーマット情報の取得に失敗しました。');
    }
}

// 帳票フォーマットモーダルを閉じる
function closeReportFormatModal() {
    document.getElementById('report-format-modal').classList.remove('active');
    editingReportFormatId = null;
}

// 帳票フォーマット保存
document.getElementById('report-format-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('report-name').value.trim();
    const description = document.getElementById('report-description').value.trim();
    const formatType = document.getElementById('report-format-type').value;
    
    try {
        const supabaseClient = window.supabaseClient || window.supabase;
        
        const formatData = {
            name,
            description,
            format_type: formatType,
            template_config: {
                sheets: [{ name: 'データ', type: 'details' }],
                columns: ['report_id', 'occurred_at', 'location_text', 'category', 'severity_rating']
            }
        };
        
        if (editingReportFormatId) {
            // 更新
            const { error } = await supabaseClient
                .from('report_formats')
                .update(formatData)
                .eq('id', editingReportFormatId);
            
            if (error) throw error;
            
            alert('✅ 帳票フォーマットを更新しました。');
        } else {
            // 新規追加
            const { error } = await supabaseClient
                .from('report_formats')
                .insert(formatData);
            
            if (error) throw error;
            
            alert('✅ 帳票フォーマットを追加しました。');
        }
        
        closeReportFormatModal();
        await loadReportFormats();
        
    } catch (error) {
        console.error('❌ 保存エラー:', error);
        alert('❌ 保存に失敗しました。');
    }
});

// 帳票フォーマット削除
async function deleteReportFormat(formatId, formatName) {
    if (!confirm(`「${formatName}」を削除してもよろしいですか？\n\nこの操作は取り消せません。`)) {
        return;
    }
    
    try {
        const supabaseClient = window.supabaseClient || window.supabase;
        
        const { error } = await supabaseClient
            .from('report_formats')
            .delete()
            .eq('id', formatId);
        
        if (error) throw error;
        
        alert('✅ 帳票フォーマットを削除しました。');
        await loadReportFormats();
        
    } catch (error) {
        console.error('❌ 削除エラー:', error);
        alert('❌ 削除に失敗しました。');
    }
}

// 帳票フォーマット有効/無効切り替え
async function toggleReportFormatStatus(formatId, currentStatus) {
    try {
        const supabaseClient = window.supabaseClient || window.supabase;
        
        const { error } = await supabaseClient
            .from('report_formats')
            .update({ is_active: !currentStatus })
            .eq('id', formatId);
        
        if (error) throw error;
        
        alert(`✅ フォーマットを${!currentStatus ? '有効化' : '無効化'}しました。`);
        await loadReportFormats();
        
    } catch (error) {
        console.error('❌ ステータス更新エラー:', error);
        alert('❌ ステータスの更新に失敗しました。');
    }
}

// ========================================
// 分析フォーマット管理
// ========================================

// 分析フォーマット一覧を読み込み
async function loadAnalysisFormats() {
    const container = document.getElementById('analysis-formats-container');
    container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">読み込み中...</p>';
    
    try {
        const supabaseClient = window.supabaseClient || window.supabase;
        
        const { data: formats, error } = await supabaseClient
            .from('analysis_formats')
            .select('*')
            .order('display_order', { ascending: true });
        
        if (error) throw error;
        
        analysisFormats = formats || [];
        displayAnalysisFormats(analysisFormats);
        
        console.log('✅ 分析フォーマット読み込み完了:', analysisFormats.length);
        
    } catch (error) {
        console.error('❌ 分析フォーマット読み込みエラー:', error);
        container.innerHTML = '<p style="text-align: center; color: #ef4444; padding: 2rem;">フォーマットの読み込みに失敗しました</p>';
    }
}

// 分析フォーマット表示
function displayAnalysisFormats(formats) {
    const container = document.getElementById('analysis-formats-container');
    
    if (!formats || formats.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 2rem;">分析フォーマットが登録されていません</p>';
        return;
    }
    
    const chartTypeLabels = {
        bar: '棒グラフ',
        pie: '円グラフ',
        line: '折れ線グラフ',
        table: 'テーブル'
    };
    
    container.innerHTML = formats.map(format => `
        <div class="format-card">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                <div>
                    <h3>${format.name}</h3>
                    <span style="font-size: 0.75rem; color: #9ca3af;">表示順序: ${format.display_order}</span>
                </div>
                <span class="chart-type-badge badge-${format.chart_type}">${chartTypeLabels[format.chart_type]}</span>
            </div>
            <p>${format.description || '説明なし'}</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 0.75rem; color: #9ca3af;">
                    グループ化: ${format.data_config.groupBy || '-'} | 集計: ${format.data_config.aggregate || '-'}
                </div>
                <div class="format-card-actions">
                    <button class="btn btn-primary" onclick="editAnalysisFormat('${format.id}')" style="padding: 0.5rem 1rem; font-size: 0.875rem;">✏️ 編集</button>
                    <button class="btn ${format.is_active ? 'btn-secondary' : 'btn-primary'}" onclick="toggleAnalysisFormatStatus('${format.id}', ${format.is_active})" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                        ${format.is_active ? '🔄 無効化' : '✅ 有効化'}
                    </button>
                    <button class="btn btn-danger" onclick="deleteAnalysisFormat('${format.id}', '${format.name}')" style="padding: 0.5rem 1rem; font-size: 0.875rem;">🗑️ 削除</button>
                </div>
            </div>
        </div>
    `).join('');
}

// 分析フォーマット追加モーダルを開く
function openAddAnalysisFormatModal() {
    editingAnalysisFormatId = null;
    document.getElementById('analysis-modal-title').textContent = '分析フォーマットを追加';
    document.getElementById('analysis-format-form').reset();
    document.getElementById('analysis-format-modal').classList.add('active');
}

// 分析フォーマット編集
async function editAnalysisFormat(formatId) {
    editingAnalysisFormatId = formatId;
    
    try {
        const supabaseClient = window.supabaseClient || window.supabase;
        
        const { data: format, error } = await supabaseClient
            .from('analysis_formats')
            .select('*')
            .eq('id', formatId)
            .single();
        
        if (error) throw error;
        
        document.getElementById('analysis-modal-title').textContent = '分析フォーマットを編集';
        document.getElementById('analysis-name').value = format.name;
        document.getElementById('analysis-description').value = format.description || '';
        document.getElementById('analysis-chart-type').value = format.chart_type;
        document.getElementById('analysis-group-by').value = format.data_config.groupBy || '';
        document.getElementById('analysis-display-order').value = format.display_order || 0;
        
        document.getElementById('analysis-format-modal').classList.add('active');
        
    } catch (error) {
        console.error('❌ フォーマット取得エラー:', error);
        alert('❌ フォーマット情報の取得に失敗しました。');
    }
}

// 分析フォーマットモーダルを閉じる
function closeAnalysisFormatModal() {
    document.getElementById('analysis-format-modal').classList.remove('active');
    editingAnalysisFormatId = null;
}

// 分析フォーマット保存
document.getElementById('analysis-format-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('analysis-name').value.trim();
    const description = document.getElementById('analysis-description').value.trim();
    const chartType = document.getElementById('analysis-chart-type').value;
    const groupBy = document.getElementById('analysis-group-by').value;
    const displayOrder = parseInt(document.getElementById('analysis-display-order').value) || 0;
    
    try {
        const supabaseClient = window.supabaseClient || window.supabase;
        
        const formatData = {
            name,
            description,
            chart_type: chartType,
            data_config: {
                groupBy,
                aggregate: 'count',
                sortBy: 'count',
                sortOrder: 'desc'
            },
            display_order: displayOrder
        };
        
        if (editingAnalysisFormatId) {
            // 更新
            const { error } = await supabaseClient
                .from('analysis_formats')
                .update(formatData)
                .eq('id', editingAnalysisFormatId);
            
            if (error) throw error;
            
            alert('✅ 分析フォーマットを更新しました。');
        } else {
            // 新規追加
            const { error } = await supabaseClient
                .from('analysis_formats')
                .insert(formatData);
            
            if (error) throw error;
            
            alert('✅ 分析フォーマットを追加しました。');
        }
        
        closeAnalysisFormatModal();
        await loadAnalysisFormats();
        
    } catch (error) {
        console.error('❌ 保存エラー:', error);
        alert('❌ 保存に失敗しました。');
    }
});

// 分析フォーマット削除
async function deleteAnalysisFormat(formatId, formatName) {
    if (!confirm(`「${formatName}」を削除してもよろしいですか？\n\nこの操作は取り消せません。`)) {
        return;
    }
    
    try {
        const supabaseClient = window.supabaseClient || window.supabase;
        
        const { error } = await supabaseClient
            .from('analysis_formats')
            .delete()
            .eq('id', formatId);
        
        if (error) throw error;
        
        alert('✅ 分析フォーマットを削除しました。');
        await loadAnalysisFormats();
        
    } catch (error) {
        console.error('❌ 削除エラー:', error);
        alert('❌ 削除に失敗しました。');
    }
}

// 分析フォーマット有効/無効切り替え
async function toggleAnalysisFormatStatus(formatId, currentStatus) {
    try {
        const supabaseClient = window.supabaseClient || window.supabase;
        
        const { error } = await supabaseClient
            .from('analysis_formats')
            .update({ is_active: !currentStatus })
            .eq('id', formatId);
        
        if (error) throw error;
        
        alert(`✅ フォーマットを${!currentStatus ? '有効化' : '無効化'}しました。`);
        await loadAnalysisFormats();
        
    } catch (error) {
        console.error('❌ ステータス更新エラー:', error);
        alert('❌ ステータスの更新に失敗しました。');
    }
}

console.log('✅ admin-format-management.js loaded');
