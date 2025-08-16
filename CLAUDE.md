# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Проект Overview
PWA (Progressive Web App) для учёта подписок - современное веб-приложение с офлайн-поддержкой для отслеживания ежемесячных подписок и визуализации расходов.

## Цель проекта
Создать интуитивно понятное приложение, позволяющее пользователям:
- Управлять подписками (CRUD операции)
- Просматривать статистику расходов через графики
- Получать прогнозы трат на месяц/год
- Работать офлайн после первой загрузки
- Переключаться между светлой/тёмной темами
- Использовать мультиязычность (ru/en/uk)

## Архитектура проекта

### Технический стек
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **PWA**: Service Workers, Web App Manifest
- **Данные**: localStorage (без внешней БД)
- **Графики**: Chart.js с responsive конфигурацией
- **Хостинг**: Vercel с автодеплоем из GitHub
- **Дизайн**: Material Design принципы

### Структура файлов
```
pwa-test/
├── index.html              # Главная страница
├── manifest.json           # PWA манифест
├── service-worker.js       # Cache-First стратегия
├── vercel.json            # Конфигурация Vercel + SPA routing
├── css/
│   ├── styles.css         # Основные стили
│   ├── themes.css         # Light/Dark themes
│   └── animations.css     # CSS transitions
├── js/
│   ├── app.js             # Главная логика приложения
│   ├── db.js              # localStorage операции
│   ├── ui.js              # DOM манипуляции
│   ├── charts.js          # Chart.js интеграция
│   ├── notifications.js   # Push notifications
│   └── i18n.js            # Интернационализация
├── locales/
│   ├── ru.json            # Русские переводы
│   ├── en.json            # Английские переводы
│   └── uk.json            # Украинские переводы
└── icons/                 # PWA иконки (192x192, 512x512)
```

## Команды разработки

### Локальная разработка
```bash
# Запуск локального сервера (например, с Python)
python -m http.server 8000

# Или с Node.js
npx serve .

# Просмотр в браузере
open http://localhost:8000
```

### Git workflow
```bash
# Работа с изменениями
git add .
git commit -m "✨ Описание функции"
git push origin main

# Автодеплой на Vercel произойдёт автоматически
```

### Тестирование PWA
- Chrome DevTools > Application > Service Workers
- Chrome DevTools > Application > Manifest
- Lighthouse audit для PWA score
- Тестирование офлайн режима (Network tab > Offline)

## Ключевые архитектурные решения

### Service Worker (Cache-First)
```javascript
// Стратегия кэширования
const CACHE_NAME = 'pwa-subscription-v1';
const PRECACHE_ASSETS = ['/', '/css/styles.css', '/js/app.js', '/icons/icon-192x192.png'];
```

### Данные (localStorage)
```javascript
// Модель подписки
{
  id: uuid,
  name: string,
  price: number,
  period: 'monthly'|'yearly',
  nextPayment: Date,
  active: boolean,
  category: string
}
```

### Chart.js конфигурация
```javascript
// Обязательно использовать responsive контейнер
<div class="chart-container" style="position: relative; height:40vh; width:80vw">
    <canvas id="chartId"></canvas>
</div>
```

### Мультиязычность
```javascript
// Система переводов через функцию t(key)
const lang = localStorage.getItem('language') || 'ru';
return translations[lang][key] || key;
```

## Фазы разработки

1. **Фаза 1**: Базовая PWA структура + Service Worker
2. **Фаза 2**: CRUD функционал для подписок
3. **Фаза 3**: Аналитика и графики (Chart.js)
4. **Фаза 4**: UI/UX, темы, мультиязычность
5. **Фаза 5**: Тестирование и деплой

## Требования к функциям

### PWA Requirements
- Устанавливается как нативное приложение
- Работает офлайн после первой загрузки
- Адаптивный дизайн для всех устройств
- Service Worker с Cache-First стратегией

### UI/UX Requirements
- Минималистичный Material Design
- Светлая и тёмная темы
- Плавные CSS анимации
- Интуитивная навигация
- Поддержка touch-жестов на мобильных

### Deплой конфигурация (Vercel)
- Автодеплой из GitHub main ветки
- SPA routing через rewrites в vercel.json
- Правильные заголовки для Service Worker и Manifest
- Кэширование статических ресурсов

## Важные детали разработки

- Всегда тестировать PWA функции в Chrome DevTools
- Использовать semantic HTML для доступности
- Все строки интерфейса через систему переводов t()
- Chart.js загружать из CDN для актуальной версии
- localStorage операции оборачивать в try/catch
- Service Worker обновлять при изменении CACHE_NAME
- Всякий раз при завершении работ обновлять чек лист и фазы в файле plan.md