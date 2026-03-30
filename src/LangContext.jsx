import { createContext, useContext } from 'react';
import { T } from './i18n.js';

export const LangContext = createContext('en');

export function useLang() {
  return useContext(LangContext);
}

export function useT() {
  const lang = useContext(LangContext);
  return function t(key, vars = {}) {
    const tmpl = T[lang]?.[key] ?? T.en?.[key] ?? key;
    return tmpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  };
}
