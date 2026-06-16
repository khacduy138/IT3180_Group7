import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { buttonVariants } from './components/ui/Button';
import UISample from './pages/UISample';
import LoginPage from './pages/auth/LoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import UserManagementPage from './pages/auth/UserManagementPage';
import InvoiceListPage from './pages/billing/InvoiceListPage';
import PaymentHistoryPage from './pages/billing/PaymentHistoryPage';
import PaymentPage from './pages/billing/PaymentPage';
import HouseholdDetailPage from './pages/households/HouseholdDetailPage';
import HouseholdsListPage from './pages/households/HouseholdsListPage';
import FeeListPage from './pages/fees/FeeListPage';
import FeeTypeListPage from './pages/fees/FeeTypeListPage';
import FeePeriodForm from './pages/fees/FeePeriodForm';
import UtilityInvoiceForm from './pages/fees/UtilityInvoiceForm';
import ReportPage from './pages/dashboard/ReportPage';
import SettingsPage from './pages/settings/SettingsPage';

function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles) {
    const userRole = localStorage.getItem('userRole');
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }
  return children;
}

function HomePage() {
  return (
    <div className="bg-background text-foreground min-h-screen p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold text-primary">BlueMoon AMS</h1>
        <p className="text-lg text-muted-foreground">Apartment Management System</p>
        <Link className={buttonVariants({ variant: 'default' })} to="/uisample">
          Xem sample o day
        </Link>
        <Link className={buttonVariants({ variant: 'outline' })} to="/login">
          Đăng nhập
        </Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/uisample" element={<UISample />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin', 'accountant']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <ProtectedRoute allowedRoles={['admin', 'accountant']}>
              <InvoiceListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute allowedRoles={['admin', 'accountant']}>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments/history"
          element={
            <ProtectedRoute allowedRoles={['admin', 'accountant']}>
              <PaymentHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/households"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <HouseholdsListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/households/:id"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <HouseholdDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fees"
          element={
            <ProtectedRoute allowedRoles={['admin', 'accountant']}>
              <FeeListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fees/new"
          element={
            <ProtectedRoute allowedRoles={['admin', 'accountant']}>
              <FeePeriodForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fees/utility-invoices/new"
          element={
            <ProtectedRoute allowedRoles={['admin', 'accountant']}>
              <UtilityInvoiceForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fee-types"
          element={
            <ProtectedRoute allowedRoles={['admin', 'accountant']}>
              <FeeTypeListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['admin', 'accountant']}>
              <ReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
