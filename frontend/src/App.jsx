import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { buttonVariants } from './components/ui/Button';
import UISample from './pages/UISample';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import UserManagementPage from './pages/auth/UserManagementPage';
import InvoiceListPage from './pages/billing/InvoiceListPage';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
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
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <UserManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <ProtectedRoute>
              <InvoiceListPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
