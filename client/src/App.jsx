import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Calls from './pages/Calls';
import EmployeeList from './pages/employee/EmployeeList';
import EmployeeDetail from './pages/employee/EmployeeDetail';
import EmployeeForm from './pages/employee/EmployeeForm';
import CustomerList from './pages/customer/CustomerList';
import CustomerDetail from './pages/customer/CustomerDetail';
// Phase 2: Sales Funnel & Customer Grading
import SalesFunnel from './pages/salesFunnel/SalesFunnel';
import TagManagement from './pages/tagManagement/TagManagement';
import ClientGrading from './pages/clientGrading/ClientGrading';
// Phase 3: Analytics
import SalesAnalytics from './pages/analytics/SalesAnalytics';
import CustomerAnalytics from './pages/analytics/CustomerAnalytics';
import FollowUpAnalytics from './pages/analytics/FollowUpAnalytics';
import CallAnalytics from './pages/analytics/CallAnalytics';
// Phase 4: Customer Expansion
import CustomerLeads from './pages/CustomerLeads';
import CustomerPool from './pages/CustomerPool';
import ConversionFunnel from './pages/customer/ConversionFunnel';
import FollowUpStatistics from './pages/FollowUpStatistics';
import Settings from './pages/Settings';
import LeadTagManagement from './pages/LeadTagManagement';
import LeadDetail from './pages/LeadDetail';
// Call System
import CallRecords from './pages/CallRecords';
import CallTaskList from './pages/CallTaskList';

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          colorSuccess: '#52c41a',
          colorWarning: '#faad14',
          colorError: '#ff4d4f',
          colorInfo: '#1677ff',
          colorTextBase: '#1f1f1f',
          colorBgBase: '#ffffff',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', sans-serif",
          borderRadius: 6,
        },
        components: {
          Table: {
            headerBg: '#fafafa',
            rowHoverBg: '#e6f4ff',
            borderColor: '#f0f0f0',
          },
          Menu: {
            darkItemBg: '#001529',
            darkSubMenuItemBg: '#000c17',
            darkItemColor: 'rgba(255,255,255,0.65)',
            darkItemHoverBg: 'rgba(255,255,255,0.08)',
            darkItemSelectedBg: '#1677ff',
          },
          Layout: {
            siderBg: '#001529',
          },
        },
      }}
    >
      <AuthProvider>
        <Router>
        <Routes>
          {/* 公开路由 */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 受保护的路由 */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route
              path="clients"
              element={
                <PrivateRoute roles={['admin', 'manager', 'sales']}>
                  <Clients />
                </PrivateRoute>
              }
            />
            <Route
              path="customers"
              element={
                <PrivateRoute roles={['admin', 'manager', 'sales']}>
                  <CustomerList />
                </PrivateRoute>
              }
            />
            <Route
              path="customers/:id"
              element={
                <PrivateRoute roles={['admin', 'manager', 'sales']}>
                  <CustomerDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="sales-funnel"
              element={
                <PrivateRoute roles={['admin', 'manager', 'sales']}>
                  <SalesFunnel />
                </PrivateRoute>
              }
            />
            <Route
              path="tag-management"
              element={
                <PrivateRoute roles={['admin', 'manager']}>
                  <TagManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="client-grading"
              element={
                <PrivateRoute roles={['admin', 'manager']}>
                  <ClientGrading />
                </PrivateRoute>
              }
            />
            <Route
              path="analytics/sales"
              element={
                <PrivateRoute roles={['admin', 'manager']}>
                  <SalesAnalytics />
                </PrivateRoute>
              }
            />
            <Route
              path="analytics/customers"
              element={
                <PrivateRoute roles={['admin', 'manager']}>
                  <CustomerAnalytics />
                </PrivateRoute>
              }
            />
            <Route
              path="analytics/follow-ups"
              element={
                <PrivateRoute roles={['admin', 'manager']}>
                  <FollowUpAnalytics />
                </PrivateRoute>
              }
            />
            <Route
              path="analytics/calls"
              element={
                <PrivateRoute roles={['admin', 'manager']}>
                  <CallAnalytics />
                </PrivateRoute>
              }
            />
            <Route
              path="calls"
              element={
                <PrivateRoute>
                  <Calls />
                </PrivateRoute>
              }
            />
            <Route
              path="leads"
              element={
                <PrivateRoute roles={['admin', 'manager', 'sales']}>
                  <CustomerLeads />
                </PrivateRoute>
              }
            />
            <Route
              path="leads/:id"
              element={
                <PrivateRoute roles={['admin', 'manager', 'sales']}>
                  <LeadDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="customer-pool"
              element={
                <PrivateRoute roles={['admin', 'manager', 'sales']}>
                  <CustomerPool />
                </PrivateRoute>
              }
            />
            <Route
              path="conversion-funnel"
              element={
                <PrivateRoute roles={['admin', 'manager', 'sales']}>
                  <ConversionFunnel />
                </PrivateRoute>
              }
            />
            <Route
              path="follow-up-statistics"
              element={
                <PrivateRoute roles={['admin', 'manager', 'sales']}>
                  <FollowUpStatistics />
                </PrivateRoute>
              }
            />
            <Route
              path="lead-tags"
              element={
                <PrivateRoute roles={['admin', 'manager']}>
                  <LeadTagManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="call-records"
              element={
                <PrivateRoute roles={['admin', 'manager', 'sales']}>
                  <CallRecords />
                </PrivateRoute>
              }
            />
            <Route
              path="call-tasks"
              element={
                <PrivateRoute roles={['admin', 'manager', 'sales']}>
                  <CallTaskList />
                </PrivateRoute>
              }
            />
            <Route
              path="employees"
              element={
                <PrivateRoute roles={['admin', 'manager']}>
                  <EmployeeList />
                </PrivateRoute>
              }
            />
            <Route
              path="employees/:id"
              element={
                <PrivateRoute roles={['admin', 'manager']}>
                  <EmployeeDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="employees/create"
              element={
                <PrivateRoute roles={['admin']}>
                  <EmployeeForm />
                </PrivateRoute>
              }
            />
            <Route
              path="employees/:id/edit"
              element={
                <PrivateRoute roles={['admin', 'manager']}>
                  <EmployeeForm />
                </PrivateRoute>
              }
            />
            <Route
              path="settings"
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              }
            />
          </Route>

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
