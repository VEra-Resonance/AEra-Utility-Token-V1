# AEra Bot — Sicherheits- & Compliance-Prinzipien

**Version:** 1.0  
**Status:** ✅ Production Standard  
**Letzte Aktualisierung:** 2. November 2025

---

## 🔒 Neun Kernprinzipien für verantwortungsvolle Tokenverteiling

### 1️⃣ Keine Investment-Sprache

**Regel:** Keine Begriffe wie „Profit", „Gewinn", „Wertsteigerung" oder „Investment".

**Warum:** 
- 📋 Regulatorische Konformität (BaFin, SEC, FINMA)
- ⚖️ Vermeidung von Wertpapier-Klassifizierung
- 🛡️ Schutz vor Unregelmäßigkeiten

**Erlaubte Begriffe:**
- ✅ „Testtoken", „Airdrop", „Blockchain-Test"
- ✅ „Dezentralisierung", „Governance", „Community"
- ✅ „Technische Demo", „How-To"

**Verboten:**
- ❌ „Investieren Sie in AEra"
- ❌ „Gewinn durch Halten"
- ❌ „Preissteigerung erwartet"
- ❌ „Wertstabile Coins"

---

### 2️⃣ Nur Information & Tests

**Regel:** Bot zeigt nur Roadmap, Tech-Infos, How-to, Test-Airdrop (Sepolia) — deutlich gekennzeichnet.

**Bot-Funktionen:**
- 📖 `/info` — Technische Daten (Smart Contract, Solidity, ERC-20)
- 🗺️ `/roadmap` — Entwicklungs-Timeline
- 🧪 `/test-airdrop` — Sepolia Testnet (mit Disclaimer)
- 🔗 `/verify` — Etherscan Verification Proof
- 📚 `/docs` — Dokumentation & GitHub Link
- ⚖️ `/disclaimer` — Rechtliche Hinweise

**NICHT im Bot:**
- ❌ Preis-Vorhersagen
- ❌ Trading-Tipps
- ❌ Gewinn-Versprechen
- ❌ Markt-Analysen

---

### 3️⃣ Opt-in + Consent (Nutzer-Bestätigung)

**Regel:** Nutzer müssen aktiv bestätigen: „Ich verstehe, das ist nur Testtoken, kein Investment."

**Implementierung:**
```
Bei /test-airdrop oder großen Anforderungen:

1. Bot zeigt: "⚠️ WICHTIG: Das ist ein TESTTOKEN auf Sepolia Testnet!"
2. Nutzer klickt: ✅ "Ich verstehe — es ist kein Investment"
3. Bot speichert Consent mit Timestamp
4. Erst dann: Airdrop durchführen
5. Logging: Consent in Datei dokumentiert
```

**Technische Umsetzung:**
```javascript
// Inline Buttons in Telegram
const options = {
    reply_markup: {
        inline_keyboard: [
            [
                { text: '✅ Ich verstehe', callback_data: 'consent_testtoken' },
                { text: '❌ Abbrechen', callback_data: 'cancel' }
            ]
        ]
    }
};
```

---

### 4️⃣ Keine KYC (Know Your Customer)

**Regel:** Verzichte auf Sammlung sensibler Daten. Maximum: Wallet-Adresse (öffentlich auf Blockchain).

**Was der Bot NICHT sammelt:**
- ❌ Namen, E-Mail, Telefon
- ❌ Identitätsdokumente
- ❌ Geo-Daten
- ❌ Trading-Verhalten

**Was der Bot KANN sammeln (optional):**
- ✅ Telegram User ID (öffentlich, anonym per Bot)
- ✅ Wallet-Adressen (öffentlich auf Blockchain)
- ✅ Opt-in Timestamps (für Compliance)

**DSGVO-Konformität:**
- 📋 Rechtsgrundlage: Art. 6 DSGVO (Vertragserfüllung)
- 🔐 Daten-Minimierung: Nur das Nötigste
- 🗑️ Löschpflicht: Nach 30 Tagen inaktiv
- 🔒 Verschlüsselung: user-data.json mit `git-crypt` oder verschlüsselt

---

