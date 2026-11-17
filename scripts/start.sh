#!/usr/bin/env bash
#
# JsonZen 一键启动脚本（macOS / Linux）
# 作用：拉取（或本地构建兜底）JsonZen 镜像 -> docker run 起服务 -> 终端输出访问地址
# 使用端无需 clone 源码、无需 npm install。访问地址：http://localhost:8508
#
set -euo pipefail

IMAGE="ghcr.io/bigwg/jsonzen:latest"
CONTAINER="jsonzen"
HOST_PORT="8508"          # 宿主机端口（浏览器访问用）
CONTAINER_PORT="80"       # 容器内 nginx 监听端口

command -v docker >/dev/null 2>&1 || { echo "❌ 未检测到 Docker，请先安装：https://docs.docker.com/get-docker/"; exit 1; }

# 1) 获取镜像：本地有则直接用，否则优先从 GHCR 拉取，再不行用当前目录 Dockerfile 构建
if docker image inspect "$IMAGE" >/dev/null 2>&1; then
  echo "✔ 使用本地已有镜像 $IMAGE"
elif docker pull "$IMAGE" >/dev/null 2>&1; then
  echo "✔ 已从 GHCR 拉取镜像 $IMAGE"
elif [ -f Dockerfile ]; then
  echo "⚠ 未找到远程镜像，使用当前目录 Dockerfile 本地构建..."
  docker build -t "$IMAGE" .
else
  echo "❌ 无法获取镜像，请先构建并推送，或在本工程目录内运行本脚本以本地构建。"
  exit 1
fi

# 2) 启动容器，映射宿主机 8508 -> 容器 80
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run -d --name "$CONTAINER" -p "${HOST_PORT}:${CONTAINER_PORT}" "$IMAGE" >/dev/null
echo "✔ 容器 $CONTAINER 已启动（端口 $HOST_PORT）"

# 3) 终端提示访问地址
echo ""
echo "✅ JsonZen 已启动！请在浏览器访问："
echo "   👉 http://localhost:${HOST_PORT}"
echo ""
echo "   停止服务： docker rm -f $CONTAINER"
