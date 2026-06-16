import { useNavigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { Button } from '../components/ui/Button';

const roleHomeMap = {
  admin: '/dashboard',
  accountant: '/billing',
  staff: '/households',
};

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const role = localStorage.getItem('userRole');
  const homePath = roleHomeMap[role] || '/dashboard';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-8">
      <ShieldOff className="text-muted-foreground" size={64} />
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">403 — Không có quyền truy cập</h1>
        <p className="text-muted-foreground">Bạn không có quyền truy cập trang này.</p>
      </div>
      <Button onClick={() => navigate(homePath)}>Về trang chủ</Button>
    </div>
  );
}
