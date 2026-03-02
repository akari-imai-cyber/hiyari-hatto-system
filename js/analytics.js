// ===================================
// 分析画面 JavaScript
// ===================================

let analyticsData = [];
let charts = {};

// ページ読み込み時
document.addEventListener('DOMContentLoaded', function() {
    // 認証完了イベントを待つ
    window.addEventListener('authComplete', function(e) {
        const auth = e.detail;
        if (auth && auth.authenticated) {
            loadAnalyticsData();
        }
    });
});

// 分析データ読み込み
async function loadAnalyticsData() {
    try {
        const period = parseInt(document.getElementById('period-select').value);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - period);
        
        console.log('=== 分析データ読み込み開始 ===');
        
        // 認証情報から company_id を取得
        const auth = window.getCurrentAuth ? window.getCurrentAuth() : null;
        const companyId = auth ? auth.companyId : null;
        const role = auth ? auth.role : null;
        
        console.log('認証情報:', auth);
        console.log('企業ID:', companyId);
        console.log('ロール:', role);
        
        if (!companyId && role !== 'admin') {
            console.error('❌ 企業IDが取得できません');
            console.error('認証情報の内容:', auth);
            alert('認証情報が取得できません。ページをリロードしてください。');
            // 5秒後に自動リロード
            setTimeout(() => {
                location.reload();
            }, 5000);
            return;
        }
        
        // データ取得クエリを構築
        let query = supabaseClient
            .from('incidents')
            .select('*')
            .gte('occurred_at', startDate.toISOString())
            .order('occurred_at', { ascending: true });
        
        // 一般ユーザーまたは企業管理者の場合は自社データのみ
        if (role !== 'admin' && companyId) {
            console.log('✅ 企業IDでフィルタリング:', companyId);
            query = query.eq('company_id', companyId);
        } else if (role === 'admin') {
            console.log('✅ システム管理者: 全企業のデータを取得');
        }
        
        const { data, error } = await query;
        
        console.log('取得データ:', data);
        console.log('エラー:', error);
        
        if (error) throw error;
        
        analyticsData = data || [];
        console.log('analyticsData件数:', analyticsData.length);
        
        updateAllCharts();
        updateStatsTable();
        
    } catch (error) {
        console.error('データ読み込みエラー:', error);
        alert('データの読み込みに失敗しました: ' + error.message);
    }
}

// 全チャート更新
function updateAllCharts() {
    console.log('=== チャート描画開始 ===');
    console.log('analyticsData:', analyticsData);
    
    try {
        console.log('月次傾向グラフ作成中...');
        createMonthlyTrendChart();
        console.log('✅ 月次傾向グラフ完了');
        
        console.log('カテゴリグラフ作成中...');
        createCategoryChart();
        console.log('✅ カテゴリグラフ完了');
        
        createSeverityChart();
        createDriverChart();
        createCauseChart();
        createTimeChart();
        createDayChart();
        createWeatherChart();
        
        console.log('=== 全チャート描画完了 ===');
    } catch (error) {
        console.error('❌ チャート描画エラー:', error);
    }
}

// 月次傾向グラフ
function createMonthlyTrendChart() {
    console.log('月次傾向グラフ: Canvas要素取得中...');
    const ctx = document.getElementById('monthly-trend-chart');
    
    if (!ctx) {
        console.error('❌ Canvas要素が見つかりません: monthly-trend-chart');
        return;
    }
    
    console.log('✅ Canvas要素取得成功');
    
    // 月別集計
    const monthlyData = {};
    analyticsData.forEach(report => {
        const date = new Date(report.occurred_at);
        const monthKey = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { hiyari: 0, accident: 0 };
        }
        
        if (report.report_type === 'hiyari') {
            monthlyData[monthKey].hiyari++;
        } else {
            monthlyData[monthKey].accident++;
        }
    });
    
    const labels = Object.keys(monthlyData).sort();
    const hiyariData = labels.map(key => monthlyData[key].hiyari);
    const accidentData = labels.map(key => monthlyData[key].accident);
    
    if (charts.monthly) charts.monthly.destroy();
    
    charts.monthly = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'ヒヤリハット',
                    data: hiyariData,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4
                },
                {
                    label: '事故',
                    data: accidentData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// カテゴリ別グラフ
function createCategoryChart() {
    const ctx = document.getElementById('category-chart');
    
    const categoryCounts = {};
    analyticsData.forEach(report => {
        const cat = report.what_happened_category || '未分類';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    
    const labels = Object.keys(categoryCounts);
    const data = Object.values(categoryCounts);
    
    if (charts.category) charts.category.destroy();
    
    charts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#2563eb', '#10b981', '#f59e0b', '#ef4444',
                    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                }
            }
        }
    });
}

