# Служебные скрипты

- `patch-sonner-csp.mjs` — проверяемый postinstall/prebuild patch для Sonner 2.0.8, необходимый строгому CSP;
- `verify-security-headers.ps1` — запускает production server на порту 3011 и проверяет CSP/nonce/security headers.

Patch намеренно привязан к точной версии Sonner и завершится ошибкой после несовместимого обновления зависимости. Это сигнал пересмотреть обход, а не убрать проверку версии.
