# ---------- 构建阶段：在容器内完成 npm install + build ----------
FROM node:18-alpine AS build
WORKDIR /app

# 利用层缓存：先拷依赖清单
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# 再拷源码并构建（输出到 dist/）
COPY . .
RUN npm run build

# ---------- 运行阶段：极简 nginx 提供静态文件 ----------
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
