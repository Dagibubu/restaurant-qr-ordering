import { useLang } from '../i18n/LanguageContext';

const OPTIONS = [
  { code: 'en', label: 'EN' },
  { code: 'am', label: 'አማ' },
];

// `dark` styles it for the dark customer menu; default is for the light admin UI.
export default function LanguageSwitch({ dark = false, className = '' }) {
  const { lang, setLang, t } = useLang();

  return (
    <div
      role="group"
      aria-label={t('language')}
      className={`lang-switch ${dark ? 'is-dark' : ''} ${className}`}
    >
      {OPTIONS.map((o) => (
        <button
          key={o.code}
          type="button"
          onClick={() => setLang(o.code)}
          aria-pressed={lang === o.code}
          className={lang === o.code ? 'is-active' : ''}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
