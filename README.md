# DentalCare Frontend

Frontend React/Vite preparado para desplegar en Vercel.

## Vercel

- Framework Preset: Vite
- Build Command: npm run build
- Output Directory: dist
- Install Command: npm install

## Variable de entorno

Configura esta variable en Vercel cuando el backend este publicado:

```text
VITE_API_URL=https://TU-BACKEND/api
```

Mientras el backend no este publicado, la pantalla cargara pero el login remoto no funcionara.