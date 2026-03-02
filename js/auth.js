// 認証チェック
(function() {
    const authenticated = sessionStorage.getItem('nlp_authenticated');
    if (!authenticated) {
        let userId = prompt('ユーザーIDを入力してください');
        
        // キャンセルまたは空白チェック
        if (!userId || userId.trim() === '') {
            alert('ユーザーIDが入力されていません。');
            document.body.innerHTML = '<div style="text-align:center;padding:50px;font-family:sans-serif;"><h1>🔒 アクセスが拒否されました</h1><p>正しいユーザーID/パスワードでアクセスしてください。</p></div>';
            throw new Error('Authentication cancelled');
        }
        
        let password = prompt('パスワードを入力してください');
        
        // キャンセルまたは空白チェック
        if (!password || password.trim() === '') {
            alert('パスワードが入力されていません。');
            document.body.innerHTML = '<div style="text-align:center;padding:50px;font-family:sans-serif;"><h1>🔒 アクセスが拒否されました</h1><p>正しいユーザーID/パスワードでアクセスしてください。</p></div>';
            throw new Error('Authentication cancelled');
        }
        
        if (userId === 'nlp-test' && password === 'nlp2026') {
            sessionStorage.setItem('nlp_authenticated', 'true');
            alert('ログインしました');
        } else {
            alert('認証に失敗しました。正しいID/パスワードを入力してください。');
            document.body.innerHTML = '<div style="text-align:center;padding:50px;font-family:sans-serif;"><h1>🔒 アクセスが拒否されました</h1><p>正しいユーザーID/パスワードでアクセスしてください。</p></div>';
            throw new Error('Authentication failed');
        }
    }
})();
