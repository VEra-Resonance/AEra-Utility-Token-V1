# 🔑 API Keys Rotation Checklist - Security Incident Response

**Date:** November 5, 2025  
**Priority:** HIGH - Alle alten Keys sind potenziell kompromittiert  
**Status:** PENDING

---

## 📋 Zu rotierende API-Keys

Der alte `.env` enthielt diese Werte:

```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/[REDACTED-API-KEY]
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/[REDACTED-API-KEY]
ETHERSCAN_API_KEY=K5SUWMCY8GVHXHIUK8K1WZVBVXB2N6K45Y
```

Alle drei müssen rotiert werden!

---

## ✅ SCHRITT 1: Alchemy API Keys neu generieren

### 1.1 Sepolia RPC Key

**Gehe zu:** https://dashboard.alchemy.com/apps

**Aktion:**
1. Suche die alte App: `AERA Token - Sepolia`
2. Gehe zu **Settings** → **API Keys**
3. Klicke **Regenerate Key** oder erstelle neue App
4. Kopiere den neuen Key:

```
Neuer Sepolia Key: https://eth-sepolia.g.alchemy.com/v2/[NEW_KEY]
```

### 1.2 Mainnet RPC Key

**Auf gleicher Seite:**
1. Suche die alte App: `AERA Token - Mainnet`
2. Gehe zu **Settings** → **API Keys**
3. Klicke **Regenerate Key**
4. Kopiere den neuen Key:

```
Neuer Mainnet Key: https://eth-mainnet.g.alchemy.com/v2/[NEW_KEY]
```

---

## ✅ SCHRITT 2: Etherscan API Key neu generieren

**Gehe zu:** https://etherscan.io/apis

**Aktion:**
1. Login mit deinem Etherscan Account
2. Gehe zu **My API Keys** Sektion
3. Suche den alten Key: `K5SUWMCY8GVHXHIUK8K1WZVBVXB2N6K45Y`
4. Klicke **Delete** (um ihn zu deaktivieren)
5. Erstelle neuen Key:
   - Klicke **+ Add** neuer API Key
   - Name: `AERA Token - Mainnet + Sepolia`
   - Kopiere den neu generierten Key:

```
Neuer Etherscan Key: [NEW_API_KEY]
```

---

## ✅ SCHRITT 3: Telegram Bot Tokens (Falls relevant)

Falls der Telegram Bot `.env` gelesen hat, solltest du auch:

**Telegram Bot Tokens:**
```
.env enthielt:
TELEGRAM_BOT_TOKEN=8427599853:AAF4dZnp-uzRR3rI6rQqnB_wid3weWv6LT4
```

