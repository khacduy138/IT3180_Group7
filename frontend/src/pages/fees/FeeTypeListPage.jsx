import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';

import TopBar from '../../components/ui/TopBar';
import Sidebar from '../../components/ui/Sidebar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';
import { Tag } from '../../components/ui/Tag';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../components/ui/Table';

const API = 'http://localhost:3001/api';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const CALC_TYPE_OPTIONS = [
  { value: '', label: 'Tất cả loại tính phí' },
  { value: 'per_area', label: 'Theo diện tích' },
  { value: 'per_vehicle', label: 'Theo phương tiện' },
  { value: 'per_person', label: 'Theo nhân khẩu' },
  { value: 'fixed', label: 'Cố định' },
  { value: 'utility', label: 'Tiện ích' },
];

const CALC_TYPE_TAGS = {
  per_area: { label: 'Theo diện tích', color: 'blue' },
  per_vehicle: { label: 'Theo phương tiện', color: 'purple' },
  per_person: { label: 'Theo nhân khẩu', color: 'cyan' },
  fixed: { label: 'Cố định', color: 'gray' },
  utility: { label: 'Tiện ích', color: 'green' },
};

const IS_ACTIVE_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'true', label: 'Đang hoạt động' },
  { value: 'false', label: 'Đã vô hiệu hóa' },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));

export default function FeeTypeListPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [calculationType, setCalculationType] = useState('');
  const [isActive, setIsActive] = useState('true');
  const [feeTypes, setFeeTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ pageSize: '100' });
      if (calculationType) params.set('calculationType', calculationType);
      if (isActive !== '') params.set('isActive', isActive);

      try {
        const res = await fetch(`${API}/fee-types?${params}`, {
          headers: authHeaders(),
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Không thể tải danh sách loại phí');
        setFeeTypes(data.data || []);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setFeeTypes([]);
          setError(err.message || 'Không thể kết nối đến máy chủ');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchData();
    return () => controller.abort();
  }, [calculationType, isActive, reloadKey]);

  return (
    <div className="min-h-screen bg-background">
      <TopBar onToggleSidebar={() => setSidebarOpen((c) => !c)} sidebarOpen={sidebarOpen} />

      <div className="flex">
        <Sidebar open={sidebarOpen} />

        <main className={`flex-1 p-8 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Loại phí</h1>
                <p className="mt-1 text-muted-foreground">Quản lý các loại phí áp dụng trong tòa nhà</p>
              </div>
              <Button onClick={() => navigate('/fee-types/new')}>
                <Plus className="h-4 w-4" />
                Tạo loại phí
              </Button>
            </div>

            <Card className="flex flex-wrap items-end gap-4">
              <label className="min-w-56 space-y-2 text-sm font-medium">
                <span>Loại tính phí</span>
                <Select
                  value={calculationType}
                  onValueChange={setCalculationType}
                  options={CALC_TYPE_OPTIONS}
                  className="w-full"
                />
              </label>
              <label className="min-w-48 space-y-2 text-sm font-medium">
                <span>Trạng thái</span>
                <Select
                  value={isActive}
                  onValueChange={setIsActive}
                  options={IS_ACTIVE_OPTIONS}
                  className="w-full"
                />
              </label>
              <Button type="button" variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
                <RefreshCw className="h-4 w-4" /> Làm mới
              </Button>
            </Card>

            <Card className="p-0">
              {loading ? (
                <div className="flex min-h-64 items-center justify-center gap-3 text-muted-foreground">
                  <Spinner className="h-6 w-6 text-primary" /> Đang tải...
                </div>
              ) : error ? (
                <div className="min-h-64 p-8 text-center text-destructive">{error}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã</TableHead>
                      <TableHead>Tên loại phí</TableHead>
                      <TableHead>Loại tính phí</TableHead>
                      <TableHead>Đơn vị</TableHead>
                      <TableHead>Đơn giá</TableHead>
                      <TableHead>Bắt buộc</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeTypes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                          Không có loại phí nào phù hợp.
                        </TableCell>
                      </TableRow>
                    ) : (
                      feeTypes.map((ft) => {
                        const calcTag = CALC_TYPE_TAGS[ft.calculation_type] || { label: ft.calculation_type, color: 'gray' };
                        return (
                          <TableRow key={ft.id}>
                            <TableCell className="font-mono text-xs">{ft.code}</TableCell>
                            <TableCell className="font-medium">{ft.name}</TableCell>
                            <TableCell>
                              <Tag color={calcTag.color}>{calcTag.label}</Tag>
                            </TableCell>
                            <TableCell>{ft.unit || <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                            <TableCell>{formatCurrency(ft.unit_price)}</TableCell>
                            <TableCell>
                              {ft.is_mandatory
                                ? <Tag color="blue">Bắt buộc</Tag>
                                : <Tag color="gray">Tùy chọn</Tag>}
                            </TableCell>
                            <TableCell>
                              {ft.is_active
                                ? <Tag color="green">Hoạt động</Tag>
                                : <Tag color="red">Vô hiệu</Tag>}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
