import { profile, projects, type Project } from '../data/portfolio';
import { icons } from './icons';

export const escape = (value: string) =>
  value.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);

const pad = (n: number) => String(n).padStart(2, '0');

const chips = (items: string[]) => `<ul class="chips">${items.map((t) => `<li>${escape(t)}</li>`).join('')}</ul>`;

export function projectView(project: Project, index: number) {
  const prev = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];
  const wip = project.status === 'wip';
  const actions = [
    project.demo &&
      `<a class="btn btn--primary" href="${escape(project.demo)}" target="_blank" rel="noopener">Открыть демо ${icons.external}</a>`,
    project.repo &&
      `<a class="btn" href="${escape(project.repo)}" target="_blank" rel="noopener">${icons.github} Исходный код</a>`,
  ]
    .filter(Boolean)
    .join('');

  return `
    <p class="panel__eyebrow">
      <span>Планета ${pad(index + 1)} / ${pad(projects.length)}</span>
      ${wip ? '<span class="badge">В разработке</span>' : `<span>${project.year}</span>`}
    </p>
    <h2 class="panel__title">${escape(project.name)}</h2>
    <p class="panel__tagline">${escape(project.tagline)}</p>
    <p class="panel__text">${escape(project.description)}</p>
    <h3 class="panel__label">${wip ? 'Планируемый стек' : 'Стек'}</h3>
    ${chips(project.tech)}
    ${
      wip
        ? '<p class="panel__note">Планета ещё формируется: демо и исходный код появятся здесь, как только проект будет готов.</p>'
        : actions && `<div class="panel__actions">${actions}</div>`
    }
    <nav class="pager" aria-label="Другие проекты">
      <button type="button" class="pager__btn" data-step="-1">
        <small>Предыдущий</small><span>${escape(prev.name)}</span>
      </button>
      <button type="button" class="pager__btn pager__btn--next" data-step="1">
        <small>Следующий</small><span>${escape(next.name)}</span>
      </button>
    </nav>`;
}

export function aboutView() {
  const initial = profile.name.trim().charAt(0).toUpperCase();
  return `
    <div class="about__head">
      <div class="avatar" aria-hidden="true">${escape(initial)}</div>
      <div>
        <h2 class="panel__title">${escape(profile.name)}</h2>
        <p class="panel__tagline">${escape(profile.role)}</p>
      </div>
    </div>
    <p class="panel__eyebrow"><span>📍 ${escape(profile.location)}</span></p>
    ${profile.about.map((p) => `<p class="panel__text">${escape(p)}</p>`).join('')}
    ${profile.skills
      .map((group) => `<h3 class="panel__label">${escape(group.group)}</h3>${chips(group.items)}`)
      .join('')}
    <div class="panel__actions">
      <button type="button" class="btn btn--primary" data-action="tour">Смотреть проекты ${icons.arrow}</button>
      <button type="button" class="btn" data-action="contact">Связаться</button>
    </div>`;
}

export function contactView() {
  return `
    <p class="panel__eyebrow"><span>Канал связи открыт</span></p>
    <h2 class="panel__title">Давайте сделаем что-то космическое</h2>
    <p class="panel__text">Открыт к предложениям о работе, фрилансу и интересным коллаборациям. Отвечаю быстрее скорости света (почти).</p>
    <ul class="contacts">
      ${profile.contacts
        .map(
          (c) => `
        <li>
          <a class="contact" href="${escape(c.url)}" ${c.kind === 'email' ? '' : 'target="_blank" rel="noopener"'}>
            <span class="contact__icon">${icons[c.kind]}</span>
            <span class="contact__text"><strong>${escape(c.label)}</strong><small>${escape(c.url.replace(/^(mailto:|https?:\/\/)/, ''))}</small></span>
            <span class="contact__arrow">${icons.external}</span>
          </a>
        </li>`,
        )
        .join('')}
    </ul>`;
}

export function projectsMenu() {
  return projects
    .map(
      (p, i) => `
      <li>
        <button type="button" class="menu-item" data-project="${escape(p.id)}" style="--accent:${escape(p.planet.atmosphere)}">
          <span class="menu-item__dot"></span>
          <span class="menu-item__text"><strong>${escape(p.name)}</strong><small>${escape(p.tagline)}</small></span>
          <span class="menu-item__num">${p.status === 'wip' ? 'скоро' : pad(i + 1)}</span>
        </button>
      </li>`,
    )
    .join('');
}

export function fallbackView() {
  return `
    <div class="fallback">
      <h1>${escape(profile.name)}</h1>
      <p class="panel__tagline">${escape(profile.role)}</p>
      ${profile.about.map((p) => `<p class="panel__text">${escape(p)}</p>`).join('')}
      <p class="fallback__note">Ваш браузер не поддерживает WebGL, поэтому вместо 3D-космоса показана простая версия сайта.</p>
      ${projects
        .map(
          (p, i) => `<article class="fallback__card" style="--accent:${escape(p.planet.atmosphere)}">${projectView(p, i).replace(/<nav class="pager"[\s\S]*<\/nav>/, '')}</article>`,
        )
        .join('')}
      ${contactView()}
    </div>`;
}
