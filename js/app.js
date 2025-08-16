/* ===========================
   ГЛАВНЫЙ МОДУЛЬ PWA ПРИЛОЖЕНИЯ
   Инициализация и координация
   =========================== */

class SubscriptionApp {
  constructor() {
    this.isOnline = navigator.onLine;
    this.deferredPrompt = null;
    this.swRegistration = null;
    
    this.init();
  }

  // ===========================
  // ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
  // ===========================

  async init() {
    console.log('Инициализация SubscriptionApp...');
    
    try {
      // Проверяем готовность DOM
      if (document.readyState === 'loading') {
        console.log('Ожидание готовности DOM...');
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }
      
      console.log('DOM готов, начинаем инициализацию компонентов...');
      
      // Инициализация базовых компонентов
      this.initializeServiceWorker();
      this.initializeEventListeners();
      this.initializePWAFeatures();
      this.initializePerformanceMonitoring();
      
      // Показать уведомление о готовности приложения
      this.showAppReady();
      
      // Проверка обновлений
      this.checkForUpdates();
      
      console.log('Инициализация SubscriptionApp завершена');
      
    } catch (error) {
      console.error('Ошибка инициализации приложения:', error);
      this.handleCriticalError(error);
    }
  }

  // ===========================
  // SERVICE WORKER
  // ===========================

  async initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('Service Worker зарегистрирован:', this.swRegistration);
        
        // Обработка обновлений Service Worker
        this.swRegistration.addEventListener('updatefound', () => {
          this.handleServiceWorkerUpdate();
        });
        
