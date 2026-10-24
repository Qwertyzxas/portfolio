import './style.css';
import { profile } from './data/portfolio';
import { Universe, type Focus } from './scene/Universe';
import { aboutView, contactView, fallbackView, projectsMenu, projectView } from './ui/templates';

type View = 'project' | 'about' | 'contact' | null;

const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;

const canvas = $<HTMLCanvasElement>('#scene');
const loader = $('#loader');
const panel = $('#panel');
const panelContent = $('#panel-content');
const menu = $('#projects-menu');
const menuToggle = $<HTMLButtonElement>('[data-action="projects"]');

document.title = `${profile.name} — ${profile.role}`;
document.querySelectorAll<HTMLElement>('[data-bind]').forEach((el) => {
  el.textContent = profile[el.dataset.bind as 'name' | 'role'];
});

function supportsWebGL() {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

if (supportsWebGL()) boot();
else {
  document.body.classList.add('no-webgl');
  loader.remove();
  canvas.remove();
  document.body.insertAdjacentHTML('beforeend', fallbackView());
}

function boot() {
  const touch = matchMedia('(pointer: coarse)').matches;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowPower = touch || (navigator.hardwareConcurrency ?? 8) <= 4;
  const isNarrow = () => window.innerWidth <= 760;

  let view: View = null;

  const universe = new Universe({ canvas, lowPower, reducedMotion, onFocusChange });

  $('#hint').innerHTML = (
    touch
      ? ['Свайп — вращать', 'Щипок — масштаб', 'Тап по планете — проект']
      : ['Тяни — вращать', 'Колесо — масштаб', 'Клик по планете — проект', '← → — листать']
  )
    .map((text) => `<span>${text}</span>`)
    .join('');

  function setHash(id: string) {
    history.replaceState(null, '', id ? `#${id}` : location.pathname + location.search);
  }

  function updateViewShift() {
    // keep the focused object visible next to the panel instead of under it
    if (!view || !universe.focus) universe.setViewShift(0, 0);
    else if (isNarrow()) universe.setViewShift(0, panel.offsetHeight / 2);
    else universe.setViewShift(panel.offsetWidth / 2 + 12, 0);
  }

  function showPanel(next: Exclude<View, null>, html: string, accent: string) {
    view = next;
    panelContent.innerHTML = html;
    panelContent.scrollTop = 0;
    panel.style.setProperty('--accent', accent);
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    // restart the staggered entrance animation
    panelContent.classList.remove('is-entering');
    void panelContent.offsetWidth;
    panelContent.classList.add('is-entering');
    document.body.classList.add('has-panel');
    closeMenu();
    updateViewShift();
  }

  function hidePanel() {
    view = null;
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('has-panel');
    updateViewShift();
  }

  function closePanel() {
    if (universe.focus) universe.overview();
    else {
      hidePanel();
      setHash('');
    }
  }

  function openContact() {
    showPanel('contact', contactView(), '#7fd6ff');
    setHash('contact');
  }

  function onFocusChange(focus: Focus) {
    if (focus?.kind === 'planet') {
      const { project, index } = focus.planet;
      showPanel('project', projectView(project, index), project.planet.atmosphere);
      setHash(project.id);
    } else if (focus?.kind === 'sun') {
      showPanel('about', aboutView(), '#ffb347');
      setHash('about');
    } else {
      hidePanel();
      setHash('');
    }
  }

  function openMenu() {
    menu.classList.add('is-open');
    menuToggle.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    menu.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }

  function openFromHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id === 'about') universe.focusSun();
    else if (id === 'contact') openContact();
    else {
      const planet = universe.findPlanet(id);
      if (planet) universe.focusPlanet(planet);
    }
  }

  // ── navigation ───────────────────────────────────────────
  menu.querySelector('ul')!.innerHTML = projectsMenu();
  menu.addEventListener('click', (event) => {
    const item = (event.target as HTMLElement).closest<HTMLElement>('[data-project]');
    const planet = item && universe.findPlanet(item.dataset.project!);
    if (planet) {
      closeMenu();
      universe.focusPlanet(planet);
    }
  });

  document.querySelector('.nav')!.addEventListener('click', (event) => {
    const action = (event.target as HTMLElement).closest<HTMLElement>('[data-action]')?.dataset.action;
    if (action === 'about') universe.focusSun();
    else if (action === 'contact') openContact();
    else if (action === 'projects') {
      if (menu.classList.contains('is-open')) closeMenu();
      else openMenu();
    }
  });

  $('#brand').addEventListener('click', () => {
    closeMenu();
    closePanel();
  });

  $('#panel-close').addEventListener('click', closePanel);

  panelContent.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const step = target.closest<HTMLElement>('[data-step]')?.dataset.step;
    const action = target.closest<HTMLElement>('[data-action]')?.dataset.action;
    if (step) universe.step(Number(step));
    else if (action === 'tour') universe.focusPlanet(universe.planets[0]);
    else if (action === 'contact') openContact();
  });

  document.addEventListener('pointerdown', (event) => {
    const target = event.target as HTMLElement;
    if (!menu.contains(target) && !menuToggle.contains(target)) closeMenu();
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (menu.classList.contains('is-open')) closeMenu();
      else closePanel();
    } else if (event.key === 'ArrowRight') universe.step(1);
    else if (event.key === 'ArrowLeft') universe.step(-1);
  });

  window.addEventListener('resize', updateViewShift);

  // ── launch ───────────────────────────────────────────────
  universe.start(() => document.body.classList.add('is-ready'));
  openFromHash();

  // the first frame compiles every shader; hide the loader once it has been drawn
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      loader.classList.add('is-hidden');
      setTimeout(() => loader.remove(), 1200);
      if (reducedMotion || location.hash) document.body.classList.add('is-ready');
    }),
  );
}
