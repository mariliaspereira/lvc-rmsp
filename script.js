let rawData = [];
let trendChart, outcomeChart;

// Configurações de cores
const COLORS = {
    positive: '#e74c3c',
    negative: '#27ae60',
    inconclusive: '#f1c40f'
};

// Carregar CSV ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    Papa.parse('dados_leishmaniose.csv', {
        download: true,
        header: true,
        dynamicTyping: true,
        complete: function(results) {
            rawData = results.data.filter(row => row.Municipio); // Remove linhas vazias
            initDashboard();
        }
    });
});

function initDashboard() {
    populateFilters();
    updateDashboard();
    
    // Listeners
    document.getElementById('city-filter').addEventListener('change', updateDashboard);
    document.getElementById('year-filter').addEventListener('change', updateDashboard);
}

function populateFilters() {
    const cities = [...new Set(rawData.map(d => d.Municipio))].sort();
    const years = [...new Set(rawData.map(d => d.Ano))].sort();

    const citySelect = document.getElementById('city-filter');
    const yearSelect = document.getElementById('year-filter');

    cities.forEach(city => {
        const opt = document.createElement('option');
        opt.value = city;
        opt.textContent = city;
        citySelect.appendChild(opt);
    });

    years.forEach(year => {
        const opt = document.createElement('option');
        opt.value = year;
        opt.textContent = year;
        yearSelect.appendChild(opt);
    });
}

function updateDashboard() {
    const selectedCity = document.getElementById('city-filter').value;
    const selectedYear = document.getElementById('year-filter').value;

    const filteredData = rawData.filter(d => {
        const cityMatch = selectedCity === 'all' || d.Municipio === selectedCity;
        const yearMatch = selectedYear === 'all' || d.Ano === parseInt(selectedYear);
        return cityMatch && yearMatch;
    });

    updateKPIs(filteredData);
    renderTrendChart(filteredData);
    renderOutcomeChart(filteredData);
}

function updateKPIs(data) {
    const total = data.length;
    const positive = data.filter(d => d.Desfecho === 1).length;
    const negative = data.filter(d => d.Desfecho === 0).length;
    const inconclusive = data.filter(d => d.Desfecho === 2).length;

    document.getElementById('total-tests').innerText = total;
    document.getElementById('total-positive').innerText = positive;
    document.getElementById('total-negative').innerText = negative;
    document.getElementById('total-inconclusive').innerText = inconclusive;
}

function renderTrendChart(data) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    
    // Agrupar por ano
    const yearlyData = {};
    rawData.forEach(d => {
        if (!yearlyData[d.Ano]) yearlyData[d.Ano] = { positive: 0, total: 0 };
    });

    // Se estiver filtrado por cidade, mostrar apenas aquela cidade na tendência
    const selectedCity = document.getElementById('city-filter').value;
    const trendSource = selectedCity === 'all' ? rawData : rawData.filter(d => d.Municipio === selectedCity);

    const years = Object.keys(yearlyData).sort();
    const counts = years.map(y => trendSource.filter(d => d.Ano === parseInt(y) && d.Desfecho === 1).length);

    if (trendChart) trendChart.destroy();

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'Casos Positivos por Ano',
                data: counts,
                borderColor: COLORS.positive,
                tension: 0.3,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'Evolução Temporal' }
            }
        }
    });
}

function renderOutcomeChart(data) {
    const ctx = document.getElementById('outcomeChart').getContext('2d');
    
    const positive = data.filter(d => d.Desfecho === 1).length;
    const negative = data.filter(d => d.Desfecho === 0).length;
    const inconclusive = data.filter(d => d.Desfecho === 2).length;

    if (outcomeChart) outcomeChart.destroy();

    outcomeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Positivo', 'Negativo', 'Inconclusivo'],
            datasets: [{
                data: [positive, negative, inconclusive],
                backgroundColor: [COLORS.positive, COLORS.negative, COLORS.inconclusive]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'Distribuição de Desfechos' }
            }
        }
    });
}

const toggleBtn = document.getElementById('toggle-theme');

toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');

    if (document.body.classList.contains('dark')) {
        toggleBtn.textContent = '☀️ Modo claro';
    } else {
        toggleBtn.textContent = '🌙 Modo escuro';
    }
});
