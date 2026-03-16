# Usamos una imagen ligera de Node.js
FROM node:18-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos package.json y package-lock.json primero (para aprovechar caché de Docker)
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos el resto del código
COPY . .

# Exponemos el puerto que usa la app
EXPOSE 3000

# Creamos directorios para persistencia si no existen
RUN mkdir -p public/images

# Comando para iniciar la aplicación
CMD ["node", "index.js"]
