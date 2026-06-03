# 税务CRM系统 - 完整启动脚本
# 同时启动前端和后端服务

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  税务CRM系统 - 启动中..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js
Write-Host "检查 Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 未安装 Node.js，请先安装 Node.js" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js 版本: $nodeVersion" -ForegroundColor Green
Write-Host ""

# 检查 PostgreSQL
Write-Host "检查 PostgreSQL..." -ForegroundColor Yellow
$pgVersion = psql --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  未检测到 PostgreSQL，请确保数据库服务正在运行" -ForegroundColor Yellow
} else {
    Write-Host "✅ PostgreSQL 已安装" -ForegroundColor Green
}
Write-Host ""

# 启动后端服务
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  启动后端服务..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run dev
}

Write-Host "✅ 后端服务启动中... (端口: 3000)" -ForegroundColor Green
Start-Sleep -Seconds 3

# 启动前端服务
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "  启动前端服务..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$frontendJob = Start-Job -ScriptBlock {
    Set-Location "$using:PWD\client"
    npm run dev
}

Write-Host "✅ 前端服务启动中... (端口: 5173)" -ForegroundColor Green
Start-Sleep -Seconds 3

# 显示启动信息
Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "  🎉 服务启动成功！" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "📍 前端地址: " -NoNewline -ForegroundColor Yellow
Write-Host "http://localhost:5173" -ForegroundColor Cyan
Write-Host "📍 后端地址: " -NoNewline -ForegroundColor Yellow
Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host "📍 API 文档: " -NoNewline -ForegroundColor Yellow
Write-Host "http://localhost:3000/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "👤 测试账号:" -ForegroundColor Yellow
Write-Host "   用户名: admin" -ForegroundColor White
Write-Host "   密码: admin123" -ForegroundColor White
Write-Host ""
Write-Host "📚 查看详细文档: 前端访问指南.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "按 Ctrl+C 停止所有服务" -ForegroundColor Gray
Write-Host ""

# 等待用户中断
try {
    while ($true) {
        Start-Sleep -Seconds 1
        
        # 检查任务状态
        if ($backendJob.State -eq "Failed") {
            Write-Host "❌ 后端服务异常退出" -ForegroundColor Red
            break
        }
        if ($frontendJob.State -eq "Failed") {
            Write-Host "❌ 前端服务异常退出" -ForegroundColor Red
            break
        }
    }
} finally {
    Write-Host ""
    Write-Host "正在停止服务..." -ForegroundColor Yellow
    
    # 停止所有任务
    Stop-Job -Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job -Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $frontendJob -ErrorAction SilentlyContinue
    
    Write-Host "✅ 所有服务已停止" -ForegroundColor Green
}




