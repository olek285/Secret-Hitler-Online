# Konfiguracja lokalna polskiej wersji

Ta wersja jest przeznaczona do uruchamiania serwera na własnym komputerze i gry ze znajomymi na telefonach w tej samej sieci Wi-Fi.

## Wymagania

- Java,
- Node.js i npm,
- Windows z dostępem do prywatnej sieci lokalnej.

## Uruchomienie gry w Windows

Uruchom backend w pierwszym terminalu:

```powershell
cd D:\Secret-Hitler-Online-development\backend
.\run-local.bat
```

W drugim terminalu uruchom frontend:

```powershell
cd D:\Secret-Hitler-Online-development\frontend
npm.cmd run devLocal
```

Na komputerze otwórz `http://192.168.1.17:3000`. Utwórz lobby, a następnie udostępnij znajomym link lub kod QR widoczny w lobby. Telefony muszą być podłączone do tej samej sieci Wi-Fi.

Adres `192.168.1.17` jest przykładowy. Jeśli komputer ma inny adres lokalny, zmień wartości w `frontend/.env.local`:

```text
REACT_APP_SERVER_ADDRESS=ADRES_IP_KOMPUTERA:4040
REACT_APP_SERVER_ADDRESS_HTTP=http://ADRES_IP_KOMPUTERA:4040
```

Windows może poprosić o zezwolenie na połączenia dla Javy i Node.js w sieci prywatnej.

## Praca tylko nad frontendem

Jeśli backend działa już na komputerze, uruchom frontend:

```powershell
cd D:\Secret-Hitler-Online-development\frontend
npm install
npm.cmd run devLocal
```

## Sprawdzanie zmian

Po zmianach we frontendzie:

```powershell
cd D:\Secret-Hitler-Online-development\frontend
npm.cmd run build
```

Po zmianach w backendzie:

```powershell
cd D:\Secret-Hitler-Online-development\backend
.\gradlew.bat compileJava
```

Backend należy zatrzymać i uruchomić ponownie po zmianach w kodzie Java.

## Oryginalny projekt

Ta wersja bazuje na repozytorium [ShrimpCryptid/Secret-Hitler-Online](https://github.com/ShrimpCryptid/Secret-Hitler-Online).
