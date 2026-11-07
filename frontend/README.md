# Frontend — polska wersja lokalna

Projekt został utworzony za pomocą [Create React App](https://github.com/facebook/create-react-app).

Frontend jest przeznaczony do lokalnej gry ze znajomymi. Po uruchomieniu backendu komputery i telefony muszą być w tej samej sieci Wi-Fi.

## Instalacja

W katalogu `frontend` zainstaluj zależności:

```powershell
npm install
Copy-Item .env.example .env.local
```

Plik `.env.local` jest lokalny i nie powinien być publikowany. Ustaw w nim adres IP komputera, na którym działa backend.

## Uruchomienie dla gry lokalnej

W PowerShell:

```powershell
cd frontend
npm.cmd run devLocal
```

Otwórz frontend na komputerze pod adresem `http://localhost:3000`. W lobby pojawi się link i kod QR, które można przekazać graczom korzystającym z telefonów. Jeśli adres IP komputera jest inny, zaktualizuj `frontend/.env.local`.

## Dostępne skrypty

W katalogu projektu możesz uruchomić:

### `npm start`

Uruchamia aplikację w trybie deweloperskim. Otwórz [http://localhost:3000](http://localhost:3000), aby ją zobaczyć. Strona odświeża się po zmianie plików, a błędy lintowania są widoczne w konsoli.

### `npm test`

Uruchamia testy w interaktywnym trybie obserwowania. Więcej informacji znajduje się w [dokumentacji testów](https://facebook.github.io/create-react-app/docs/running-tests).

### `npm run build`

Tworzy produkcyjną wersję aplikacji w katalogu `build`. Pliki są zminimalizowane i otrzymują haszowane nazwy.

### `npm run eject`

**To operacja jednokierunkowa. Po jej wykonaniu nie można wrócić do poprzedniej konfiguracji.**

Polecenie kopiuje konfigurację oraz zależności przechodnie (Webpack, Babel, ESLint itd.) do projektu, zapewniając pełną kontrolę nad narzędziami.

## Więcej informacji

Przeczytaj [dokumentację Create React App](https://facebook.github.io/create-react-app/docs/getting-started) oraz [dokumentację React](https://reactjs.org/).

Pozostałe sekcje dokumentacji Create React App:

- [Dzielenie kodu](https://facebook.github.io/create-react-app/docs/code-splitting)
- [Analiza rozmiaru paczki](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)
- [Własna konfiguracja](https://facebook.github.io/create-react-app/docs/advanced-configuration)
- [Wdrażanie](https://facebook.github.io/create-react-app/docs/deployment)
- [Problemy z minifikacją](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
