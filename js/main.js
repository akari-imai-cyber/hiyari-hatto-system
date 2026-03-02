// ===================================
// メイン JavaScript
// ===================================

// グローバル変数
let currentStep = 1;
let reportData = {};
let uploadedPhotoUrls = [];

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    // アプリ初期化
    if (!initializeApp()) {
        return;
    }
    
    // 発生日時のデフォルト値設定（現在時刻）
    setDefaultDateTime();
    
    // 条件展開のイベントリスナー設定
    setupConditionalTriggers();
    
    // デバッグ: カテゴリ配列の確認
    console.log('=== カテゴリ配列チェック ===');
    console.log('window.DRIVING_CATEGORIES:', window.DRIVING_CATEGORIES);
    console.log('window.LOADING_CATEGORIES:', window.LOADING_CATEGORIES);
    
    if (!window.DRIVING_CATEGORIES || !window.LOADING_CATEGORIES) {
        console.error('❌ カテゴリ配列が読み込まれていません！');
        console.log('config.jsが正しく読み込まれているか確認してください');
    } else {
        console.log('✅ カテゴリ配列が正しく読み込まれています');
        console.log('走行中:', window.DRIVING_CATEGORIES.length, '個');
        console.log('荷役中:', window.LOADING_CATEGORIES.length, '個');
    }
    
    console.log('selectCategory関数:', typeof selectCategory);
    console.log('updateWhatHappenedOptions関数:', typeof updateWhatHappenedOptions);
});



// 発生日時のデフォルト値設定
function setDefaultDateTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('occurred-at').value = now.toISOString().slice(0, 16);
}

// 現在地取得
function getCurrentLocation() {
    if (!navigator.geolocation) {
        alert('このブラウザは位置情報に対応していません');
        return;
    }
    
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '取得中...';
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // hidden inputに値を設定
            document.getElementById('gps-lat').value = lat;
            document.getElementById('gps-lng').value = lng;
            
            // 位置情報を保存
            reportData.location_lat = lat;
            reportData.location_lng = lng;
            
            // 住所を逆ジオコーディング（簡易版）
            document.getElementById('location').value = `緯度: ${lat.toFixed(6)}, 経度: ${lng.toFixed(6)}`;
            
            btn.disabled = false;
            btn.textContent = '📍 現在地を取得';
        },
        (error) => {
            console.error('位置情報取得エラー:', error);
            alert('位置情報の取得に失敗しました');
            btn.disabled = false;
            btn.textContent = '📍 現在地を取得';
        }
    );
}

// 報告種別選択
function selectReportType(type) {
    // グローバル変数に保存
    window.currentReportType = type;
    
    document.getElementById('report-type').value = type;
    document.getElementById('entry-selection').classList.add('hidden');
    document.getElementById('report-form').classList.remove('hidden');
    
    // フォームのタイトルを変更
    const title = type === 'hiyari' ? 'ヒヤリハット報告' : '事故報告';
    document.querySelector('.section-title').textContent = title;
    
    console.log('報告種別を設定:', type);
}

// 事象カテゴリ選択（走行中 or 荷役中）
function selectCategory(category) {
    console.log('=== selectCategory実行 ===');
    console.log('選択されたカテゴリ:', category);
    
    document.getElementById('incident-category').value = category;
    
    // ボタンのアクティブ状態更新
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    console.log('updateWhatHappenedOptionsを呼び出します');
    // カテゴリに応じた選択肢を設定
    updateWhatHappenedOptions(category);
    console.log('=== selectCategory完了 ===');
}

// グローバルスコープに明示的に設定
window.selectCategory = selectCategory;

