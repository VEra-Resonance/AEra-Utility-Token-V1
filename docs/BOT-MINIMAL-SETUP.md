# AEra Token Bot - Setup Instructions

## Zwei Bot-Versionen

Das Projekt läuft jetzt mit **zwei separaten Telegram-Bots**:

### 1️⃣ **Hauptbot** (Vollversion)
- **Bot-Name:** @AEra_Official_Bot
- **Datei:** `telegram-marketing/marketing-bot.js`
- **Service:** `aera-bot`
- **Befehle:** 20+ (vollständige Feature-Set)
- **Status:** ✅ Läuft

### 2️⃣ **Minimaler Bot** (White Paper Conform)
- **Bot-Name:** (NOCH ZU ERSTELLEN!)
- **Datei:** `telegram-marketing/marketing-bot-minimal.js`
- **Service:** `aera-bot-minimal`
- **Befehle:** 13 (essenzielle Befehle nur)
- **Status:** ⏸️ Wartet auf Token

---

## Minimalen Bot Aktivieren (WICHTIG!)

### Schritt 1: Neuen Telegram Bot erstellen

1. Öffne Telegram und schreibe: `@BotFather`
2. Schreib: `/newbot`
3. Gib einen Namen ein (z.B. "AEra Info Bot" oder "AEra Minimal")
4. Gib einen Username ein (z.B. "@AEra_Info_Bot") 
   - **Muss mit `_bot` enden und eindeutig sein**
5. @BotFather gibt dir einen Token, z.B.:
   ```
   8409771440:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Schritt 2: Token in .env.minimal eintragen

Bearbeite: `/home/karlheinz/krypto/aera-token/telegram-marketing/.env.minimal`

Ersetze:
```ini
TELEGRAM_BOT_TOKEN=YOUR_SECOND_BOT_TOKEN_HERE
```

Mit deinem neuen Token:
```ini
TELEGRAM_BOT_TOKEN=8409771440:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Schritt 3: Service starten

```bash
sudo systemctl start aera-bot-minimal
sudo systemctl status aera-bot-minimal
```

### Schritt 4: Logs überprüfen

```bash
tail -50 /var/log/aera-bot-minimal.log
```

---

## Bot-Befehle (Minimal Version)

Die minimale Version enthält diese 13 Befehle:

✅ `/start` - Willkommensnachricht  
✅ `/status` - Systemstatus  
✅ `/info` - Technische Details  
✅ `/supply` - Token-Supply  
✅ `/contract` - Contract-Link  
✅ `/verification` - Verifizierungsstatus  
✅ `/roadmap` - Entwicklungs-Roadmap  
✅ `/community` - Community-Links  
✅ `/marketing` - Projekt-Positionierung  
✅ `/disclaimer` - Rechtlicher Hinweis  
✅ `/consent` - Zustimmung mit Buttons  
✅ `/whitepaper` - Vollständiges White Paper  
✅ `/help` - Alle Befehle auflisten  

---

## Architektur

```
telegram-marketing/
├── marketing-bot.js               ← Hauptbot (20+ Befehle)
├── marketing-bot-minimal.js       ← Minimal Bot (13 Befehle)
├── .env                           ← Hauptbot Config
├── .env.minimal                   ← Minimal Bot Config
└── node_modules/

/etc/systemd/system/
├── aera-bot.service              ← Hauptbot Service
└── aera-bot-minimal.service      ← Minimal Bot Service

/var/log/
├── aera-bot.log                  ← Hauptbot Logs
└── aera-bot-minimal.log          ← Minimal Bot Logs
```

---

## Befehle zum Verwalten

### Hauptbot
```bash
sudo systemctl start aera-bot
sudo systemctl stop aera-bot
sudo systemctl restart aera-bot
sudo systemctl status aera-bot
tail -50 /var/log/aera-bot.log
```

### Minimaler Bot
```bash
sudo systemctl start aera-bot-minimal
sudo systemctl stop aera-bot-minimal
sudo systemctl restart aera-bot-minimal
sudo systemctl status aera-bot-minimal
tail -50 /var/log/aera-bot-minimal.log
```

---

## White Paper Konformität

Der minimale Bot folgt vollständig dem **WHITEPAPER.md**:

✅ Alle Beschreibungen basieren auf White Paper  
✅ Legal-Notices sind korrekt und ausführlich  
✅ Technische Specs sind aktuell  
✅ Governance-Modell ist korrekt dargestellt  
✅ Airdrop-Policy ist konsistent  
✅ Roadmap ist aktuell (Phase 0 ✅, Phase 1-4 geplant)  

---

## Nächste Schritte

1. ✅ **Minimalen Bot-Code erstellt**
2. ⏳ **Neuen Bot-Token von @BotFather holen** ← DU BIST HIER
3. ⏳ **Token in `.env.minimal` eintragen**
4. ⏳ **Service starten**
5. ⏳ **Zu GitHub committen**

---

## Troubleshooting

### Fehler: "terminated by other getUpdates request"
→ Zwei Bot-Instanzen laufen mit gleichem Token  
→ **Lösung:** Verwende unterschiedliche Tokens für beide Bots

### Fehler: "Bot Token missing"
→ Token in `.env.minimal` nicht gesetzt  
→ **Lösung:** Token eintragen (siehe oben)

### Bot funktioniert nicht
```bash
# Überprüfe Service Status
sudo systemctl status aera-bot-minimal

# Überprüfe Logs
tail -100 /var/log/aera-bot-minimal.log | grep -i error

# Starte neu
sudo systemctl restart aera-bot-minimal
```

---

## Support

Alle Befehle sind White-Paper-conform. Bei Fragen:
- Check: `/whitepaper` Command im Bot
- Lese: `WHITEPAPER.md` im GitHub
- Überprüfe: Logs in `/var/log/aera-bot-minimal.log`