**Aktion:**
1. Gehe zu [@BotFather](https://t.me/BotFather) auf Telegram
2. Suche deine Bots: `/mybots`
3. Wähle den AERA Bot
4. Klicke `/revoke` für API Token
5. Generiere neuen Token:
   - Klicke `/newapi`
   - Kopiere neuen Token

```
Neuer Bot Token: [NEW_BOT_TOKEN]
```

---

## ✅ SCHRITT 4: Neue .env.local aktualisieren

Nachdem du alle Keys neu generiert hast, updatet die `.env.local`:

**Datei:** `/home/karlheinz/krypto/aera-token/.env.local`

```bash
# === RPC URLS (PUBLIC - sicher) ===
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/[NEW_SEPOLIA_KEY]
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/[NEW_MAINNET_KEY]

# === ETHERSCAN API KEY (PUBLIC - sicher) ===
ETHERSCAN_API_KEY=[NEW_ETHERSCAN_KEY]

# === CONTRACT ===
AERA_TOKEN_ADDRESS=0x5032206396A6001eEaD2e0178C763350C794F69e

# === MULTI-SIG SAFE ===
AERA_SAFE_ADDRESS=0xC8B1bEb43361bb78400071129139A37Eb5c5Dd93

# === LEDGER (für zukünftige Deployments) ===
# Private Keys nur auf Hardware Wallet!
# PRIVATE_KEY=<NIE HIER!>
```

---

## ✅ SCHRITT 5: Alte Keys deaktivieren/löschen

**WICHTIG:** Nach der Rotation die alten Keys SOFORT deaktivieren!

### Alchemy
1. Gehe zu: https://dashboard.alchemy.com/apps
2. Für jede alte App: Klicke **Settings** → **Delete App**
3. Bestätige Löschung

### Etherscan
1. Gehe zu: https://etherscan.io/apis
2. Klicke **Delete** für alten Key `K5SUWMCY8GVHXHIUK8K1WZVBVXB2N6K45Y`
3. Bestätige Löschung

### Telegram Bot
1. Im BotFather: `/revoke` für alten Token
2. Bestätige Sperrung

---

## 🔒 Sicherheitsüberprüfung

### Alte Keys sind jetzt WERTLOS:
```
❌ [REDACTED-API-KEY] (Sepolia) - DEACTIVATED
❌ [REDACTED-API-KEY] (Mainnet) - DEACTIVATED  
❌ K5SUWMCY8GVHXHIUK8K1WZVBVXB2N6K45Y (Etherscan) - DEACTIVATED
❌ 8427599853:AAF4dZnp-... (Telegram) - REVOKED
```

### Neue Keys sind SICHER:
```
✅ [NEW_SEPOLIA_KEY] - Aktiv auf .env.local
✅ [NEW_MAINNET_KEY] - Aktiv auf .env.local
✅ [NEW_ETHERSCAN_KEY] - Aktiv auf .env.local
✅ [NEW_BOT_TOKEN] - Aktiv auf Telegram Bot
```

---

## 📋 Checkliste zur Bestätigung

Nach der API-Rotation, überprüfe diese Punkte:

### Alchemy
- [ ] Neue Sepolia RPC funktioniert
- [ ] Neue Mainnet RPC funktioniert
- [ ] Alte Apps sind gelöscht

### Etherscan
- [ ] Neuer API-Key funktioniert
- [ ] Alter Key ist deaktiviert

### Telegram Bot
- [ ] Neuer Token ist aktiv
- [ ] Alter Token ist revoked

### Lokale Konfiguration
- [ ] .env.local mit neuen Keys aktualisiert
- [ ] .env Datei bleibt GELÖSCHT
- [ ] Keine alten Keys in .env.local

### Verifizierung
- [ ] Teste RPC Connection:
  ```bash
  curl https://eth-sepolia.g.alchemy.com/v2/[NEW_KEY] \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
  ```
- [ ] Teste Etherscan API:
  ```bash
  curl "https://api-sepolia.etherscan.io/api?module=account&action=balance&address=0x5032206396A6001eEaD2e0178C763350C794F69e&apikey=[NEW_KEY]"
  ```

---

## 🚨 WARNUNG: Alte Keys sind kompromittiert!

**Behandele alte Keys als KOMPROMITTIERT:**

- ❌ Verwende sie NICHT mehr
- ❌ Gib sie NIEMANDEN weiter
- ❌ Speichere sie NICHT ab
- ❌ Committe sie NICHT zu Git

**Sie sind jetzt deaktiviert und wertlos** ✅

---

## 📝 Zusammenfassung

**Zu tun:**
1. [ ] Alchemy: Neue Sepolia RPC generieren
2. [ ] Alchemy: Neue Mainnet RPC generieren
3. [ ] Etherscan: Neuen API-Key generieren
4. [ ] Telegram: Neuen Bot Token generieren
5. [ ] .env.local mit neuen Keys aktualisieren
6. [ ] Alte Keys in Alchemy/Etherscan löschen
7. [ ] Alte Telegram Bot Token revoken
8. [ ] Verbindungen testen
9. [ ] Verification durchführen
10. [ ] Diese Checkliste abhaken ✅

---

**Zeitschätzung:** 15-20 Minuten  
**Priority:** HIGH (Do this ASAP!)  
**Status:** PENDING USER ACTION