// 「何が起きたか」の選択肢更新（ボタン形式）
function updateWhatHappenedOptions(category) {
    console.log('=== updateWhatHappenedOptions実行 ===');
    console.log('カテゴリ:', category);
    
    const container = document.getElementById('what-category-buttons');
    const group = document.getElementById('what-category-group');
    const memoGroup = document.getElementById('category-memo-group');
    
    console.log('container:', container);
    console.log('group:', group);
    console.log('memoGroup:', memoGroup);
    
    if (!container || !group || !memoGroup) {
        console.error('❌ カテゴリ選択要素が見つかりません！');
        alert('エラー: カテゴリ選択要素が見つかりません。ページをリロードしてください。');
        return;
    }
    
    container.innerHTML = '';
    
    // windowオブジェクトから取得
    const categories = category === 'driving' ? 
        (window.DRIVING_CATEGORIES || []) : 
        (window.LOADING_CATEGORIES || []);
    
    if (categories.length === 0) {
        console.error('❌ カテゴリ配列が空です！');
        alert('エラー: カテゴリが読み込まれていません。ページをリロードしてください。');
        return;
    }
    
    console.log('使用するカテゴリ配列:', categories);
    console.log('カテゴリ数:', categories.length);
    
    categories.forEach((cat, index) => {
        console.log(`ボタン${index + 1}作成:`, cat);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'category-select-btn';
        button.dataset.value = cat;
        button.textContent = cat;
        
        button.addEventListener('click', function() {
            this.classList.toggle('selected');
            updateWhatCategoryValue();
        });
        
        container.appendChild(button);
    });
    
    console.log('ボタン作成完了。コンテナ内のボタン数:', container.children.length);
    
    // グループを表示
    group.style.display = 'block';
    memoGroup.style.display = 'block';
    
    console.log('group.style.display:', group.style.display);
    console.log('memoGroup.style.display:', memoGroup.style.display);
    console.log('=== updateWhatHappenedOptions完了 ===');
}

// 選択されたカテゴリをhiddenフィールドに設定
function updateWhatCategoryValue() {
    const selected = Array.from(document.querySelectorAll('.category-select-btn.selected'))
        .map(btn => btn.dataset.value);
    document.getElementById('what-category').value = selected.join(', ');
    
    // バリデーション用：1つ以上選択されているかチェック
    if (selected.length > 0) {
        document.getElementById('what-category').setCustomValidity('');
    } else {
        document.getElementById('what-category').setCustomValidity('カテゴリを1つ以上選択してください');
    }
}

// 条件展開のトリガー設定
function setupConditionalTriggers() {
    const checkboxes = document.querySelectorAll('input[name="direct_causes"]');
    
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const trigger = this.dataset.trigger;
            if (!trigger) return;
            
            const detailSection = document.getElementById(`${trigger}-details`);
            if (detailSection) {
                if (this.checked) {
                    detailSection.classList.remove('hidden');
                } else {
                    detailSection.classList.add('hidden');
                    // チェックボックスをクリア
                    detailSection.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                        cb.checked = false;
                    });
                }
            }
        });
    });
}

// STEP 1 提出
async function submitStep1() {
    if (!validateStep1()) {
        return;
    }
    
    // フォームデータ収集
    collectFormData();
    
    // データベースに保存
    try {
        await saveReport(false); // STEP2未完了
        
        // 成功メッセージ表示
        document.getElementById('report-form').classList.add('hidden');
        document.getElementById('success-message').classList.remove('hidden');
        
    } catch (error) {
        console.error('提出エラー:', error);
        alert('報告の提出に失敗しました: ' + error.message);
    }
}

// STEP 2 へ進む
async function goToStep2() {
    if (!validateStep1()) {
        return;
    }
    
    await collectFormData();
    
    // STEP2表示・STEP1非表示
    document.querySelector('#report-form > .card').classList.add('hidden');
    document.getElementById('step2-form').classList.remove('hidden');
    
    // スクロール
    window.scrollTo(0, 0);
    
    // カテゴリに応じた詳細セクション表示
    const category = document.getElementById('incident-category').value;
    if (category === 'driving') {
        document.getElementById('driving-details').classList.remove('hidden');
        document.getElementById('loading-details').classList.add('hidden');
    } else {
        document.getElementById('driving-details').classList.add('hidden');
        document.getElementById('loading-details').classList.remove('hidden');
    }
}

// STEP 1 に戻る
function backToStep1() {
    document.getElementById('step2-form').classList.add('hidden');
    document.querySelector('#report-form > .card').classList.remove('hidden');
    window.scrollTo(0, 0);
}

// フォームキャンセル
function cancelForm() {
    if (confirm('入力内容が失われますがよろしいですか？')) {
        location.reload();
    }
}

