# 🔧 Error Handling Guide - WalletConnect

**Last Updated:** 15. November 2025

## 📋 Overview

Das System hat umfassendes Error-Handling für alle WalletConnect Szenarien implementiert. Hier sind alle Fehlerfälle und deren Lösungen.

---

## ✅ Funktioniert - Keine Fehler

### Szenario 1: Erste Wallet-Verbindung
**Aktion:** `/connect` + neue Wallet verbinden

**Erwartete Nachricht:**
```
✅ Wallet erfolgreich verbunden!

💳 Adresse: 0x...

Du kannst jetzt an Abstimmungen teilnehmen! Nutze /polls zum Abstimmen.

💰 0.5 AERA Willkommensbonus wurde gebucht!
TX: 0x...
```

**Status:** ✅ WORKING

---

## ❌ Fehlerfall 1: Andere Wallet mit gleicher User-ID

### Szenario 2: Versuch, andere Wallet zu verbinden
**Aktion:** `/connect` + **ANDERE** Wallet (wenn schon eine verbunden ist)

**Erwartete Nachricht:**
```
⚠️ Du versuchst eine andere Wallet zu verbinden!

❌ Das funktioniert nicht, da du bereits mit dieser Wallet verbunden bist:

💳 `0xfba43a53754886010e23549364fdb54a2c06cbfa`

Optionen:
1️⃣ /disconnect - Aktuelle Wallet trennen
2️⃣ /connect - Neue Wallet verbinden

Fragen? Kontaktiere @AEra_Support
```

**Status:** ✅ FIXED - Benutzer sieht jetzt klare Fehlermeldung

**Was passierte vorher:** Keine Rückmeldung - verwirrend!

**Lösung:** 
- Check in `registerUserWallet()` prüft UNIQUE constraint
- Rückgabe von `success: false` + `currentWallet`
- Bot zeigt detaillierte Anleitung zur Behebung

---

## ❌ Fehlerfall 2: Wallet-Ablehnung in MetaMask

### Szenario 3: User lehnt in MetaMask ab
**Aktion:** `/connect` + In MetaMask auf "Ablehnen" klicken

**Erwartete Nachricht:**
```
❌ Wallet-Verbindung abgebrochen.

Mögliche Gründe:
• Du hast die Verbindung in MetaMask abgelehnt
• Verbindung verloren
• Timeout (zu lange gewartet)

Bitte versuche es erneut mit /connect
```

**Status:** ✅ IMPLEMENTED

**Technisch:** 
- `.catch()` Handler fängt den Fehler auf
- Prüft ob User schon Wallet hat
- Falls ja: Zeigt alternative Meldung mit `/disconnect` Option
- Falls nein: Zeigt verständliche Fehlermeldung

---

## ❌ Fehlerfall 3: Mehrere Versuche ohne Erfolg

### Szenario 4: User versucht mehrmals, andere Wallet zu verbinden
**Aktion:** `/connect` (3x mit unterschiedlichen Wallets)

**Erste Nachricht:**
```
✅ Wallet erfolgreich verbunden!
💳 Adresse: 0xAAA...
💰 0.5 AERA Willkommensbonus wurde gebucht!
```

**Zweite Nachricht:**
```
⚠️ Du versuchst eine andere Wallet zu verbinden!

❌ Das funktioniert nicht, da du bereits mit dieser Wallet verbunden bist:

💳 `0xAAA...`

Optionen:
1️⃣ /disconnect - Aktuelle Wallet trennen
2️⃣ /connect - Neue Wallet verbinden
```

**Dritte Nachricht:** (gleich wie zweite)
```
⚠️ Du versuchst eine andere Wallet zu verbinden!
...
```

**Status:** ✅ CONSISTENT

---

## ✅ Richtig - Gleiche Wallet erneut verbinden

### Szenario 5: User verbindet gleiche Wallet zweimal
**Aktion:** `/connect` + gleiche Wallet (wenn schon verbunden)