        // Обработка контроля страницы
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });
        
      } catch (error) {
        console.error('Ошибка регистрации Service Worker:', error);
      }
    }
  }

  handleServiceWorkerUpdate() {
    const newWorker = this.swRegistration.installing;
    
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        this.showUpdateAvailable();
      }
    });
  }

  showUpdateAvailable() {
    const updateBanner = document.createElement('div');
    updateBanner.className = 'update-banner';
    updateBanner.innerHTML = `
      <div class="update-content">
        <span>Доступно обновление приложения</span>
        <button class="primary-button" onclick="subscriptionApp.applyUpdate()">
          Обновить
        </button>
        <button class="text-button" onclick="this.parentElement.parentElement.remove()">
          Позже
        </button>
      </div>
    `;
    
    document.body.appendChild(updateBanner);
  }

  applyUpdate() {
    if (this.swRegistration && this.swRegistration.waiting) {
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  async checkForUpdates() {
    if (this.swRegistration) {
      try {
        await this.swRegistration.update();
      } catch (error) {
        console.error('Ошибка проверки обновлений:', error);
      }
    }
  }

  // ===========================
  // PWA ФУНКЦИИ
  // ===========================

  initializePWAFeatures() {
    this.initializeInstallPrompt();
    this.initializeNotifications();
    this.initializeOfflineHandling();
    this.initializeBackgroundSync();
  }

  initializeInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallPrompt();
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA успешно установлено');
      this.hideInstallPrompt();
      subscriptionUI.showToast({
        type: 'success',
        message: 'Приложение успешно установлено!'
      });
    });
  }

  showInstallPrompt() {
    const installPrompt = document.getElementById('install-prompt');
    const installAccept = document.getElementById('install-accept');
    const installDismiss = document.getElementById('install-dismiss');

    if (installPrompt) {
      installPrompt.hidden = false;
      
      installAccept.onclick = () => this.installApp();
      installDismiss.onclick = () => this.hideInstallPrompt();
    }
  }

  hideInstallPrompt() {
    const installPrompt = document.getElementById('install-prompt');
    if (installPrompt) {
      installPrompt.hidden = true;
    }
  }

  async installApp() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('Пользователь принял установку PWA');
      } else {
        console.log('Пользователь отклонил установку PWA');
      }
      
      this.deferredPrompt = null;
      this.hideInstallPrompt();
    }
  }

  // ===========================
  // УВЕДОМЛЕНИЯ
  // ===========================

  async initializeNotifications() {
    if ('Notification' in window) {
      const permission = await this.requestNotificationPermission();
      
      if (permission === 'granted') {
        this.scheduleNotificationChecks();
      }
    }
  }

  async requestNotificationPermission() {
    try {
      const permission = await Notification.requestPermission();
      console.log('Разрешение на уведомления:', permission);
      return permission;
    } catch (error) {
      console.error('Ошибка запроса разрешения на уведомления:', error);
      return 'denied';
    }
  }

  scheduleNotificationChecks() {
    // Проверяем напоминания каждый час
    setInterval(() => {
      this.checkUpcomingPayments();
    }, 60 * 60 * 1000);

    // Проверяем сразу при запуске
    this.checkUpcomingPayments();
  }

  checkUpcomingPayments() {
    try {
      const stats = subscriptionDB.getStatistics();
      const upcomingPayments = stats.upcomingPayments;
      
      upcomingPayments.forEach(subscription => {
        const paymentDate = new Date(subscription.nextPayment);
        const today = new Date();
        const daysUntilPayment = Math.ceil((paymentDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilPayment <= 3 && daysUntilPayment >= 0) {
          this.showPaymentNotification(subscription, daysUntilPayment);
        }
      });
    } catch (error) {
      console.error('Ошибка проверки предстоящих платежей:', error);
    }
  }

  showPaymentNotification(subscription, daysUntilPayment) {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      const title = 'Напоминание о подписке';
      const body = daysUntilPayment === 0 
        ? `Сегодня списание по ${subscription.name}`
        : `Через ${daysUntilPayment} ${this.getDayWord(daysUntilPayment)} списание по ${subscription.name}`;
      
      const options = {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: `payment-${subscription.id}`,
        data: {
          url: '/',
          subscriptionId: subscription.id
        },
        actions: [
          {
            action: 'view',
            title: 'Посмотреть'
          },
          {
            action: 'dismiss',
            title: 'Закрыть'
          }
        ]
      };

      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, options);
      });
    }
  }

  getDayWord(days) {
    if (days === 1) return 'день';
    if (days >= 2 && days <= 4) return 'дня';
    return 'дней';
  }

  // ===========================
  // OFFLINE HANDLING
  // ===========================

  initializeOfflineHandling() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Проверяем текущее состояние
    if (!navigator.onLine) {
      this.handleOffline();
    }
  }

  handleOnline() {
    this.isOnline = true;
    console.log('Приложение онлайн');
    
    subscriptionUI.showToast({
      type: 'success',
      message: 'Соединение восстановлено'
    });

    this.syncPendingData();
  }

  handleOffline() {
    this.isOnline = false;
    console.log('Приложение офлайн');
    
    subscriptionUI.showToast({
      type: 'info',
      message: 'Работаем в офлайн режиме'
    });
  }

  // ===========================
  // BACKGROUND SYNC
  // ===========================

  initializeBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      console.log('Background Sync поддерживается');
    }
  }

  async syncPendingData() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('background-sync-subscriptions');
        console.log('Background sync зарегистрирован');
      } catch (error) {
        console.error('Ошибка регистрации background sync:', error);
      }
    }
  }

  // ===========================
  // ПРОИЗВОДИТЕЛЬНОСТЬ
  // ===========================

  initializePerformanceMonitoring() {
    // Отслеживание времени загрузки
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      console.log(`Приложение загружено за ${Math.round(loadTime)}ms`);
    });

    // Отслеживание использования памяти
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        console.log('Использование памяти:', {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB',
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
        });
      }, 30000); // каждые 30 секунд
    }
  }

  // ===========================
  // ОБРАБОТКА СОБЫТИЙ
  // ===========================

  initializeEventListeners() {
    // Обработка жестов на мобильных устройствах
    this.initializeTouchGestures();
    
    // Обработка сочетаний клавиш
    this.initializeKeyboardShortcuts();
    
    // Обработка изменения размера окна
    window.addEventListener('resize', () => this.handleResize());
    
    // Обработка изменения ориентации
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.handleResize(), 500);
    });
  }

  initializeTouchGestures() {
    let startX, startY, startTime;

    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTime = Date.now();
    });

    document.addEventListener('touchend', (e) => {
      if (!startX || !startY) return;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const endTime = Date.now();

      const diffX = startX - endX;
      const diffY = startY - endY;
      const timeDiff = endTime - startTime;

      // Свайп влево (для удаления подписки)
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50 && timeDiff < 300) {
        if (diffX > 0) {
          // Свайп влево
          this.handleSwipeLeft(e.target);
        } else {
          // Свайп вправо
          this.handleSwipeRight(e.target);
        }
      }

      startX = startY = null;
    });
  }

  handleSwipeLeft(target) {
    const subscriptionCard = target.closest('.subscription-card');
    if (subscriptionCard) {
      const id = subscriptionCard.getAttribute('data-id');
      if (id) {
        subscriptionUI.toggleSubscriptionActive(id);
      }
    }
  }

  handleSwipeRight(target) {
    const subscriptionCard = target.closest('.subscription-card');
    if (subscriptionCard) {
      const id = subscriptionCard.getAttribute('data-id');
      if (id) {
        subscriptionUI.editSubscription(id);
      }
    }
  }

  initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + / - показать помощь по горячим клавишам
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        this.showKeyboardShortcuts();
      }
      
      // Ctrl/Cmd + D - переключить тему
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        subscriptionUI.toggleTheme();
      }
    });
  }

  showKeyboardShortcuts() {
    const shortcuts = [
      { key: 'Ctrl/Cmd + N', action: 'Новая подписка' },
      { key: 'Ctrl/Cmd + K', action: 'Поиск' },
      { key: 'Ctrl/Cmd + D', action: 'Переключить тему' },
      { key: 'Escape', action: 'Закрыть модальное окно' },
      { key: 'Ctrl/Cmd + /', action: 'Показать горячие клавиши' }
    ];

    const shortcutsHtml = shortcuts
      .map(s => `<div><kbd>${s.key}</kbd> - ${s.action}</div>`)
      .join('');

    subscriptionUI.showToast({
      type: 'info',
      message: `Горячие клавиши:<br>${shortcutsHtml}`,
      duration: 5000
    });
  }

  handleResize() {
    // Обновление графиков при изменении размера
    if (window.subscriptionCharts) {
      window.subscriptionCharts.resizeCharts();
    }
  }

  // ===========================
  // УТИЛИТЫ И ПОМОЩНИКИ
  // ===========================

  showAppReady() {
    console.log('PWA приложение готово к работе');
    
    try {
      // Проверяем доступность необходимых компонентов
      if (!window.subscriptionDB) {
        console.error('subscriptionDB не доступен при показе готовности приложения');
        return;
      }
      
      if (!window.subscriptionUI) {
        console.error('subscriptionUI не доступен при показе готовности приложения');
        return;
      }
      
      // Показать сообщение только при первом запуске
      if (!subscriptionDB.getSetting('appLaunched')) {
        subscriptionUI.showToast({
          type: 'success',
          message: 'Добро пожаловать в приложение для учёта подписок!'
        });
        
        subscriptionDB.setSetting('appLaunched', true);
      }
      
      console.log('Приложение полностью готово к использованию');
    } catch (error) {
      console.error('Ошибка при показе готовности приложения:', error);
    }
  }

  handleCriticalError(error) {
    console.error('Критическая ошибка приложения:', error);
    
    // Скрываем экран загрузки если он есть
    const loading = document.getElementById('loading');
    if (loading) {
      loading.hidden = true;
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'critical-error';
    errorDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    errorDiv.innerHTML = `
      <div style="background: #1e1e1e; padding: 2rem; border-radius: 8px; max-width: 400px; text-align: center;">
        <h2 style="color: #ff4757; margin: 0 0 1rem 0;">Произошла ошибка</h2>
        <p style="margin: 0 0 1rem 0; color: #ccc;">Приложение не может запуститься корректно.</p>
        <details style="margin: 1rem 0; text-align: left;">
          <summary style="cursor: pointer; color: #ffa502;">Подробности ошибки</summary>
          <pre style="font-size: 0.8rem; background: #2d2d2d; padding: 1rem; border-radius: 4px; overflow: auto; margin-top: 0.5rem;">
${error.message}
${error.stack || ''}
          </pre>
        </details>
        <button onclick="window.location.reload()" 
                style="background: #6200EA; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 1rem;">
          Перезагрузить
        </button>
      </div>
    `;
    
    document.body.appendChild(errorDiv);
  }

  // ===========================
  // ЭКСПОРТ/ИМПОРТ ДАННЫХ
  // ===========================

  exportData() {
    try {
      const data = subscriptionDB.exportData();
      if (data) {
        this.downloadFile(data, 'subscription-backup.json', 'application/json');
        subscriptionUI.showToast({
          type: 'success',
          message: 'Данные экспортированы'
        });
      }
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      subscriptionUI.showToast({
        type: 'error',
        message: 'Ошибка экспорта данных'
      });
    }
  }

  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const success = subscriptionDB.importData(e.target.result);
            if (success) {
              subscriptionUI.updateUI();
            }
          } catch (error) {
            console.error('Ошибка импорта:', error);
            subscriptionUI.showToast({
              type: 'error',
              message: 'Ошибка импорта данных'
            });
          }
        };
        reader.readAsText(file);
      }
    };
    
    input.click();
  }

  downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  // ===========================
  // ANALYTICS
  // ===========================

  trackEvent(eventName, parameters = {}) {
    // Здесь можно добавить интеграцию с аналитикой
    console.log('Event tracked:', eventName, parameters);
  }

  // ===========================
  // ДИАГНОСТИКА
  // ===========================

  getDiagnosticInfo() {
    return {
      appVersion: '1.0.0',
      userAgent: navigator.userAgent,
      isOnline: this.isOnline,
      serviceWorker: !!this.swRegistration,
      storage: subscriptionDB.getStorageSize(),
      subscriptionsCount: subscriptionDB.getAllSubscriptions().length,
      settings: subscriptionDB.getSettings()
    };
  }

  showDiagnosticInfo() {
    const info = this.getDiagnosticInfo();
    console.table(info);
    
    subscriptionUI.showToast({
      type: 'info',
      message: 'Диагностическая информация выведена в консоль',
      duration: 2000
    });
  }
}

