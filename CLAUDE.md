# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Fan-made web adaptation of the Secret Hitler board game (CC BY-NC-SA 4.0). Two independent apps in one repo: a Java/Javalin game server in `backend/` and a Create React App client in `frontend/`. They talk over HTTP and one websocket.

**This checkout is a private fork for LAN game nights.** Phones on the host's Wi-Fi are the only screens. Compared with upstream it adds: a single permanent "house" lobby (no lobby codes, name and avatar only), a QR code to join, a phone-first layout, seat takeover on reconnect, a single-container Docker build, a Polish UI, and removal of analytics, Twitter and public-site links. Keep changes low-risk and phone-first, and make sure desktop still works.

## Commands

### Game night (production, single container)
```bash
./game-night.sh                  # detect Wi-Fi IP, build + start on :80, open QR page, caffeinate
./game-night.sh stop | logs
HOST_PORT=8080 ./game-night.sh   # if :80 is taken
```
The root `Dockerfile` builds the client (deleting `.env*` first, because CRA also loads `.env.local` for production builds) and the jar. Javalin then serves both from one origin (`STATIC_DIR`). `compose.gamenight.yml` passes `PUBLIC_URL`, the LAN address the QR code shows when the host views the page on localhost. No Postgres.

### Upstream dev stack (Docker)
```bash
docker compose up --build        # postgres :5432, backend :4040 (runLocal, debug), frontend :3000 (devLocal)
docker compose up -d db          # DB only; then run backend/frontend natively
```
The upstream compose stack runs **dev servers** (gradle `runLocal`, `react-scripts start`) in bind-mounted source dirs, not production builds.

### Backend (`cd backend`)
```bash
./gradlew runLocal               # dev server on :4040 with DEBUG forced on (entry: src/test/java/game/ApplicationTest.java)
./gradlew test                   # JUnit 4
./gradlew test --tests 'game.testCpuPlayer'                       # one class
./gradlew test --tests 'game.testCpuPlayer.testCanPlayFullGame'   # one method
./gradlew jar                    # fat jar -> build/libs/secret-hitler-online.jar (Main-Class server.SecretHitlerServer)
```
Java changes need a server restart; there is no hot reload. CI builds on Java 11, Dockerfiles run JRE 17.

### Frontend (`cd frontend`)
```bash
npm install
npm run devLocal                 # dev server on :3000 using .env.local (backend at localhost:4040)
npm run devServer                # dev server using .env.dev (remote fly.dev dev backend)
npm run build                    # production build -> build/ (also reads .env.local, which bakes in localhost:4040: build without the .env files for anything phones will use)
npm test                         # CRA/Jest watch mode
CI=true npm test -- -t "name"    # single run, filter by test name
```
Formatting: Prettier, 2-space indent (`frontend/.prettierrc`). Prettier isn't a dependency, and `npx prettier` fetches v3, while the code is in v2 style: pass `--trailing-comma es5`, and only format files you touched (upstream `.js` components aren't Prettier-formatted). ESLint is CRA's `react-app` preset, surfaced through `react-scripts`.

## Architecture