### 5️⃣ Limits & Caps (Anti-Spam, Anti-Sybil)

**Implementierte Limits:**

| Limit | Wert | Grund |
|-------|------|-------|
| Max per Wallet | 100 Test-Token | Spam-Prävention |
| Max per Nutzer/Tag | 200 Token | Rate Limiting |
| Min Zeit zwischen Anfragen | 1 Stunde | Bot-Schutz |
| Max Anfragen/Woche | 5 | Fairness |

**Anti-Sybil-Maßnahmen:**
- 🔗 GitHub/Twitter Sign-in (optional, für Verifikation)
- ⏱️ Time-Lock: Mindestens 24h zwischen Wallets
- 🤖 Captcha: Bei verdächtigen Mustern
- 📊 Duplicate Detection: Gleiche Wallet/IP blocken
- 🚨 Threshold Alert: >1000 Token/Tag = Manual Review

**Technische Umsetzung:**
```javascript
const LIMITS = {
    MAX_PER_WALLET: 100,
    MAX_PER_DAY: 200,
    MIN_INTERVAL_HOURS: 1,
    MAX_REQUESTS_WEEK: 5,
    COOLDOWN_BETWEEN_WALLETS: 24 * 60 * 60 * 1000 // 24h
};
```

---

### 6️⃣ Transparenz & Open Source

**Regel:** Code Open Source + Audit + README + klare Disclaimer.

