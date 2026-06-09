import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, Zap, Filter } from 'lucide-react';

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

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'ACTIVE', label: 'Đang thu' },
  { value: 'CLOSED', label: 'Đã đóng' },
];

const STATUS_TAGS = {
  DRAFT: { label: 'Nháp', color: 'yellow' },
  ACTIVE: { label: 'Đang thu', color: 'green' },
  CLOSED: { label: 'Đã đóng', color: 'red' },
};

const formatDate = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('vi-VN').format(new Date(`${value}T00:00:00`));
};

export default function FeeListPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [status, setStatus] = useState('');
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const fetch_ = async () => {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ pageSize: '100' });
      if (status) params.set('status', status);

      try {
        const res = await fetch(`${API}/fee-periods?${params}`, {
          headers: authHeaders(),
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Không thể tải danh sách đợt thu');
        setPeriods(data.data || []);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setPeriods([]);
          setError(err.message || 'Không thể kết nối đến máy chủ');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetch_();
    return () => controller.abort();
  }, [status, reloadKey]);

  return (
    <div className="min-h-screen bg-background">
      <TopBar onToggleSidebar={() => setSidebarOpen((c) => !c)} sidebarOpen={sidebarOpen} />

      <div className="flex">
        <Sidebar open={sidebarOpen} />

        <main className={`flex-1 p-8 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="mx-auto max-w-7xl space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Quản lý phí</h1>
                <p className="mt-1 text-muted-foreground">Quản lý đợt thu và hóa đơn tiện ích</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate('/fees/utility-invoices/new')}>
                  <Zap className="h-4 w-4" />
                  Nhập tiện ích
                </Button>
                <Button onClick={() => navigate('/fees/new')}>
                  <Plus className="h-4 w-4" />
                  Tạo đợt thu
                </Button>
              </div>
            </div>

            <div className="flex gap-2 items-center bg-card p-1.5 rounded-2xl border border-border shadow-sm transition-all w-fit max-w-2xl">
  <Select
    variant="subtle"
    size="sm"
    value={status}
    onValueChange={setStatus}
    options={STATUS_OPTIONS}
    className="h-9 rounded-xl bg-muted/50 border-none font-medium min-w-[160px]"
  />


  <Button
    variant="icon"
    className="rounded-xl h-10 w-12 p-0 flex shrink-0"
    onClick={() => setReloadKey((prev) => prev + 1)}
  >
    <Filter size={18} />
  </Button>

  <div className="h-6 w-px bg-border" />

  <Button
    variant="outline"
    className="rounded-xl h-10 px-4 flex gap-2 shrink-0 border-none hover:bg-muted font-medium text-sm text-muted-foreground"
    onClick={() => {
      setStatus("all");
      setReloadKey((prev) => prev + 1);
    }}
  >
    <RefreshCw size={16} />
    làm mới
  </Button>
</div>

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
                      <TableHead>Tên đợt thu</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Tháng / Năm</TableHead>
                      <TableHead>Ngày bắt đầu</TableHead>
                      <TableHead>Ngày kết thúc</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Loại phí</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {periods.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                          Không có đợt thu nào phù hợp.
                        </TableCell>
                      </TableRow>
                    ) : (
                      periods.map((fp) => {
                        const statusTag = STATUS_TAGS[fp.status] || { label: fp.status, color: 'yellow' };
                        return (
                          <TableRow key={fp.id}>
                            <TableCell className="font-mono text-xs">{fp.code}</TableCell>
                            <TableCell className="font-medium">{fp.name}</TableCell>
                            <TableCell>{fp.period_type}</TableCell>
                            <TableCell>
                              {fp.month ? `${fp.month}/${fp.year}` : fp.year}
                            </TableCell>
                            <TableCell>{formatDate(fp.start_date)}</TableCell>
                            <TableCell>{formatDate(fp.end_date)}</TableCell>
                            <TableCell>
                              <Tag color={statusTag.color}>{statusTag.label}</Tag>
                            </TableCell>
                            <TableCell>
                              {fp.fee_types && fp.fee_types.length > 0
                                ? fp.fee_types.map((ft) => ft.name).join(', ')
                                : <span className="text-muted-foreground text-xs">Chưa có</span>}
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
