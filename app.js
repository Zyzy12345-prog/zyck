const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// 支持两种 .env 位置：
// 1) 项目根目录: tax-crm-system/.env（推荐）
// 2) server 目录: tax-crm-system/server/.env（兼容你的当前结构）
const rootEnvPath = path.join(process.cwd(), '.env');
const serverEnvPath = path.join(process.cwd(), 'server', '.env');
dotenv.config({ path: fs.existsSync(rootEnvPath) ? rootEnvPath : serverEnvPath });
const express = require('express');
const cors = require('cors');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// 导入路由
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const callRoutes = require('./routes/calls');
const userRoutes = require('./routes/users');
const employeeRoutes = require('./routes/employees');
const roleRoutes = require('./routes/roles');
// Phase 2: Sales funnel and customer grading
const salesFunnelRoutes = require('./routes/salesFunnel');
const customerTagRoutes = require('./routes/customerTags');
const clientScoringRoutes = require('./routes/clientScoring');
// Phase 3: Analytics
const analyticsRoutes = require('./routes/analytics');
// Phase 4: Customer Expansion
const customerLeadRoutes = require('./routes/customerLeads');
const customerPoolRoutes = require('./routes/customerPool');
const leadFollowUpRoutes = require('./routes/leadFollowUps');
const leadTagRoutes = require('./routes/leadTags');
const followUpReminderRoutes = require('./routes/followUpReminders');
// Call System
const callRecordRoutes = require('./routes/callRecords');
const callTaskRoutes = require('./routes/callTasks');
const callScriptTemplateRoutes = require('./routes/callScriptTemplates');
const fileUploadRoutes = require('./routes/fileUploads');
const chatRoutes = require('./routes/chat');
const communicationRoutes = require('./routes/communications');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（用于上传的文件）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/users', userRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/roles', roleRoutes);
// Phase 2: Sales funnel and customer grading
app.use('/api/sales-funnel', salesFunnelRoutes);
app.use('/api/customer-tags', customerTagRoutes);
app.use('/api/client-scoring', clientScoringRoutes);
// Phase 3: Analytics
app.use('/api/analytics', analyticsRoutes);
// Phase 4: Customer Expansion
app.use('/api/leads', customerLeadRoutes);
app.use('/api/customer-pool', customerPoolRoutes);
app.use('/api', leadFollowUpRoutes);
app.use('/api/lead-tags', leadTagRoutes);
app.use('/api', followUpReminderRoutes);
// Call System
app.use('/api/call', callRecordRoutes);
app.use('/api/call', callTaskRoutes);
app.use('/api/call', callScriptTemplateRoutes);
app.use('/api/files', fileUploadRoutes);
// Chat System
app.use('/api/chat', chatRoutes);
// Communication (Mock / real provider adapter later)
app.use('/api/communications', communicationRoutes);

// 404处理
app.use(notFound);

// 错误处理
app.use(errorHandler);

module.exports = app;
