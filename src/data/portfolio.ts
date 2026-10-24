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
  /** 'wip' — проект в разработке: без ссылок, с пометкой «скоро». По умолчанию 'live' */
  status?: 'live' | 'wip';
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
    { kind: 'telegram', label: 'Telegram', url: 'https://t.me/legeng163' },
    { kind: 'email', label: 'Email', url: 'mailto:vojtenkotimur88@gmail.com' },
  ],
};

export const projects: Project[] = [
  {
    id: 'space-portfolio',
    name: 'Space Portfolio',
    tagline: 'Интерактивное 3D-портфолио, которое вы сейчас смотрите',
    description:
      'Солнечная система на Three.js, где каждая планета — проект. Процедурные планеты на GLSL-шейдерах, кольца с тенями, bloom-свечение, кинематографичные пролёты камеры, адаптив под телефоны и облегчённый режим для слабых устройств.',
    tech: ['TypeScript', 'Three.js', 'GLSL', 'Vite', 'GitHub Actions'],
    year: 2026,
    repo: 'https://github.com/Qwertyzxas/portfolio',
    demo: 'https://qwertyzxas.github.io/portfolio/',
    planet: {
      type: 'gas',
      color: '#7b6cff',
      accent: '#2c2370',
      atmosphere: '#a29bff',
      size: 2.6,
      orbit: 22,
      speed: 1.3,
      moons: 1,
    },
  },
  {
    id: 'orbit-tasks',
    name: 'Orbit Tasks',
    tagline: 'Таск-менеджер в стиле Linear',
    description:
      'Канбан-доска с drag & drop, офлайн-режимом (PWA + IndexedDB), отменой действий, палитрой команд по Ctrl+K и полным управлением с клавиатуры.',
    tech: ['TypeScript', 'React', 'IndexedDB', 'PWA', 'Vitest', 'Playwright'],
    year: 2026,
    status: 'wip',
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
    id: 'pulse',
    name: 'Pulse',
    tagline: 'Крипто-дашборд в реальном времени',
    description:
      'Живые котировки через WebSocket, свечные графики на Canvas и таблица на тысячи строк без лагов. Тяжёлые вычисления вынесены в Web Workers.',
    tech: ['TypeScript', 'WebSocket', 'Canvas', 'Web Workers'],
    year: 2026,
    status: 'wip',
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
    id: 'aurora',
    name: 'Aurora',
    tagline: 'Промо-лендинг уровня Awwwards',
    description:
      'Посадочная страница гаджета: 3D-модель вращается при скролле, кинематографичные анимации и плавная прокрутка.',
    tech: ['Three.js', 'GSAP', 'ScrollTrigger', 'Lenis'],
    year: 2026,
    status: 'wip',
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
    id: 'nova-ui',
    name: 'Nova UI',
    tagline: 'Дизайн-система и библиотека компонентов',
    description:
      'Доступные компоненты с темами, документацией в Storybook, тестами и публикацией в npm.',
    tech: ['TypeScript', 'React', 'Storybook', 'npm'],
    year: 2026,
    status: 'wip',
    planet: {
      type: 'ice',
      color: '#7fd6ff',
      accent: '#2a5d9c',
      atmosphere: '#8ad8ff',
      size: 2.8,
      orbit: 84,
      speed: 0.4,
      moons: 2,
    },
  },
];

/** Пояс астероидов между внутренними и внешними планетами */
export const asteroidBelt = { inner: 54, outer: 59 };