### Server (`backend/src/main/java`)
- `server/SecretHitlerServer.java` is the whole network layer. It exposes HTTP `GET /new-lobby`, `GET /check-login?lobby=&name=`, `GET /ping`, `GET /join-url` (returns env `PUBLIC_URL`, used for the QR code), and websocket `/game?lobby=&name=`. Every websocket message is a JSON object with `command`, `lobby`, `name` plus command-specific params. The server answers by pushing state to clients instead of replying per request.
- All state lives in memory: static `ConcurrentHashMap`s `codeToLobby` (4-letter code -> `Lobby`) and `userToLobby` (`WsContext` -> `Lobby`). A websocket connection *is* a user, and identity is just the `(lobby, name)` pair, with no auth.
- **House lobby:** `HOUSE_LOBBY_CODE` (env `HOUSE_LOBBY`, default `HOME`; it must match `HOUSE_LOBBY` in `frontend/src/constants`) is created on startup, recreated on demand by `getLobby()`, and skipped by `removeInactiveLobbies()`. Without that exemption, a break where every phone is locked (no pings) would destroy the running game.
- **Hide-counts setting:** `Lobby.hideCounts` is sent as `hideCounts` in every lobby and game packet. Only the host (first in `activeUsernames`) can change it, with `set-hide-counts`, and only between games; other senders are ignored. The client then hides the `Deck` numbers and the `PlayerPolicyStatus` policies-left row. The data itself is still sent.
- **Reconnect takeover:** clients send a random per-browser `client` id, stored in localStorage, on `/check-login` and `/game`. `Lobby.canReconnect(name, client)` lets the same browser reclaim its name: the server detaches and closes the stale socket, which phones often leave half-open, then calls `reconnectUser`. A different browser still gets the duplicate-name or in-game rejection. The client treats a close reason starting with "Replaced" as "opened in another tab" and does not retry. This prefix is a wire contract, so it stays English.
- `server/util/Lobby.java` owns the connected sockets, the `SecretHitlerGame`, player icons, and CPU players. It also runs timeouts: the lobby expires 10 min after its last command, and a disconnected player gets a 3 s grace period. `Lobby.updateAllUsers()` broadcasts state.
- `server/util/GameToJSONConverter.java` builds the game-state packet **per user**, hiding the identities that user must not see. Any change to what players can know goes through here.
- `game/SecretHitlerGame.java` is the rules engine and state machine. `game/GameState.java` lists its states, and `game/datastructures/board/*` holds the per-player-count boards and presidential powers. `game/CpuPlayer.java` contains the bot players.
- Postgres is **optional**. It is used only to back up and restore the whole `codeToLobby` map as Java-serialized bytes: on startup, every 60 s if something changed, and on shutdown. Without `DATABASE_URL` the server logs an error and runs purely in memory. Because the backup uses Java serialization, changing fields on `Lobby`/game classes invalidates old backups.
- Env vars:
  - `DEBUG_MODE` (any value means debug) and `DATABASE_URL`: read in `server/ApplicationConfig.java`.
  - `PORT`: defaults to 4040.
  - `STATIC_DIR`: serve the built client from this directory.
  - `PUBLIC_URL`: the address the QR code shows.
  - `HOUSE_LOBBY`: the house lobby's code.
  - `FILL_BOTS_TO`: test aid, read in `Lobby.java`.

  **CORS:** any origin is allowed when `DEBUG_MODE` or `STATIC_DIR` is set (the client then comes from this server). Otherwise only `https://secret-hitler.online` is allowed. The rule covers static files too, so browser font requests fail without it.

