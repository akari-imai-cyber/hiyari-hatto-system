// ===================================
// 設定ファイル
// ===================================

// Supabase設定
const SUPABASE_CONFIG = {
    url: 'https://yimeoggmsubtcmxddyat.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpbWVvZ2dtc3VidGNteGRkeWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5OTcwMTcsImV4cCI6MjA4NzU3MzAxN30.wQY_t9umGhqshO1UQJ-aHj3MPUimzJgOso3W9YmKYlA'
};

// ヒヤリハット事象カテゴリ（走行中）
// ※HTMLで既に定義されているので、ここでは上書きしない
if (!window.DRIVING_CATEGORIES) {
    window.DRIVING_CATEGORIES = [
        '急ブレーキ・急ハンドル',
        '車両との接触寸前',
        '歩行者・自転車との接触寸前',
        '見落とし・確認ミス',
        'バック・方向転換時のニアミス',
        '車線変更・合流ヒヤリ',
        '踏切・交差点ヒヤリ',
        'その他'
    ];
}

// ヒヤリハット事象カテゴリ（荷役中）
if (!window.LOADING_CATEGORIES) {
    window.LOADING_CATEGORIES = [
        '荷崩れ・落下寸前',
        '転倒・つまずき・滑り',
        '挟まれ・巻き込まれ寸前',
        '機材との接触',
        '荷物の破損寸前',
        'その他'
    ];
}

// 後方互換性のため
const DRIVING_CATEGORIES = window.DRIVING_CATEGORIES;
const LOADING_CATEGORIES = window.LOADING_CATEGORIES;

// Supabaseクライアント初期化
let supabaseClient = null;

// 初期化関数
function initializeApp() {
    try {
        // Supabaseクライアント初期化
        const { createClient } = window.supabase;
        supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        
        // グローバルにも設定（後方互換性）
        window.supabaseClient = supabaseClient;
        
        console.log('アプリケーション初期化完了');
        console.log('supabaseClient:', supabaseClient);
        return true;
    } catch (error) {
        console.error('初期化エラー:', error);
        alert('アプリケーションの初期化に失敗しました。設定を確認してください。');
        return false;
    }
}
