@echo off
chcp 65001 >nul
echo ========================================
echo   财税CRM系统 - 快速启动
echo ========================================
echo.
echo 请选择启动模式：
echo.
echo 1. 启动后端服务器 (端口 3000)
echo 2. 启动前端应用 (端口 5173)
echo 3. 同时启动前后端
echo 4. 初始化项目
echo 5. 退出
echo.
set /p choice="请输入选项 (1-5): "

if "%choice%"=="1" (
    echo.
    echo 启动后端服务器...
    npm run dev
) else if "%choice%"=="2" (
    echo.
    echo 启动前端应用...
    cd client
    npm run dev
) else if "%choice%"=="3" (
    echo.
    echo 同时启动前后端...
    start "后端服务器" cmd /k "npm run dev"
    timeout /t 2 /nobreak >nul
    start "前端应用" cmd /k "cd client && npm run dev"
    echo.
    echo 前后端已在新窗口中启动
    echo 前端: http://localhost:5173
    echo 后端: http://localhost:3000
    echo.
    pause
) else if "%choice%"=="4" (
    echo.
    echo 初始化项目...
    echo 1/4 安装后端依赖...
    call npm install
    echo 2/4 安装前端依赖...
    cd client
    call npm install
    cd ..
    echo 3/4 创建必要目录...
    call npm run init
    echo 4/4 完成！
    echo.
    echo 下一步：
    echo 1. 确保 PostgreSQL 正在运行
    echo 2. 创建数据库: psql -U postgres -c "CREATE DATABASE tax_crm;"
    echo 3. 运行迁移: npm run db:migrate
    echo 4. 重新运行此脚本选择启动模式
    echo.
    pause
) else if "%choice%"=="5" (
    echo.
    echo 再见！
    exit
) else (
    echo.
    echo 无效选择
    pause
)





