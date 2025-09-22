# Batocera ES Web – Visual, UX & Systems Dock Enhancer

Un userscript moderne qui améliore considérablement l'interface web d'EmulationStation de Batocera avec des fonctionnalités avancées de filtrage, tri, navigation et gestion visuelle.

## Fonctionnalités

###  Gestion des Jeux
- **Barre d'outils fixe** sous la bannière principale
- **Recherche instantanée** par nom ou genre
- **Tri avancé** : Nom (A→Z/Z→A), Année, Sessions de jeu, Favoris d'abord
- **Filtres intelligents** : Favoris uniquement, Jamais joués, Jeux avec succès
- **Pagination flexible** : 10/20/50/100/Tous les jeux par page
- **Bouton Aléatoire** pour lancer un jeu au hasard (respecte les filtres)
- **Export JSON** de la liste filtrée
- **Persistance** des préférences utilisateur

###  Dock des Systèmes
- **Interface moderne** remplaçant le carousel Bootstrap d'origine
- **Filtrage et tri** des systèmes par nom
- **Systèmes favoris** épinglables (★)
- **Historique récents** avec badges visuels
- **Zoom ajustable** des tuiles système
- **Défilement fluide** horizontal (molette, drag, flèches)
- **Menu contextuel** (clic droit) : Ouvrir, Aléatoire, Recharger, Épingler
- **Compteur de jeux** au survol de chaque système
- **Mise en avant** du système actif et en cours d'exécution

###  Améliorations Visuelles
- **Grille responsive** moderne pour les jeux
- **Thème sombre** pour les modales de détails
- **Contrôle des barres de défilement** : Auto/Masquer/Fines
- **Design cohérent** avec ombres, transitions et effets hover
- **Favoris mis en valeur** avec contours dorés
- **Layout propre** sans scrollbars parasites

###  Raccourcis Clavier
- **`/`** : Focus sur la recherche
- **`r`** : Recharger les gamelists
- **`←/→`** : Navigation entre les pages
- **`k`** : Ouvrir le modal Kill
- **`g`** : Basculer l'affichage des systèmes
- **`n`** : Basculer l'affichage "Current"

## Installation

### Chrome / Chromium / Edge / Brave

1. **Installer Tampermonkey** :
   - Aller sur [Tampermonkey pour Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - Cliquer sur "Ajouter à Chrome"

2. **Installer le script** :
   - Copier le code du userscript complet
   - Ouvrir Tampermonkey Dashboard (icône → Dashboard)
   - Cliquer sur l'onglet "Utilitaires"
   - Coller l'URL ou le code dans "Installer depuis l'URL"
   - Ou créer un nouveau script et coller le code

### Firefox

1. **Installer Greasemonkey** :
   - Aller sur [Greasemonkey pour Firefox](https://addons.mozilla.org/fr/firefox/addon/greasemonkey/)
   - Cliquer sur "Ajouter à Firefox"

2. **Installer le script** :
   - Copier le code du userscript
   - Cliquer sur l'icône Greasemonkey
   - "Nouveau script utilisateur" → Coller le code
   - Sauvegarder

### Violentmonkey (Alternative cross-browser)

1. **Installer Violentmonkey** :
   - [Chrome](https://chrome.google.com/webstore/detail/violentmonkey/jinjaccalgkegednnccohejagnlnfdag)
   - [Firefox](https://addons.mozilla.org/fr/firefox/addon/violentmonkey/)
   - [Edge](https://microsoftedge.microsoft.com/addons/detail/violentmonkey/eeagobfjdenkkddmbclomhiblgggliao)

2. **Installer le script** :
   - Ouvrir le Dashboard Violentmonkey
   - "+" → "Nouveau script"
   - Remplacer le contenu par le code du userscript
   - Ctrl+S pour sauvegarder

## ⚙️ Configuration

### Première utilisation
1. Accéder à l'interface web de Batocera (généralement `http://batocera.local:1234`)
2. Le script se charge automatiquement
3. La barre d'outils apparaît sous la bannière principale
4. Le dock des systèmes remplace le carousel en bas

### Réglages disponibles
- **Barres de défilement** : Auto/Masquer/Fines (dock systèmes)
- **Zoom systèmes** : Boutons +/- pour ajuster la taille
- **Filtres jeux** : Persistants entre les sessions
- **Pagination** : Taille de page mémorisée

### URLs supportées
Le script fonctionne sur :
- `http://batocera.local:1234/*`
- `http://batocera:1234/*`
- `http://*:1234/*`

## 🔧 Compatibilité

- **Batocera** : Toutes les versions récentes avec interface web
- **Navigateurs** : Chrome 80+, Firefox 75+, Edge 80+, Safari 13+
- **Responsive** : Adapté aux écrans desktop et mobiles
- **Performance** : Optimisé pour de grandes collections (1000+ jeux)

## 🐛 Dépannage

### Le script ne se charge pas
- Vérifier que l'extension userscript est activée
- Vérifier l'URL correspond aux patterns supportés
- F12 → Console pour voir les erreurs éventuelles

### Interface cassée
- Ctrl+F5 pour vider le cache
- Vérifier qu'aucune autre extension ne modifie le CSS
- Désactiver temporairement le script pour tester

### Barres de défilement visibles
- Changer le réglage "Barres" de "Auto" vers "Masquer"
- Redémarrer le navigateur si nécessaire

