# 简单启动脚本 - 同时启动前后端

Write-Host "启动财税CRM系统..." -ForegroundColor Green
Write-Host ""

# 获取当前路径
$currentPath = Get-Location

# 启动后端
Write-Host "启动后端服务器..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$currentPath'; npm run dev"

# 等待2秒
Start-Sleep -Seconds 2

# 启动前端
Write-Host "启动前端应用..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$currentPath\client'; npm run dev"

Write-Host ""
Write-Host "前后端已启动！" -ForegroundColor Green
Write-Host ""
Write-Host "访问地址：" -ForegroundColor Cyan
Write-Host "  前端: http://localhost:5173" -ForegroundColor White
Write-Host "  后端: http://localhost:3000" -ForegroundColor White
Write-Host ""





