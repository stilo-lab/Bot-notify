# Stilo Discord-Anfragebot

Der Bot meldet neue Anfragen von [Stilo Bot Studio](https://stilo-bot-studio.aliveopal5.chatgpt.site/) in einem Discord-Textkanal. Jede Meldung zeigt den eingegebenen Anzeigenamen als **Username**, die Anfragenummer und den Link zum geschützten Posteingang. Im Posteingang siehst du das gewünschte Bot-Profil, den geplanten Einsatz und bei Server-Anfragen die gewählte Mitgliederzahl. Alle 20 Sekunden prüft der Bot, ob etwas Neues eingegangen ist.

## 1. Discord-Bot erstellen und einladen

1. Öffne das [Discord Developer Portal](https://discord.com/developers/applications). Wähle **New Application** und gib den Namen **Stilo Anfragebot** ein.
2. Unter **Bot** findest du den Bot-Token. Mit **Reset Token** kannst du bei einem neuen Bot einen Token erzeugen. Kopiere ihn direkt in die Railway-Variable `DISCORD_BOT_TOKEN`, sobald dein Railway-Dienst angelegt ist.
3. Öffne **Installation**. Aktiviere **Guild Install** und wähle als **Install Link** den **Discord Provided Link**. Füge in den Einstellungen für Guild Install den Scope **bot** sowie **View Channels** und **Send Messages** hinzu. Öffne den Installationslink und wähle deinen Server.
4. Gib dem Bot im privaten Textkanal **Kanal ansehen** und **Nachrichten senden**. Aktiviere in Discord unter **Einstellungen → Erweitert** den **Entwicklermodus**. Klicke mit der rechten Maustaste auf deinen Kanal und wähle **Kanal-ID kopieren**.

[Offizielle Discord-Anleitung](https://docs.discord.com/developers/quick-start/getting-started)

## 2. Dateien zu GitHub hochladen

1. Entpacke die ZIP-Datei auf deinem PC.
2. Erstelle auf [GitHub](https://github.com/new) ein Repository namens `stilo-discord-anfragebot`.
3. Lade über **Add file → Upload files** die entpackten Dateien und den Ordner `src` hoch. `package.json` gehört direkt auf die oberste Ebene des Repositories.
4. Speichere den Upload mit **Commit changes**.

[Offizielle GitHub-Anleitung](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)

## 3. Auf Railway starten

1. Öffne [Railway](https://railway.com/new). Wähle **Deploy from GitHub repo** und dein Repository.
2. Öffne den neuen Dienst und dann **Variables**. Lege dort diese drei Variablen an.

| Variable | Wert |
| --- | --- |
| `DISCORD_BOT_TOKEN` | Token des Bots aus dem Developer Portal |
| `DISCORD_CHANNEL_ID` | ID des privaten Discord-Textkanals |
| `STILO_ALERT_TOKEN` | Schlüssel aus dem [Stilo-Posteingang](https://stilo-bot-studio.aliveopal5.chatgpt.site/anfragen) unter **Discord-Benachrichtigungen → Railway-Schlüssel anzeigen** |

3. Übernimm die Änderungen mit **Deploy**. Der Startbefehl ist `npm start`. In den Railway-Logs steht beim Start **Stilo-Anfragebot gestartet**.
4. Schicke über Stilo Bot Studio eine Testanfrage ab. Nach ungefähr 20 Sekunden sollte die Meldung im privaten Kanal erscheinen.

Trage die beiden Schlüssel nur unter **Variables** in Railway ein. Für eine Push-Mitteilung am Handy kannst du für den privaten Kanal in Discord **Alle Nachrichten** als Benachrichtigungseinstellung wählen. Der Bot sendet per Discord-API. Seine Aktivität siehst du in den Railway-Logs, auch wenn Discord ihn als offline anzeigt.

[Offizielle Railway-Anleitung](https://docs.railway.com/quick-start) · [Railway-Variablen](https://docs.railway.com/variables)

## Meldungen auch auf Sauerland empfangen

Lade dieselbe Discord-App über ihren Installationslink auf **Sauerland** ein. Erlaube dem Bot im dortigen privaten Textkanal, den Kanal anzusehen und Nachrichten zu senden.

- Für Meldungen nur auf Sauerland trägst du die Kanal-ID von Sauerland in `DISCORD_CHANNEL_ID` ein.
- Für Meldungen in beiden Servern legst du in Railway `DISCORD_CHANNEL_IDS` an und setzt den bisherigen Kanal und den Kanal auf Sauerland als durch Komma getrennte Liste ein. Beispiel `111111111111111111,222222222222222222`. Sobald diese Variable gesetzt ist, nutzt der Bot ihre Liste.

Wenn du den Bot schon auf Railway betreibst, lade die neuen Dateien in dasselbe GitHub-Repository und deploye die aktualisierte Version. Dein Discord-Bot-Token und der Schlüssel aus dem Stilo-Posteingang passen auch für diese Version.

## Falls keine Meldung ankommt

- **Discord HTTP 401** bedeutet, dass der Bot-Token geprüft werden sollte.
- **Discord HTTP 403** bedeutet, dass der Bot Zugriff auf den Kanal und die Berechtigung zum Senden braucht.
- **Discord HTTP 404** spricht für eine falsche Kanal-ID. Prüfe, dass du einen Textkanal ausgewählt hast.
- **Stilo Bot Studio HTTP 401** bedeutet, dass du den Railway-Schlüssel erneut aus dem Posteingang kopieren solltest.
- Nach einer Änderung in **Variables** kannst du die Änderungen erneut deployen. Der Bot versucht fehlgeschlagene Zustellungen automatisch erneut.

## Lokal starten

Mit Node.js 22 kannst du `.env.example` als `.env` kopieren, deine Werte einsetzen und `npm start` ausführen. Für den Dauerbetrieb reicht eine Instanz auf Railway. Nach erfolgreicher Zustellung speichert Stilo Bot Studio den Zustellstatus.
