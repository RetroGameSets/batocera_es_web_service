Batocera ES Web Service – Interface Web améliorée
=================================================

Interface Web améliorée prête à l’emploi pour l’interface « Web API » d’EmulationStation (Batocera). Elle conserve les endpoints d’origine et ajoute une interface moderne et responsive : dock des systèmes, recherche/filtres/tri, vues grille/liste, pagination, fiche du jeu en cours avec Kill/Play, etc.

Fonctionnalités
---------------
- Dock des systèmes en bas (ordre d’origine conservé)
	- Champ de filtre, zoom ±, sélecteur rapide en modale (plein écran sur mobile)
- Barre d’outils des jeux (affichable depuis la barre du haut)
	- Recherche par nom/genre, options de tri (nom/année/sessions/favoris), filtres (Favoris, Jamais joués, RetroAchievements)
	- Bascule Grille/Liste avec lignes compactes (troncature + métadonnées)
	- Export de la liste courante en JSON
- Pagination au‑dessus du dock avec sélection du nombre d’éléments par page (10 → Tous)
- Section « Jeu en cours » (cliquable)
	- Ouvre une modale d’infos détaillée : Année, Genre, Succès (RA), Chemin, Sessions, Dernière session, Joueurs, Développeur, Éditeur, Favori, Note
	- Boutons : Play (si chemin dispo) et Kill (si jeu en cours)
- Actions dans la barre du haut : Systems (affiche/masque le dock), Current, Random (jeu aléatoire filtré), Reload (reloadgamelists), Kill
- Le titre de la barre affiche « Système – N jeux »
- Persistance de l’état (recherche, tri, filtres, page, vue)
- Thème sombre et mise en page mobile‑first


Installation / Test rapide avec Winscp connecté en SSH a batocera
--------------------------
1) Sauvegardez les fichiers d’origine sur Batocera (recommandé):
	 - /usr/share/emulationstation/resources/services/index.html
	 - /usr/share/emulationstation/resources/services/style.css

2) Copiez les fichiers de ce repo sur Batocera (remplacement):
	 - index.html → /usr/share/emulationstation/resources/services/index.html
	 - style.css  → /usr/share/emulationstation/resources/services/style.css

3) Ouvrez l’interface Web dans votre navigateur:
	 - http://batocera:1234 ou http://<IP-de-votre-batocera>:1234

Utilisation
-----------
- Bouton Systems (barre du haut): affiche/masque le dock des systèmes
- Icône “liste” à droite du filtre systèmes (dans le dock): ouvre le sélecteur de systèmes (avec logos et compte de jeux)
- Icône loupe/filtre (barre du haut): affiche/masque la barre d’outils de recherche/tri
- Vue Grid/List: bouton dans la barre d’outils
- Pagination et taille de page: barre au‑dessus du dock
- Modale “Infos”: via le bouton Infos d’un jeu (ou en cliquant la section Current)
	- Play: lance le jeu
	- Kill: tue l’émulateur/jeu en cours

Raccourcis clavier
------------------
- / : focus sur la recherche
- Flèche gauche/droite : page précédente/suivante
- r : Reload gamelists

Mise à jour
-----------
Remplacez simplement à nouveau `index.html` et `style.css` par les versions plus récentes. Un rafraîchissement du navigateur suffit en général; sinon redémarrez EmulationStation.

Retour arrière (rollback)
-------------------------
Remettez vos fichiers d’origine sauvegardés dans `/usr/share/emulationstation/resources/services/` et rechargez la page. 

Dépannage
---------
- Page vide / pas de systèmes ou jeux
	- Vérifiez que “Web API interface” est activé (Settings → Developer)
	- Essayez de redémarrer
- Styles/JS ne chargent pas
	- Videz le cache du navigateur (Ctrl+F5)

Notes
-----
- L’ordre des systèmes est celui d’origine (pas de tri forcé)
- Les préférences (filtres, recherche, page, vue…) sont conservées dans localStorage du navigateur
