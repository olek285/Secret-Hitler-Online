# Secret Hitler — polska wersja lokalna
![](https://i.postimg.cc/zvnLRbqq/place-policy.gif)

Polska, lokalna wersja fanowskiej adaptacji gry [Secret Hitler](https://secrethitler.com) — gry dedukcji społecznej dla maksymalnie 10 osób autorstwa Goat, Wolf & Cabbage. Ta wersja jest przeznaczona do uruchomienia serwera na własnym komputerze i grania ze znajomymi na telefonach w tej samej sieci Wi-Fi.

Projekt bazuje na oryginalnym repozytorium [ShrimpCryptid/Secret-Hitler-Online](https://github.com/ShrimpCryptid/Secret-Hitler-Online).

### Gra
Gracze dzielą się na Liberałów, Faszystów i jednego ukrytego Hitlera. Liberałowie muszą współpracować (albo nie), aby odkryć ukrywającego się wśród nich Hitlera, podczas gdy Faszyści próbują wynieść go do władzy. Uchwalajcie ustawy, aby osiągnąć zwycięstwo, i odblokowujcie uprawnienia prezydenta, by badać swoich znajomych.

Czy uda ci się znaleźć i powstrzymać Sekretnego Hitlera?

### Jak grać lokalnie
1. Uruchom backend na komputerze:

   ```powershell
   cd C:\Secret-Hitler-Online-development\backend
   .\run-local.bat
   ```

2. W drugim terminalu uruchom frontend:

   ```powershell
   cd C:\Secret-Hitler-Online-development\frontend
   npm.cmd run devLocal
   ```

3. Otwórz grę na komputerze pod adresem `http://192.168.1.1:3000`.
4. Utwórz poczekalnię i pokaż znajomym kod QR albo skopiuj link z lobby.
5. Znajomi otwierają link na telefonach podłączonych do tej samej sieci Wi-Fi.

Adres `192.168.1.1` jest przykładowym adresem komputera. Jeśli komputer ma inny adres w sieci lokalnej, zmień go w `frontend/.env.local`. Windows może poprosić o zezwolenie na połączenia dla Javy i Node.js w sieci prywatnej.

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
