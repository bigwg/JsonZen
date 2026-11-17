# JsonZen 一键启动脚本（Windows / PowerShell）
# 作用：拉取（或本地构建兜底）JsonZen 镜像 -> docker run 起服务 -> 终端输出访问地址
# 使用端无需 clone 源码、无需 npm install。访问地址：http://localhost:8508

$ErrorActionPreference = "Stop"
$IMAGE        = "ghcr.io/bigwg/jsonzen:latest"
$CONTAINER    = "jsonzen"
$HOST_PORT    = "8508"   # 宿主机端口（浏览器访问用）
$CONTAINER_PORT = "80"   # 容器内 nginx 监听端口

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Error "❌ 未检测到 Docker，请先安装 Docker Desktop：https://docs.docker.com/desktop/install/windows-install/"
  exit 1
}

# 1) 获取镜像
$local = docker images --format "{{.Repository}}:{{.Tag}}" | Where-Object { $_ -eq $IMAGE }
if (-not $local) {
  try { docker pull $IMAGE | Out-Null; Write-Host "✔ 已从 GHCR 拉取镜像 $IMAGE" }
  catch {
    if (Test-Path Dockerfile) { docker build -t $IMAGE .; Write-Host "⚠ 使用当前目录 Dockerfile 本地构建" }
    else { Write-Error "❌ 无法获取镜像，请先构建并推送，或在本工程目录内运行本脚本。"; exit 1 }
  }
} else { Write-Host "✔ 使用本地已有镜像 $IMAGE" }

# 2) 启动容器，映射 8508 -> 80
docker rm -f $CONTAINER 2>$null | Out-Null
docker run -d --name $CONTAINER -p "${HOST_PORT}:${CONTAINER_PORT}" $IMAGE | Out-Null
Write-Host "✔ 容器 $CONTAINER 已启动（端口 $HOST_PORT）"

# 3) 终端提示访问地址
Write-Host ""
Write-Host "✅ JsonZen 已启动！请在浏览器访问："
Write-Host "   👉 http://localhost:$HOST_PORT"
Write-Host ""
Write-Host "   停止服务： docker rm -f $CONTAINER"