// 重大度分布グラフ
function createSeverityChart() {
    console.log('重大度グラフ作成中...');
    const ctx = document.getElementById('severity-chart');
    
    if (!ctx) {
        console.error('❌ Canvas要素が見つかりません: severity-chart');
        return;
    }
    
    const severityCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    analyticsData.forEach(report => {
        // severity（新）またはseverity_rating（旧）に対応
        const severity = report.severity || report.severity_rating;
        if (severity && severity >= 1 && severity <= 5) {
            severityCounts[severity]++;
        }
    });
    
    console.log('重大度集計結果:', severityCounts);
    
    if (charts.severity) charts.severity.destroy();
    
    charts.severity = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['★☆☆☆☆', '★★☆☆☆', '★★★☆☆', '★★★★☆', '★★★★★'],
            datasets: [{
                label: '件数',
                data: Object.values(severityCounts),
                backgroundColor: [
                    '#10b981', '#84cc16', '#f59e0b', '#fb923c', '#ef4444'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
    
    console.log('✅ 重大度グラフ完了');
}

// ドライバー別グラフ
function createDriverChart() {
    console.log('ドライバー別グラフ作成中...');
    const ctx = document.getElementById('driver-chart');
    
    if (!ctx) {
        console.error('❌ Canvas要素が見つかりません: driver-chart');
        return;
    }
    
    const driverCounts = {};
    analyticsData.forEach(report => {
        // reporter_name（新）またはemployee_name（旧）に対応
        const name = report.reporter_name || report.employee_name || '不明';
        driverCounts[name] = (driverCounts[name] || 0) + 1;
    });
    
    console.log('ドライバー集計結果:', driverCounts);
    
    // 上位10名
    const sorted = Object.entries(driverCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const labels = sorted.map(item => item[0]);
    const data = sorted.map(item => item[1]);
    
    if (charts.driver) charts.driver.destroy();
    
    charts.driver = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '報告件数',
                data: data,
                backgroundColor: '#2563eb'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// 原因分析グラフ
function createCauseChart() {
    const ctx = document.getElementById('cause-chart');
    
    const causeCounts = {};
    analyticsData.forEach(report => {
        if (report.direct_causes && Array.isArray(report.direct_causes)) {
            report.direct_causes.forEach(cause => {
                causeCounts[cause] = (causeCounts[cause] || 0) + 1;
            });
        }
    });
    
    const sorted = Object.entries(causeCounts)
        .sort((a, b) => b[1] - a[1]);
    
    const labels = sorted.map(item => item[0]);
    const data = sorted.map(item => item[1]);
    
    if (charts.cause) charts.cause.destroy();
    
    charts.cause = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '件数',
                data: data,
                backgroundColor: '#8b5cf6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// 時間帯別グラフ
function createTimeChart() {
    const ctx = document.getElementById('time-chart');
    
    const hourCounts = Array(24).fill(0);
    analyticsData.forEach(report => {
        const hour = new Date(report.occurred_at).getHours();
        hourCounts[hour]++;
    });
    
    const labels = Array.from({ length: 24 }, (_, i) => `${i}時`);
    
    if (charts.time) charts.time.destroy();
    
    charts.time = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '発生件数',
                data: hourCounts,
                backgroundColor: '#06b6d4'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// 曜日別グラフ
function createDayChart() {
    const ctx = document.getElementById('day-chart');
    
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const dayCounts = Array(7).fill(0);
    
    analyticsData.forEach(report => {
        const day = new Date(report.occurred_at).getDay();
        dayCounts[day]++;
    });
    
    if (charts.day) charts.day.destroy();
    
    charts.day = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dayNames,
            datasets: [{
                label: '発生件数',
                data: dayCounts,
                backgroundColor: '#84cc16'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// 天候別グラフ
function createWeatherChart() {
    const ctx = document.getElementById('weather-chart');
    
    const weatherCounts = {};
    analyticsData.forEach(report => {
        const weather = report.weather || '未記録';
        weatherCounts[weather] = (weatherCounts[weather] || 0) + 1;
    });
    
    const labels = Object.keys(weatherCounts);
    const data = Object.values(weatherCounts);
    
    if (charts.weather) charts.weather.destroy();
    
    charts.weather = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#fbbf24', '#94a3b8', '#3b82f6', '#cbd5e1', '#6b7280'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                }
            }
        }
    });
}

// 統計テーブル更新
function updateStatsTable() {
    const tbody = document.getElementById('stats-tbody');
    const total = analyticsData.length;
    
    const stats = [
        {
            label: 'ヒヤリハット',
            count: analyticsData.filter(r => r.report_type === 'hiyari').length
        },
        {
            label: '事故',
            count: analyticsData.filter(r => r.report_type === 'accident').length
        },
        {
            label: '走行中',
            count: analyticsData.filter(r => r.incident_category === 'driving').length
        },
        {
            label: '荷役中',
            count: analyticsData.filter(r => r.incident_category === 'loading').length
        },
        {
            label: '重大度★★★以上',
            count: analyticsData.filter(r => r.severity_rating >= 3).length
        }
    ];
    
    tbody.innerHTML = stats.map(stat => {
        const percentage = total > 0 ? ((stat.count / total) * 100).toFixed(1) : 0;
        return `
            <tr>
                <td>${stat.label}</td>
                <td><strong>${stat.count}</strong></td>
                <td>
                    <span class="stats-percentage">${percentage}%</span>
                </td>
            </tr>
        `;
    }).join('');
}

// チャート更新
function updateCharts() {
    loadAnalyticsData();
}
