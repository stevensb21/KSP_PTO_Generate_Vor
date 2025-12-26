FROM node:20-alpine

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальные файлы
COPY . .

# Для development режима - просто запускаем dev сервер
# Для production можно добавить: RUN npm run build
EXPOSE 3000

CMD ["npm", "run", "dev"]
