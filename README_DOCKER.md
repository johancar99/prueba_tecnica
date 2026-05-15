# Docker Setup — Prueba Técnica Full-Stack

Stack: **NestJS** · **Next.js** · **PostgreSQL** · **Prisma**

> Requisito único: tener **Docker** y **Docker Compose** instalados en el host.
> No se necesita Node.js, npm ni PostgreSQL instalados localmente.

---

## Estructura

```
/
├── .env                  ← Variables centralizadas (copiar de .env.example si existe)
├── docker-compose.yml
├── .gitignore
├── README_DOCKER.md
├── backend/
│   └── Dockerfile
└── frontend/
    └── Dockerfile
```

---

## Variables de entorno (tres capas)

Los `.env` reales están en `.gitignore`. Cópialos desde los ejemplos antes de arrancar:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### `/.env` — Orquestación Docker Compose

Solo la lee `docker-compose.yml`. Controla la infraestructura.

| Variable          | Descripción                               |
|-------------------|-------------------------------------------|
| `BACKEND_PORT`    | Puerto del backend expuesto al host       |
| `FRONTEND_PORT`   | Puerto del frontend expuesto al host      |
| `POSTGRES_PORT`   | Puerto de PostgreSQL expuesto al host     |
| `POSTGRES_USER`   | Usuario de PostgreSQL                     |
| `POSTGRES_PASSWORD` | Contraseña de PostgreSQL               |
| `POSTGRES_DB`     | Nombre de la base de datos               |

### `/backend/.env` — Variables internas de NestJS

La carga el contenedor `backend` al arrancar.

| Variable       | Descripción                                         |
|----------------|-----------------------------------------------------|
| `PORT`         | Puerto en el que escucha NestJS                     |
| `NODE_ENV`     | Entorno (`development` / `production`)              |
| `DATABASE_URL` | URL de Prisma. El host `db` resuelve en Docker      |
| `JWT_SECRET`   | Clave secreta para firmar tokens JWT                |
| `JWT_EXPIRATION` | Tiempo de vida del token (ej: `7d`)              |

### `/frontend/.env` — Variables internas de Next.js

La carga el contenedor `frontend` al arrancar.

| Variable                  | Descripción                                                 |
|---------------------------|-------------------------------------------------------------|
| `PORT`                    | Puerto en el que escucha Next.js                            |
| `NODE_ENV`                | Entorno                                                     |
| `NEXT_PUBLIC_API_BASE_URL`| URL del API vista desde el **navegador** (`localhost:3001`) |
| `API_INTERNAL_URL`        | URL del API para llamadas **server-side** (`http://backend:3001`) |

---

## Comandos principales

### Levantar todos los servicios
```bash
docker compose up --build
```
> Usa `--build` la primera vez o cuando cambies un Dockerfile.  
> Omítelo en arranques posteriores: `docker compose up`

### Levantar en segundo plano (detached)
```bash
docker compose up --build -d
```

### Ver logs en tiempo real
```bash
# Todos los servicios
docker compose logs -f

# Solo el backend
docker compose logs -f backend

# Solo el frontend
docker compose logs -f frontend

# Solo la base de datos
docker compose logs -f db
```

### Bajar los servicios
```bash
# Detiene y elimina contenedores (conserva volúmenes y datos)
docker compose down

# Detiene, elimina contenedores Y borra volúmenes (¡borra la DB!)
docker compose down -v
```

### Reiniciar un servicio específico
```bash
docker compose restart backend
docker compose restart frontend
```

### Reconstruir solo un servicio
```bash
docker compose up --build backend
```

---

## Acceso a los servicios

| Servicio    | URL                          |
|-------------|------------------------------|
| Frontend    | http://localhost:3000        |
| Backend API | http://localhost:3001        |
| PostgreSQL  | localhost:5432               |

---

## Conectividad interna Docker

| Origen   | Destino   | Hostname usado  |
|----------|-----------|-----------------|
| backend  | db        | `db`            |
| frontend | backend   | `backend`       |

El frontend llama al backend **desde el navegador** usando `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001`.  
Para llamadas **server-side** (Server Components / API Routes de Next.js dentro del contenedor) usa `http://backend:3001`.

---

## `node_modules` en el host (LSP / Cursor)

No se usan volúmenes nombrados para `node_modules`. El proyecto se monta con
`./backend:/app` y `./frontend:/app`, así que cuando el contenedor ejecuta
`npm install`, las dependencias quedan en **`backend/node_modules`** y
**`frontend/node_modules`** en tu disco. Cursor y TypeScript las resuelven
sin instalar Node en el host.

Tras el primer `docker compose up`, si no ves tipos aún, recarga la ventana
del editor o espera a que termine `npm install` en los logs.

Solo dependencias nativas compiladas en la imagen (p. ej. Alpine/musl): el
runtime sigue siendo el contenedor; el IDE solo lee tipos y fuente.

Si antes usabas volúmenes nombrados para `node_modules`, puedes eliminar
volúmenes huérfanos: `docker volume ls` y `docker volume rm <nombre>`.

---

## Migraciones y Seed (automáticos)

Al iniciar el servicio `backend`, el entrypoint ejecuta en orden:

1. `npm install` — asegura dependencias actualizadas.
2. `npx prisma migrate deploy` — aplica migraciones pendientes.
3. `npx prisma db seed` — ejecuta el seed definido en `package.json`.
4. `npm run start:dev` — arranca NestJS en modo desarrollo con hot-reload.

Para correr migraciones manualmente:
```bash
docker compose exec backend npx prisma migrate dev --name nombre_migracion
```

Para abrir Prisma Studio:
```bash
docker compose exec backend npx prisma studio
```

---

## Comandos útiles adicionales

```bash
# Abrir una shell en el contenedor backend
docker compose exec backend sh

# Abrir una shell en el contenedor frontend
docker compose exec frontend sh

# Conectarse a PostgreSQL desde el host
docker compose exec db psql -U postgres -d prueba_tecnica_db

# Ver el estado de todos los contenedores
docker compose ps
```
