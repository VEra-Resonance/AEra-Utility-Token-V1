#!/bin/bash

# AERA Token Bot Service Installation Script
# Dieses Script richtet den Telegram Bot als systemd Service ein

echo "🚀 Installiere AERA Bot als systemd Service..."

# Stoppe den aktuell laufenden Bot
echo "⏹️ Stoppe aktuellen Bot..."
pkill -f marketing-bot.js || true

# Kopiere Service-Datei zum systemd
echo "📁 Installiere Service-Datei..."
sudo cp aera-bot.service /etc/systemd/system/

# Setze korrekte Berechtigungen
sudo chmod 644 /etc/systemd/system/aera-bot.service

# Systemd neuladen
echo "🔄 Lade systemd neu..."
sudo systemctl daemon-reload

# Service aktivieren (automatischer Start bei Boot)
echo "✅ Aktiviere Service für Auto-Start..."
sudo systemctl enable aera-bot.service

# Service starten
echo "🚀 Starte AERA Bot Service..."
sudo systemctl start aera-bot.service

# Status prüfen
echo "📊 Service Status:"
sudo systemctl status aera-bot.service --no-pager -l

echo ""
echo "🎉 AERA Bot läuft jetzt als Service!"
echo ""
echo "📋 Nützliche Befehle:"
echo "  sudo systemctl start aera-bot     # Bot starten"
echo "  sudo systemctl stop aera-bot      # Bot stoppen" 
echo "  sudo systemctl restart aera-bot   # Bot neustarten"
echo "  sudo systemctl status aera-bot    # Status prüfen"
echo "  sudo journalctl -u aera-bot -f    # Live Logs anzeigen"
echo "  sudo systemctl disable aera-bot   # Auto-Start deaktivieren"
echo ""
echo "📄 Logs: /var/log/aera-bot.log"
echo ""
echo "✅ Der Bot startet jetzt automatisch bei jedem Neustart!"