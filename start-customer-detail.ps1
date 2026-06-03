# 客户详情页功能启动脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  客户详情页（360度视图）启动脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否在项目根目录
if (-not (Test-Path "package.json")) {
    Write-Host "错误: 请在项目根目录运行此脚本" -ForegroundColor Red
    exit 1
}

# 步骤1: 运行数据库迁移
Write-Host "步骤 1/3: 运行数据库迁移..." -ForegroundColor Yellow
Write-Host "执行命令: npx sequelize-cli db:migrate" -ForegroundColor Gray
npx sequelize-cli db:migrate

if ($LASTEXITCODE -ne 0) {
    Write-Host "数据库迁移失败！" -ForegroundColor Red
    Write-Host "请检查数据库连接配置" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ 数据库迁移完成" -ForegroundColor Green
Write-Host ""

# 步骤2: 检查前端依赖
Write-Host "步骤 2/3: 检查前端依赖..." -ForegroundColor Yellow
cd client

# 检查 dayjs 是否已安装
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$hasDayjs = $packageJson.dependencies.PSObject.Properties.Name -contains "dayjs"

if (-not $hasDayjs) {
    Write-Host "安装 dayjs 依赖..." -ForegroundColor Gray
    npm install dayjs
    Write-Host "✓ dayjs 安装完成" -ForegroundColor Green
} else {
    Write-Host "✓ dayjs 已安装" -ForegroundColor Green
}

cd ..
Write-Host ""

# 步骤3: 显示启动说明
Write-Host "步骤 3/3: 准备启动服务..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  环境准备完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "接下来请按以下步骤启动服务：" -ForegroundColor White
Write-Host ""
Write-Host "1. 启动后端服务（在当前终端）：" -ForegroundColor Yellow
Write-Host "   npm start" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. 启动前端服务（在新终端）：" -ForegroundColor Yellow
Write-Host "   cd client" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. 访问系统：" -ForegroundColor Yellow
Write-Host "   前端地址: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   后端地址: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. 使用客户详情页：" -ForegroundColor Yellow
Write-Host "   - 登录系统" -ForegroundColor White
Write-Host "   - 进入客户管理页面" -ForegroundColor White
Write-Host "   - 点击任意客户名称查看详情" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "详细文档请查看: 客户详情页开发完成总结.md" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 询问是否立即启动后端
$response = Read-Host "是否立即启动后端服务？(Y/N)"
if ($response -eq "Y" -or $response -eq "y") {
    Write-Host ""
    Write-Host "正在启动后端服务..." -ForegroundColor Green
    npm start
}














