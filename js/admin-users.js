     1	/**
     2	 * ユーザー管理画面のロジック
     3	 */
     4	
     5	// グローバル変数
     6	let currentCompanyId = null;
     7	let currentUserRole = null;
     8	
     9	// 初期化
    10	document.addEventListener('DOMContentLoaded', async () => {
    11	    console.log('👤 ユーザー管理画面: 初期化開始');
    12	    
    13	    // Supabase初期化
    14	    if (typeof initializeApp === 'function') {
    15	        await initializeApp();
    16	    }
    17	    
    18	    // 認証が完了するまで待つ
    19	    if (typeof checkAuthentication === 'function') {
    20	        const authResult = await checkAuthentication();
    21	        if (!authResult) {
    22	            console.error('❌ 認証失敗');
    23	            return;
    24	        }
    25	    }
    26	    
    27	    // authComplete イベントを待つ
    28	    const waitForAuth = () => {
    29	        return new Promise((resolve) => {
    30	            // 既に認証済みの場合
    31	            const auth = window.getCurrentAuth ? window.getCurrentAuth() : null;
    32	            if (auth && auth.authenticated) {
    33	                console.log('✅ 認証済み:', auth);
    34	                resolve(auth);
    35	                return;
    36	            }
    37	            
    38	            // authComplete イベントを待つ
    39	            window.addEventListener('authComplete', (event) => {
    40	                console.log('✅ authComplete イベント受信:', event.detail);
    41	                resolve(event.detail);
    42	            });
    43	            
    44	            // タイムアウト（5秒）
    45	            setTimeout(() => {
    46	                console.error('❌ 認証タイムアウト');
    47	                window.location.href = 'index.html';
    48	            }, 5000);
    49	        });
    50	    };
    51	    
    52	    const auth = await waitForAuth();
    53	    
    54	    // 管理者権限チェック
    55	    if (auth.role !== 'company_admin' && auth.role !== 'admin') {
    56	        alert('❌ この画面にアクセスする権限がありません。');
    57	        window.location.href = 'index.html';
    58	        return;
    59	    }
    60	    
    61	    currentCompanyId = auth.companyId;
    62	    currentUserRole = auth.role;
    63	    
    64	    console.log('👤 現在の権限:', { companyId: currentCompanyId, role: currentUserRole });
    65	    
    66	    // ユーザー一覧を読み込み
    67	    await loadUsers();
    68	});
    69	
    70	// ユーザー一覧を読み込み
    71	async function loadUsers() {
    72	    const tbody = document.getElementById('users-table-body');
    73	    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">読み込み中...</td></tr>';
    74	    
    75	    try {
    76	        const supabaseClient = window.supabaseClient || window.supabase;
    77	        
    78	        // profiles テーブルからユーザーを取得
    79	        const { data: users, error } = await supabaseClient
    80	            .from('profiles')
    81	            .select('*')
    82	            .eq('company_id', currentCompanyId)
    83	            .order('created_at', { ascending: false });
    84	        
    85	        if (error) throw error;
    86	        
    87	        if (!users || users.length === 0) {
    88	            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem;">ユーザーが登録されていません</td></tr>';
    89	            return;
    90	        }
    91	        
    92	        // テーブルに表示
    93	        tbody.innerHTML = users.map(user => `
    94	            <tr>
    95	                <td>${user.email || '未設定'}</td>
    96	                <td>
    97	                    <span class="badge ${user.role === 'company_admin' ? 'badge-admin' : 'badge-user'}">
    98	                        ${user.role === 'company_admin' ? '管理者' : '一般ユーザー'}
    99	                    </span>
   100	                </td>
   101	                <td>${new Date(user.created_at).toLocaleDateString('ja-JP')}</td>
   102	                <td>
   103	                    ${user.role !== 'company_admin' ? `<button class="btn-delete" onclick="deleteUser('${user.id}', '${user.email}')">削除</button>` : ''}
   104	                </td>
   105	            </tr>
   106	        `).join('');
   107	        
   108	    } catch (error) {
   109	        console.error('❌ ユーザー読み込みエラー:', error);
   110	        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 2rem; color: #ef4444;">ユーザーの読み込みに失敗しました</td></tr>';
   111	    }
   112	}
   113	
   114	// モーダルを開く
   115	function openAddUserModal() {
   116	    const modal = document.getElementById('add-user-modal');
   117	    modal.classList.add('active');
   118	    
   119	    // フォームをリセット
   120	    document.getElementById('add-user-form').reset();
   121	    document.getElementById('success-message').classList.remove('active');
   122	}
   123	
   124	// モーダルを閉じる
   125	function closeAddUserModal() {
   126	    const modal = document.getElementById('add-user-modal');
   127	    modal.classList.remove('active');
   128	}
   129	
   130	// ユーザー追加フォーム送信
   131	document.getElementById('add-user-form')?.addEventListener('submit', async (e) => {
   132	    e.preventDefault();
   133	    
   134	    const submitBtn = document.getElementById('submit-btn');
   135	    const email = document.getElementById('user-email').value.trim();
   136	    const password = document.getElementById('user-password').value.trim();
   137	    const role = document.getElementById('user-role').value;
   138	    
   139	    // バリデーション
   140	    if (!email || !password) {
   141	        alert('❌ すべてのフィールドを入力してください。');
   142	        return;
   143	    }
   144	    
   145	    // パスワード強度チェック
   146	    if (password.length < 8) {
   147	        alert('❌ パスワードは8文字以上にしてください。');
   148	        return;
   149	    }
   150	    
   151	    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
   152	        alert('❌ パスワードは英大文字・小文字・数字を含む必要があります。');
   153	        return;
   154	    }
   155	    
   156	    // ボタン無効化
   157	    submitBtn.disabled = true;
   158	    submitBtn.textContent = '登録中...';
   159	    
   160	    try {
   161	        const supabaseClient = window.supabaseClient || window.supabase;
   162	        
   163	        // 1. Supabase Auth でユーザーを作成
   164	        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
   165	            email: email,
   166	            password: password,
   167	            options: {
   168	                emailRedirectTo: `${window.location.origin}/index.html`,
   169	                data: {
   170	                    role: role,
   171	                    company_id: currentCompanyId
   172	                }
   173	            }
   174	        });
   175	        
   176	        if (authError) {
   177	            console.error('❌ Auth登録エラー:', authError);
   178	            
   179	            let errorMessage = '登録に失敗しました。';
   180	            if (authError.message.includes('already registered')) {
   181	                errorMessage = 'このメールアドレスは既に登録されています。';
   182	            }
   183	            alert(`❌ ${errorMessage}`);
   184	            
   185	            submitBtn.disabled = false;
   186	            submitBtn.textContent = '登録する';
   187	            return;
   188	        }
   189	        
   190	        console.log('✅ Auth登録成功:', authData);
   191	        
   192	        // 2. profiles テーブルにユーザー情報を登録
   193	        const { data: profileData, error: profileError } = await supabaseClient
   194	            .from('profiles')
   195	            .insert({
   196	                id: authData.user.id,
   197	                email: email,
   198	                role: role,
   199	                company_id: currentCompanyId
   200	            })
   201	            .select()
   202	            .single();
   203	        
   204	        if (profileError) {
   205	            console.error('❌ プロフィール登録エラー:', profileError);
   206	            alert('❌ ユーザー情報の登録に失敗しました。');
   207	            
   208	            submitBtn.disabled = false;
   209	            submitBtn.textContent = '登録する';
   210	            return;
   211	        }
   212	        
   213	        console.log('✅ プロフィール登録成功:', profileData);
   214	        
   215	        // 成功メッセージを表示
   216	        const successMessage = document.getElementById('success-message');
   217	        const loginInfo = document.getElementById('login-info');
   218	        
   219	        loginInfo.innerHTML = `
   220	            <p><strong>メールアドレス:</strong> ${email}</p>
   221	            <p><strong>初期パスワード:</strong> ${password}</p>
   222	            <p><strong>ロール:</strong> ${role === 'company_admin' ? '管理者' : '一般ユーザー'}</p>
   223	        `;
   224	        
   225	        successMessage.classList.add('active');
   226	        
   227	        // フォームを非表示
   228	        document.getElementById('add-user-form').style.display = 'none';
   229	        
   230	        // ユーザー一覧を再読み込み
   231	        await loadUsers();
   232	        
   233	        // 3秒後にモーダルを閉じる
   234	        setTimeout(() => {
   235	            closeAddUserModal();
   236	            document.getElementById('add-user-form').style.display = 'block';
   237	            submitBtn.disabled = false;
   238	            submitBtn.textContent = '登録する';
   239	        }, 5000);
   240	        
   241	    } catch (error) {
   242	        console.error('❌ 予期しないエラー:', error);
   243	        alert(`❌ 予期しないエラーが発生しました: ${error.message}`);
   244	        
   245	        submitBtn.disabled = false;
   246	        submitBtn.textContent = '登録する';
   247	    }
   248	});
   249	
   250	// ユーザー削除
   251	async function deleteUser(userId, userEmail) {
   252	    if (!confirm(`${userEmail} を削除してもよろしいですか？\n\nこの操作は取り消せません。`)) {
   253	        return;
   254	    }
   255	    
   256	    try {
   257	        const supabaseClient = window.supabaseClient || window.supabase;
   258	        
   259	        // profiles テーブルから削除
   260	        const { error: profileError } = await supabaseClient
   261	            .from('profiles')
   262	            .delete()
   263	            .eq('id', userId);
   264	        
   265	        if (profileError) throw profileError;
   266	        
   267	        // Auth ユーザーは削除しない（管理者権限が必要なため）
   268	        // 実運用では Supabase の Admin API を使用して削除可能
   269	        
   270	        alert('✅ ユーザーを削除しました。');
   271	        await loadUsers();
   272	        
   273	    } catch (error) {
   274	        console.error('❌ ユーザー削除エラー:', error);
   275	        alert('❌ ユーザーの削除に失敗しました。');
   276	    }
   277	}
   278	
   279	console.log('✅ admin-users.js loaded');
   280	
