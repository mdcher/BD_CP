# Використовуємо офіційний образ Node.js 18
FROM node:18-alpine AS builder

# Встановлюємо робочу директорію
WORKDIR /usr/src/app

# Копіюємо файли package.json та package-lock.json
COPY package*.json ./

# Встановлюємо залежності
RUN npm install

# Копіюємо решту коду
COPY . .

# Компілюємо TypeScript в JavaScript
RUN npm run build

# --- Другий етап: Створення production-образу ---
FROM node:18-alpine

WORKDIR /usr/src/app

# Копіюємо залежності з першого етапу
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./

# Копіюємо скомпільований код
COPY --from=builder /usr/src/app/dist ./dist

# Відкриваємо порт, на якому працює додаток
EXPOSE 4000

# Команда для запуску додатку
CMD [ "npm", "start" ]
