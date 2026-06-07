import React, { useState, useEffect } from 'react';
import { Download, Users, Home, CreditCard, AlertCircle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import TopBar from '../../components/ui/TopBar';
import Sidebar from '../../components/ui/Sidebar';
import { Card, CardHeader, CardTitle, CardValue, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/Table';
import { Tag } from '../../components/ui/Tag';
import { Toast } from '../../components/ui/Toast';

const API = 'http://localhost:3001/api';

const STATUS_MAP = {
  PAID: { label: 'Đã nộp', color: 'green' },
  PARTIAL: { label: 'Nộp một phần', color: 'yellow' },
  PENDING: { label: 'Chưa nộp', color: 'red' },
};

const PIE_COLORS = ['#22c55e', '#eab308', '#ef4444'];

const formatCurrency = (val) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(val || 0));

const formatCurrencyShort = (val) => {
  const n = Number(val || 0);
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-md">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{payload[0].name}</p>
      <p style={{ color: payload[0].payload.fill }}>{payload[0].value} hóa đơn</p>
    </div>
  );
}

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({
    totalCollected: 0,
    collectionRate: 0,
    householdsWithDebt: 0,
    totalHouseholds: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [barData, setBarData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, variant: 'success', title: '', description: '' });

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const headers = authHeaders();

        const [summaryRes, invoicesRes, periodsRes] = await Promise.all([
          fetch(`${API}/dashboard/summary`, { headers }),
          fetch(`${API}/invoices?pageSize=5`, { headers }),
          fetch(`${API}/fee-periods?pageSize=12`, { headers }),
        ]);

        const [summaryResult, invoicesResult, periodsResult] = await Promise.all([
          summaryRes.json(),
          invoicesRes.json(),
          periodsRes.json(),
        ]);

        if (summaryRes.ok) {
          setStats(summaryResult.data);
        } else {
          setToast({ open: true, variant: 'error', title: 'Lỗi', description: 'Không thể tải dữ liệu thống kê' });
        }

        if (invoicesRes.ok) {
          const invoices = invoicesResult.data || [];
          setRecentInvoices(invoices);

          const paid = invoices.filter((i) => i.status === 'PAID').length;
          const partial = invoices.filter((i) => i.status === 'PARTIAL').length;
          const pending = invoices.filter((i) => i.status === 'PENDING').length;
          setPieData([
            { name: 'Đã nộp', value: paid, fill: PIE_COLORS[0] },
            { name: 'Nộp một phần', value: partial, fill: PIE_COLORS[1] },
            { name: 'Chưa nộp', value: pending, fill: PIE_COLORS[2] },
          ].filter((d) => d.value > 0));
        }

        if (periodsRes.ok) {
          const periods = (periodsResult.data || []).slice(0, 6).reverse();

          if (periods.length > 0) {
            const barResults = await Promise.all(
              periods.map((p) =>
                fetch(`${API}/dashboard/reports/by-period?periodId=${p.id}`, { headers })
                  .then((r) => r.json())
                  .catch(() => ({ data: [] }))
              )
            );

            const bars = periods.map((p, idx) => {
              const invoices = barResults[idx]?.data || [];
              const totalAmount = invoices.reduce((s, i) => s + Number(i.total_amount || 0), 0);
              const totalPaid = invoices.reduce((s, i) => s + Number(i.paid_amount || 0), 0);
              return {
                name: p.month ? `T${p.month}/${p.year}` : String(p.year),
                'Tổng phí': totalAmount,
                'Đã thu': totalPaid,
              };
            });
            setBarData(bars);
          }
        }
      } catch {
        setToast({ open: true, variant: 'error', title: 'Lỗi kết nối', description: 'Vui lòng kiểm tra server' });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <TopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />

      <div className="flex">
        <Sidebar open={sidebarOpen} />

        <main className={`flex-1 p-8 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          {loading ? (
            <div className="flex h-[60vh] w-full items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Spinner className="h-8 w-8 text-primary" />
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
                    <CardTitle>Tổng đã thu</CardTitle>
                    <CreditCard className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardValue>{formatCurrency(stats.totalCollected)}</CardValue>
                  <CardFooter>
                    <p className="text-xs text-muted-foreground">Tổng số tiền đã được thanh toán</p>
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
                      <div
                        className="bg-primary h-1.5 rounded-full"
                        style={{ width: `${Math.min(stats.collectionRate, 100)}%` }}
                      />
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
                    <p className="text-xs text-muted-foreground">Căn hộ đang hoạt động</p>
                  </CardFooter>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="text-base font-semibold mb-4">Thu phí theo đợt (6 đợt gần nhất)</h2>
                  {barData.length === 0 ? (
                    <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                      Chưa có dữ liệu đợt thu
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          stroke="var(--muted-foreground)"
                        />
                        <YAxis
                          tickFormatter={formatCurrencyShort}
                          tick={{ fontSize: 11 }}
                          stroke="var(--muted-foreground)"
                          width={56}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="Tổng phí" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="Đã thu" fill="#22c55e" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="text-base font-semibold mb-4">Tình trạng hóa đơn gần đây</h2>
                  {pieData.length === 0 ? (
                    <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                      Chưa có dữ liệu hóa đơn
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="45%"
                          outerRadius={72}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {pieData.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-base font-semibold">Hóa đơn gần đây</h2>
                  <Button variant="link" size="sm" onClick={() => window.open('/billing', '_self')}>
                    Xem tất cả
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Số hóa đơn</TableHead>
                      <TableHead>Mã hộ</TableHead>
                      <TableHead>Kỳ thu</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Chưa có dữ liệu hóa đơn
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentInvoices.map((invoice) => {
                        const statusInfo = STATUS_MAP[invoice.status] || { label: invoice.status, color: 'gray' };
                        return (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                            <TableCell>{invoice.household?.room_number ?? '-'}</TableCell>
                            <TableCell>{invoice.fee_period?.name ?? '-'}</TableCell>
                            <TableCell>{formatCurrency(invoice.total_amount)}</TableCell>
                            <TableCell>
                              <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </main>
      </div>

      <Toast
        open={toast.open}
        onOpenChange={(open) => setToast({ ...toast, open })}
        variant={toast.variant}
        title={toast.title}
        description={toast.description}
      />
    </div>
  );
}
