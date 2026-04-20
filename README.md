# Bomberman DOM

Jeu Bomberman multijoueur (2 a 4 joueurs) en JavaScript DOM + serveur WebSocket en Go.

Le projet respecte l'esprit "DOM only" (pas de Canvas/WebGL) et utilise un mini framework maison present dans `src/core`.

## Sommaire

- [Apercu](#apercu)
- [Fonctionnalites](#fonctionnalites)
- [Stack technique](#stack-technique)
- [Prerequis](#prerequis)
- [Installation](#installation)
- [Lancement en local](#lancement-en-local)
- [Utilisation](#utilisation)
- [Structure du projet](#structure-du-projet)
- [Depannage](#depannage)
- [Roadmap](#roadmap)

## Apercu

Chaque joueur choisit un pseudo, rejoint une salle d'attente, puis la partie demarre quand:

- 4 joueurs sont connectes, ou
- au moins 2 joueurs sont connectes apres le timer d'attente.

Le but est d'etre le dernier joueur en vie.

## Fonctionnalites

- Lobby avec compteur de joueurs
- Chat temps reel via WebSocket
- Partie multijoueur synchronisee en temps reel
- Carte type Bomberman (murs fixes, blocs destructibles)
- Gestion des vies (3 vies par joueur)
- Power-ups (bomb, speed, flame)
- Ecran de fin de partie

## Stack technique

- Frontend: JavaScript ES Modules, DOM, CSS
- Mini framework local: `src/core` (`dom.mjs`, `events.js`, `state.js`, `router.js`)
- Backend: Go + `github.com/gorilla/websocket`

## Prerequis

- Go `>= 1.21`
- Python 3 (pour servir le frontend statique)  
  Alternative possible: un autre serveur statique (ex: `npx serve`)
- Navigateur moderne (Chrome/Firefox)

## Installation

```bash
git clone <url-du-repo>
cd bomberman-dom
```

> Note: aucun build front n'est necessaire dans la version actuelle.

## Lancement en local

Le projet se lance en 2 processus: serveur WebSocket + serveur statique frontend.

1. Terminal 1: lancer le serveur Go

```bash
cd src/Bomber
go run .
```

Serveur WebSocket attendu sur `ws://localhost:8080`.

2. Terminal 2: servir les fichiers frontend

```bash
cd src/Bomber
python3 -m http.server 5500
```

3. Ouvrir dans le navigateur:

`http://localhost:5500/public/index.html`

## Utilisation

### Rejoindre une partie

- Entrer un pseudo (max 6 caracteres)
- Appuyer sur `Enter`
- Ouvrir 2 a 4 onglets/fenetres pour tester le multijoueur en local

### Controles

- `ArrowUp`: monter
- `ArrowDown`: descendre
- `ArrowLeft`: gauche
- `ArrowRight`: droite
- `Space`: poser une bombe

### Chat

- Saisir le message dans le champ de chat
- Envoyer via le bouton

## Structure du projet

```text
bomberman-dom/
├── doc/
├── src/
│   ├── core/                # Mini framework DOM
│   └── Bomber/
│       ├── server/          # WebSocket + logique serveur Go
│       ├── components/      # Composants UI et logique front
│       ├── public/          # index.html + styles.css
│       ├── assets/          # SVG/PNG
│       ├── app.js           # Entree frontend
│       └── main.go          # Entree serveur Go
├── task.todo
└── README.md
```

## Depannage

- Erreur WebSocket:
  - verifier que `go run .` tourne bien sur le port `8080`
  - verifier `src/Bomber/globals.js` (URL WebSocket)
- Ecran vide dans le navigateur:
  - verifier que vous ouvrez bien `.../public/index.html`
  - verifier que le serveur statique est lance depuis `src/Bomber`
- Partie ne demarre pas:
  - il faut au moins 2 joueurs connectes

