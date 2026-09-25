import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Page HTML racine de la version web (build statique, Vercel).
// Les icônes sont dans public/ (servies à la racine du site) et générées à partir de assets/images/logo.png.
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
      </head>
      <body>{children}</body>
    </html>
  );
}
