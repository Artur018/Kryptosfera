#!/bin/bash

echo "⚰️  Lecimy z pogrzebem syfu od Codexa..."

# 1. dashboard/ w backendzie
if [ -d "backend/dashboard" ]; then
  rm -rf backend/dashboard
  echo "🗑️  Usunięto backend/dashboard"
fi

# 2. założenia/
if [ -d "backend/założenia" ]; then
  rm -rf backend/założenia
  echo "🗑️  Usunięto backend/założenia"
fi

# 3. start.sh
if [ -f "backend/start.sh" ]; then
  rm backend/start.sh
  echo "🗑️  Usunięto backend/start.sh"
fi

# 4. backend/app/app.py
if [ -f "backend/app/app.py" ]; then
  rm backend/app/app.py
  echo "🗑️  Usunięto backend/app/app.py"
fi

# 5. backend/services/utils.py
if [ -f "backend/services/utils.py" ]; then
  rm backend/services/utils.py
  echo "🗑️  Usunięto backend/services/utils.py"
fi

echo "👌 Syf po Codexie posprzątany."
echo "🙏 Możesz znowu oddychać spokojnie."