### Client (`frontend/src`)
- `App.tsx` (~1800 lines, a class component) is essentially the whole client. It switches between `PAGE.LOGIN` / `LOBBY` / `GAME` (`renderLoginPage`/`renderLobbyPage`/`renderGamePage`), owns the websocket, keeps a 50 s keepalive ping, and runs an animation queue that sequences alerts and prompts in reaction to state changes. Prompts are queued only when `state` changes, so re-receiving the same game state is harmless.
- Reconnect: on close it retries with backoff (0.5 s up to 8 s, `MAX_FAILED_CONNECTIONS`). It also reconnects right away on `visibilitychange` (after being hidden for more than 4 s) and on `online`. localStorage `sh-auto-rejoin` holds the player's name, so a page the phone discarded in the background rejoins on load. Leave clears it.
- `util/keepAwake.ts` wraps NoSleep.js. On plain-http LAN there is no secure context, so there is no Wake Lock API or service worker; it falls back to a looping video that has to be started by a tap.
- `custom-alert/` holds the modal prompts for each player decision (vote, legislative choices, veto, powers). `board/`, `player/`, `status-bar/`, `event-bar/` and `util/` are presentational components.
- The wire protocol is defined twice: as Java constants at the top of `SecretHitlerServer.java`, and in `frontend/src/constants/index.ts` plus `frontend/src/types/`. Keep both sides in sync when adding commands or states.
- The backend address comes from `REACT_APP_SERVER_ADDRESS`, `REACT_APP_SERVER_ADDRESS_HTTP` and `REACT_APP_WEBSOCKET_HEADER` (`.env.local`, `.env.dev`), which are baked in at build time. When they are unset, the client uses `window.location` (same origin), which is what the game-night container relies on. A value of `localhost` only works on the host machine, not on phones.
- Styling is plain CSS per component, sized mostly in `vmin`/`vh`, with colors in `variables.css`. Montserrat comes from `@fontsource`; the header font is the local `Germania PL` (see Polish UI). **`src/mobile.css` holds every phone override** (`@media (max-width: 700px)`). It is imported last in `App.tsx`, and its selectors are prefixed with `.App`/page classes (`.page-login`, `.page-lobby`, `.page-game`) so they beat the components' `#id` rules. Inline `style` props can't be overridden this way, so layout styles belong in the component's CSS file.
- **Phone screens must fit without scrolling**, down to a 360×553 visible area (iPhone SE in Safari with toolbars). Heights are budgeted against `--app-h`, which `util/viewportHeight.ts` sets from `window.innerHeight` (`100vh` on iOS includes the area under the toolbars). How each screen fits:
  - The game page is a fixed-height flex column: slim header, players, two-line status bar, a 62px strip (decks, `PlayerPolicyStatus`, END TERM), then `#board-container`, which takes the rest.
  - The boards are scaled with container query units (`container-type: size`; 2.589 is the board art's aspect ratio).
  - `PlayerDisplay` sets `--player-cols` (everyone up to 5, otherwise two balanced rows). On phones its three groups are flattened with `display: contents`, and `--tile-w` sizes the tiles per page and prompt.
  - Prompts are fixed full-width sheets with a sticky `#prompt-button`. Their internal scroll is only a safety net.
  - Desktop styles are untouched.
- The line under the fascist board comes from `getFascistPowerHint` in `utils/index.tsx`. It mirrors the backend power tables in `game/datastructures/board/*`, so keep the two in sync.
- Quick multi-phone testing: run `devLocal` plus `runLocal`, then put 360×553 iframes of `localhost:3000`, `127.0.0.1:3000` and `<LAN-IP>:3000` on one page. Each origin has its own storage, so each acts as a separate device. Bots fill any seats below 5 players. Run the backend with `FILL_BOTS_TO=10` to fill up to 10 seats instead and test the big-table layouts (off by default, never set it for game night). Check fit with `document.documentElement.scrollHeight <= innerHeight` and, for an open prompt, `#alert-box` `scrollHeight <= clientHeight`. `#alert` itself always computes `visibility: hidden`; an open prompt is `#alert-box.appear-custom-alert`. Same-origin iframes share localStorage and so the client id: give each simulated device its own origin.

  To open any prompt without playing until you're president:
  1. In the same-origin frame, find the `App` instance from the `__reactInternalInstance$…` key on `.App`.
  2. Set `app.websocket.onmessage = null`.
  3. Call `app.onGameStateChanged(fake)` plus `app.setState({gameState: fake})`, where `fake` is a copy of the real state with you as president and the target `state`. Prompts are queued only when `state` changes, so go through a different state first.

### Polish UI
The whole client is Polish; the server sends no player-visible text.
- **Text:** every UI string lives in `frontend/src/strings.ts`, the single place to change wording. Its header holds the wording rules: gender-neutral Polish (players have no gender) and the phone length budgets. Display text built from server values (`LIBERAL`, `FASCIST`, `HITLER`, deck types) goes through its helpers (`roleName`, `alt.*`); the values themselves stay English.
- **Font:** Germania One has no ą ć ę ł ń ś ź ż. `frontend/src/fonts/germania-pl.woff2` adds them, built by `python3 scripts/pl/build_font.py` (from `frontend/`, needs fontTools + brotli). It is renamed `Germania PL` because the OFL reserves the original name. Any new header or button text renders in it.
- **Art:** the English labels drawn into card, banner and pile images are repainted into `frontend/src/assets/pl/` by `python3 scripts/pl/build_art.py` (Pillow + numpy, macOS Futura). Components import the `pl/` copies. To change a label, edit `SPECS` in the script, rerun it with `--sheet <dir>` and check the before/after PNGs, rather than editing the PNGs. The small rules text on the boards stays English on purpose.

## Deployment (upstream)
GitHub Actions: pushes to `main` deploy prod and pushes to `development` deploy dev. The frontend goes to Firebase Hosting and the backend jar to Fly.io (`backend/fly.toml`; dev swaps in `config/Dockerfile.dev`, which sets `DEBUG_MODE`). `backend/Dockerfile` expects the jar pre-copied to `backend/target/secret-hitler-online.jar`. Upstream PRs target `development`.