// STEP 1 バリデーション
function validateStep1() {
    const requiredFields = [
        'occurred-at',
        'employee',
        'location',
        'incident-category',
        'what-category',
        'what-text'
    ];
    
    for (const fieldId of requiredFields) {
        const field = document.getElementById(fieldId);
        if (!field.value.trim()) {
            alert('必須項目を入力してください');
            field.focus();
            return false;
        }
    }
    
    return true;
}// フォームデータ収集
async function collectFormData() {
    // 選択されたカテゴリを配列として取得
    const selectedCategories = document.getElementById('what-category').value
        .split(',')
        .map(s => s.trim())
        .filter(s => s);
    
    // 報告種別を取得（グローバル変数から）
    const reportType = window.currentReportType || 'hiyari';
    
    // 認証情報から company_id を取得
    let auth = window.getCurrentAuth ? window.getCurrentAuth() : null;
    let companyId = auth ? auth.companyId : null;
    
    // company_id が取得できない場合、セッションから再取得
    if (!companyId) {
        console.warn('⚠️ currentAuth から company_id 取得失敗、セッションから再取得');
        try {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (session) {
                const { data: profile } = await window.supabaseClient
                    .from('profiles')
                    .select('company_id')
                    .eq('id', session.user.id)
                    .single();
                
                if (profile && profile.company_id) {
                    companyId = profile.company_id;
                    console.log('✅ セッションから company_id 取得成功:', companyId);
                }
            }
        } catch (error) {
            console.error('❌ セッション取得エラー:', error);
        }
    }
    
    if (!companyId) {
        console.error('❌ 企業IDが取得できません');
        alert('認証情報が取得できません。再度ログインしてください。');
        window.location.href = 'index.html';
        return;
    }
    
    reportData = {
        company_id: companyId,  // 企業IDを追加
        report_type: reportType,
        reporter_name: document.getElementById('employee').value,
        occurred_at: document.getElementById('occurred-at').value,
        location_text: document.getElementById('location').value,
        vehicle_type: document.getElementById('vehicle-type').value,  // 車両種別を追加
        cargo_type: document.getElementById('cargo-type').value,  // 荷物の種類を追加
        cargo_info: document.getElementById('cargo-info').value,  // 荷物情報を追加
        incident_type: document.getElementById('incident-category').value,
        categories: selectedCategories,
        memo: document.getElementById('category-memo')?.value || '',
        photo_url: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls[0] : null,
        status: 'step1_complete'
    };
    
    console.log('✅ company_id を設定:', companyId);
    
    // GPS座標があれば追加
    const gpsLat = document.getElementById('gps-lat')?.value;
    const gpsLng = document.getElementById('gps-lng')?.value;
    if (gpsLat && gpsLng) {
        reportData.location_lat = parseFloat(gpsLat);
        reportData.location_lng = parseFloat(gpsLng);
    }
    
    console.log('収集したフォームデータ:', reportData);
}

// STEP 2 データ収集
function collectStep2Data() {
    const category = reportData.incident_type;
    
    // 走行中の詳細
    if (category === 'driving') {
        reportData.detail_weather = document.getElementById('weather')?.value || null;
        reportData.detail_road = document.getElementById('road-type')?.value || null;
        reportData.detail_situation = document.getElementById('driving-situation')?.value || null;
        reportData.detail_counterpart = document.getElementById('other-party')?.value || null;
        reportData.road_surface = document.getElementById('road-surface')?.value || null;
        
        const dashcam = document.querySelector('input[name="dashcam_available"]:checked');
        reportData.dashcam = dashcam ? dashcam.value === 'true' : null;
    }
    
    // 荷役中の詳細
    if (category === 'loading') {
        reportData.work_phase = document.getElementById('work-phase')?.value || null;
        reportData.equipment_used = document.getElementById('equipment')?.value || null;
        reportData.load_status = document.getElementById('load-status')?.value || null;
        reportData.load_collapse = document.getElementById('load-collapse')?.value || null;
        reportData.temperature_zone = document.getElementById('temperature')?.value || null;
    }
    
    // 原因分析
    reportData.direct_causes = Array.from(document.querySelectorAll('input[name="direct_causes"]:checked'))
        .map(cb => cb.value);
    
    // 詳細原因をJSONBとして保存
    reportData.cause_detail = {
        rush: Array.from(document.querySelectorAll('input[name="cause_rush"]:checked')).map(cb => cb.value),
        fatigue: Array.from(document.querySelectorAll('input[name="cause_fatigue"]:checked')).map(cb => cb.value),
        unfamiliar: Array.from(document.querySelectorAll('input[name="cause_unfamiliar"]:checked')).map(cb => cb.value),
        vehicle: Array.from(document.querySelectorAll('input[name="cause_vehicle"]:checked')).map(cb => cb.value)
    };
    
    // 対策・フォロー
    reportData.own_action = document.getElementById('immediate-action')?.value || null;
    reportData.prevention = document.getElementById('prevention')?.value || null;
    
    const severity = document.querySelector('input[name="severity_rating"]:checked');
    reportData.severity = severity ? parseInt(severity.value) : null;
    
    reportData.order_id = document.getElementById('order-id')?.value || null;
    
    // ステータス更新
    reportData.status = 'step2_complete';
    
    console.log('収集したSTEP2データ:', reportData);
}

