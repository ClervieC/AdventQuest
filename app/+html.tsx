import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Page HTML racine de la version web (build statique, Vercel).
// Les icônes sont dans public/ (servies à la racine du site) et générées à partir de assets/images/logo.png.

// iPhone en mode écran d'accueil : hauteur de l'app = hauteur de l'écran (voir la balise <script> plus bas)
const IOS_STANDALONE_HEIGHT = `(function () {
  var nav = window.navigator;
  var isIOS = /iPhone|iPad|iPod/.test(nav.userAgent) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
  var standalone = nav.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  if (!isIOS || !standalone) return;
  var root = document.documentElement;
  root.classList.add('ios-standalone');
  function fit() {
    var landscape = window.matchMedia('(orientation: landscape)').matches;
    var screenHeight = landscape ? Math.min(screen.width, screen.height) : Math.max(screen.width, screen.height);
    root.style.setProperty('--app-height', Math.max(screenHeight, window.innerHeight) + 'px');
  }
  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', function () { setTimeout(fit, 300); });
})();`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <title>AdventQuest</title>
        <meta name="description" content="Calendrier de l'Avent interactif : 24 mini-jeux pour réparer le Cœur de Noël." />

        {/* Icônes : onglet du navigateur, favoris et écran d'accueil iPhone/iPad, Android */}
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />

        {/* Ajout à l'écran d'accueil sur iPhone : nom sous l'icône et barre d'état sombre */}
        <meta name="apple-mobile-web-app-title" content="AdventQuest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#0c1521" />

        <ScrollViewStyleReset />
        {/* Fond sombre dès le premier affichage (évite un flash blanc avant le chargement de l'app) */}
        <style dangerouslySetInnerHTML={{ __html: 'html, body { background-color: #0c1521; }' }} />
        {/* iPhone : « 100 % » de hauteur peut inclure la zone cachée sous la barre d'outils de Safari :
            un #root fixé aux 4 bords suit la zone réellement affichée. */}
        <style
          dangerouslySetInnerHTML={{
            __html:
              '#root { position: fixed; top: 0; right: 0; bottom: 0; left: 0; height: auto; }' +
              'html.ios-standalone #root { bottom: auto; height: var(--app-height); }',
          }}
        />
        {/* iPhone, site ajouté à l'écran d'accueil : iOS annonce une fenêtre plus courte que l'écran
            (de la hauteur de la barre d'état), même pour un élément fixé en bas. L'app s'arrêtait donc
            ~60 px trop haut et les onglets flottaient au-dessus d'un bandeau vide.
            En mode écran d'accueil l'app occupe tout l'écran : on prend la hauteur de l'écran. */}
        <script dangerouslySetInnerHTML={{ __html: IOS_STANDALONE_HEIGHT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
