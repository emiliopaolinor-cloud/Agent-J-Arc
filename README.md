# Agent J — landing + chat en vivo

## Estructura
```
index.html                     ← la página (todo el diseño y el frontend del chat)
assets/agent-j.png             ← la imagen hero
netlify.toml                   ← config de Netlify
netlify/functions/chat.js      ← backend serverless que llama a la API de Anthropic
```

## Antes de publicar
En `index.html`, reemplazá los placeholders:
- `#ca-text` → la dirección real del contrato
- `#link-buy` → link real de compra (el DEX/exchange que corresponda en Arc)
- `#link-x`, `#link-telegram` y los links del footer → tus redes reales

## Deploy en Netlify
1. Subí esta carpeta completa a un repo de GitHub (o arrastrala directo al dashboard de Netlify en "Deploys").
2. En Netlify, andá a **Site settings → Environment variables** y agregá:
   - `ANTHROPIC_API_KEY` = tu API key de Anthropic (la sacás en console.anthropic.com)
3. Netlify detecta `netlify.toml` solo y publica `index.html` en la raíz, con la función en `/.netlify/functions/chat`.
4. Deploy. Probá el chat en producción — sin la env var, el uplink va a responder con un error claro en vez de romperse silenciosamente.

## Notas
- La API key **nunca** viaja al navegador: solo vive en la función serverless.
- El endpoint corta el historial a los últimos 10 mensajes y 2000 caracteres por mensaje, para controlar costo y evitar abuso obvio.
- Si más adelante querés swappear el modelo (por ejemplo a uno más barato para volumen alto), el único lugar que tenés que tocar es la línea `model:` en `chat.js`.
- Si preferís no depender de Netlify Functions, la misma función se porta casi 1:1 a un Cloudflare Worker o a un endpoint de Vercel — avisame y te la adapto.
