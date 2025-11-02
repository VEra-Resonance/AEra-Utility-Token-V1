# 👑 Admin-System Setup für AERA Bot

## 🔧 **Admin-User-ID ermitteln**

### Schritt 1: Ihre Telegram User-ID finden

**Methode 1 - @userinfobot:**
1. Öffne Telegram
2. Suche nach `@userinfobot`  
3. Starte den Bot
4. Sende eine beliebige Nachricht
5. Bot zeigt dir deine User-ID

**Methode 2 - @AEra_Official_Bot:**
1. Sende `/start` an deinen AERA Bot
2. Prüfe die Logs: `sudo journalctl -u aera-bot -f`
3. Deine User-ID erscheint in den Logs

### Schritt 2: Admin-ID in .env eintragen

```bash
nano .env
```

**Ändere diese Zeile:**
```env
ADMIN_USER_ID=DEINE_ECHTE_USER_ID
```

**Beispiel:**
```env
ADMIN_USER_ID=987654321
```

### Schritt 3: Bot neu starten

```bash
sudo systemctl restart aera-bot
```

## 👑 **Admin-Kommandos**

Nach der Konfiguration stehen Ihnen folgende Admin-Kommandos zur Verfügung:

### `/stats` - System Übersicht
```
📊 Gesamtstatistiken:
• Teilnehmer: 156
• Verteilt: 15,600 AERA  
• Durchschnitt: 100 AERA/User

🏆 Top 10 Holdings:
1. Username1: 500 AERA
2. Username2: 450 AERA
...
```

### `/users` - Alle Teilnehmer
```
1. **Username**
   💰 Balance: 250 AERA
   🆔 ID: 123456789
   📅 Letzter Claim: 01.11.2025
   👥 Referrals: 5
   📊 Total Earned: 250 AERA
```

### `/export` - CSV Export
```
📊 AIRDROP EXPORT

UserID,Username,Balance,WelcomeClaimed,TotalEarned,Referrals,DailyClaims,JoinDate,LastClaim
123456789,Username1,250,true,250,5,15,2025-11-01T10:00:00.000Z,2025-11-01T12:00:00.000Z
...
```

## 🚀 **Mainnet Transfer Vorbereitung**

### Export für Smart Contract

Der `/export` Befehl erstellt eine CSV-Datei mit allen Daten:

```csv
UserID,Username,Balance,WelcomeClaimed,TotalEarned,Referrals,DailyClaims,JoinDate,LastClaim
```

### Verwendung für Mainnet

**Option 1 - Airdrop Smart Contract:**
- CSV in Airdrop-Contract hochladen
- Batch-Transfer zu allen Adressen
- Automatisierte Verteilung

**Option 2 - Manueller Transfer:**
- Excel/CSV importieren
- Wallet-Adressen sammeln  
- Batch-Transfers ausführen

**Option 3 - Claim-System:**
- Nutzer müssen Wallet verknüpfen
- Claim-Portal auf Website
- Self-Service Token-Abhholung

## 🔐 **Sicherheit**

**Admin-Zugriff ist beschränkt auf:**
- Nur die konfigurierte User-ID
- Read-Only Zugriff auf Daten
- Keine Manipulation der Balances

**Empfohlene Vorsichtsmaßnahmen:**
- Admin-ID geheim halten
- Regelmäßige Backups der Daten
- Logs überwachen

## 📊 **Monitoring**

**Live-Überwachung:**
```bash
# Bot-Logs anzeigen
sudo journalctl -u aera-bot -f

# Service Status
sudo systemctl status aera-bot

# Memory/CPU Nutzung  
htop
```

**Automatische Backups einrichten:**
```bash
# Cron-Job für täglichen Export
0 2 * * * /pfad/zu/export-script.sh
```

## ✅ **Setup-Checkliste**

```
☐ Admin-User-ID mit @userinfobot ermittelt
☐ ADMIN_USER_ID in .env eingetragen  
☐ Bot neu gestartet
☐ /stats Kommando getestet
☐ /export funktioniert
☐ CSV-Daten validiert
☐ Mainnet-Transfer Strategie gewählt
```

**Nach dem Setup können Sie alle Airdrop-Teilnehmer und ihre Guthaben verwalten! 👑**