// ===========================
// ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
// ===========================

// Создать экземпляр приложения при загрузке DOM
let subscriptionApp = null;

function initializeSubscriptionApp() {
  if (!subscriptionApp) {
    console.log('Создание экземпляра SubscriptionApp...');
    
    // Ждем пока загрузятся все необходимые компоненты
    const checkDependencies = () => {
      if (window.subscriptionDB && window.subscriptionUI) {
        console.log('Все зависимости загружены, создаем SubscriptionApp');
        subscriptionApp = new SubscriptionApp();
        window.subscriptionApp = subscriptionApp;
        return true;
      }
      return false;
    };
    
    // Проверяем немедленно
    if (!checkDependencies()) {
      console.log('Ожидание загрузки зависимостей...');
      
      // Проверяем каждые 50мс до 5 секунд
      let attempts = 0;
      const maxAttempts = 100; // 5 секунд
      
      const checkInterval = setInterval(() => {
        attempts++;
        
        if (checkDependencies()) {
          clearInterval(checkInterval);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.error('Не удалось дождаться загрузки всех зависимостей');
          
          // Пытаемся создать приложение принудительно
          subscriptionApp = new SubscriptionApp();
          window.subscriptionApp = subscriptionApp;
        }
      }, 50);
    }
  }
  return subscriptionApp;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSubscriptionApp);
} else {
  initializeSubscriptionApp();
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SubscriptionApp };
} else {
  window.SubscriptionApp = SubscriptionApp;
}