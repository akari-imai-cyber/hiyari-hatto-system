// ============================================
// 企業登録システム（Supabase連携）
// ============================================

// Supabase設定読み込み
const SUPABASE_URL = 'https://yimeoggmsubtcmxddyat.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpbWVvZ2dtc3VidGNteGRkeWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5OTcwMTcsImV4cCI6MjA4NzU3MzAxN30.wQY_t9umGhqshO1UQJ-aHj3MPUimzJgOso3W9YmKYlA';

// Supabaseクライアント初期化
const registrationClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * 企業登録処理
 * @param {Object} data - 企業登録データ
 * @returns {Object} - {success: boolean, companyCode: string, password: string, error: string}
 */
async function registerCompany(data) {
    try {
        const { companyName, email, phone, plan } = data;
        
        // 企業コード生成
        const companyCode = generateCompanyCode(companyName);
        
        // パスワード生成
        const password = generateSecurePassword();
        
        console.log('🔧 企業登録開始:', { companyName, companyCode });
        
        // Supabaseに企業データ挿入
        const insertData = {
            company_code: companyCode,
            company_name: companyName,
            industry: '物流業', // デフォルト
            plan: plan === 'pro' ? 'premium' : 'free',
            created_at: new Date().toISOString()
        };
        
        // contact_email と contact_phone は存在する場合のみ追加
        if (email) insertData.contact_email = email;
        if (phone) insertData.contact_phone = phone;
        
        const { data: responseData, error: insertError } = await registrationClient
            .from('companies')
            .insert([insertData])
            .select();
        
        if (insertError) {
            console.error('❌ Supabase挿入エラー:', insertError);
            throw new Error(`企業登録に失敗しました: ${insertError.message}`);
        }
        
        console.log('✅ Supabase登録成功:', responseData);
        
        // パスワードをLocalStorageに保存（管理画面用）
        savePasswordToLocalStorage(companyCode, password);
        
        // メール通知送信（実装予定）
        await sendRegistrationEmail(email, companyName, companyCode, password);
        
        return {
            success: true,
            companyCode: companyCode,
            password: password,
            error: null
        };
        
    } catch (error) {
        console.error('❌ 企業登録エラー:', error);
        return {
            success: false,
            companyCode: null,
            password: null,
            error: error.message
        };
    }
}

/**
 * 企業コード生成
 * @param {string} companyName - 企業名
 * @returns {string} - 企業コード（例: abc1234-company）
 */
function generateCompanyCode(companyName) {
    // 企業名の最初の3文字（ひらがな→ローマ字変換）
    const prefix = extractPrefix(companyName);
    
    // ランダム4桁数字
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    
    return `${prefix}${randomNum}-company`;
}

/**
 * 企業名から接頭辞抽出
 */
function extractPrefix(companyName) {
    // 数字・記号を除去
    const cleaned = companyName.replace(/[0-9０-９\s　株式会社]/g, '');
    
    // 最初の3文字取得
    const firstChars = cleaned.substring(0, 3);
    
    // ひらがな→ローマ字変換
    let romanized = '';
    for (let char of firstChars) {
        romanized += toRomaji(char);
    }
    
    // 小文字3文字に正規化
    return romanized.toLowerCase().substring(0, 3).padEnd(3, 'x');
}

/**
 * ひらがな→ローマ字変換マップ
 */
function toRomaji(char) {
    const map = {
        'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
        'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
        'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
        'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
        'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
        'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
        'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
        'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
        'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
        'わ': 'wa', 'を': 'wo', 'ん': 'n',
        // カタカナも対応
        'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o',
        'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko',
        'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so',
        'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu', 'テ': 'te', 'ト': 'to',
        'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
        'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho',
        'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo',
        'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
        'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
        'ワ': 'wa', 'ヲ': 'wo', 'ン': 'n'
    };
    
    // マップにない場合は英字ならそのまま、それ以外はxに
    const lower = char.toLowerCase();
    if (map[char]) return map[char];
    if (/[a-z]/.test(lower)) return lower;
    return 'x';
}

/**
 * セキュアなパスワード生成（英数字8文字）
 */
function generateSecurePassword() {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const all = lowercase + numbers;
    
    let password = '';
    
    // 最低1つの英字と1つの数字を保証
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    
    // 残り6文字をランダム生成
    for (let i = 0; i < 6; i++) {
        password += all[Math.floor(Math.random() * all.length)];
    }
    
    // シャッフル
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * パスワードをLocalStorageに保存
 */
function savePasswordToLocalStorage(companyCode, password) {
    try {
        const passwords = JSON.parse(localStorage.getItem('company_passwords') || '{}');
        passwords[companyCode] = password;
        localStorage.setItem('company_passwords', JSON.stringify(passwords));
        console.log('✅ パスワード保存成功:', companyCode);
    } catch (error) {
        console.error('❌ パスワード保存エラー:', error);
    }
}

/**
 * 登録完了メール送信（仮実装）
 */
async function sendRegistrationEmail(email, companyName, companyCode, password) {
    // TODO: EmailJS または Supabase Edge Functions でメール送信
    console.log('📧 メール送信（仮）:', {
        to: email,
        subject: `【ヒヤリハット報告システム】登録完了 - ${companyName}`,
        body: `
企業コード: ${companyCode}
パスワード: ${password}

ログインURL: https://stellular-profiterole-2ff0a2.netlify.app/index.html
        `
    });
    
    return { success: true };
}

// グローバルに公開
if (typeof window !== 'undefined') {
    window.registerCompany = registerCompany;
}
