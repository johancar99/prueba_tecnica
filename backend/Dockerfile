# =============================================================================
# BACKEND — NestJS + Prisma  (Desarrollo)
# Imagen base: Node 20 Alpine (ligera, sin binarios innecesarios)
# =============================================================================
FROM node:20-alpine

# Dependencias nativas mínimas que Prisma y bcrypt pueden necesitar
RUN apk add --no-cache \
      openssl \
      libc6-compat \
      python3 \
      make \
      g++

WORKDIR /app

# Copiar manifiestos de paquetes primero para aprovechar la caché de capas.
# El código fuente se monta en tiempo de ejecución vía volumen, por lo que
# aquí solo copiamos lo necesario para que la imagen arranque.
COPY package*.json ./

# Si existe schema de Prisma cópialo para que "prisma generate" funcione
# en el build (opcional; se vuelve a correr en el entrypoint de todas formas)
COPY prisma ./prisma/

# Variables de entorno para Prisma en tiempo de build
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Instalar dependencias dentro de la imagen
RUN npm install

# Generar el cliente de Prisma
RUN npx prisma generate || true

# Puerto que expone el servidor NestJS
EXPOSE 3001

# El comando real se define en docker-compose para mayor flexibilidad.
# Este CMD sirve como fallback si el contenedor se usa de forma independiente.
CMD ["npm", "run", "start:dev"]
