# Secret Hitler — polska wersja lokalna
![](https://i.postimg.cc/zvnLRbqq/place-policy.gif)

Polska, lokalna wersja fanowskiej adaptacji gry [Secret Hitler](https://secrethitler.com) — gry dedukcji społecznej dla maksymalnie 10 osób autorstwa Goat, Wolf & Cabbage. Ta wersja jest przeznaczona do uruchomienia serwera na własnym komputerze i grania ze znajomymi na telefonach w tej samej sieci Wi-Fi.

Projekt bazuje na oryginalnym repozytorium [ShrimpCryptid/Secret-Hitler-Online](https://github.com/ShrimpCryptid/Secret-Hitler-Online).

### Gra
Gracze dzielą się na Liberałów, Faszystów i jednego ukrytego Hitlera. Liberałowie muszą współpracować (albo nie), aby odkryć ukrywającego się wśród nich Hitlera, podczas gdy Faszyści próbują wynieść go do władzy. Uchwalajcie ustawy, aby osiągnąć zwycięstwo, i odblokowujcie uprawnienia prezydenta, by badać swoich znajomych.

Czy uda ci się znaleźć i powstrzymać Sekretnego Hitlera?

## Uruchomienie lokalne

Wymagane: Java 17+, Node.js 18+ i npm.

Zainstaluj zależności frontendu:

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
```

Jeśli grasz z innymi osobami przez Wi-Fi, ustaw w `frontend/.env.local` adres IP komputera zamiast `localhost`.

Uruchom backend i frontend w dwóch terminalach:

Terminal 1:

```powershell
cd backend
.\run-local.bat
```

Terminal 2:

```powershell
cd frontend
npm.cmd run devLocal
```

Gra działa pod adresem `http://localhost:3000`. Backend używa portu `4040`.

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
