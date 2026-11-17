#!/bin/sh
# প্রতিবার কোড বদলালে এটা চালালে সংস্করণ নম্বর বেড়ে যায়,
# ফলে সব ফোনে নতুন ফাইল নিজে থেকেই নামে।
set -e
cd "$(dirname "$0")"
OLD=$(grep -o 'app\.js?v=[0-9]*' index.html | head -1 | sed 's/.*=//')
NEW=$((OLD + 1))
sed -i "s/?v=$OLD/?v=$NEW/g" index.html sw.js
sed -i "s/jara-maath-v[0-9]*/jara-maath-v$NEW/" sw.js
echo "সংস্করণ $OLD → $NEW"
