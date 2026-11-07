# Game night: hosting for phones on your Wi-Fi

## Before friends arrive
1. Start **Docker Desktop**. Wait until the whale icon in the menu bar settles.
2. In this folder, run:
   ```bash
   ./game-night.sh
   ```
   The first run builds everything (a few minutes). Then a page with a **QR code** opens on your Mac.
3. Plug the Mac in and keep it on the same Wi-Fi. The script keeps it awake until you press Ctrl+C. The game keeps running after that, but the Mac may then sleep.

## Joining
- Friends scan the QR code (or type the address printed under it, e.g. `192.168.0.143`) → type a name → pick a look → done.
- Whoever joins **first** is the host and gets the **ZACZYNAMY** (start game) button. Fewer than 5 players? Bots fill the empty seats.
- The host can tick **Ukryj liczbę kart** in the lobby to hide the pile counts and the policies-left row for everyone. It can only be changed between games, and it stays set for the next game.
- More people can scan the QR code on any lobby screen. Tap it to show it full screen, and tap again to close.
- Optional: in Safari, Share → **Add to Home Screen** opens the game fullscreen like an app.

## If something goes wrong
- **A phone locked or dropped out:** unlock it and the game reconnects by itself. If it lands on the name screen, type the **same name** and tap DOŁĄCZ (join) to get your seat back.
- **The screen keeps dimming:** tap the game once (keep-awake starts on a tap). If it still dims, set Settings → Display → Auto-Lock to a few minutes for the evening.
- **Nobody can connect:** check everyone is on the same Wi-Fi network, not a guest network (guest networks often isolate devices). Also check the macOS firewall isn't blocking Docker: System Settings → Network → Firewall.
- **Typing the address doesn't work, but scanning does:** type it with `http://` and any port, exactly as printed (e.g. `http://192.168.0.143`). Without that, phone browsers may try `https://` or run a search. The QR code avoids this.
- **Port 80 is busy:** run `HOST_PORT=8080 ./game-night.sh` instead.
- **The Wi-Fi address changed:** just rerun `./game-night.sh`. The QR code always shows the current address.

## Afterwards
```bash
./game-night.sh stop
```
