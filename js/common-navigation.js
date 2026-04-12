/**
 * 共通ナビゲーション管理システム v20260412n
 * 全HTMLページで使用される統一されたメニュー表示ロジック
 * 
 * 機能:
 * - ロール別メニュー表示制御
 * - パスワード変更ボタン自動追加
 * - authCompleteイベントのフォールバック処理
 */

(function() {
    console.log('📋 common-navigation.js loaded');

    /**
     * ロールに基づいて表示すべきメニュー項目を決定
     * @param {string} role - ユーザーロール ('admin', 'company_admin', 'company_user')
     * @returns {object} - 各メニューの表示フラグ
     */
    function getMenuVisibility(role) {
        const menus = {
            'report-input': true,        // ①報告入力（全員表示）
            'dashboard': true,            // ②ダッシュボード（全員表示）
            'analytics': true,            // ③分析（全員表示）
            'admin': false,               // ④企業管理（管理者のみ）
            'admin-reports': false,       // ⑤報告管理（管理者のみ）
            'admin-users': false,         // ⑥ユーザー管理
            'import-data': false,         // ⑦データインポート
            'data-fix': false,            // ⑧データ修正
            'format-management': false    // ⑨フォーマット管理（システム管理者のみ）
        };

        if (role === 'admin') {
            // システム管理者：①②③④⑤⑥⑦⑧⑨ すべて表示
            menus['admin'] = true;
            menus['admin-reports'] = true;
            menus['admin-users'] = true;
            menus['import-data'] = true;
            menus['data-fix'] = true;
            menus['format-management'] = true;  // ⑨フォーマット管理: 表示
        } else if (role === 'company_admin') {
            // 企業管理者：④⑤⑨を非表示 → ①②③⑥⑦⑧ を表示
            menus['admin'] = false;           // ④企業管理: 非表示
            menus['admin-reports'] = false;   // ⑤報告管理: 非表示
            menus['admin-users'] = true;      // ⑥ユーザー管理: 表示
            menus['import-data'] = true;      // ⑦データインポート: 表示
            menus['data-fix'] = true;         // ⑧データ修正: 表示
            menus['format-management'] = false; // ⑨フォーマット管理: 非表示
        }
        // company_user はデフォルト（①②③のみ）

        return menus;
    }

    /**
     * ナビゲーションメニューを更新
     * @param {object} auth - 認証情報オブジェクト
     */
    function updateNavigationMenu(auth) {
        if (!auth || !auth.authenticated) {
            console.log('❌ 認証されていないため、メニューを非表示');
            return;
        }

        const role = auth.role;
        console.log(`🔍 [Navigation] ロール: ${role}`);

        const visibility = getMenuVisibility(role);

        // ④企業管理リンク
        const adminLink = document.getElementById('admin-link');
        if (adminLink) {
            adminLink.style.display = visibility['admin'] ? 'inline-block' : 'none';
            console.log(`📍 企業管理: ${visibility['admin'] ? '表示' : '非表示'}`);
        }

        // ⑤報告管理リンク
        const adminReportsLink = document.getElementById('admin-reports-link');
        if (adminReportsLink) {
            adminReportsLink.style.display = visibility['admin-reports'] ? 'inline-block' : 'none';
            console.log(`📍 報告管理: ${visibility['admin-reports'] ? '表示' : '非表示'}`);
        }

        // ⑥ユーザー管理リンク
        const adminUsersLink = document.getElementById('admin-users-link');
        if (adminUsersLink) {
            adminUsersLink.style.display = visibility['admin-users'] ? 'inline-block' : 'none';
            console.log(`📍 ユーザー管理: ${visibility['admin-users'] ? '表示' : '非表示'}`);
        }

        // ⑦データインポートリンク
        const importDataLink = document.getElementById('import-data-link');
        if (importDataLink) {
            importDataLink.style.display = visibility['import-data'] ? 'inline-block' : 'none';
            console.log(`📍 データインポート: ${visibility['import-data'] ? '表示' : '非表示'}`);
        }

        // ⑧データ修正リンク
        const dataFixLink = document.getElementById('data-fix-link');
        if (dataFixLink) {
            dataFixLink.style.display = visibility['data-fix'] ? 'inline-block' : 'none';
            console.log(`📍 データ修正: ${visibility['data-fix'] ? '表示' : '非表示'}`);
        }

        // ⑨フォーマット管理リンク
        const formatLink = document.getElementById('format-link');
        if (formatLink) {
            formatLink.style.display = visibility['format-management'] ? 'inline-block' : 'none';
            console.log(`📍 フォーマット管理: ${visibility['format-management'] ? '表示' : '非表示'}`);
        }

        console.log(`✅ [Navigation] ${role} 用のメニュー表示完了`);
    }

    /**
     * ユーザー情報表示を更新
     * @param {object} auth - 認証情報オブジェクト
     */
    function updateUserInfo(auth) {
        if (!auth || !auth.authenticated) return;

        const userInfo = document.getElementById('user-info');
        const displayCompany = document.getElementById('display-company');
        const displayEmail = document.getElementById('display-email');

        if (displayCompany) {
            displayCompany.textContent = auth.companyName || auth.companyCode || '企業名不明';
        }
        if (displayEmail) {
            displayEmail.textContent = auth.email || 'メール不明';
        }
        
        // パスワード変更ボタンを追加（まだ存在しない場合）
        if (userInfo && !document.getElementById('change-password-btn')) {
            const changePasswordBtn = document.createElement('a');
            changePasswordBtn.id = 'change-password-btn';
            changePasswordBtn.href = 'change-password.html';
            changePasswordBtn.className = 'btn-change-password';
            changePasswordBtn.textContent = '🔑';
            changePasswordBtn.title = 'パスワード変更';
            
            // ログアウトボタンの前に挿入
            const logoutBtn = userInfo.querySelector('.btn-logout');
            if (logoutBtn) {
                userInfo.insertBefore(changePasswordBtn, logoutBtn);
            } else {
                userInfo.appendChild(changePasswordBtn);
            }
        }
        
        if (userInfo) {
            userInfo.style.display = 'flex';
        }
    }

    /**
     * authComplete イベントリスナー
     */
    let authCompleteReceived = false;
    
    window.addEventListener('authComplete', function(e) {
        authCompleteReceived = true;
        const auth = e.detail;
        console.log('🔐 [Navigation] authComplete イベント受信:', auth);

        // ユーザー情報表示
        updateUserInfo(auth);

        // ナビゲーションメニュー表示
        updateNavigationMenu(auth);
    });

    // フォールバック：5秒後にauthCompleteイベントが来ていなければ警告
    setTimeout(function() {
        if (!authCompleteReceived) {
            console.warn('⚠️ [Navigation] authCompleteイベントが5秒以内に受信されませんでした');
            console.warn('⚠️ [Navigation] 認証システムを確認してください');
            
            // 緊急フォールバック：getCurrentAuth() を試す
            if (typeof getCurrentAuth === 'function') {
                const auth = getCurrentAuth();
                if (auth && auth.authenticated) {
                    console.log('🔧 [Navigation] getCurrentAuth() からフォールバック実行');
                    updateUserInfo(auth);
                    updateNavigationMenu(auth);
                } else {
                    console.error('❌ [Navigation] 認証情報が取得できません');
                }
            }
        }
    }, 5000);

    console.log('✅ common-navigation.js 初期化完了');
})();
