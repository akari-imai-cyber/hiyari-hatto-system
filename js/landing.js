// ============================================
// ランディングページ JavaScript
// ============================================

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

// 企業登録フォーム送信
document.getElementById('register-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const companyName = document.getElementById('company-name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const plan = document.getElementById('plan').value;
    
    if (!companyName || !email || !phone || !plan) {
        alert('すべての項目を入力してください');
        return;
    }
    
    // 簡易的なメールアドレス検証
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('有効なメールアドレスを入力してください');
        return;
    }
    
    try {
        // ローディング表示
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '登録中...';
        submitBtn.disabled = true;
        
        // 企業登録処理（Supabase連携）
        const result = await window.registerCompany({
            companyName,
            email,
            phone,
            plan
        });
        
        // ローディング解除
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        if (result.success) {
            // 成功モーダル表示
            showSuccessModal(companyName, result.companyCode, result.password, email);
            
            // フォームリセット
            e.target.reset();
        } else {
            throw new Error(result.error || '登録に失敗しました');
        }
        
    } catch (error) {
        console.error('登録エラー:', error);
        alert(`登録に失敗しました\n${error.message}\n\nもう一度お試しください。`);
        
        // ボタンを元に戻す
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = '無料で始める';
        submitBtn.disabled = false;
    }
});

// 成功モーダル表示
function showSuccessModal(companyName, companyCode, password, email) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            padding: 40px;
            border-radius: 16px;
            max-width: 500px;
            text-align: center;
        ">
            <div style="font-size: 4rem; margin-bottom: 20px;">🎉</div>
            <h2 style="font-size: 2rem; margin-bottom: 20px; color: #2563eb;">登録完了！</h2>
            <p style="margin-bottom: 30px; line-height: 1.8;">
                <strong>${companyName}</strong> 様<br>
                ご登録ありがとうございます。<br>
                以下の情報でログインできます。
            </p>
            <div style="
                background: #f9fafb;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
                text-align: left;
            ">
                <p style="margin-bottom: 10px;">
                    <strong>企業コード:</strong><br>
                    <span style="font-size: 1.5rem; color: #2563eb;">${companyCode}</span>
                </p>
                <p style="margin-bottom: 10px;">
                    <strong>パスワード:</strong><br>
                    <span style="font-size: 1.5rem; color: #2563eb;">${password}</span>
                </p>
            </div>
            <p style="color: #ef4444; font-weight: 600; margin-bottom: 20px;">
                ⚠️ この情報は必ずメモしてください
            </p>
            <p style="margin-bottom: 30px; font-size: 0.9rem; color: #6b7280;">
                認証情報は ${email} にも送信されました。
            </p>
            <a href="index.html" style="
                display: inline-block;
                padding: 15px 40px;
                background: #2563eb;
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
            ">ログイン画面へ</a>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 5秒後に自動的に閉じる
    setTimeout(() => {
        modal.style.opacity = '0';
        modal.style.transition = 'opacity 0.5s';
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 500);
    }, 10000);
}

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
document.querySelectorAll('.feature-card, .pricing-card, .testimonial-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s, transform 0.6s';
    observer.observe(el);
});
