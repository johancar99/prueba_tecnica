# Despliegue en Railway (backend)

## Configuración del servicio

| Setting | Valor |
|---------|--------|
| **Root Directory** | `backend` |
| **Builder** | Nixpacks (auto; no debe existir `Dockerfile` en esta carpeta) |

Los comandos de build y arranque están en `railway.toml`. **Borra** en el panel de Railway cualquier *Custom Build Command*, *Dockerfile Path* o *Start Command* manual que tengas de antes (evita conflictos).

## Variables de entorno obligatorias

```env
DATABASE_URL=          # Reference desde el plugin PostgreSQL
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
NODE_ENV=production
```

Opcionales: `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `MAIL_*`, `FRONTEND_URL`, `CORS_ORIGIN`.

## Seed (una sola vez)

El arranque en producción **no** ejecuta el seed. Para cargar cuentas de prueba:

```bash
railway run npx prisma db seed
```

## Desarrollo local

Sigue usando Docker Compose con `Dockerfile.dev`:

```bash
docker compose up -d --build backend
```
