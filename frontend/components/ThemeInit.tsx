// Runs before paint to avoid a flash of the wrong theme.
const THEME_SCRIPT = `
(function() {
  try {
    var saved = localStorage.getItem('raven-theme');
    if (saved === 'light') document.documentElement.classList.add('light');
  } catch (e) {}
})();
`;

export default function ThemeInit() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />;
}
