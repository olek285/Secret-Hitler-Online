# Secret Hitler — polska wersja lokalna
![](https://i.postimg.cc/zvnLRbqq/place-policy.gif)

Polska, lokalna wersja fanowskiej adaptacji gry [Secret Hitler](https://secrethitler.com) — gry dedukcji społecznej dla maksymalnie 10 osób autorstwa Goat, Wolf & Cabbage. Ta wersja jest przeznaczona do uruchomienia serwera na własnym komputerze i grania ze znajomymi na telefonach w tej samej sieci Wi-Fi.

Projekt bazuje na oryginalnym repozytorium [ShrimpCryptid/Secret-Hitler-Online](https://github.com/ShrimpCryptid/Secret-Hitler-Online).

### Gra
Gracze dzielą się na Liberałów, Faszystów i jednego ukrytego Hitlera. Liberałowie muszą współpracować (albo nie), aby odkryć ukrywającego się wśród nich Hitlera, podczas gdy Faszyści próbują wynieść go do władzy. Uchwalajcie ustawy, aby osiągnąć zwycięstwo, i odblokowujcie uprawnienia prezydenta, by badać swoich znajomych.

Czy uda ci się znaleźć i powstrzymać Sekretnego Hitlera?

## Wymagania

- Windows 10/11, macOS albo Linux
- Java 17 lub nowsza
- Node.js 18 lub nowszy oraz npm
- Opcjonalnie Docker Desktop, jeśli chcesz uruchomić cały projekt jednym poleceniem

## Instalacja

Sklonuj repozytorium i zainstaluj zależności frontendu:

```powershell
git clone https://github.com/olek285/Secret-Hitler-Online.git
cd Secret-Hitler-Online
cd frontend
npm install
cd ..
```

Nie dodawaj do repozytorium pliku `frontend/.env.local`. Zawiera on konfigurację konkretnej sieci. Utwórz go lokalnie na podstawie szablonu:

```powershell
Copy-Item .env.example .env.local
```

Następnie otwórz `frontend/.env.local` i ustaw adres IP komputera w sieci Wi-Fi:

```dotenv
HOST=0.0.0.0
REACT_APP_DEBUG=DEBUG
REACT_APP_SERVER_ADDRESS=192.168.1.17:4040
REACT_APP_SERVER_ADDRESS_HTTP=http://192.168.1.17:4040
REACT_APP_WEBSOCKET_HEADER=ws://
```

Zastąp `192.168.1.17` adresem IP swojego komputera. Możesz go sprawdzić poleceniem `ipconfig`.

### Jak grać lokalnie

Otwórz dwa terminale w katalogu głównym projektu.

1. W pierwszym terminalu uruchom backend:

   ```powershell
   cd backend
   .\run-local.bat
   ```

2. W drugim terminalu uruchom frontend:

   ```powershell
   cd frontend
   npm.cmd run devLocal
   ```

3. Otwórz grę na komputerze pod adresem `http://localhost:3000`.
4. Utwórz poczekalnię i pokaż znajomym kod QR albo skopiuj link z lobby.
5. Znajomi otwierają link na telefonach podłączonych do tej samej sieci Wi-Fi.

Windows może poprosić o zezwolenie na połączenia dla Javy i Node.js w sieci prywatnej. Backend działa domyślnie na porcie `4040`, a frontend na porcie `3000`.

### Uruchomienie przez Docker

Jeśli masz Docker Desktop, możesz uruchomić backend, frontend i PostgreSQL razem:

```powershell
docker compose up --build
```

Frontend będzie dostępny pod adresem `http://localhost:3000`. Zatrzymanie usług:

```powershell
docker compose down
```

### Najczęstsze problemy

- `npm` nie jest rozpoznawany — zainstaluj Node.js i uruchom ponownie terminal.
- Gradle nie startuje — sprawdź, czy `java -version` pokazuje Java 17 lub nowszą.
- Telefony nie mogą wejść do gry — sprawdź, czy są w tej samej sieci Wi-Fi, używasz właściwego adresu IPv4 oraz zezwoliłeś Javie i Node.js na połączenia w sieci prywatnej.
- Port `3000` albo `4040` jest zajęty — zamknij proces, który go używa, albo zmień porty w konfiguracji.

### Dodanie projektu do GitHub

Po sklonowaniu lub przygotowaniu projektu sprawdź, czy pliki lokalne nie są śledzone:

```powershell
git status
git check-ignore frontend/.env.local
```

`frontend/.env.local` oraz `node_modules` są wykluczone przez `.gitignore`. Do repozytorium dodawaj tylko `frontend/.env.example`, który pokazuje wymaganą konfigurację bez lokalnych adresów i sekretów.

Jeśli GitHub poprosi o logowanie, wykonaj:

```powershell
gh auth login
git add .
git commit -m "Update project documentation"
git push origin development
```

Do logowania można też użyć tokena GitHub zamiast hasła. Token wkleja się w terminalu jako hasło i nie zapisuje się go w żadnym pliku projektu.

Jednocześnie może grać do 10 osób. W lobby można również ustawić własne zdjęcie avatara — jest ono automatycznie przycinane i kompresowane.

Na stronie znajdują się instrukcje gry i pomocne wskazówki dla nowych graczy. Gra pilnuje zasad, więc można szybko rozpocząć zabawę.

Więcej informacji znajdziesz w [oficjalnej instrukcji](https://www.secrethitler.com/assets/Secret_Hitler_Rules.pdf).

## O projekcie i autorach
### Szczegóły techniczne
Serwer Java jest podzielony na [symulację gry](backend/src/main/java/game) i [REST API](backend/src/main/java/server). Komunikacja między serwerem i klientem odbywa się przez WebSocket oraz żądania HTTP z użyciem biblioteki [Javalin](https://javalin.io/).

Frontend jest napisany w [React](https://reactjs.org/) i wykorzystuje animacje CSS. Grafiki zaadaptowano z oryginalnej gry planszowej lub utworzono w [Inkscape](https://inkscape.org/).

### Licencja Creative Commons i autorzy
Secret Hitler Online jest udostępniany na licencji [Creative Commons BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) i stanowi adaptację oryginalnej gry planszowej wydanej przez Goat, Wolf & Cabbage (© 2016–2020).

*(Projekt nie jest powiązany z Goat, Wolf & Cabbage ani przez nich zatwierdzony.)*

#### Co zmieniono względem oryginału?
![](https://i.postimg.cc/cCNCZxw2/show-votes.gif)
- Grafiki plansz, talii ustaw, kart tożsamości i partii oraz ikon Liberałów i Faszystów zaadaptowano na potrzeby strony, wprowadzając drobne zmiany (zaokrąglone rogi, głębię i cienie).
- Dodano własne grafiki utworzone w Inkscape, utrzymane w stylu oryginału — przede wszystkim licznik wyborów, okna ujawniania ustaw oraz ikony i kafelki graczy.
- Interfejs został przetłumaczony na język polski i dopasowany do ekranów telefonów.
- Dodano lokalne lobby, link oraz kod QR do dołączania przez telefony w sieci Wi-Fi.
- Dodano własne avatary graczy z automatycznym przycięciem i kompresją zdjęć.
- Interfejs, animacje i serwer są nowymi elementami, które wykorzystują te same zasady co oryginalna gra.
