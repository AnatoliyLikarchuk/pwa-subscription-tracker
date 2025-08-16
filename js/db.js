/* ===========================
   DATABASE МОДУЛЬ ДЛЯ PWA
   Работа с localStorage
   =========================== */

class SubscriptionDB {
  constructor() {
    this.storageKey = 'pwa-subscriptions';
    this.settingsKey = 'pwa-settings';
    this.initializeDatabase();
  }

  // Инициализация базы данных
  initializeDatabase() {
    try {
      if (!localStorage.getItem(this.storageKey)) {
        this.saveSubscriptions([]);
      }
      if (!localStorage.getItem(this.settingsKey)) {
        this.saveSettings({
          theme: 'light',
          language: 'ru',
          currency: 'UAH',
          notifications: true
        });
      }
    } catch (error) {
      console.error('Ошибка инициализации базы данных:', error);
      this.showError('Ошибка инициализации локального хранилища');
    }
  }

  // ===========================
  // CRUD ОПЕРАЦИИ ДЛЯ ПОДПИСОК
  // ===========================

  // Получить все подписки
  getAllSubscriptions() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Ошибка получения подписок:', error);
      this.showError('Ошибка загрузки данных');
      return [];
    }
  }

  // Получить активные подписки
  getActiveSubscriptions() {
    return this.getAllSubscriptions().filter(sub => sub.active);
  }

  // Получить архивные подписки
  getArchivedSubscriptions() {
    return this.getAllSubscriptions().filter(sub => !sub.active);
  }

  // Получить подписку по ID
  getSubscriptionById(id) {
    try {
      return this.getAllSubscriptions().find(sub => sub.id === id);
    } catch (error) {
      console.error('Ошибка получения подписки:', error);
      return null;
    }
  }

  // Создать новую подписку
  createSubscription(subscriptionData) {
    try {
      const subscription = this.createSubscriptionObject(subscriptionData);
      const subscriptions = this.getAllSubscriptions();
      subscriptions.push(subscription);
      this.saveSubscriptions(subscriptions);
      this.showSuccess('Подписка успешно добавлена');
      return subscription;
    } catch (error) {
      console.error('Ошибка создания подписки:', error);
      this.showError('Ошибка добавления подписки');
      return null;
    }
  }

  // Обновить подписку
  updateSubscription(id, updates) {
    try {
      const subscriptions = this.getAllSubscriptions();
      const index = subscriptions.findIndex(sub => sub.id === id);
      
      if (index === -1) {
        throw new Error('Подписка не найдена');
      }

      subscriptions[index] = {
        ...subscriptions[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      this.saveSubscriptions(subscriptions);
      this.showSuccess('Подписка успешно обновлена');
      return subscriptions[index];
    } catch (error) {
      console.error('Ошибка обновления подписки:', error);
      this.showError('Ошибка обновления подписки');
      return null;
    }
  }

  // Удалить подписку
  deleteSubscription(id) {
    try {
      const subscriptions = this.getAllSubscriptions();
      const filteredSubscriptions = subscriptions.filter(sub => sub.id !== id);
      
      if (filteredSubscriptions.length === subscriptions.length) {
        throw new Error('Подписка не найдена');
      }

      this.saveSubscriptions(filteredSubscriptions);
      this.showSuccess('Подписка успешно удалена');
      return true;
    } catch (error) {
      console.error('Ошибка удаления подписки:', error);
      this.showError('Ошибка удаления подписки');
      return false;
    }
  }

  // Архивировать/разархивировать подписку
  toggleSubscriptionActive(id) {
    try {
      const subscription = this.getSubscriptionById(id);
      if (!subscription) {
        throw new Error('Подписка не найдена');
      }

      return this.updateSubscription(id, { active: !subscription.active });
    } catch (error) {
      console.error('Ошибка изменения статуса подписки:', error);
      this.showError('Ошибка изменения статуса');
      return null;
    }
  }

  // ===========================
  // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // ===========================

  // Создать объект подписки
  createSubscriptionObject(data) {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    return {
      id,
      name: data.name || '',
      price: parseFloat(data.price) || 0,
      currency: data.currency || this.getSetting('currency', 'UAH'),
      period: data.period || 'monthly',
      nextPayment: data.nextPayment || this.calculateNextPayment(data.period),
      category: data.category || 'other',
      active: true,
      createdAt: now,
      updatedAt: now,
      description: data.description || '',
      url: data.url || '',
      reminderDays: data.reminderDays || 3
    };
  }

  // Генерировать уникальный ID
  generateId() {
    return 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Рассчитать следующую дату платежа
  calculateNextPayment(period, fromDate = new Date()) {
    const date = new Date(fromDate);
    
    switch (period) {
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
    }
    
    return date.toISOString().split('T')[0];
  }

  // Сохранить подписки в localStorage
  saveSubscriptions(subscriptions) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(subscriptions));
      this.dispatchEvent('subscriptionsUpdated', subscriptions);
    } catch (error) {
      console.error('Ошибка сохранения подписок:', error);
      this.showError('Ошибка сохранения данных');
      throw error;
    }
  }

  // ===========================
  // АНАЛИТИКА И СТАТИСТИКА
  // ===========================

  // Получить общую статистику
  getStatistics() {
    try {
      const subscriptions = this.getActiveSubscriptions();
      
      const monthlyTotal = this.calculateMonthlyTotal(subscriptions);
      const yearlyTotal = this.calculateYearlyTotal(subscriptions);
      const activeCount = subscriptions.length;
      const totalCount = this.getAllSubscriptions().length;
      
      const categoryBreakdown = this.getCategoryBreakdown(subscriptions);
      const upcomingPayments = this.getUpcomingPayments(subscriptions);
      
      return {
        monthlyTotal,
        yearlyTotal,
        activeCount,
        totalCount,
        archivedCount: totalCount - activeCount,
        categoryBreakdown,
        upcomingPayments,
        averageSubscriptionPrice: activeCount > 0 ? monthlyTotal / activeCount : 0
      };
    } catch (error) {
      console.error('Ошибка получения статистики:', error);
      return this.getEmptyStatistics();
    }
  }

  // Рассчитать месячные расходы
  calculateMonthlyTotal(subscriptions) {
    return subscriptions.reduce((total, sub) => {
      const monthlyPrice = sub.period === 'yearly' ? sub.price / 12 : sub.price;
      return total + monthlyPrice;
    }, 0);
  }

  // Рассчитать годовые расходы
  calculateYearlyTotal(subscriptions) {
    return subscriptions.reduce((total, sub) => {
      const yearlyPrice = sub.period === 'monthly' ? sub.price * 12 : sub.price;
      return total + yearlyPrice;
    }, 0);
  }

  // Получить разбивку по категориям
  getCategoryBreakdown(subscriptions) {
    const breakdown = {};
    
    subscriptions.forEach(sub => {
      const category = sub.category || 'other';
      if (!breakdown[category]) {
        breakdown[category] = { count: 0, total: 0, subscriptions: [] };
      }
      
      const monthlyPrice = sub.period === 'yearly' ? sub.price / 12 : sub.price;
      breakdown[category].count++;
      breakdown[category].total += monthlyPrice;
      breakdown[category].subscriptions.push(sub);
    });
    
    return breakdown;
  }

  // Получить предстоящие платежи
  getUpcomingPayments(subscriptions, days = 30) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);
    
    return subscriptions
      .filter(sub => {
        const paymentDate = new Date(sub.nextPayment);
        return paymentDate >= now && paymentDate <= futureDate;
      })
      .sort((a, b) => new Date(a.nextPayment) - new Date(b.nextPayment));
  }

  // Получить пустую статистику
  getEmptyStatistics() {
    return {
      monthlyTotal: 0,
      yearlyTotal: 0,
      activeCount: 0,
      totalCount: 0,
      archivedCount: 0,
      categoryBreakdown: {},
      upcomingPayments: [],
      averageSubscriptionPrice: 0
    };
  }

  // ===========================
  // ПОИСК И ФИЛЬТРАЦИЯ
  // ===========================

  // Поиск подписок
  searchSubscriptions(query, filters = {}) {
    try {
      let subscriptions = this.getAllSubscriptions();
      
      // Фильтр по активности
      if (filters.active !== undefined) {
        subscriptions = subscriptions.filter(sub => sub.active === filters.active);
      }
      
      // Фильтр по категории
      if (filters.category) {
        subscriptions = subscriptions.filter(sub => sub.category === filters.category);
      }
      
      // Поиск по тексту
      if (query) {
        const searchQuery = query.toLowerCase();
        subscriptions = subscriptions.filter(sub => 
          sub.name.toLowerCase().includes(searchQuery) ||
          sub.description.toLowerCase().includes(searchQuery) ||
          sub.category.toLowerCase().includes(searchQuery)
        );
      }
      
      return subscriptions;
    } catch (error) {
      console.error('Ошибка поиска подписок:', error);
      return [];
    }
  }

  // Сортировка подписок
  sortSubscriptions(subscriptions, sortBy = 'name', order = 'asc') {
    try {
      return [...subscriptions].sort((a, b) => {
        let valueA, valueB;
        
        switch (sortBy) {
          case 'name':
            valueA = a.name.toLowerCase();
            valueB = b.name.toLowerCase();
            break;
          case 'price':
            valueA = a.price;
            valueB = b.price;
            break;
          case 'nextPayment':
            valueA = new Date(a.nextPayment);
            valueB = new Date(b.nextPayment);
            break;
          case 'createdAt':
            valueA = new Date(a.createdAt);
            valueB = new Date(b.createdAt);
            break;
          default:
            valueA = a[sortBy];
            valueB = b[sortBy];
        }
        
        if (valueA < valueB) return order === 'asc' ? -1 : 1;
        if (valueA > valueB) return order === 'asc' ? 1 : -1;
        return 0;
      });
    } catch (error) {
      console.error('Ошибка сортировки подписок:', error);
      return subscriptions;
    }
  }

  // ===========================
  // НАСТРОЙКИ ПРИЛОЖЕНИЯ
  // ===========================

  // Получить настройки
  getSettings() {
    try {
      const data = localStorage.getItem(this.settingsKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Ошибка получения настроек:', error);
      return {};
    }
  }

  // Сохранить настройки
  saveSettings(settings) {
    try {
      const currentSettings = this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      localStorage.setItem(this.settingsKey, JSON.stringify(newSettings));
      this.dispatchEvent('settingsUpdated', newSettings);
      return newSettings;
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
      this.showError('Ошибка сохранения настроек');
      return null;
    }
  }

  // Получить конкретную настройку
  getSetting(key, defaultValue = null) {
    const settings = this.getSettings();
    return settings[key] !== undefined ? settings[key] : defaultValue;
  }

  // Установить конкретную настройку
  setSetting(key, value) {
    return this.saveSettings({ [key]: value });
  }

  // ===========================
  // ИМПОРТ/ЭКСПОРТ ДАННЫХ
  // ===========================

  // Экспорт всех данных
  exportData() {
    try {
      const data = {
        subscriptions: this.getAllSubscriptions(),
        settings: this.getSettings(),
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Ошибка экспорта данных:', error);
      this.showError('Ошибка экспорта данных');
      return null;
    }
  }

  // Импорт данных
  importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.subscriptions || !Array.isArray(data.subscriptions)) {
        throw new Error('Неверный формат данных');
      }
      
      // Валидация данных
      const validSubscriptions = data.subscriptions.filter(sub => 
        sub.id && sub.name && typeof sub.price === 'number'
      );
      
      if (validSubscriptions.length !== data.subscriptions.length) {
        console.warn('Некоторые подписки были пропущены при импорте');
      }
      
      // Сохранение данных
      this.saveSubscriptions(validSubscriptions);
      
      if (data.settings) {
        this.saveSettings(data.settings);
      }
      
      this.showSuccess(`Импортировано ${validSubscriptions.length} подписок`);
      return true;
    } catch (error) {
      console.error('Ошибка импорта данных:', error);
      this.showError('Ошибка импорта данных');
      return false;
    }
  }

  // ===========================
  // УТИЛИТЫ И СОБЫТИЯ
  // ===========================

  // Отправка пользовательских событий
  dispatchEvent(eventName, data) {
    try {
      const event = new CustomEvent(eventName, { detail: data });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Ошибка отправки события:', error);
    }
  }

  // Показать сообщение об успехе
  showSuccess(message) {
    this.dispatchEvent('showToast', { type: 'success', message });
  }

  // Показать сообщение об ошибке
  showError(message) {
    this.dispatchEvent('showToast', { type: 'error', message });
  }

  // Очистить все данные
  clearAllData() {
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.settingsKey);
      this.initializeDatabase();
      this.showSuccess('Все данные очищены');
      return true;
    } catch (error) {
      console.error('Ошибка очистки данных:', error);
      this.showError('Ошибка очистки данных');
      return false;
    }
  }

  // Получить размер данных в localStorage
  getStorageSize() {
    try {
      const subscriptionsSize = new Blob([localStorage.getItem(this.storageKey) || '']).size;
      const settingsSize = new Blob([localStorage.getItem(this.settingsKey) || '']).size;
      
      return {
        subscriptions: subscriptionsSize,
        settings: settingsSize,
        total: subscriptionsSize + settingsSize
      };
    } catch (error) {
      console.error('Ошибка получения размера хранилища:', error);
      return { subscriptions: 0, settings: 0, total: 0 };
    }
  }
}

// Создать глобальный экземпляр базы данных
const subscriptionDB = new SubscriptionDB();

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SubscriptionDB, subscriptionDB };
} else {
  window.subscriptionDB = subscriptionDB;
  window.SubscriptionDB = SubscriptionDB;
}