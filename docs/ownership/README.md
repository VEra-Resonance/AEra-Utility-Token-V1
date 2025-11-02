# 🔐 Ownership Transfer - Schnell-Checkliste

## ✅ Schritt-für-Schritt Anleitung (10-15 Min)

### PHASE 1: Safe Setup (5 Min)

```
☐ Gehe zu https://app.safe.global/welcome
☐ Wähle Sepolia Testnet (oben rechts)
☐ Klick: "+ Create new Safe"
☐ Name: "AERA Token Multi-Sig"
☐ Füge 3 Owner hinzu (oder deine 3 Adressen)
☐ Threshold: 2-of-3 (2 müssen zustimmen)
☐ Safe erstellen & verifizieren
☐ Safe-Adresse notieren: 0x________________
```

### PHASE 2: Ownership Transfer (3 Min)

```
☐ Gehe zu: https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e#code
☐ Klick auf "Code" Tab
☐ Scroll zu "Write Contract"
☐ Klick "Connect to Web3"
☐ Wähle MetaMask (dein Wallet)
☐ Suche: "transferOwnership"
☐ Input newOwner: [PASTE SAFE-ADRESSE]
☐ Klick "Write"
☐ MetaMask: Bestätige Transaction
☐ Warte auf Success (30-60 Sek)
☐ Hash notieren: 0x________________
```

### PHASE 3: Verification (1 Min)

```
☐ Gleiche Etherscan Seite, "Read Contract"
☐ Suche: "owner()"
☐ Überprüfe: Zeigt deine Safe-Adresse?
☐ ✅ JA: Ownership erfolgreich übertragen!
☐ ❌ NEIN: Kontrolliere die Tx noch mal
```

### PHASE 4: Documentation (2 Min)

```
☐ Screenshot 1: Ownership-Transfer Tx
   • Etherscan → Tx Details
   • Zeige: Hash, From, To, Function, Status: Success
   • Speichere: 1-ownership-transfer-tx.png

☐ Screenshot 2: Read Contract owner()
   • Etherscan → Read Contract
   • Zeige: owner() Output = Safe-Adresse
   • Speichere: 2-read-contract-owner.png

☐ Screenshot 3: Safe Übersicht
   • Safe.global → Dashboard
   • Zeige: Name, Owners, Threshold, Address
   • Speichere: 3-safe-overview.png

☐ ownership-details.md ausfüllen:
   • Alle Adressen eintragen
   • Alle Daten von Tx eintragen
   • Alle Links aktualisieren
   • Alles überprüfen

☐ Alle Dateien in /docs/ownership/ speichern
☐ GitHub: git add docs/ownership/
☐ GitHub: git commit -m "chore: transfer ownership to Multi-Sig Safe"
☐ GitHub: git push origin main
```

---

## 📋 Eingabe-Vorlage

### Safe-Adresse (von Phase 1)
```
0x________________________________________________
```

### Transaction Hash (von Phase 2)
```
0x________________________________________________
```

### Owner Adressen

**Owner 1:**
```
Adresse: 0x________________________________________________
Name: ____________________________________________________
```

**Owner 2:**
```
Adresse: 0x________________________________________________
Name: ____________________________________________________
```

**Owner 3:**
```
Adresse: 0x________________________________________________
Name: ____________________________________________________
```

### Verifikation (von Phase 3)

**owner() Output:**
```
0x________________________________________________
✅ Stimmt mit Safe-Adresse überein?
```

---

## 🚀 Mach es jetzt!

| Phase | Aufgabe | Zeit | Status |
|-------|---------|------|--------|
| 1 | Safe erstellen | 5 min | ☐ TODO |
| 2 | Ownership transferieren | 3 min | ☐ TODO |
| 3 | Verifizieren | 1 min | ☐ TODO |
| 4 | Dokumentieren | 2 min | ☐ TODO |
| **TOTAL** | | **~11 min** | ☐ TODO |

---

## 💡 Pro-Tipps

✅ **Vor dem Transfer:**
- Überprüfe die Safe-Adresse 3x!
- Schreib sie auf, nicht kopieren aus unsicher Quellen
- Teste mit kleinen Beträgen zuerst

✅ **Während dem Transfer:**
- Gas auf Sepolia ist super günstig (~0.001 ETH)
- Bestätige langsam und sorgfältig
- Mach einen Screenshot von jeder wichtigen Seite

✅ **Nach dem Transfer:**
- Verifiziere sofort mit Read Contract
- Dokumentiere alles in GitHub
- Informiere deine Community

---

## ⚠️ Häufige Fehler

❌ **NICHT:** Falsche Adresse eingeben!  
✅ **STATTDESSEN:** Adresse mehrfach überprüfen

❌ **NICHT:** Ownership zu Early transferieren!  
✅ **STATTDESSEN:** Zuerst Safe vollständig testen

❌ **NICHT:** Vergessen zu dokumentieren!  
✅ **STATTDESSEN:** Alles sofort in /docs/ownership/ speichern

---

## 🔗 Links

- Safe App: https://app.safe.global/welcome
- AERA Contract: https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e
- Detaillierte Anleitung: ../OWNERSHIP-TRANSFER-GUIDE.md

---

**Status:** ✅ Ready to Execute  
**Zeit benötigt:** ~10-15 Minuten  
**Schwierigkeit:** ⭐⭐ (Einfach)

🚀 **Los geht's!**
