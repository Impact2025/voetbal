export const CONSENT_KEY = 'gdpr_consent_v1';

export const hasConsented = (): boolean =>
  !!localStorage.getItem(CONSENT_KEY);
