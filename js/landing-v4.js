/**
 * ランディングページ - 登録機能
 * Supabase Auth を使用してユーザー登録を実装
 */

// DOMContentLoaded後に初期化
document.addEventListener('DOMContentLoaded', () => {
    // Supabase初期化
    if (typeof initializeApp === 'function') {
        initializeApp();
        console.log('✅ Supabase client initialized via initializeApp()');
    } else if (!window.supabase && typeof SUPABASE_CONFIG !== 'undefined') {
        // initializeApp が存在しない場合は直接初期化
        const { createClient } = window.supabase;
        const client = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        window.supabase = client;
        window.supabaseClient = client;
        console.log('✅ Supabase client initialized directly');
    } else if (window.supabase && window.supabase.auth) {
        console.log('✅ Supabase client already initialized');
    } else {
        console.error('❌ Supabase client not initialized properly');
    }
});

// パスワード自動生成関数
function generatePassword(length = 10) {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%';
    
    const allChars = uppercase + lowercase + numbers + symbols;
    
    let password = '';
    // 最低1つずつ各カテゴリから
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // 残りの文字をランダムに
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // シャッフル
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

// 登録フォーム送信処理
document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const registerBtn = document.getElementById('register-btn');
    const messageEl = document.getElementById('register-message');
    
    // 入力値取得
    const companyName = document.getElementById('company-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const termsAgree = document.getElementById('terms-agree').checked;
    
    // バリデーション
    if (!companyName || !email || !phone) {
        messageEl.textContent = '❌ すべてのフィールドを入力してください。';
        messageEl.style.color = '#ef4444';
        return;
    }
    
    // 利用規約同意チェック
    if (!termsAgree) {
        messageEl.textContent = '❌ 利用規約およびプライバシーポリシーに同意するには、チェックボックスにチェックを入れてください。';
        messageEl.style.color = '#ef4444';
        return;
    }
    
    // メール形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        messageEl.textContent = '❌ 有効なメールアドレスを入力してください。';
        messageEl.style.color = '#ef4444';
        return;
    }
    
    // ボタン無効化
    registerBtn.disabled = true;
    registerBtn.textContent = '登録中...';
    messageEl.textContent = '🔄 登録処理を実行中です...';
    messageEl.style.color = '#2563eb';
    
    try {
        // パスワード自動生成
        const generatedPassword = generatePassword(12);
        
        console.log('📝 登録情報:', { companyName, email, phone });
        console.log('🔐 生成されたパスワード:', generatedPassword);
        
       // Supabase Auth で新規ユーザー登録
const supabaseClient = window.supabaseClient || window.supabase;

if (!supabaseClient || !supabaseClient.auth) {
    throw new Error('Supabase client not properly initialized');
}

const { data: authData, error: authError } = await supabaseClient.auth.signUp({

            email: email,
            password: generatedPassword,
            options: {
                data: {
                    company_name: companyName,
                    phone: phone,
                    role: 'user'
                },
                emailRedirectTo: `${window.location.origin}/index.html`
            }
        });
        
        if (authError) {
            console.error('❌ 登録エラー:', authError);
            
            // エラーメッセージを日本語化
            let errorMessage = '登録に失敗しました。';
            if (authError.message.includes('already registered')) {
                errorMessage = 'このメールアドレスは既に登録されています。';
            } else if (authError.message.includes('invalid email')) {
                errorMessage = '無効なメールアドレスです。';
            }
            
            messageEl.textContent = `❌ ${errorMessage}`;
            messageEl.style.color = '#ef4444';
            
            registerBtn.disabled = false;
            registerBtn.textContent = 'いますぐ始める';
            return;
        }
        
        console.log('✅ Supabase Auth 登録成功:', authData);
        
        // 成功メッセージ
        messageEl.innerHTML = `
            ✅ <strong>登録が完了しました!</strong><br>
            <br>
            📧 <strong>${email}</strong> にログイン情報を送信しました。<br>
            受信メールを確認して、ログインしてください。<br>
            <br>
            <strong>ログイン情報:</strong><br>
            メールアドレス: <code style="background: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 4px;">${email}</code><br>
            パスワード: <code style="background: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 4px;">${generatedPassword}</code><br>
            <br>
            ⚠️ <em>このパスワードは必ず保存してください。</em><br>
            <br>
            <a href="index.html" style="color: #2563eb; font-weight: 600; text-decoration: underline;">今すぐログインする →</a>
        `;
        messageEl.style.color = '#059669';
        
        // フォームリセット
        document.getElementById('register-form').reset();
        registerBtn.disabled = true;
        registerBtn.textContent = '登録完了 ✅';
        
        // Supabase からの確認メールを待つメッセージ
        setTimeout(() => {
            alert(`✅ 登録完了しました!\n\nログイン情報:\nメール: ${email}\nパスワード: ${generatedPassword}\n\nこのパスワードは必ずメモしてください。\n確認メールも送信されていますので、メールボックスをご確認ください。`);
        }, 500);
        
    } catch (error) {
        console.error('❌ 予期しないエラー:', error);
        
        let errorDetail = '';
        if (error.message) {
            errorDetail = `（${error.message}）`;
        }
        
        messageEl.textContent = `❌ 予期しないエラーが発生しました。${errorDetail} しばらくしてから再度お試しください。`;
        messageEl.style.color = '#ef4444';
        
        registerBtn.disabled = false;
        registerBtn.textContent = 'いますぐ始める';
    }
});

// スムーススクロール
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// スクロールアニメーション
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// アニメーション対象要素
document.querySelectorAll('.feature-card, .screen-card, .demo-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s, transform 0.6s';
    observer.observe(el);
});

console.log('✅ landing.js loaded');
