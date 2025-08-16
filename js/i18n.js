/* ===========================
   ИНТЕРНАЦИОНАЛИЗАЦИЯ PWA
   Система переводов
   =========================== */

class I18n {
  constructor() {
    this.currentLanguage = 'ru';
    this.translations = {};
    this.fallbackLanguage = 'ru';
    this.supportedLanguages = ['ru', 'en', 'uk'];
    
    this.init();
  }

  // ===========================
  // ИНИЦИАЛИЗАЦИЯ
  // ===========================

  async init() {
    try {
      // Определяем язык пользователя
      this.currentLanguage = this.detectUserLanguage();
      
      // Загружаем переводы
      await this.loadTranslations();
      
      // Применяем переводы к интерфейсу
      this.applyTranslations();
      
      console.log(`Язык интерфейса: ${this.currentLanguage}`);
    } catch (error) {
      console.error('Ошибка инициализации интернационализации:', error);
      this.currentLanguage = this.fallbackLanguage;
    }
  }

  // ===========================
  // ОПРЕДЕЛЕНИЕ ЯЗЫКА
  // ===========================

  detectUserLanguage() {
    // 1. Проверяем сохранённые настройки
    const savedLanguage = subscriptionDB.getSetting('language');
    if (savedLanguage && this.isLanguageSupported(savedLanguage)) {
      return savedLanguage;
    }
    
    // 2. Проверяем URL параметры
    const urlParams = new URLSearchParams(window.location.search);
    const urlLanguage = urlParams.get('lang');
    if (urlLanguage && this.isLanguageSupported(urlLanguage)) {
      return urlLanguage;
    }
    
    // 3. Проверяем язык браузера
    const browserLanguages = navigator.languages || [navigator.language];
    for (const lang of browserLanguages) {
      const langCode = lang.split('-')[0];
      if (this.isLanguageSupported(langCode)) {
        return langCode;
      }
    }
    
    // 4. Возвращаем язык по умолчанию
    return this.fallbackLanguage;
  }

  isLanguageSupported(language) {
    return this.supportedLanguages.includes(language);
  }

  // ===========================
  // ЗАГРУЗКА ПЕРЕВОДОВ
  // ===========================

  async loadTranslations() {
    try {
      // Загружаем переводы для текущего языка
      const translations = await this.fetchTranslations(this.currentLanguage);
      this.translations[this.currentLanguage] = translations;
      
      // Загружаем резервный язык, если он отличается
      if (this.currentLanguage !== this.fallbackLanguage) {
        const fallbackTranslations = await this.fetchTranslations(this.fallbackLanguage);
        this.translations[this.fallbackLanguage] = fallbackTranslations;
      }
    } catch (error) {
      console.error('Ошибка загрузки переводов:', error);
      // Используем встроенные переводы как резерв
      this.loadBuiltinTranslations();
    }
  }