**Erste Nachricht:**
```
✅ Wallet erfolgreich verbunden!
💳 Adresse: 0xAAA...
💰 0.5 AERA Willkommensbonus wurde gebucht!
```

**Zweite Nachricht:**
```
✅ Wallet erfolgreich verbunden!
💳 Adresse: 0xAAA...

✅ Du hast bereits deinen Willkommensbonus erhalten!
📝 Previous TX: 0x7ac12...
```

**Status:** ✅ WORKING - Duplikat-Prävention aktiv!

---

## 🔄 Fehler-Behebungs-Ablauf

### Was tun wenn Fehler auftritt?

```
1. Fehlermeldung lesen
   ↓
2. Falls "andere Wallet": /disconnect + /connect mit korrekter Wallet
   ↓
3. Falls "Verbindung abgebrochen": Nochmal /connect versuchen
   ↓
4. Falls immer noch Fehler: @AEra_Support kontaktieren
```

---

## 🛡️ Sicherheits-Features

### 1. UNIQUE Constraint
```sql
CREATE TABLE users (
  ...
  walletAddress TEXT UNIQUE NOT NULL,
  ...
)
```
✅ Verhindert, dass eine Wallet mit mehreren User-IDs verbunden wird

### 2. Status-Tracking
```
airdropStatus: 'completed' | 'pending' | 'failed'
```
✅ Verhindert, dass Airdrop mehrfach gesendet wird

### 3. User-Check
```javascript
if (existingUser && existingUser.walletAddress) {
    // Zeige hilfreiche Meldung
}
```
✅ Detektiert automatisch andere Wallets

---

## 📊 Error-Handling Locations

| Fehlertyp | Ort | Handler |
|-----------|-----|---------|
| Andere Wallet | `/connect` (Foto-Pfad) | Line 718-740 |
| Andere Wallet | `/connect` (Fallback-Pfad) | Line 810-832 |
| Verbindung abgebrochen | Photo error | Line 761-778 |
| Verbindung abgebrochen | Fallback error | Line 843-860 |

---

## 🧪 Test-Checkliste

- [x] Erste Wallet-Verbindung funktioniert
- [x] Zweite Wallet-Verbindung zeigt Fehler
- [x] Fehler-Nachricht ist verständlich
- [x] `/disconnect` funktioniert
- [x] Nach `/disconnect` kann neue Wallet verbunden werden
- [x] Gleiche Wallet 2x verbinden zeigt "bereits erhalten"
- [x] Keine Duplikate in Datenbank
- [x] Airdrop nur einmal pro User

---

## 🚀 Deployment-Checklist

Vor Production:

- [ ] Bot mit neuesten Fehler-Handlern neu starten
- [ ] Mit mehreren Test-Wallets durchspielen
- [ ] Datenbank-Backups einrichten
- [ ] Error-Logs monitoring aktivieren
- [ ] Support-Contact in Nachrichten aktuell halten

---

## 📞 Support-Kontakt

Bei Problemen: `@AEra_Support` oder `support@aera-token.com`

---

## 🔍 Debugging-Commands

### Alle Benutzer anzeigen
```bash
sqlite3 data/users.db "SELECT userId, walletAddress, airdropStatus FROM users;"
```

### Fehlgeschlagene Airdrops
```bash
sqlite3 data/users.db "SELECT * FROM airdrop_log WHERE status='failed';"
```

### Bot-Logs live verfolgen
```bash
tail -f /var/log/aera-bot-complete.log  # oder wo Logs sind
```

---

## 📝 Änderungshistorie

| Datum | Was | Status |
|-------|-----|--------|
| 15.11.2025 | Error-Handling für andere Wallets | ✅ IMPLEMENTED |
| 15.11.2025 | Bessere `.catch()` Handler | ✅ IMPLEMENTED |
| 15.11.2025 | Dokumentation erstellt | ✅ DONE |

