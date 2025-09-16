# Estágio 1: Build do React
# Usamos uma imagem do Node.js para instalar as dependências e gerar os arquivos estáticos.
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio 2: Servidor de produção com Nginx
# Usamos o Nginx, um servidor web leve e eficiente, para servir os arquivos gerados.
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Copia a nossa configuração customizada do Nginx para dentro do contêiner.
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]