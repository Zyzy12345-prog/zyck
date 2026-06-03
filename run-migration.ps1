# 跟进记录功能 - 数据库迁移脚本
# 解决编码问题并验证迁移结果

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  跟进记录功能 - 数据库迁移" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 设置环境变量以使用UTF-8编码
$env:PGCLIENTENCODING = "UTF8"

Write-Host "步骤 1: 执行数据库迁移..." -ForegroundColor Yellow
Write-Host "使用 UTF-8 编码执行 SQL 脚本" -ForegroundColor Gray
Write-Host ""

# 执行迁移
$result = psql -U postgres -d tax_crm -f migration-fix.sql 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ 数据库迁移执行完成" -ForegroundColor Green
} else {
    Write-Host "⚠ 迁移过程中有一些警告，继续验证..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "步骤 2: 验证迁移结果..." -ForegroundColor Yellow

# 验证表是否创建
Write-Host ""
Write-Host "检查表是否创建成功..." -ForegroundColor Gray

$tables = @('follow_ups', 'follow_up_comments', 'customer_files', 'customer_discussions', 'follow_up_reminders')

foreach ($table in $tables) {
    $check = psql -U postgres -d tax_crm -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '$table';" 2>&1
    if ($check -match "1") {
        Write-Host "  ✓ $table 表已创建" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $table 表未创建" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  迁移完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "下一步操作：" -ForegroundColor White
Write-Host ""
Write-Host "1. 安装前端依赖：" -ForegroundColor Yellow
Write-Host "   cd client" -ForegroundColor Cyan
Write-Host "   npm install react-quill dayjs" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. 启动后端服务：" -ForegroundColor Yellow
Write-Host "   npm start" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. 启动前端服务（新终端）：" -ForegroundColor Yellow
Write-Host "   cd client" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. 访问系统：" -ForegroundColor Yellow
Write-Host "   http://localhost:5173/customers" -ForegroundColor Cyan
Write-Host ""

Read-Host "按 Enter 键退出"