**Was ist öffentlich:**
- ✅ Smart Contract: [Etherscan](https://sepolia.etherscan.io/address/0x5032206396A6001eEaD2e0178C763350C794F69e#code)
- ✅ Bot Code: [GitHub](https://github.com/koal0308/AEra)
- ✅ Airdrop-Logs: `airdrop-log.json` (TX-Hashes, Wallets öffentlich)
- ✅ Deployment Docs: `/docs`

**Audit & Review:**
- 🔍 Smart Contract: Etherscan verified (Sourcify)
- 📋 Compiler Warnings: Analysiert & dokumentiert
- 🧪 Tests: `/test/AeraToken.test.js` (50+ Tests)
- 🔐 Code Review: Community kann Feedback geben

---

### 7️⃣ Legal Notice (Haftungsausschluss)

**Regel:** Kurzer, rechtlich belastbarer Disclaimer in Fußzeile jeder Bot-Message.

**Standard Legal Notice:**
```
⚖️ DISCLAIMER: 
Dies ist ein TESTTOKEN auf Sepolia Testnet. Kein Investment.
Keine Gewährleistung. Code: github.com/koal0308/AEra
```

**In jeder Message implementiert:**
```javascript
const disclaimer = `
⚖️ DISCLAIMER: Testtoken, kein Investment. Keine Garantie.
Mehr: /disclaimer`;

// Am Ende jeder Nachricht anhängen
bot.sendMessage(chatId, message + '\n\n' + disclaimer);
```

**Vollständiger Disclaimer:**
```
VOLLSTÄNDIGER HAFTUNGSAUSSCHLUSS:

1. TESTTOKEN: AEra ist ein Testtoken auf Sepolia Testnet. Kein echter Wert.
2. KEINE INVESTITION: Dies ist KEIN Wertpapier, Finanzprodukt oder Investment.
3. KEINE GARANTIE: Keine Garantie auf Funktionalität, Wert oder Verfügbarkeit.
4. NUTZER TRÄGT RISIKO: Jeder Nutzer handelt auf eigene Verantwortung.
5. TECHNISCH: Sepolia Testnetz kann instabil sein. Keine SLA.
6. RECHTLICH: Nutzer sind verantwortlich für lokale Compliance.
7. HAFTUNG: Der Bot-Betreiber haftet nicht für Schäden jeglicher Art.
8. CODE-AS-IS: Open Source unter MIT Lizenz.
```

---

### 8️⃣ Dokumentation & Logging

**Regel:** Jeder Airdrop-TX geloggt, TX-Hash öffentlich, Release Notes im Repo.

**Airdrop-Log Format:**
```json
{
  "airdrop_id": "2025-11-02-001",
  "timestamp": "2025-11-02T14:30:15Z",
  "user_id": "telegram_123456",
  "wallet": "0x1234...abcd",
  "amount": "50",
  "network": "sepolia",
  "tx_hash": "0xa0a1a5...",
  "block": "9545535",
  "status": "confirmed",
  "limits_check": {
    "daily_used": "50/200",
    "wallet_used": "50/100",
    "passed": true
  },
  "consent": {
    "agreed": true,
    "timestamp": "2025-11-02T14:29:00Z"
  }
}
```

**Release Notes Template:**
```markdown
## Airdrop Run #1 — 2. Nov 2025

**Zusammenfassung:**
- Empfänger: 42
- Total verteilt: 4,200 Test-Tokens
- Netzwerk: Sepolia
- Status: ✅ Alle erfolgreich

**TX-Hashes:**
1. 0xa0a1a525... → 100 Token
2. 0xb1b2b636... → 100 Token
... (alle in airdrop-log.json)

**Limits eingehalten:**
- ✅ Max pro Wallet: 100 Token
- ✅ Rate Limiting: 1h zwischen Anfragen
- ✅ Max pro Tag: 200 Token
```

**Log-Storage:**
```
/telegram-marketing/
  ├─ airdrop-log.json (aktiv, täglich geupdatet)
  ├─ airdrop-archive/
  │  ├─ 2025-11-02.json
  │  ├─ 2025-11-03.json
  │  └─ ...
  └─ release-notes.md
```

---

### 9️⃣ Testnet Only (anfangs)

**Regel:** Sepolia/Goerli verwenden, Mainnet-Drops erst nach Rechtscheck.

**Aktuelle Phase (Nov 2025 – Q1 2026):**
- 🧪 **Testnet Only**: Sepolia
- 📊 Community-Testing
- 🔍 Feedback sammeln
- 📋 Legal Review durchführen

**Übergang zu Mainnet (frühestens Q2 2026):**
- ✅ Rechtsanwalt konsultiert
- ✅ Compliance-Audit durchgeführt
- ✅ Community votiert
- ✅ Multi-Sig Safe genehmigt
- 📢 Mainnet aktiviert

**Sepolia Config im Bot:**
```javascript
const NETWORK = {
    name: 'sepolia',
    chainId: 11155111,
    rpc: process.env.SEPOLIA_RPC_URL,
    tokenAddress: '0x5032206396A6001eEaD2e0178C763350C794F69e',
    faucetUrl: 'https://sepoliafaucet.com'
};

// Warnung in allen Messages
const TESTNET_WARNING = '🧪 SEPOLIA TESTNET — Kein echter Wert';
```

---

## 📋 Implementierungs-Checkliste

- [ ] 1. Alle Investment-Sprache entfernt (Profit, Gewinn, etc.)
- [ ] 2. Bot-Commands: Info nur, kein Trading
- [ ] 3. Consent-Dialog vor Airdrop implementiert
- [ ] 4. KYC deaktiviert, nur Wallet-Adressen
- [ ] 5. Rate Limits & Anti-Sybil aktiviert
- [ ] 6. GitHub Public, Code reviewed
- [ ] 7. Legal Notice in jeder Message
- [ ] 8. Airdrop-Log mit TX-Hashes erstellt
- [ ] 9. Testnet-only Warnung prominent

---

## 🔗 Verwandte Dokumente

- 📖 [Bot-Setup Anleitung](telegram-marketing/BOT-SETUP-ANLEITUNG.html)
- 🤖 [Marketing Bot Source](telegram-marketing/marketing-bot.js)
- 📦 [Smart Contract](contracts/AeraToken.sol)
- 📋 [README](README.md)
- ⚖️ [Disclaimer im Bot](/disclaimer Kommando)

---

## 📞 Support & Feedback

Fragen zur Compliance?
- 📧 Mail: [support email]
- 💬 Telegram: @AEra_Official_Bot → /help
- 🐙 GitHub Issues: https://github.com/koal0308/AEra/issues

---

**Status:** ✅ Final  
**Review:** ⚖️ Rechtskonform (Selbst-Assessment)  
**Maintenance:** Quarterly Review empfohlen