  async fetchTranslations(language) {
    try {
      const response = await fetch(`/locales/${language}.json`);
      if (!response.ok) {
        throw new Error(`Не удалось загрузить переводы для языка: ${language}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`Загрузка переводов из файла не удалась для ${language}, используем встроенные`);
      return this.getBuiltinTranslations(language);
    }
  }

  loadBuiltinTranslations() {
    this.translations = {
      ru: this.getBuiltinTranslations('ru'),
      en: this.getBuiltinTranslations('en'),
      uk: this.getBuiltinTranslations('uk')
    };
  }

  getBuiltinTranslations(language) {
    const translations = {
      ru: {
        // Общие
        'app.title': 'Мои Подписки',
        'app.description': 'Учёт подписок и расходов',
        'common.add': 'Добавить',
        'common.edit': 'Редактировать',
        'common.delete': 'Удалить',
        'common.save': 'Сохранить',
        'common.cancel': 'Отмена',
        'common.close': 'Закрыть',
        'common.search': 'Поиск',
        'common.filter': 'Фильтр',
        'common.sort': 'Сортировать',
        'common.loading': 'Загрузка...',
        'common.error': 'Ошибка',
        'common.success': 'Успешно',
        
        // Подписки
        'subscriptions.title': 'Активные подписки',
        'subscriptions.add': 'Добавить подписку',
        'subscriptions.edit': 'Редактировать подписку',
        'subscriptions.name': 'Название сервиса',
        'subscriptions.price': 'Стоимость',
        'subscriptions.period': 'Период',
        'subscriptions.nextPayment': 'Следующее списание',
        'subscriptions.category': 'Категория',
        'subscriptions.monthly': 'Ежемесячно',
        'subscriptions.yearly': 'Ежегодно',
        'subscriptions.active': 'Активна',
        'subscriptions.inactive': 'Архивная',
        'subscriptions.overdue': 'Просрочена',
        
        // Категории
        'categories.entertainment': 'Развлечения',
        'categories.music': 'Музыка',
        'categories.video': 'Видео',
        'categories.productivity': 'Продуктивность',
        'categories.cloud': 'Облачные сервисы',
        'categories.news': 'Новости',
        'categories.other': 'Другое',
        
        // Статистика
        'stats.monthlyExpenses': 'Расходы в месяц',
        'stats.activeSubscriptions': 'Активных подписок',
        'stats.yearlyForecast': 'Прогноз на год',
        
        // Состояния
        'empty.title': 'Нет активных подписок',
        'empty.description': 'Добавьте свою первую подписку, чтобы начать отслеживание расходов',
        
        // Уведомления
        'notifications.subscriptionAdded': 'Подписка успешно добавлена',
        'notifications.subscriptionUpdated': 'Подписка успешно обновлена',
        'notifications.subscriptionDeleted': 'Подписка успешно удалена',
        'notifications.dataExported': 'Данные экспортированы',
        'notifications.dataImported': 'Данные импортированы',
        'notifications.connectionRestored': 'Соединение восстановлено',
        'notifications.workingOffline': 'Работаем в офлайн режиме',
        
        // PWA
        'pwa.installTitle': 'Установить приложение',
        'pwa.installDescription': 'Добавьте на главный экран для быстрого доступа',
        'pwa.install': 'Установить',
        'pwa.updateAvailable': 'Доступно обновление приложения',
        'pwa.update': 'Обновить',
        'pwa.later': 'Позже'
      },
      
      en: {
        // General
        'app.title': 'My Subscriptions',
        'app.description': 'Track subscriptions and expenses',
        'common.add': 'Add',
        'common.edit': 'Edit',
        'common.delete': 'Delete',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.close': 'Close',
        'common.search': 'Search',
        'common.filter': 'Filter',
        'common.sort': 'Sort',
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'common.success': 'Success',
        
        // Subscriptions
        'subscriptions.title': 'Active subscriptions',
        'subscriptions.add': 'Add subscription',
        'subscriptions.edit': 'Edit subscription',
        'subscriptions.name': 'Service name',
        'subscriptions.price': 'Price',
        'subscriptions.period': 'Period',
        'subscriptions.nextPayment': 'Next payment',
        'subscriptions.category': 'Category',
        'subscriptions.monthly': 'Monthly',
        'subscriptions.yearly': 'Yearly',
        'subscriptions.active': 'Active',
        'subscriptions.inactive': 'Archived',
        'subscriptions.overdue': 'Overdue',
        
        // Categories
        'categories.entertainment': 'Entertainment',
        'categories.music': 'Music',
        'categories.video': 'Video',
        'categories.productivity': 'Productivity',
        'categories.cloud': 'Cloud services',
        'categories.news': 'News',
        'categories.other': 'Other',
        
        // Statistics
        'stats.monthlyExpenses': 'Monthly expenses',
        'stats.activeSubscriptions': 'Active subscriptions',
        'stats.yearlyForecast': 'Yearly forecast',
        
        // States
        'empty.title': 'No active subscriptions',
        'empty.description': 'Add your first subscription to start tracking expenses',
        
        // Notifications
        'notifications.subscriptionAdded': 'Subscription successfully added',
        'notifications.subscriptionUpdated': 'Subscription successfully updated',
        'notifications.subscriptionDeleted': 'Subscription successfully deleted',
        'notifications.dataExported': 'Data exported',
        'notifications.dataImported': 'Data imported',
        'notifications.connectionRestored': 'Connection restored',
        'notifications.workingOffline': 'Working offline',
        
        // PWA
        'pwa.installTitle': 'Install app',
        'pwa.installDescription': 'Add to home screen for quick access',
        'pwa.install': 'Install',
        'pwa.updateAvailable': 'App update available',
        'pwa.update': 'Update',
        'pwa.later': 'Later'
      },
      
      uk: {
        // Загальні
        'app.title': 'Мої Підписки',
        'app.description': 'Облік підписок та витрат',
        'common.add': 'Додати',
        'common.edit': 'Редагувати',
        'common.delete': 'Видалити',
        'common.save': 'Зберегти',
        'common.cancel': 'Скасувати',
        'common.close': 'Закрити',
        'common.search': 'Пошук',
        'common.filter': 'Фільтр',
        'common.sort': 'Сортувати',
        'common.loading': 'Завантаження...',
        'common.error': 'Помилка',
        'common.success': 'Успішно',
        
        // Підписки
        'subscriptions.title': 'Активні підписки',
        'subscriptions.add': 'Додати підписку',
        'subscriptions.edit': 'Редагувати підписку',
        'subscriptions.name': 'Назва сервісу',
        'subscriptions.price': 'Вартість',
        'subscriptions.period': 'Період',
        'subscriptions.nextPayment': 'Наступне списання',
        'subscriptions.category': 'Категорія',
        'subscriptions.monthly': 'Щомісяця',
        'subscriptions.yearly': 'Щорічно',
        'subscriptions.active': 'Активна',
        'subscriptions.inactive': 'Архівна',
        'subscriptions.overdue': 'Прострочена',
        
        // Категорії
        'categories.entertainment': 'Розваги',
        'categories.music': 'Музика',
        'categories.video': 'Відео',
        'categories.productivity': 'Продуктивність',
        'categories.cloud': 'Хмарні сервіси',
        'categories.news': 'Новини',
        'categories.other': 'Інше',
        
        // Статистика
        'stats.monthlyExpenses': 'Витрати на місяць',
        'stats.activeSubscriptions': 'Активних підписок',
        'stats.yearlyForecast': 'Прогноз на рік',
        
        // Стани
        'empty.title': 'Немає активних підписок',
        'empty.description': 'Додайте свою першу підписку, щоб почати відстеження витрат',
        
        // Сповіщення
        'notifications.subscriptionAdded': 'Підписку успішно додано',
        'notifications.subscriptionUpdated': 'Підписку успішно оновлено',
        'notifications.subscriptionDeleted': 'Підписку успішно видалено',
        'notifications.dataExported': 'Дані експортовано',
        'notifications.dataImported': 'Дані імпортовано',
        'notifications.connectionRestored': "З'єднання відновлено",
        'notifications.workingOffline': 'Працюємо в офлайн режимі',
        
        // PWA
        'pwa.installTitle': 'Встановити додаток',
        'pwa.installDescription': 'Додайте на головний екран для швидкого доступу',
        'pwa.install': 'Встановити',
        'pwa.updateAvailable': 'Доступне оновлення додатку',
        'pwa.update': 'Оновити',
        'pwa.later': 'Пізніше'
      }
    };
    
    return translations[language] || translations[this.fallbackLanguage];
  }

  // ===========================
  // ПРИМЕНЕНИЕ ПЕРЕВОДОВ
  // ===========================

  applyTranslations() {
    // Обновляем все элементы с атрибутом data-i18n
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.translate(key);
      
      if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'search')) {
        element.placeholder = translation;
      } else {
        element.textContent = translation;
      }
    });
    
    // Обновляем атрибуты aria-label
    const ariaElements = document.querySelectorAll('[data-i18n-aria]');
    ariaElements.forEach(element => {
      const key = element.getAttribute('data-i18n-aria');
      const translation = this.translate(key);
      element.setAttribute('aria-label', translation);
    });
    
    // Обновляем мета-теги
    this.updateMetaTags();
    
    // Уведомляем компоненты об изменении языка
    this.dispatchLanguageChange();
  }

  updateMetaTags() {
    // Обновляем title страницы
    document.title = this.translate('app.title');
    
    // Обновляем description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.content = this.translate('app.description');
    }
    
    // Обновляем lang атрибут
    document.documentElement.lang = this.currentLanguage;
  }

  dispatchLanguageChange() {
    const event = new CustomEvent('languageChanged', {
      detail: {
        language: this.currentLanguage,
        translations: this.translations[this.currentLanguage]
      }
    });
    window.dispatchEvent(event);
  }

  // ===========================
  // ОСНОВНОЙ API
  // ===========================

  translate(key, params = {}) {
    try {
      // Получаем перевод для текущего языка
      let translation = this.getTranslation(key, this.currentLanguage);
      
      // Если не найден, пробуем резервный язык
      if (!translation && this.currentLanguage !== this.fallbackLanguage) {
        translation = this.getTranslation(key, this.fallbackLanguage);
      }
      
      // Если всё ещё не найден, возвращаем ключ
      if (!translation) {
        console.warn(`Перевод не найден для ключа: ${key}`);
        return key;
      }
      
      // Заменяем параметры в переводе
      return this.replaceParams(translation, params);
    } catch (error) {
      console.error('Ошибка при переводе:', error);
      return key;
    }
  }

  getTranslation(key, language) {
    const languageTranslations = this.translations[language];
    if (!languageTranslations) {
      return null;
    }
    
    // Поддерживаем вложенные ключи (например, 'common.add')
    return key.split('.').reduce((obj, k) => {
      return obj && obj[k] !== undefined ? obj[k] : null;
    }, languageTranslations);
  }

  replaceParams(text, params) {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }

  // Короткая функция для перевода (алиас)
  t(key, params = {}) {
    return this.translate(key, params);
  }

  // ===========================
  // УПРАВЛЕНИЕ ЯЗЫКОМ
  // ===========================

  async setLanguage(language) {
    if (!this.isLanguageSupported(language)) {
      console.warn(`Язык ${language} не поддерживается`);
      return false;
    }
    
    if (language === this.currentLanguage) {
      return true;
    }
    
    try {
      const oldLanguage = this.currentLanguage;
      this.currentLanguage = language;
      
      // Загружаем переводы для нового языка, если ещё не загружены
      if (!this.translations[language]) {
        const translations = await this.fetchTranslations(language);
        this.translations[language] = translations;
      }
      
      // Сохраняем выбор пользователя
      subscriptionDB.setSetting('language', language);
      
      // Применяем переводы
      this.applyTranslations();
      
      console.log(`Язык изменён с ${oldLanguage} на ${language}`);
      return true;
    } catch (error) {
      console.error('Ошибка смены языка:', error);
      this.currentLanguage = this.fallbackLanguage;
      return false;
    }
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }

  getSupportedLanguages() {
    return [...this.supportedLanguages];
  }

  getLanguageInfo(language) {
    const info = {
      ru: { name: 'Русский', nativeName: 'Русский', flag: '🇷🇺' },
      en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
      uk: { name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' }
    };
    
    return info[language] || null;
  }

  // ===========================
  // ФОРМАТИРОВАНИЕ
  // ===========================

  formatNumber(number, options = {}) {
    return new Intl.NumberFormat(this.getLocaleCode(), options).format(number);
  }

  formatCurrency(amount, currency = 'UAH') {
    return new Intl.NumberFormat(this.getLocaleCode(), {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date, options = {}) {
    const defaultOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    };
    
    return new Intl.DateTimeFormat(this.getLocaleCode(), {
      ...defaultOptions,
      ...options
    }).format(new Date(date));
  }

  formatRelativeTime(date) {
    const rtf = new Intl.RelativeTimeFormat(this.getLocaleCode(), { numeric: 'auto' });
    const diffTime = new Date(date) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (Math.abs(diffDays) < 7) {
      return rtf.format(diffDays, 'day');
    } else if (Math.abs(diffDays) < 30) {
      return rtf.format(Math.round(diffDays / 7), 'week');
    } else {
      return rtf.format(Math.round(diffDays / 30), 'month');
    }
  }

  getLocaleCode() {
    const localeCodes = {
      'ru': 'ru-RU',
      'en': 'en-US',
      'uk': 'uk-UA'
    };
    
    return localeCodes[this.currentLanguage] || 'ru-RU';
  }

  // ===========================
  // НАПРАВЛЕНИЕ ТЕКСТА
  // ===========================

  getTextDirection() {
    // Для будущего добавления RTL языков
    const rtlLanguages = ['ar', 'he', 'fa'];
    return rtlLanguages.includes(this.currentLanguage) ? 'rtl' : 'ltr';
  }

  applyTextDirection() {
    document.documentElement.dir = this.getTextDirection();
  }

  // ===========================
  // ОТЛАДКА И ДИАГНОСТИКА
  // ===========================

  getDebugInfo() {
    return {
      currentLanguage: this.currentLanguage,
      fallbackLanguage: this.fallbackLanguage,
      supportedLanguages: this.supportedLanguages,
      loadedTranslations: Object.keys(this.translations),
      browserLanguages: navigator.languages,
      localeCode: this.getLocaleCode(),
      textDirection: this.getTextDirection()
    };
  }

  validateTranslations(language) {
    const translations = this.translations[language];
    if (!translations) {
      return { valid: false, errors: [`Переводы для языка ${language} не загружены`] };
    }
    
    const errors = [];
    const requiredKeys = [
      'app.title',
      'common.add',
      'common.save',
      'common.cancel',
      'subscriptions.title'
    ];
    
    requiredKeys.forEach(key => {
      if (!this.getTranslation(key, language)) {
        errors.push(`Отсутствует перевод для ключа: ${key}`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
}

// ===========================
// ГЛОБАЛЬНАЯ ФУНКЦИЯ ПЕРЕВОДА
// ===========================

let i18n;

// Функция для быстрого доступа к переводам
function t(key, params = {}) {
  if (!i18n) {
    console.warn('i18n не инициализирован');
    return key;
  }
  return i18n.translate(key, params);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
  i18n = new I18n();
  window.i18n = i18n;
  window.t = t;
});

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { I18n, t };
} else {
  window.I18n = I18n;
}