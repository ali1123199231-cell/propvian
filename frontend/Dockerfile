FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --frozen-lockfile
COPY . .
RUN npm run build

FROM nginx:1.25-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Break stdout/stderr symlinks so logs write to real files when volume is mounted
RUN rm -f /var/log/nginx/access.log /var/log/nginx/error.log \
    && mkdir -p /var/log/nginx
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