// フォーム送信（STEP 2完了）
document.getElementById('report-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // STEP2データ収集
    collectStep2Data();
    
    try {
        await saveReport(true); // STEP2完了
        
        // 成功メッセージ表示
        document.getElementById('step2-form').classList.add('hidden');
        document.getElementById('success-message').classList.remove('hidden');
        
    } catch (error) {
        console.error('提出エラー:', error);
        alert('報告の提出に失敗しました: ' + error.message);
    }
});

// データベースに保存
async function saveReport(step2Completed) {
    console.log('=== データベース保存開始 ===');
    console.log('supabaseClient:', window.supabaseClient);
    
    if (!window.supabaseClient) {
        throw new Error('Supabaseクライアントが初期化されていません');
    }
    
    // occurred_atの処理
    // Supabaseのタイムゾーンが Asia/Tokyo に設定されていれば、
    // datetime-localの値をそのまま使える
    const occurredAtInput = document.getElementById('occurred-at').value;
    
    if (occurredAtInput) {
        console.log('入力された日時:', occurredAtInput);
        // "2026-02-25T10:30" → "2026-02-25 10:30:00"（Supabaseが自動でJSTとして扱う）
        reportData.occurred_at = occurredAtInput.replace('T', ' ') + ':00';
        console.log('保存する日時:', reportData.occurred_at);
    }
    
    const dataToSave = {
        ...reportData,
        status: step2Completed ? 'step2_complete' : 'step1_complete'
    };
    
    console.log('保存データ:', dataToSave);
    
    const { data, error } = await supabaseClient
        .from('incidents')
        .insert([dataToSave])
        .select();
    
    if (error) {
        console.error('保存エラー詳細:', error);
        throw new Error(`データベース保存エラー: ${error.message}`);
    }
    
    console.log('保存成功:', data);
    return data[0];
}

// メール通知機能は削除されました（不要）

// 写真アップロード処理（Base64変換方式）
document.getElementById('photos')?.addEventListener('change', async function(e) {
    const files = e.target.files;
    if (files.length === 0) return;
    
    uploadedPhotoUrls = [];
    
    for (const file of files) {
        try {
            // 画像のみ受け付け
            if (!file.type.startsWith('image/')) {
                console.warn('画像ファイルのみアップロードできます:', file.name);
                continue;
            }
            
            // ファイルサイズチェック（5MB以下）
            if (file.size > 5 * 1024 * 1024) {
                alert(`ファイルサイズが大きすぎます: ${file.name} (5MB以下にしてください)`);
                continue;
            }
            
            // Base64に変換
            const base64 = await fileToBase64(file);
            uploadedPhotoUrls.push(base64);
            
        } catch (error) {
            console.error('写真処理エラー:', error);
            alert('写真の処理に失敗しました: ' + file.name);
        }
    }
    
    if (uploadedPhotoUrls.length > 0) {
        console.log(`${uploadedPhotoUrls.length}件の写真を選択しました`);
    }
});

// ファイルをBase64に変換
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
