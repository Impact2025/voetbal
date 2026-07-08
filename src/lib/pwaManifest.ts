/**
 * Wisselt de gekoppelde web-app-manifest om, zodat de native install-prompt
 * (naam, beschrijving, screenshots) aansluit bij de rol van de ingelogde
 * gebruiker. Moet zo vroeg mogelijk na het bekend worden van de rol worden
 * aangeroepen — Chrome herbeoordeelt installability zodra de manifest-link
 * wijzigt, en herhaalt daarna `beforeinstallprompt` met de nieuwe manifest.
 */
const MANIFEST_BY_ROLE: Record<string, string> = {
  player: '/manifest.webmanifest',
  coach: '/manifest-coach.webmanifest',
  superadmin: '/manifest-coach.webmanifest', // buiten /admin krijgt superadmin dezelfde dashboard-weergave als coach
  parent: '/manifest-ouder.webmanifest',
  club_admin: '/manifest-club.webmanifest',
};

export function applyManifestForRole(role?: string | null) {
  if (typeof document === 'undefined') return;

  const href = (role && MANIFEST_BY_ROLE[role]) || MANIFEST_BY_ROLE.player;
  let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');

  if (!link) {
    link = document.createElement('link');
    link.rel = 'manifest';
    document.head.appendChild(link);
  }

  if (link.getAttribute('href') !== href) {
    link.setAttribute('href', href);
  }
}
