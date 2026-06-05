import React, { useState, useEffect } from 'react';
import { Shield, UserPlus, Search, MoreVertical, UserCheck, UserMinus } from 'lucide-react';

import TopBar from '../../components/ui/TopBar';
import Sidebar from '../../components/ui/Sidebar';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Tag } from '../../components/ui/Tag';
import { Spinner } from '../../components/ui/Spinner';
import { Toast } from '../../components/ui/Toast';
import { Input } from '../../components/ui/Input';

export default function UserManagementPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, variant: 'success', title: '', description: '' });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const result = await response.json();
        
        if (response.ok) {
          setUsers(result.data || result); 
        } else {
          throw new Error(result.message || 'Không có quyền truy cập dữ liệu này');
        }
      } catch (error) {
        setToast({
          open: true,
          variant: 'error',
          title: 'Lỗi bảo mật',
          description: error.message
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const getRoleBadge = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case 'admin': return <Tag color="red">Quản trị viên</Tag>;
      case 'accountant': return <Tag color="green">Kế toán</Tag>;
      case 'staff': return <Tag color="yellow">Nhân viên</Tag>;
      default: return <Tag color="green">Cư dân</Tag>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />

      <div className="flex">
        <Sidebar open={sidebarOpen} />

        <main className={`flex-1 p-8 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="max-w-7xl mx-auto space-y-8">
            
            <div className="flex justify-between items-end">
              <div>
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Shield size={20} />
                  <span className="text-sm font-bold uppercase tracking-wider">Hệ thống quản trị</span>
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground">Quản lý người dùng</h1>
              </div>
              
              <Button className="gap-2" variant="default">
                <UserPlus size={18} /> Thêm tài khoản
              </Button>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input placeholder="Tìm theo tên hoặc username..." className="pl-10" />
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Tổng cộng: {users.length} tài khoản
                </div>
              </div>

              {loading ? (
                <div className="flex h-64 w-full flex-col items-center justify-center gap-4">
                  <Spinner size="lg" className="text-primary" />
                  <p className="text-muted-foreground animate-pulse font-medium">Đang tải danh sách người dùng...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Tên đăng nhập</TableHead>
                      <TableHead>Vai trò</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">#{user.id}</TableCell>
                          <TableCell>
                            <div className="font-bold text-foreground">{user.username}</div>
                          </TableCell>
                          <TableCell>{getRoleBadge(user.role?.name || user.role)}</TableCell>
                          <TableCell>
                            {user.is_active ? (
                              <div className="flex items-center gap-1.5 text-green-600 font-medium text-xs">
                                <UserCheck size={14} /> Hoạt động
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-destructive font-medium text-xs">
                                <UserMinus size={14} /> Bị khóa
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(user.created_at).toLocaleDateString('vi-VN')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="icon" className="h-8 w-8">
                              <MoreVertical size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                          Không tìm thấy người dùng nào trong hệ thống.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
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