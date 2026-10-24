# 🌌 Space Portfolio

Интерактивное 3D-портфолио в виде солнечной системы. Солнце — это вы («Обо мне»), каждая планета — отдельный проект.

**Стек:** TypeScript · Three.js · Vite · GLSL-шейдеры

## Возможности

- Процедурные планеты на шейдерах: каменистые с континентами и облаками, газовые гиганты, ледяные и лавовые миры
- Кольца с тенью от планеты, луны, пояс астероидов, мерцающие звёзды и туманность
- Bloom-свечение, кинематографичный пролёт камеры при загрузке
- Клик по планете — камера подлетает и следует за ней, открывается карточка проекта
- Прямые ссылки: `site/#saturn-shop`, `site/#about`, `site/#contact`
- Клавиатура: `←` `→` — листать проекты, `Esc` — назад к системе
- Адаптив под телефоны, облегчённый режим для слабых устройств, `prefers-reduced-motion`
- Простая версия страницы, если браузер не поддерживает WebGL

## Запуск

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # сборка в dist/
npm run preview   # просмотр собранной версии
```

## Как заполнить своими данными

Всё содержимое — в одном файле [`src/data/portfolio.ts`](src/data/portfolio.ts):

- `profile` — имя, роль, текст «Обо мне», навыки, контакты
- `projects` — проекты; у каждого есть блок `planet`, задающий внешний вид планеты:

| Поле | Что делает |
| --- | --- |
| `type` | `rocky` · `gas` · `ice` · `lava` |
| `color`, `accent` | основной и дополнительный цвет поверхности |
| `atmosphere` | цвет свечения, подписи и акцента в панели |
| `size`, `orbit` | радиус планеты и радиус орбиты |
| `speed` | скорость движения по орбите |
| `rings`, `moons` | кольца и количество лун |

Следите, чтобы орбиты не пересекались с поясом астероидов (`asteroidBelt`).

## Публикация на GitHub Pages

1. Создайте репозиторий на GitHub (для адреса `username.github.io` назовите его именно так).
2. Залейте код в ветку `main`:
   ```bash
   git init
   git add .
   git commit -m "Space portfolio"
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPO.git
   git push -u origin main
   ```
3. В репозитории: **Settings → Pages → Source: GitHub Actions**.

Workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) сам соберёт и опубликует сайт при каждом пуше в `main`.

## Структура

```
src/
  data/portfolio.ts     ← ваши данные
  scene/Universe.ts     рендер, камера, перелёты, клики
  scene/Planet.ts       планета: поверхность, атмосфера, кольца, луны, подпись
  scene/Sun.ts          солнце и корона
  scene/Background.ts   звёзды и туманность
  scene/AsteroidBelt.ts пояс астероидов
  scene/shaders.ts      GLSL-шейдеры
  ui/templates.ts       разметка панелей
  main.ts               интерфейс и навигация
  style.css             стили
```
