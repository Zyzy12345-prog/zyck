# 财税CRM系统 - 启动脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  财税CRM系统 - 启动脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查Node.js
Write-Host "检查 Node.js..." -ForegroundColor Yellow
$nodeVersion = node -v 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "未安装 Node.js，请先安装 Node.js" -ForegroundColor Red
    exit 1
}
Write-Host "Node.js 版本: $nodeVersion" -ForegroundColor Green

# 检查PostgreSQL
Write-Host "检查 PostgreSQL..." -ForegroundColor Yellow
$pgVersion = psql --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "未检测到 PostgreSQL，请确保已安装并配置" -ForegroundColor Yellow
} else {
    Write-Host "PostgreSQL 已安装" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  选择启动模式" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. 启动后端服务器 (端口 3000)" -ForegroundColor White
Write-Host "2. 启动前端应用 (端口 5173)" -ForegroundColor White
Write-Host "3. 同时启动前后端" -ForegroundColor White
Write-Host "4. 初始化项目（首次运行）" -ForegroundColor White
Write-Host "5. 退出" -ForegroundColor White
Write-Host ""

$choice = Read-Host "请选择 (1-5)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "启动后端服务器..." -ForegroundColor Green
        Write-Host ""
        npm run dev
    }
    "2" {
        Write-Host ""
        Write-Host "启动前端应用..." -ForegroundColor Green
        Write-Host ""
        Set-Location client
        npm run dev
    }
    "3" {
        Write-Host ""
        Write-Host "同时启动前后端..." -ForegroundColor Green
        Write-Host ""
        
        # 获取当前路径
        $currentPath = Get-Location
        
        # 启动后端
        $backendCmd = "cd '$currentPath'; Write-Host '后端服务器启动中...' -ForegroundColor Green; npm run dev"
        Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd
        
        # 等待2秒
        Start-Sleep -Seconds 2
        
        # 启动前端
        $frontendCmd = "cd '$currentPath\client'; Write-Host '前端应用启动中...' -ForegroundColor Green; npm run dev"
        Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd
        
        Write-Host ""
        Write-Host "前后端已在新窗口中启动" -ForegroundColor Green
        Write-Host ""
        Write-Host "访问地址：" -ForegroundColor Cyan
        Write-Host "  前端: http://localhost:5173" -ForegroundColor White
        Write-Host "  后端: http://localhost:3000" -ForegroundColor White
        Write-Host ""
        Write-Host "按任意键退出..." -ForegroundColor Yellow
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
    "4" {
        Write-Host ""
        Write-Host "初始化项目..." -ForegroundColor Green
        Write-Host ""
        
        # 安装后端依赖
        Write-Host "1/4 安装后端依赖..." -ForegroundColor Yellow
        npm install
        
        # 安装前端依赖
        Write-Host "2/4 安装前端依赖..." -ForegroundColor Yellow
        Set-Location client
        npm install
        Set-Location ..
        
        # 创建上传目录
        Write-Host "3/4 创建必要目录..." -ForegroundColor Yellow
        npm run init
        
        # 提示配置环境变量
        Write-Host "4/4 配置检查..." -ForegroundColor Yellow
        if (Test-Path .env) {
            Write-Host ".env 文件已存在" -ForegroundColor Green
        } else {
            Write-Host "请创建 .env 文件并配置数据库连接" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "初始化完成！" -ForegroundColor Green
        Write-Host ""
        Write-Host "下一步：" -ForegroundColor Cyan
        Write-Host "1. 确保 PostgreSQL 正在运行" -ForegroundColor White
        Write-Host "2. 创建数据库: psql -U postgres -c `"CREATE DATABASE tax_crm;`"" -ForegroundColor White
        Write-Host "3. 运行迁移: npm run db:migrate" -ForegroundColor White
        Write-Host "4. 重新运行此脚本选择启动模式" -ForegroundColor White
        Write-Host ""
        Write-Host "按任意键退出..." -ForegroundColor Yellow
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
    "5" {
        Write-Host ""
        Write-Host "再见！" -ForegroundColor Cyan
        exit 0
    }
    default {
        Write-Host ""
        Write-Host "无效选择" -ForegroundColor Red
        exit 1
    }
}
