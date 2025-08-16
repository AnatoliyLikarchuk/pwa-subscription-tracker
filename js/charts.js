/* ===========================
   CHARTS МОДУЛЬ ДЛЯ PWA
   Интеграция с Chart.js
   =========================== */

class SubscriptionCharts {
  constructor() {
    this.charts = {};
    this.isChartJsLoaded = false;
    this.chartContainers = [];
    
    this.init();
  }

  // ===========================
  // ИНИЦИАЛИЗАЦИЯ
  // ===========================

  async init() {
    try {
      await this.waitForChartJs();
      this.setupChartDefaults();
      this.createChartContainers();
      this.bindEvents();
      this.renderAllCharts();
    } catch (error) {
      console.error('Ошибка инициализации графиков:', error);
    }
  }

  async waitForChartJs() {
    return new Promise((resolve, reject) => {
      if (window.Chart) {
        this.isChartJsLoaded = true;
        resolve();
        return;
      }

      let attempts = 0;
      const maxAttempts = 50;
      
      const checkChart = () => {
        attempts++;
        if (window.Chart) {
          this.isChartJsLoaded = true;
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('Chart.js не загружен'));
        } else {
          setTimeout(checkChart, 100);
        }
      };
      
      checkChart();
    });
  }

  setupChartDefaults() {
    if (!window.Chart) return;

    // Настройки по умолчанию для всех графиков
    Chart.defaults.font.family = "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = getComputedStyle(document.documentElement)
      .getPropertyValue('--on-surface').trim() || '#1C1B1F';
    Chart.defaults.borderColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--outline-variant').trim() || '#CAC4D0';
    Chart.defaults.backgroundColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--surface-variant').trim() || '#F5F5F5';

    // Регистрация плагинов
    this.registerCustomPlugins();
  }

  registerCustomPlugins() {
    // Плагин для адаптивности
    Chart.register({
      id: 'responsivePlugin',
      afterResize: (chart) => {
        this.handleChartResize(chart);
      }
    });

    // Плагин для анимации появления
    Chart.register({
      id: 'animationPlugin',
      afterRender: (chart) => {
        if (!chart.rendered) {
          chart.canvas.parentElement.classList.add('animate-fade-in');
          chart.rendered = true;
        }
      }
    });
  }

  // ===========================
  // СОЗДАНИЕ КОНТЕЙНЕРОВ
  // ===========================

  createChartContainers() {
    this.createExpensesPieChart();
    this.createMonthlyTrendChart();
    this.createCategoryBredownChart();
  }

  createExpensesPieChart() {
    const container = this.createChartContainer('expenses-pie-chart', 'Распределение расходов по подпискам');
    const dashboardSection = document.querySelector('.dashboard');
    
    if (dashboardSection) {
      dashboardSection.appendChild(container);
      this.chartContainers.push(container);
    }
  }

  createMonthlyTrendChart() {
    const container = this.createChartContainer('monthly-trend-chart', 'Тренд расходов по месяцам');
    const subscriptionsSection = document.querySelector('.subscriptions-section');
    
    if (subscriptionsSection) {
      subscriptionsSection.appendChild(container);
      this.chartContainers.push(container);
    }
  }

  createCategoryBredownChart() {
    const container = this.createChartContainer('category-breakdown-chart', 'Расходы по категориям');
    const subscriptionsSection = document.querySelector('.subscriptions-section');
    
    if (subscriptionsSection) {
      subscriptionsSection.appendChild(container);
      this.chartContainers.push(container);
    }
  }

  createChartContainer(id, title) {
    const container = document.createElement('div');
    container.className = 'chart-container';
    container.innerHTML = `
      <h3 class="chart-title">${title}</h3>
      <div class="chart-wrapper">
        <canvas id="${id}"></canvas>
      </div>
      <div class="chart-controls">
        <button class="text-button" onclick="subscriptionCharts.toggleChartType('${id}')">
          <span class="material-icons">bar_chart</span>
          Изменить тип
        </button>
        <button class="text-button" onclick="subscriptionCharts.exportChart('${id}')">
          <span class="material-icons">download</span>
          Скачать
        </button>
      </div>
    `;
    
    return container;
  }

  // ===========================
  // РЕНДЕРИНГ ГРАФИКОВ
  // ===========================

  renderAllCharts() {
    if (!this.isChartJsLoaded) {
      console.warn('Chart.js не загружен, пропускаем рендеринг графиков');
      return;
    }

    try {
      const stats = subscriptionDB.getStatistics();
      
      this.renderExpensesPieChart(stats);
      this.renderMonthlyTrendChart(stats);
      this.renderCategoryBreakdownChart(stats);
    } catch (error) {
      console.error('Ошибка рендеринга графиков:', error);
    }
  }

  renderExpensesPieChart(stats) {
    const canvas = document.getElementById('expenses-pie-chart');
    if (!canvas || !stats.categoryBreakdown) return;

    const ctx = canvas.getContext('2d');
    
    // Уничтожаем предыдущий график
    if (this.charts.expensesPie) {
      this.charts.expensesPie.destroy();
    }

    const categories = Object.keys(stats.categoryBreakdown);
    const data = categories.map(cat => stats.categoryBreakdown[cat].total);
    const labels = categories.map(cat => this.getCategoryName(cat));

    this.charts.expensesPie = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: this.getCategoryColors(categories),
          borderColor: this.getCategoryBorderColors(categories),
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = this.formatCurrency(context.parsed);
                const percentage = this.calculatePercentage(context.parsed, data);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        },
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 1000,
          easing: 'easeOutQuart'
        }
      }
    });
  }

  renderMonthlyTrendChart(stats) {
    const canvas = document.getElementById('monthly-trend-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    if (this.charts.monthlyTrend) {
      this.charts.monthlyTrend.destroy();
    }

    const monthlyData = this.generateMonthlyTrendData(stats);

    this.charts.monthlyTrend = new Chart(ctx, {
      type: 'line',
      data: {
        labels: monthlyData.labels,
        datasets: [{
          label: 'Месячные расходы',
          data: monthlyData.data,
          borderColor: this.getPrimaryColor(),
          backgroundColor: this.getPrimaryColorWithAlpha(0.1),
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: this.getPrimaryColor(),
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: this.getSurfaceColor(),
            titleColor: this.getOnSurfaceColor(),
            bodyColor: this.getOnSurfaceColor(),
            borderColor: this.getOutlineColor(),
            borderWidth: 1,
            callbacks: {
              label: (context) => {
                return `Расходы: ${this.formatCurrency(context.parsed.y)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: this.getOutlineVariantColor()
            },
            ticks: {
              color: this.getOnSurfaceVariantColor()
            }
          },
          y: {
            grid: {
              color: this.getOutlineVariantColor()
            },
            ticks: {
              color: this.getOnSurfaceVariantColor(),
              callback: (value) => this.formatCurrency(value)
            }
          }
        },
        animation: {
          duration: 1500,
          easing: 'easeOutQuart'
        }
      }
    });
  }

  renderCategoryBreakdownChart(stats) {
    const canvas = document.getElementById('category-breakdown-chart');
    if (!canvas || !stats.categoryBreakdown) return;

    const ctx = canvas.getContext('2d');
    
    if (this.charts.categoryBreakdown) {
      this.charts.categoryBreakdown.destroy();
    }

    const categories = Object.keys(stats.categoryBreakdown);
    const data = categories.map(cat => stats.categoryBreakdown[cat].total);
    const labels = categories.map(cat => this.getCategoryName(cat));

    this.charts.categoryBreakdown = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Расходы по категориям',
          data: data,
          backgroundColor: this.getCategoryColors(categories, 0.8),
          borderColor: this.getCategoryColors(categories),
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: this.getSurfaceColor(),
            titleColor: this.getOnSurfaceColor(),
            bodyColor: this.getOnSurfaceColor(),
            borderColor: this.getOutlineColor(),
            borderWidth: 1,
            callbacks: {
              label: (context) => {
                return `${context.label}: ${this.formatCurrency(context.parsed.y)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: this.getOnSurfaceVariantColor(),
              maxRotation: 45
            }
          },
          y: {
            grid: {
              color: this.getOutlineVariantColor()
            },
            ticks: {
              color: this.getOnSurfaceVariantColor(),
              callback: (value) => this.formatCurrency(value)
            }
          }
        },
        animation: {
          duration: 1200,
          easing: 'easeOutBounce'
        }
      }
    });
  }

  // ===========================
  // ДАННЫЕ ДЛЯ ГРАФИКОВ
  // ===========================

  generateMonthlyTrendData(stats) {
    const months = [];
    const data = [];
    const monthlyExpense = stats.monthlyTotal;
    
    // Генерируем данные за последние 12 месяцев
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      months.push(date.toLocaleDateString('uk-UA', { month: 'short', year: '2-digit' }));
      
      // Симулируем изменение расходов (в реальном приложении здесь была бы история)
      const variation = (Math.random() - 0.5) * 0.3;
      const monthData = monthlyExpense * (1 + variation);
      data.push(Math.max(0, monthData));
    }
    
    return { labels: months, data };
  }

  // ===========================
  // ЦВЕТА И СТИЛИ
  // ===========================

  getCategoryColors(categories, alpha = 1) {
    const colors = {
      entertainment: `rgba(233, 30, 99, ${alpha})`,
      music: `rgba(156, 39, 176, ${alpha})`,
      video: `rgba(244, 67, 54, ${alpha})`,
      productivity: `rgba(33, 150, 243, ${alpha})`,
      cloud: `rgba(0, 188, 212, ${alpha})`,
      news: `rgba(255, 152, 0, ${alpha})`,
      other: `rgba(96, 125, 139, ${alpha})`
    };
    
    return categories.map(cat => colors[cat] || colors.other);
  }

  getCategoryBorderColors(categories) {
    return this.getCategoryColors(categories, 1);
  }

  getCategoryName(category) {
    const names = {
      entertainment: 'Развлечения',
      music: 'Музыка',
      video: 'Видео',
      productivity: 'Продуктивность',
      cloud: 'Облачные сервисы',
      news: 'Новости',
      other: 'Другое'
    };
    
    return names[category] || category;
  }

  getPrimaryColor() {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--primary-color').trim() || '#6200EA';
  }

  getPrimaryColorWithAlpha(alpha) {
    const hex = this.getPrimaryColor();
    const rgb = this.hexToRgb(hex);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }

  getSurfaceColor() {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--surface').trim() || '#FFFFFF';
  }

  getOnSurfaceColor() {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--on-surface').trim() || '#1C1B1F';
  }

  getOnSurfaceVariantColor() {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--on-surface-variant').trim() || '#49454F';
  }

  getOutlineColor() {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--outline').trim() || '#79747E';
  }

  getOutlineVariantColor() {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--outline-variant').trim() || '#CAC4D0';
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // ===========================
  // УТИЛИТЫ
  // ===========================

  formatCurrency(amount) {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  calculatePercentage(value, dataArray) {
    const total = dataArray.reduce((sum, val) => sum + val, 0);
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  // ===========================
  // УПРАВЛЕНИЕ ГРАФИКАМИ
  // ===========================

  updateCharts() {
    if (!this.isChartJsLoaded) return;
    
    try {
      const stats = subscriptionDB.getStatistics();
      this.updateChartData(stats);
    } catch (error) {
      console.error('Ошибка обновления графиков:', error);
    }
  }

  updateChartData(stats) {
    // Обновляем данные без пересоздания графиков
    if (this.charts.expensesPie) {
      this.updatePieChartData(this.charts.expensesPie, stats);
    }
    
    if (this.charts.monthlyTrend) {
      this.updateLineChartData(this.charts.monthlyTrend, stats);
    }
    
    if (this.charts.categoryBreakdown) {
      this.updateBarChartData(this.charts.categoryBreakdown, stats);
    }
  }

  updatePieChartData(chart, stats) {
    const categories = Object.keys(stats.categoryBreakdown);
    const data = categories.map(cat => stats.categoryBreakdown[cat].total);
    const labels = categories.map(cat => this.getCategoryName(cat));
    
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.data.datasets[0].backgroundColor = this.getCategoryColors(categories);
    chart.update('active');
  }

  updateLineChartData(chart, stats) {
    const monthlyData = this.generateMonthlyTrendData(stats);
    chart.data.labels = monthlyData.labels;
    chart.data.datasets[0].data = monthlyData.data;
    chart.update('active');
  }

  updateBarChartData(chart, stats) {
    const categories = Object.keys(stats.categoryBreakdown);
    const data = categories.map(cat => stats.categoryBreakdown[cat].total);
    const labels = categories.map(cat => this.getCategoryName(cat));
    
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.data.datasets[0].backgroundColor = this.getCategoryColors(categories, 0.8);
    chart.update('active');
  }

  resizeCharts() {
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.resize === 'function') {
        chart.resize();
      }
    });
  }

  toggleChartType(chartId) {
    const chart = this.charts[chartId.replace('-', '')];
    if (!chart) return;
    
    const currentType = chart.config.type;
    let newType;
    
    switch (currentType) {
      case 'doughnut':
        newType = 'pie';
        break;
      case 'pie':
        newType = 'doughnut';
        break;
      case 'line':
        newType = 'bar';
        break;
      case 'bar':
        newType = 'line';
        break;
      default:
        return;
    }
    
    chart.config.type = newType;
    chart.update();
  }

  exportChart(chartId) {
    const chart = this.charts[chartId.replace('-', '')];
    if (!chart) return;
    
    try {
      const canvas = chart.canvas;
      const link = document.createElement('a');
      link.download = `${chartId}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      subscriptionUI.showToast({
        type: 'success',
        message: 'График сохранён как изображение'
      });
    } catch (error) {
      console.error('Ошибка экспорта графика:', error);
      subscriptionUI.showToast({
        type: 'error',
        message: 'Ошибка сохранения графика'
      });
    }
  }

  // ===========================
  // СОБЫТИЯ
  // ===========================

  bindEvents() {
    // Обновление графиков при изменении данных
    window.addEventListener('subscriptionsUpdated', () => {
      this.updateCharts();
    });
    
    // Обновление цветов при смене темы
    window.addEventListener('settingsUpdated', (e) => {
      if (e.detail && e.detail.theme) {
        this.updateChartColors();
      }
    });
    
    // Обновление размеров при изменении окна
    window.addEventListener('resize', () => {
      setTimeout(() => this.resizeCharts(), 300);
    });
  }

  updateChartColors() {
    // Пересоздаём графики с новыми цветами для корректного отображения темы
    setTimeout(() => {
      this.setupChartDefaults();
      this.renderAllCharts();
    }, 100);
  }

  handleChartResize(chart) {
    // Дополнительная логика при изменении размера графика
    console.log(`График ${chart.canvas.id} изменил размер`);
  }

  // ===========================
  // УНИЧТОЖЕНИЕ
  // ===========================

  destroy() {
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    
    this.charts = {};
    
    this.chartContainers.forEach(container => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    });
    
    this.chartContainers = [];
  }

  // ===========================
  // ДИАГНОСТИКА
  // ===========================

  getChartsInfo() {
    return {
      isChartJsLoaded: this.isChartJsLoaded,
      activeCharts: Object.keys(this.charts),
      chartContainers: this.chartContainers.length,
      chartVersion: window.Chart ? Chart.version : 'Not loaded'
    };
  }
}

// Создать глобальный экземпляр графиков
let subscriptionCharts;

// Инициализация после загрузки DOM и других компонентов
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    subscriptionCharts = new SubscriptionCharts();
    window.subscriptionCharts = subscriptionCharts;
  }, 500);
});

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SubscriptionCharts };
} else {
  window.SubscriptionCharts = SubscriptionCharts;
}