#!/bin/bash

echo "🔧 MySQL Password Fix Script"
echo "============================"
echo ""
echo "Masalah: MySQL memerlukan password, tapi DB_PASSWORD di .env kosong"
echo ""
echo "Pilih salah satu solusi:"
echo ""
echo "1. Jika MySQL Anda TIDAK pakai password (default XAMPP):"
echo "   - Pastikan XAMPP MySQL running"
echo "   - Update .env: DB_PORT=3308, DB_PASSWORD="
echo ""
echo "2. Jika MySQL Anda PAKAI password:"
echo "   - Masukkan password MySQL Anda:"
read -s MYSQL_PASSWORD
echo ""
echo "   Updating all .env files..."
for dir in 2-services/*/; do
  if [ -f "$dir/.env" ]; then
    sed -i '' "s/^DB_PASSWORD=$/DB_PASSWORD=$MYSQL_PASSWORD/" "$dir/.env"
    echo "✅ Updated $dir/.env"
  fi
done
echo ""
echo "✅ Done! Sekarang restart services dengan: ./stop-all.sh && ./start-all.sh"
