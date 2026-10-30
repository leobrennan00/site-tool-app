import { Brand } from '@/constants/theme';

// Page-level touches the shared React Native styles can't express: the tab
// title, the page background behind the app, thin scroll bars, a visible
// keyboard focus ring, and no blue tap flash.
if (typeof document !== 'undefined') {
  document.title = 'SiteReport';
  const style = document.createElement('style');
  style.textContent = `
    html, body { background: ${Brand.bg}; }
    body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    * { -webkit-tap-highlight-color: transparent; }
    input, textarea { outline: none; }
    input::placeholder, textarea::placeholder { color: ${Brand.textMuted} !important; opacity: 1; }
    [role="button"]:focus-visible, a:focus-visible { outline: 2px solid ${Brand.primaryMid}; outline-offset: 2px; border-radius: 10px; }
    ::selection { background: ${Brand.primaryTint}; }
    * { scrollbar-width: thin; scrollbar-color: ${Brand.border} transparent; }
    ::-webkit-scrollbar { width: 10px; height: 10px; }
    ::-webkit-scrollbar-thumb { background: ${Brand.border}; border-radius: 10px; border: 2px solid ${Brand.bg}; }
    ::-webkit-scrollbar-track { background: transparent; }
  `;
  document.head.appendChild(style);
}
