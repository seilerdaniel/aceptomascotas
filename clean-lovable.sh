#!/bin/bash

echo "🧹 Limpiando rastros de Lovable..."

# Buscar y reemplazar en archivos
find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -exec sed -i '' 's/lovable/ /g' {} \;
find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -exec sed -i '' 's/Lovable/ /g' {} \;
find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -exec sed -i '' 's/LOVABLE/ /g' {} \;

# Limpiar URLs específicas
find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -exec sed -i '' 's/lovable\.dev/ /g' {} \;
find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -exec sed -i '' 's/lovable\.app/ /g' {} \;

echo "✅ Limpieza completada!"
echo "⚠️  Revisa los archivos manualmente para asegurarte"