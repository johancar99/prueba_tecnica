# =============================================================================
# FRONTEND — Next.js  (Desarrollo)
# Imagen base: Node 20 Alpine
# =============================================================================
FROM node:20-alpine

# Dependencias nativas mínimas
RUN apk add --no-cache \
      libc6-compat

WORKDIR /app

# Manifiesto de dependencias (obligatorio para la capa de caché de npm)
COPY package.json ./

# Instalar dependencias
RUN npm install

# Puerto que expone el servidor de desarrollo de Next.js
EXPOSE 3000

# El comando real se define en docker-compose.
# Fallback para uso independiente del contenedor.
CMD ["npm", "run", "dev"]
