@echo off
echo ========================================
echo 启动财税CRM系统后端服务
echo ========================================
echo.

cd /d %~dp0

echo [1/3] 检查环境...
if not exist node_modules (
    echo 错误: node_modules 不存在，请先运行 npm install
    pause
    exit /b 1
)

echo [2/3] 检查数据库连接...
node check-users.js
if errorlevel 1 (
    echo 警告: 数据库检查失败，但继续启动...
)

echo.
echo [3/3] 启动服务器...
echo ========================================
echo 服务器将在 http://localhost:3000 启动
echo 按 Ctrl+C 停止服务器
echo ========================================
echo.

npm start










