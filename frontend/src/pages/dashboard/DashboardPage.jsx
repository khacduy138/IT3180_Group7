import React, { useState, useEffect } from 'react';
import { Download, Users, Home, CreditCard, AlertCircle } from 'lucide-react';

// Import Layout & UI Components
import TopBar from '../../components/ui/TopBar';
import Sidebar from '../../components/ui/Sidebar';
import { Card, CardHeader, CardTitle, CardValue, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/Table';
import { Tag } from '../../components/ui/Tag';
import { Toast } from '../../components/ui/Toast';

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({
    totalCollected: 0,
    collectionRate: 0,
    householdsWithDebt: 0,
    totalHouseholds: 0
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, variant: 'success', title: '', description: '' });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/dashboard/summary', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await response.json();
        if (response.ok) {
          setStats(result.data);
        } else {
          setToast({ open: true, variant: 'error', title: 'Lỗi', description: 'Không thể tải dữ liệu thống kê' });
        }
      } catch (error) {
        setToast({ open: true, variant: 'error', title: 'Lỗi kết nối', description: 'Vui lòng kiểm tra server' });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="min-h-screen bg-background">
      <TopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />

      <div className="flex">
        <Sidebar open={sidebarOpen} />

        <main className={`flex-1 p-8 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
            {loading ? (
              <div className="flex h-[60vh] w-full items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Spinner className="h-8 w-8 text-primary" /> {/* Hoặc dùng component Spinner của Trung */}
                  <p className="text-muted-foreground animate-pulse">Đang tải dữ liệu...</p>
                </div>
              </div>
            ) : (
          <div className="max-w-7xl mx-auto space-y-8">
            
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground">Dashboard</h1>
                <p className="text-muted-foreground mt-1">Chào mừng quay trở lại, Admin.</p>
              </div>
              <Button variant="outline" className="gap-2">
                <Download size={18} /> Export report
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>Tổng thu tháng này</CardTitle>
                  <CreditCard className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardValue>{formatCurrency(stats.totalCollected)}</CardValue>
                <CardFooter>
                  <p className="text-xs text-green-500 font-medium">↑ 12% so với tháng trước</p>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>Tỷ lệ đóng phí</CardTitle>
                  <Home className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardValue>{stats.collectionRate}%</CardValue>
                <CardFooter>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${stats.collectionRate}%` }}></div>
                  </div>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>Số hộ còn nợ</CardTitle>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardValue>{stats.householdsWithDebt}</CardValue>
                <CardFooter>
                  <p className="text-xs text-muted-foreground">Cần gửi thông báo nhắc nhở</p>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>Tổng số căn hộ</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardValue>{stats.totalHouseholds}</CardValue>
                <CardFooter>
                  <p className="text-xs text-muted-foreground">98% đang có người ở</p>
                </CardFooter>
              </Card>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Tình trạng thu phí gần đây</h2>
                <Button variant="link" size="sm">Xem tất cả</Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã hộ</TableHead>
                    <TableHead>Đầu mục</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">HH-A101</TableCell>
                    <TableCell>Phí quản lý tháng 5</TableCell>
                    <TableCell>{formatCurrency(1500000)}</TableCell>
                    <TableCell><Tag color="green">Đã nộp</Tag></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">HH-B204</TableCell>
                    <TableCell>Tiền điện tháng 5</TableCell>
                    <TableCell>{formatCurrency(840000)}</TableCell>
                    <TableCell><Tag color="yellow">Chưa nộp</Tag></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">HH-C506</TableCell>
                    <TableCell>Phí vệ sinh</TableCell>
                    <TableCell>{formatCurrency(100000)}</TableCell>
                    <TableCell><Tag color="red">Muộn</Tag></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )}
        </main>
      </div>

      <Toast 
        open={toast.open} 
        onOpenChange={(open) => setToast({...toast, open})}
        variant={toast.variant}
        title={toast.title}
        description={toast.description}
      />
    </div>
  );
}