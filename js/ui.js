/* ===========================
   UI МОДУЛЬ ДЛЯ PWA
   Управление интерфейсом
   =========================== */

class SubscriptionUI {
  constructor() {
    // Инициализация SubscriptionUI
    
    this.currentSubscription = null;
    this.isEditMode = false;
    this.searchQuery = '';
    this.currentSort = { field: 'name', order: 'asc' };
    this.currentFilter = { active: true, category: null };
    
    // Ожидаем готовности DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      this.initialize();
    }
  }
  
  initialize() {
    // Инициализация элементов UI
    
    try {
      this.initializeElements();
      this.bindEvents();
      
      // Даем время на загрузку других модулей
      setTimeout(() => {
        this.loadInitialData();
      }, 50);
    } catch (error) {
      console.error('Ошибка инициализации UI:', error);
    }
  }

  // ===========================
  // ИНИЦИАЛИЗАЦИЯ
  // ===========================

  initializeElements() {
    // Инициализация элементов DOM
    
    try {
      // Основные элементы
      this.subscriptionsList = document.getElementById('subscriptions-list');
      this.modal = document.getElementById('subscription-modal');
      this.modalTitle = document.getElementById('modal-title');
      this.subscriptionForm = document.getElementById('subscription-form');
      this.searchInput = document.getElementById('search-input');
      this.toastContainer = document.getElementById('toast-container');
      this.loadingElement = document.getElementById('loading');
      
      // Кнопки
      this.addButton = document.getElementById('add-subscription');
      this.closeModalButton = document.getElementById('close-modal');
      this.cancelButton = document.getElementById('cancel-button');
      this.saveButton = document.getElementById('save-button');
      this.themeToggle = document.getElementById('theme-toggle');
      this.sortButton = document.getElementById('sort-button');
      this.filterButton = document.getElementById('filter-button');
      
      // Статистика
      this.monthlyExpenseElement = document.getElementById('monthly-expense');
      this.activeCountElement = document.getElementById('active-count');
      this.yearlyForecastElement = document.getElementById('yearly-forecast');
      
      // Элементы формы
      this.nameInput = document.getElementById('subscription-name');
      this.priceInput = document.getElementById('subscription-price');
      this.currencySelect = document.getElementById('subscription-currency');
      this.periodSelect = document.getElementById('subscription-period');
      this.nextPaymentInput = document.getElementById('subscription-next-payment');
      this.categorySelect = document.getElementById('subscription-category');
      
      // Проверяем критически важные элементы
      const criticalElements = [
        'subscriptions-list', 'loading', 'toast-container'
      ];
      
      const missingElements = criticalElements.filter(id => !document.getElementById(id));
      if (missingElements.length > 0) {
        console.error('Критически важные элементы не найдены:', missingElements);
      }
    } catch (error) {
      console.error('Ошибка при инициализации элементов:', error);
    }
  }

  bindEvents() {
    // События кнопок
    this.addButton?.addEventListener('click', () => this.openModal());
    this.closeModalButton?.addEventListener('click', () => this.closeModal());
    this.cancelButton?.addEventListener('click', () => this.closeModal());
    this.saveButton?.addEventListener('click', () => this.saveSubscription());
    this.themeToggle?.addEventListener('click', () => this.toggleTheme());
    this.sortButton?.addEventListener('click', () => this.showSortMenu());
    this.filterButton?.addEventListener('click', () => this.showFilterMenu());
    
    // События поиска
    this.searchInput?.addEventListener('input', (e) => this.handleSearch(e.target.value));
    
    // События формы
    this.subscriptionForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveSubscription();
    });
    
    // События модального окна
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });
    
    // События клавиатуры
    document.addEventListener('keydown', (e) => this.handleKeyboardEvents(e));
    
    // События базы данных
    window.addEventListener('subscriptionsUpdated', () => this.updateUI());
    window.addEventListener('showToast', (e) => this.showToast(e.detail));
    
    // События периода подписки
    this.periodSelect?.addEventListener('change', () => this.updateNextPaymentDate());
  }

  // ===========================
  // УПРАВЛЕНИЕ ДАННЫМИ
  // ===========================

  loadInitialData() {
    this.showLoading(true);
    
    try {
      // Проверяем доступность subscriptionDB
      if (!window.subscriptionDB) {
        throw new Error('subscriptionDB не доступен');
      }
      
      this.updateStatistics();
      this.renderSubscriptions();
      this.loadTheme();
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      this.showToast({ type: 'error', message: 'Ошибка загрузки данных: ' + error.message });
    } finally {
      this.showLoading(false);
    }
  }

  updateUI() {
    this.updateStatistics();
    this.renderSubscriptions();
  }

  // ===========================
  // ОТОБРАЖЕНИЕ ПОДПИСОК
  // ===========================

  renderSubscriptions() {
    try {
      const subscriptions = this.getFilteredAndSortedSubscriptions();
      
      if (!subscriptions.length) {
        this.showEmptyState();
        return;
      }
      
      this.subscriptionsList.innerHTML = '';
      subscriptions.forEach(subscription => {
        const element = this.createSubscriptionElement(subscription);
        this.subscriptionsList.appendChild(element);
      });
      
      // Анимация появления
      this.animateSubscriptionCards();
    } catch (error) {
      console.error('Ошибка отображения подписок:', error);
      this.showEmptyState();
    }
  }

  createSubscriptionElement(subscription) {
    const div = document.createElement('div');
    div.className = 'subscription-card';
    div.setAttribute('data-id', subscription.id);
    
    const categoryClass = `category-${subscription.category}`;
    const statusClass = this.getSubscriptionStatus(subscription);
    const monthlyPrice = subscription.period === 'yearly' ? subscription.price / 12 : subscription.price;
    const nextPaymentFormatted = this.formatDate(subscription.nextPayment);
    const currency = subscription.currency || 'UAH';
    
    div.innerHTML = `
      <div class="subscription-info">
        <div class="subscription-icon ${categoryClass}">
          <span class="material-icons">${this.getCategoryIcon(subscription.category)}</span>
        </div>
        <div class="subscription-details">
          <h3>${this.escapeHtml(subscription.name)}</h3>
          <div class="subscription-meta">
            <span>${this.formatCurrency(monthlyPrice, currency)}/мес</span>
            <span>Следующий платёж: ${nextPaymentFormatted}</span>
            <span class="subscription-status ${statusClass}">${this.getStatusText(statusClass)}</span>
          </div>
        </div>
      </div>
      <div class="subscription-price">
        ${this.formatCurrency(subscription.price, currency)}
        <small>/${subscription.period === 'monthly' ? 'мес' : 'год'}</small>
      </div>
      <div class="subscription-actions">
        <button class="icon-button edit-btn" data-id="${this.escapeHtml(subscription.id)}" aria-label="Редактировать">
          <span class="material-icons">edit</span>
        </button>
        <button class="icon-button toggle-btn" data-id="${this.escapeHtml(subscription.id)}" aria-label="Архивировать">
          <span class="material-icons">${subscription.active ? 'archive' : 'unarchive'}</span>
        </button>
        <button class="icon-button delete-btn" data-id="${this.escapeHtml(subscription.id)}" aria-label="Удалить">
          <span class="material-icons">delete</span>
        </button>
      </div>
    `;
    
    // Добавляем безопасные обработчики событий
    this.setupSubscriptionCardEvents(div, subscription.id);
    
    return div;
  }

  setupSubscriptionCardEvents(cardElement, subscriptionId) {
    // Безопасная обработка событий без использования onclick в innerHTML
    const editBtn = cardElement.querySelector('.edit-btn');
    const toggleBtn = cardElement.querySelector('.toggle-btn');
    const deleteBtn = cardElement.querySelector('.delete-btn');
    
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.editSubscription(subscriptionId);
      });
    }
    
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleSubscriptionActive(subscriptionId);
      });
    }
    
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.deleteSubscription(subscriptionId);
      });
    }
  }

  showEmptyState() {
    this.subscriptionsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <span class="material-icons">subscriptions</span>
        </div>
        <h3>Нет активных подписок</h3>
        <p>Добавьте свою первую подписку, чтобы начать отслеживание расходов</p>
        <button class="primary-button empty-add-btn">
          <span class="material-icons">add</span>
          Добавить подписку
        </button>
      </div>
    `;
    
    // Безопасная обработка события для кнопки в пустом состоянии
    const addBtn = this.subscriptionsList.querySelector('.empty-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openModal());
    }
  }

  animateSubscriptionCards() {
    const cards = this.subscriptionsList.querySelectorAll('.subscription-card');
    cards.forEach((card, index) => {
      card.style.animationDelay = `${index * 0.1}s`;
      card.classList.add('animate-slide-in-up');
    });
  }

  // ===========================
  // СТАТИСТИКА
  // ===========================

  updateStatistics() {
    try {
      const stats = subscriptionDB.getStatistics();
      
      // Группируем по валютам
      const statsByCurrency = this.groupStatisticsByCurrency(stats);
      
      // Показываем статистику для основной валюты
      const defaultCurrency = subscriptionDB.getSetting('currency', 'UAH');
      const defaultStats = statsByCurrency[defaultCurrency] || { monthlyTotal: 0, yearlyTotal: 0 };
      
      this.monthlyExpenseElement.textContent = this.formatCurrency(defaultStats.monthlyTotal, defaultCurrency);
      this.activeCountElement.textContent = stats.activeCount.toString();
      this.yearlyForecastElement.textContent = this.formatCurrency(defaultStats.yearlyTotal, defaultCurrency);
      
      // Анимация обновления статистики
      [this.monthlyExpenseElement, this.activeCountElement, this.yearlyForecastElement].forEach(element => {
        element.classList.add('animate-pulse');
        setTimeout(() => element.classList.remove('animate-pulse'), 600);
      });
    } catch (error) {
      console.error('Ошибка обновления статистики:', error);
    }
  }
  
  groupStatisticsByCurrency(stats) {
    const subscriptions = subscriptionDB.getActiveSubscriptions();
    const statsByCurrency = {};
    
    subscriptions.forEach(sub => {
      const currency = sub.currency || 'UAH';
      if (!statsByCurrency[currency]) {
        statsByCurrency[currency] = { monthlyTotal: 0, yearlyTotal: 0 };
      }
      
      const monthlyPrice = sub.period === 'yearly' ? sub.price / 12 : sub.price;
      const yearlyPrice = sub.period === 'monthly' ? sub.price * 12 : sub.price;
      
      statsByCurrency[currency].monthlyTotal += monthlyPrice;
      statsByCurrency[currency].yearlyTotal += yearlyPrice;
    });
    
    return statsByCurrency;
  }

  // ===========================
  // МОДАЛЬНОЕ ОКНО
  // ===========================

  openModal(subscription = null) {
    this.currentSubscription = subscription;
    this.isEditMode = !!subscription;
    
    this.modalTitle.textContent = this.isEditMode ? 'Редактировать подписку' : 'Добавить подписку';
    this.saveButton.innerHTML = `
      <span class="material-icons">${this.isEditMode ? 'save' : 'add'}</span>
      ${this.isEditMode ? 'Сохранить' : 'Добавить'}
    `;
    
    if (this.isEditMode) {
      this.fillForm(subscription);
    } else {
      this.resetForm();
      this.setDefaultNextPayment();
    }
    
    this.modal.classList.add('active');
    this.nameInput?.focus();
    
    // Предотвращение скролла страницы
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.modal.classList.remove('active');
    this.resetForm();
    this.currentSubscription = null;
    this.isEditMode = false;
    
    // Восстановление скролла
    document.body.style.overflow = '';
  }

  fillForm(subscription) {
    if (!subscription) {
      console.error('fillForm: подписка не передана');
      return;
    }
    
    // Безопасное заполнение формы с проверками существования элементов
    if (this.nameInput) {
      this.nameInput.value = subscription.name || '';
    }
    if (this.priceInput) {
      this.priceInput.value = subscription.price || '';
    }
    if (this.currencySelect) {
      this.currencySelect.value = subscription.currency || 'UAH';
    }
    if (this.periodSelect) {
      this.periodSelect.value = subscription.period || 'monthly';
    }
    if (this.nextPaymentInput) {
      this.nextPaymentInput.value = subscription.nextPayment || '';
    }
    if (this.categorySelect) {
      this.categorySelect.value = subscription.category || 'other';
    }
  }

  resetForm() {
    this.subscriptionForm.reset();
  }

  setDefaultNextPayment() {
    const today = new Date();
    today.setMonth(today.getMonth() + 1);
    this.nextPaymentInput.value = today.toISOString().split('T')[0];
  }

  updateNextPaymentDate() {
    if (!this.isEditMode && this.periodSelect.value) {
      const nextPayment = subscriptionDB.calculateNextPayment(this.periodSelect.value);
      this.nextPaymentInput.value = nextPayment;
    }
  }

  // ===========================
  // CRUD ОПЕРАЦИИ
  // ===========================

  saveSubscription() {
    try {
      const formData = new FormData(this.subscriptionForm);
      const subscriptionData = {
        name: formData.get('name').trim(),
        price: parseFloat(formData.get('price')),
        currency: formData.get('currency'),
        period: formData.get('period'),
        nextPayment: formData.get('nextPayment'),
        category: formData.get('category')
      };
      
      // Валидация
      if (!this.validateSubscriptionData(subscriptionData)) {
        return;
      }
      
      let result;
      if (this.isEditMode) {
        result = subscriptionDB.updateSubscription(this.currentSubscription.id, subscriptionData);
      } else {
        result = subscriptionDB.createSubscription(subscriptionData);
      }
      
      if (result) {
        this.closeModal();
      }
    } catch (error) {
      console.error('Ошибка сохранения подписки:', error);
      this.showToast({ type: 'error', message: 'Ошибка сохранения подписки' });
    }
  }

  editSubscription(id) {
    const subscription = subscriptionDB.getSubscriptionById(id);
    if (subscription) {
      this.openModal(subscription);
    }
  }

  deleteSubscription(id) {
    if (confirm('Вы уверены, что хотите удалить эту подписку?')) {
      subscriptionDB.deleteSubscription(id);
    }
  }

  toggleSubscriptionActive(id) {
    subscriptionDB.toggleSubscriptionActive(id);
  }

  validateSubscriptionData(data) {
    // Проверка названия
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      this.showToast({ type: 'error', message: 'Введите название подписки' });
      this.nameInput?.focus();
      return false;
    }
    
    if (data.name.trim().length > 100) {
      this.showToast({ type: 'error', message: 'Название слишком длинное (максимум 100 символов)' });
      this.nameInput?.focus();
      return false;
    }
    
    // Проверка стоимости
    if (!data.price || typeof data.price !== 'number' || isNaN(data.price) || data.price <= 0) {
      this.showToast({ type: 'error', message: 'Введите корректную стоимость (больше 0)' });
      this.priceInput?.focus();
      return false;
    }
    
    if (data.price > 1000000) {
      this.showToast({ type: 'error', message: 'Стоимость слишком большая (максимум 1,000,000)' });
      this.priceInput?.focus();
      return false;
    }
    
    // Проверка валюты
    const allowedCurrencies = ['UAH', 'USD'];
    if (!data.currency || !allowedCurrencies.includes(data.currency)) {
      this.showToast({ type: 'error', message: 'Выберите корректную валюту' });
      this.currencySelect?.focus();
      return false;
    }
    
    // Проверка периода
    const allowedPeriods = ['monthly', 'yearly'];
    if (!data.period || !allowedPeriods.includes(data.period)) {
      this.showToast({ type: 'error', message: 'Выберите корректный период оплаты' });
      this.periodSelect?.focus();
      return false;
    }
    
    // Проверка даты
    if (!data.nextPayment) {
      this.showToast({ type: 'error', message: 'Выберите дату следующего платежа' });
      this.nextPaymentInput?.focus();
      return false;
    }
    
    const paymentDate = new Date(data.nextPayment);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isNaN(paymentDate.getTime())) {
      this.showToast({ type: 'error', message: 'Введите корректную дату' });
      this.nextPaymentInput?.focus();
      return false;
    }
    
    if (paymentDate < today) {
      this.showToast({ type: 'error', message: 'Дата платежа не может быть в прошлом' });
      this.nextPaymentInput?.focus();
      return false;
    }
    
    // Проверка категории
    const allowedCategories = ['entertainment', 'music', 'video', 'productivity', 'cloud', 'news', 'other'];
    if (!data.category || !allowedCategories.includes(data.category)) {
      this.showToast({ type: 'error', message: 'Выберите корректную категорию' });
      this.categorySelect?.focus();
      return false;
    }
    
    return true;
  }

  // ===========================
  // ПОИСК И ФИЛЬТРАЦИЯ
  // ===========================

  handleSearch(query) {
    this.searchQuery = query.toLowerCase();
    this.renderSubscriptions();
  }

  getFilteredAndSortedSubscriptions() {
    let subscriptions = subscriptionDB.searchSubscriptions(this.searchQuery, this.currentFilter);
    return subscriptionDB.sortSubscriptions(subscriptions, this.currentSort.field, this.currentSort.order);
  }

  showSortMenu() {
    // Простое меню сортировки
    const sortOptions = [
      { field: 'name', label: 'По названию' },
      { field: 'price', label: 'По стоимости' },
      { field: 'nextPayment', label: 'По дате платежа' },
      { field: 'createdAt', label: 'По дате создания' }
    ];
    
    // Здесь можно добавить полноценное меню
    // Пока что просто переключаем сортировку по названию
    this.currentSort.order = this.currentSort.order === 'asc' ? 'desc' : 'asc';
    this.renderSubscriptions();
    
    this.showToast({ 
      type: 'success', 
      message: `Сортировка: ${this.currentSort.field} (${this.currentSort.order === 'asc' ? 'возр.' : 'убыв.'})` 
    });
  }

  showFilterMenu() {
    // Переключение фильтра между активными и всеми подписками
    this.currentFilter.active = this.currentFilter.active === true ? undefined : true;
    this.renderSubscriptions();
    
    const filterText = this.currentFilter.active === true ? 'активные' : 'все';
    this.showToast({ type: 'success', message: `Показать: ${filterText} подписки` });
  }

  // ===========================
  // ТЕМА И НАСТРОЙКИ
  // ===========================

  toggleTheme() {
    const currentTheme = subscriptionDB.getSetting('theme', 'light');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    subscriptionDB.setSetting('theme', newTheme);
    this.applyTheme(newTheme);
  }

  loadTheme() {
    const theme = subscriptionDB.getSetting('theme', 'light');
    this.applyTheme(theme);
  }

  applyTheme(theme) {
    document.body.className = `theme-${theme}`;
    
    // Обновление иконки переключателя темы
    if (this.themeToggle) {
      const icon = this.themeToggle.querySelector('.material-icons');
      if (icon) {
        icon.textContent = theme === 'light' ? 'dark_mode' : 'light_mode';
      }
    }
  }

  // ===========================
  // УВЕДОМЛЕНИЯ
  // ===========================

  showToast(options) {
    const { type, message, duration = 3000 } = options;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="material-icons">
        ${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'}
      </span>
      <span>${this.escapeHtml(message)}</span>
    `;
    
    this.toastContainer.appendChild(toast);
    
    // Анимация появления
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Автоматическое удаление
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  // ===========================
  // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // ===========================

  showLoading(show) {
    const loadingElement = this.loadingElement || document.getElementById('loading');
    
    if (loadingElement) {
      if (show) {
        loadingElement.hidden = false;
        loadingElement.style.display = 'flex';
      } else {
        loadingElement.hidden = true;
        loadingElement.style.display = 'none';
      }
    } else {
      console.warn('Элемент loading не найден');
    }
  }

  formatCurrency(amount, currency = null) {
    // Получаем валюту из настроек или используем переданную
    const currencyCode = currency || window.subscriptionDB?.getSetting('currency', 'UAH') || 'UAH';
    
    const currencyConfig = {
      UAH: { locale: 'uk-UA', symbol: '₴' },
      USD: { locale: 'en-US', symbol: '$' }
    };
    
    const config = currencyConfig[currencyCode] || currencyConfig.UAH;
    
    try {
      return new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    } catch (error) {
      // Fallback для случая ошибки форматирования
      return `${config.symbol}${Math.round(amount)}`;
    }
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  getCategoryIcon(category) {
    const icons = {
      entertainment: 'movie',
      music: 'music_note',
      video: 'play_circle',
      productivity: 'work',
      cloud: 'cloud',
      news: 'newspaper',
      other: 'category'
    };
    return icons[category] || 'category';
  }

  getSubscriptionStatus(subscription) {
    const today = new Date();
    const paymentDate = new Date(subscription.nextPayment);
    
    if (!subscription.active) return 'inactive';
    if (paymentDate < today) return 'overdue';
    return 'active';
  }

  getStatusText(status) {
    const texts = {
      active: 'Активна',
      inactive: 'Архивная',
      overdue: 'Просрочена'
    };
    return texts[status] || 'Неизвестно';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  handleKeyboardEvents(e) {
    // ESC - закрыть модальное окно
    if (e.key === 'Escape' && this.modal.classList.contains('active')) {
      this.closeModal();
    }
    
    // Ctrl/Cmd + K - фокус на поиск
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      this.searchInput?.focus();
    }
    
    // Ctrl/Cmd + N - новая подписка
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      this.openModal();
    }
  }
}

// Инициализация после загрузки DOM
let subscriptionUI = null;

function initializeSubscriptionUI() {
  if (!subscriptionUI) {
    subscriptionUI = new SubscriptionUI();
    window.subscriptionUI = subscriptionUI;
  }
  return subscriptionUI;
}

// Ожидаем готовности DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSubscriptionUI);
} else {
  initializeSubscriptionUI();
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SubscriptionUI, subscriptionUI: () => subscriptionUI };
} else {
  window.SubscriptionUI = SubscriptionUI;
  window.initializeSubscriptionUI = initializeSubscriptionUI;
}