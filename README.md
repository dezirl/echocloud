<div align="center">

<img src="logo/app-icon-source.png" width="112" alt="EchoCloud">

# EchoCloud

**Десктопный клиент SoundCloud, который выглядит как приложение, а не как обёртка вокруг сайта**

[![Версия](https://img.shields.io/badge/версия-3.0.0-8b5cf6?style=flat-square)](https://github.com/dezirl/echocloud/releases/latest)
[![Платформы](https://img.shields.io/badge/Windows%20·%20macOS%20·%20Linux-0c0c0c?style=flat-square)](#установка)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-24C8DB?style=flat-square&logo=tauri&logoColor=white)](https://tauri.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Rust](https://img.shields.io/badge/Rust-000000?style=flat-square&logo=rust&logoColor=white)](https://www.rust-lang.org)

<img src="docs/screenshots/hero.png" width="100%" alt="Главный экран EchoCloud">

</div>

---

## Что это

Нативный плеер для SoundCloud на Tauri 2 и React. Rust-бэкенд ходит в SoundCloud напрямую, звук идёт через Web Audio API — поэтому доступны вещи, которых в вебе нет: эквалайзер, реверберация, изменение скорости без потери тона, бесшовные переходы между треками и полноэкранный визуализатор, который реагирует на музыку.

Приложение весит несколько мегабайт и не тащит с собой Chromium: интерфейс рисует системный вебвью, вся логика — в нативном бинарнике.

---

## Возможности

### Библиотека целиком

Поиск по трекам, артистам, плейлистам и альбомам, домашняя лента с подборками, лайки, свои и чужие плейлисты, страницы артистов со статистикой.

<img src="docs/screenshots/home.png" width="100%" alt="Главная">

<img src="docs/screenshots/search.png" width="100%" alt="Поиск">

### Полноэкранный плеер

Визуализатор на весь экран, реагирующий на спектр в реальном времени, обложка на фоне, несколько режимов отрисовки и настройка интенсивности со скоростью.

<img src="docs/screenshots/fullscreen.png" width="100%" alt="Полноэкранный плеер">

### EchoWaves

Бесконечный поток треков, подобранных по звучанию, а не по тегам. Три профиля подбора: всё вперемешку, андеграунд SoundCloud и популярные исполнители. Чем дольше слушаешь, тем точнее попадает.

<img src="docs/screenshots/echowaves.png" width="100%" alt="EchoWaves">

### Текст песни

Синхронный построчный текст на движке Apple Music Like Lyrics — с подсветкой активной строки и посимвольной анимацией там, где разметка это позволяет.

<img src="docs/screenshots/lyrics.png" width="100%" alt="Текст песни">

### AutoMix

Переходы между треками как у диджея, а не встык. Стык просчитывается заранее в `OfflineAudioContext` — многополосное сведение с автоматикой эквалайзера и опциональным ревером, так что переход звучит одинаково ровно даже на слабой машине. Если просчитать не успели, включается живой кроссфейд.

<img src="docs/screenshots/automix.png" width="100%" alt="Настройки AutoMix">

### Оверлей для OBS

Обложка, название и живая волна прямо в стриме — и ничего из этого не появляется на твоём экране. Виджет отдаётся локальным сервером, в OBS добавляется как источник «Браузер». Два оформления, настройка прозрачности и превью прямо в настройках: в окне крутится ровно та страница, которую увидит OBS.

<img src="docs/screenshots/obs.png" width="100%" alt="Оверлей для OBS">

### Друзья и чат

Список друзей со статусом онлайн, личные сообщения, голосовые, отправка треков в чат прямо из плеера.

<img src="docs/screenshots/friends.png" width="100%" alt="Друзья и чат">

### Под себя

Темы оформления, живые обои из своего видео, персонажи и картинки в шапке и навбаре, прозрачность карточек, выбор стиля полосы прокрутки.

<img src="docs/screenshots/settings.png" width="100%" alt="Персонализация">

---

## Ещё в коробке

| | |
|---|---|
| **Эквалайзер** | Многополосный, с пресетами |
| **Реверберация** | MIX, SIZE, DAMP, WIDTH, PRE-DELAY, LOCUT |
| **Скорость** | 0.5×–2.0× без потери тона |
| **Загрузки** | Сохранение треков в MP3 |
| **Мини-плеер** | Компактное окно поверх остальных |
| **Горячие клавиши** | Play/Pause, вперёд, назад — работают на уровне системы, даже когда окно свёрнуто |
| **Discord** | Rich Presence с обложкой и прогрессом |
| **Трей** | Закрытие прячет в трей, приложение продолжает играть |
| **Два языка** | Русский и английский |
| **Автообновления** | Подписанные обновления прямо из приложения |

Часть возможностей — EchoWaves, AutoMix, живые обои, реверберация, скорость, безлимитные загрузки, персонажи — входит в подписку **Pro**.

---

## Установка

Готовые сборки — на странице [релизов](https://github.com/dezirl/echocloud/releases/latest).

| Платформа | Файл |
|---|---|
| **Windows** | `EchoCloud_3.0.0_x64-setup.exe` |
| **macOS** | `EchoCloud_3.0.0_universal.dmg` — Intel и Apple Silicon |
| **Linux** | `.AppImage`, `.deb` или `.rpm` |

**macOS.** Сборка не подписана в Apple, поэтому при первом запуске Gatekeeper ругается. Правый клик по приложению → «Открыть», либо один раз в терминале:

```bash
xattr -dr com.apple.quarantine /Applications/EchoCloud.app
```

**Linux.** AppImage достаточно сделать исполняемым:

```bash
chmod +x EchoCloud_3.0.0_amd64.AppImage && ./EchoCloud_3.0.0_amd64.AppImage
```

---

## Сборка из исходников

Нужны [Node.js 18+](https://nodejs.org), [Rust](https://rustup.rs) и системные зависимости Tauri для твоей ОС — список в [документации Tauri](https://tauri.app/start/prerequisites/).

```bash
npm install
npm run dev
```

Сборка установщика под текущую платформу:

```bash
npm run build
```

Готовые пакеты окажутся в `src-tauri/target/release/bundle/`.

Отдельные команды:

```bash
npm run dev:vite     # только фронтенд, без нативной оболочки
npm run build:vite   # только сборка фронтенда
npm run lint         # проверка типов
```

Сборка сразу под все три платформы собирается в GitHub Actions — workflow лежит в [`.github/workflows/build.yml`](.github/workflows/build.yml).

---

## Стек

**Оболочка** — Tauri 2 (Rust): сеть, аудиопрокси, работа с файлами, глобальные горячие клавиши, трей, автообновления.

**Интерфейс** — React 19, TypeScript, Vite 6, Tailwind CSS 4, zustand для состояния, Motion для анимаций.

**Звук** — Web Audio API: графы эффектов, анализаторы для визуализаторов, `OfflineAudioContext` для просчёта переходов. Meyda и web-audio-beat-detector — для разбора трека на признаки, Apple Music Like Lyrics — для текста песни.

---

## Скриншоты для этого файла

Кадры снимаются скриптом с запущенного приложения — он находит окно EchoCloud, выносит вперёд и снимает ровно его, без рабочего стола и панели задач:

```bash
powershell -ExecutionPolicy Bypass -File tools/capture-screenshots.ps1 -All
```

Скрипт по очереди подскажет, какой экран открыть, и разложит файлы по именам, которых ждёт README. Один кадр отдельно:

```bash
powershell -ExecutionPolicy Bypass -File tools/capture-screenshots.ps1 fullscreen
```

---

<div align="center">
<sub>EchoCloud — неофициальный клиент. Не связан с SoundCloud Limited.</sub>
</div>
