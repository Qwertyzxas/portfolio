// ─────────────────────────────────────────────────────────────
//  Всё содержимое сайта живёт здесь. Меняйте тексты, ссылки и
//  внешний вид планет — сцена перестроится автоматически.
// ─────────────────────────────────────────────────────────────

export type PlanetType = 'rocky' | 'gas' | 'ice' | 'lava';

export interface Project {
  /** Используется в адресе: site.com/#id */
  id: string;
  name: string;
  tagline: string;
  description: string;
  tech: string[];
  year: number;
  repo?: string;
  demo?: string;
  planet: {
    type: PlanetType;
    /** Основной цвет поверхности */
    color: string;
    /** Второй цвет (океаны, полосы, трещины) */
    accent: string;
    /** Цвет свечения атмосферы */
    atmosphere: string;
    /** Радиус планеты */
    size: number;
    /** Радиус орбиты */
    orbit: number;
    /** Скорость движения по орбите (1 — обычная) */
    speed: number;
    rings?: boolean;
    moons?: number;
  };
}

export interface Contact {
  kind: 'github' | 'telegram' | 'email' | 'linkedin' | 'website';
  label: string;
  url: string;
}

export interface Profile {
  name: string;
  role: string;
  location: string;
  about: string[];
  skills: { group: string; items: string[] }[];
  contacts: Contact[];
}

export const profile: Profile = {
  name: 'Тимур',
  role: 'Frontend-разработчик',
  location: 'Земля, Солнечная система',
  about: [
    'Делаю интерфейсы, которые хочется трогать: быстрые, анимированные и аккуратные до пикселя.',
    'Люблю WebGL, TypeScript и момент, когда сложная идея наконец превращается в простой продукт.',
  ],
  skills: [
    { group: 'Языки', items: ['TypeScript', 'JavaScript', 'HTML', 'CSS', 'GLSL'] },
    { group: 'Фреймворки', items: ['React', 'Vue', 'Node.js', 'Vite', 'Next.js'] },
    { group: 'Графика', items: ['Three.js', 'WebGL', 'Canvas', 'GSAP'] },
    { group: 'Инструменты', items: ['Git', 'Figma', 'Docker', 'CI/CD'] },
  ],
  contacts: [
    { kind: 'github', label: 'GitHub', url: 'https://github.com/Qwertyzxas' },
    { kind: 'telegram', label: 'Telegram', url: 'https://t.me/username' },
    { kind: 'email', label: 'Email', url: 'mailto:hello@example.com' },
    { kind: 'linkedin', label: 'LinkedIn', url: 'https://linkedin.com/in/username' },
  ],
};

export const projects: Project[] = [
  {
    id: 'nebula-ui',
    name: 'Nebula UI',
    tagline: 'Библиотека компонентов с космической анимацией',
    description:
      'Набор из 40+ доступных React-компонентов с продуманными микровзаимодействиями. Темизация через CSS-переменные, tree-shaking, документация в Storybook.',
    tech: ['React', 'TypeScript', 'Storybook', 'CSS'],
    year: 2026,
    repo: 'https://github.com/username/nebula-ui',
    demo: 'https://username.github.io/nebula-ui',
    planet: {
      type: 'ice',
      color: '#7fd6ff',
      accent: '#2a5d9c',
      atmosphere: '#8ad8ff',
      size: 2.2,
      orbit: 22,
      speed: 1.4,
    },
  },
  {
    id: 'terra-tasks',
    name: 'Terra Tasks',
    tagline: 'Канбан-доска с реалтайм-синхронизацией',
    description:
      'Командный таск-трекер: drag & drop, совместное редактирование через WebSocket, офлайн-режим и синхронизация после восстановления сети.',
    tech: ['Vue', 'Node.js', 'WebSocket', 'PostgreSQL'],
    year: 2025,
    repo: 'https://github.com/username/terra-tasks',
    planet: {
      type: 'rocky',
      color: '#5fae6a',
      accent: '#1d4e89',
      atmosphere: '#6cb6ff',
      size: 2.8,
      orbit: 34,
      speed: 1,
      moons: 1,
    },
  },
  {
    id: 'magma-analytics',
    name: 'Magma Analytics',
    tagline: 'Дашборд метрик в реальном времени',
    description:
      'Визуализация миллионов событий в секунду: WebGL-графики, стриминг данных и фильтры без задержек. Отрисовка 60 FPS даже на слабых ноутбуках.',
    tech: ['TypeScript', 'WebGL', 'D3', 'Web Workers'],
    year: 2025,
    repo: 'https://github.com/username/magma-analytics',
    demo: 'https://username.github.io/magma-analytics',
    planet: {
      type: 'lava',
      color: '#ff6a1f',
      accent: '#3a1410',
      atmosphere: '#ff7b3a',
      size: 2.4,
      orbit: 46,
      speed: 0.8,
    },
  },
  {
    id: 'saturn-shop',
    name: 'Saturn Shop',
    tagline: 'Интернет-магазин с 3D-примеркой товаров',
    description:
      'E-commerce с интерактивным просмотром товаров в 3D, корзиной, оплатой и админкой. Lighthouse 98+ благодаря SSR и ленивой загрузке моделей.',
    tech: ['Next.js', 'Three.js', 'Stripe', 'Prisma'],
    year: 2024,
    repo: 'https://github.com/username/saturn-shop',
    demo: 'https://saturn-shop.example.com',
    planet: {
      type: 'gas',
      color: '#e8c08a',
      accent: '#9c6b3f',
      atmosphere: '#ffd59a',
      size: 4.2,
      orbit: 70,
      speed: 0.55,
      rings: true,
    },
  },
  {
    id: 'void-chat',
    name: 'Void Chat',
    tagline: 'Мессенджер со сквозным шифрованием',
    description:
      'Чат с E2E-шифрованием на Web Crypto API, голосовыми сообщениями и PWA-установкой. Работает без сервера хранения сообщений.',
    tech: ['TypeScript', 'WebRTC', 'Web Crypto', 'PWA'],
    year: 2024,
    repo: 'https://github.com/username/void-chat',
    planet: {
      type: 'gas',
      color: '#7b6cff',
      accent: '#2c2370',
      atmosphere: '#a29bff',
      size: 3.4,
      orbit: 84,
      speed: 0.4,
      moons: 2,
    },
  },
];

/** Пояс астероидов между внутренними и внешними планетами */
export const asteroidBelt = { inner: 54, outer: 59 };
