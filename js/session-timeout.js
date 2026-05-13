/**
 * セッションタイムアウト管理
 * 30分間操作がない場合、自動的にログアウトする
 */

(function() {
    'use strict';

    // タイムアウト設定（ミリ秒）
    const TIMEOUT_DURATION = 30 * 60 * 1000; // 30分
    const WARNING_DURATION = 5 * 60 * 1000;  // 5分前に警告

    let timeoutId = null;
    let warningId = null;
    let warningShown = false;

    /**
     * タイマーをリセット
     */
    function resetTimer() {
        // 既存のタイマーをクリア
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        if (warningId) {
            clearTimeout(warningId);
        }
        warningShown = false;

        // 警告タイマーを設定（25分後）
        warningId = setTimeout(showWarning, TIMEOUT_DURATION - WARNING_DURATION);

        // ログアウトタイマーを設定（30分後）
        timeoutId = setTimeout(logout, TIMEOUT_DURATION);
    }

    /**
     * 警告メッセージを表示
     */
    function showWarning() {
        if (warningShown) return;
        warningShown = true;

        // 警告バナーを作成
        const banner = document.createElement('div');
        banner.id = 'session-warning-banner';
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ff9800;
            color: white;
            padding: 15px;
            text-align: center;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        banner.innerHTML = `
            <strong>⚠️ セッションタイムアウト警告</strong><br>
            5分後に自動的にログアウトされます。操作を続ける場合は、このページをクリックしてください。
        `;

        document.body.insertBefore(banner, document.body.firstChild);

        // バナーをクリックしたら警告を削除
        banner.addEventListener('click', function() {
            document.body.removeChild(banner);
            warningShown = false;
            resetTimer();
        });
    }

    /**
     * ログアウト処理
     */
    async function logout() {
        console.log('セッションタイムアウトによりログアウトします');

        try {
            // Supabaseクライアントが利用可能か確認
            const supabaseClient = window.supabaseClient || window.supabase;
            
            if (supabaseClient) {
                // Supabaseセッションを削除
                await supabaseClient.auth.signOut();
            }

            // sessionStorageをクリア
            sessionStorage.clear();

            // ログアウトメッセージを表示
            alert('30分間操作がなかったため、自動的にログアウトしました。');

            // ログインページにリダイレクト
            window.location.href = 'index.html';
        } catch (error) {
            console.error('ログアウトエラー:', error);
            // エラーが発生してもログインページにリダイレクト
            window.location.href = 'index.html';
        }
    }

    /**
     * イベントリスナーを設定
     */
    function initSessionTimeout() {
        // 初回タイマーを設定
        resetTimer();

        // ユーザーアクティビティを監視するイベント
        const events = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'click'
        ];

        // 各イベントでタイマーをリセット
        events.forEach(function(event) {
            document.addEventListener(event, resetTimer, true);
        });

        console.log('セッションタイムアウト監視を開始しました（タイムアウト: 30分）');
    }

    /**
     * ページロード時に初期化
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSessionTimeout);
    } else {
        initSessionTimeout();
    }

    // グローバルに公開（デバッグ用）
    window.sessionTimeout = {
        reset: resetTimer,
        logout: logout,
        getTimeoutDuration: function() { return TIMEOUT_DURATION; },
        getWarningDuration: function() { return WARNING_DURATION; }
    };
})();
