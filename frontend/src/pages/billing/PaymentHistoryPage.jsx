import { useEffect, useState } from 'react';
import { RefreshCw, Calendar, X } from 'lucide-react';

import TopBar from '../../components/ui/TopBar';
import Sidebar from '../../components/ui/Sidebar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Tag } from '../../components/ui/Tag';
import { Spinner } from '../../components/ui/Spinner';
import { Select } from '../../components/ui/Select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/Table';

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(Number(value || 0));

const formatDateTime = (value) => {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export default function PaymentHistoryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const [paymentStatus, setPaymentStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      const params = new URLSearchParams({
        q: debouncedQuery,
        status: paymentStatus,
        startDate: startDate,
        endDate: endDate
      });

      try {
        const response = await fetch(`http://localhost:3001/api/billing/payments?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const result = await response.json();

        if (response.ok) {
          setPayments(result.data || []);
        } else {
          setPayments([]);
        }
      } catch (error) {
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [debouncedQuery, paymentStatus, startDate, endDate, reloadKey]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <TopBar
        onToggleSidebar={() => setSidebarOpen((current) => !current)}
        sidebarOpen={sidebarOpen}
      />

      <div className="flex">
        <Sidebar open={sidebarOpen} />

        <main
          className={`flex-1 p-8 transition-all duration-300 ${
            sidebarOpen ? 'ml-64' : 'ml-0'
          }`}
        >
          <div className="mx-auto max-w-7xl space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Lịch sử thanh toán</h1>
              <p className="mt-1 text-muted-foreground">
                Xem lịch sử các khoản thanh toán đã ghi nhận.
              </p>
            </div>

            <div className="flex gap-2 items-center bg-card p-1.5 rounded-2xl border border-border shadow-sm transition-all w-full max-w-5xl">
              <Select
                variant="subtle"
                size="sm"
                value={paymentStatus}
                onValueChange={setPaymentStatus}
                options={[
                  { value: "all", label: "tất cả trạng thái" },
                  { value: "SUCCESS", label: "thành công" },
                  { value: "FAILED", label: "thất bại" },
                ]}
                className="h-9 rounded-xl bg-muted/50 border-none font-medium min-w-[160px]"
              />

              <div className="h-6 w-px bg-border" />

              <Input
                placeholder="tìm theo phòng hoặc mã hóa đơn..."
                className="border-none bg-transparent focus-visible:ring-0 text-base h-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                rightIcon={
                  searchQuery.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full"
                      onClick={() => setSearchQuery("")}
                    >
                      <X size={16} />
                    </Button>
                  )
                }
              />

              <div className="h-6 w-px bg-border" />

              <div className="flex items-center gap-2 px-2 shrink-0">
                <Calendar size={16} className="text-muted-foreground" />
                <input
                  type="date"
                  className="bg-transparent text-xs outline-none text-muted-foreground cursor-pointer"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-muted-foreground text-xs">→</span>
                <input
                  type="date"
                  className="bg-transparent text-xs outline-none text-muted-foreground cursor-pointer"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="h-6 w-px bg-border" />

              <Button
                variant="outline"
                className="rounded-xl h-10 px-4 flex gap-2 shrink-0 border-none hover:bg-muted font-medium text-sm text-muted-foreground"
                onClick={() => {
                  setSearchQuery("");
                  setPaymentStatus("all");
                  setStartDate("");
                  setEndDate("");
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
                  <Spinner className="h-6 w-6 text-primary" />
                  đang tải dữ liệu thanh toán...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>mã hóa đơn</TableHead>
                      <TableHead>phòng / hộ</TableHead>
                      <TableHead>thời gian giao dịch</TableHead>
                      <TableHead>số tiền nộp</TableHead>
                      <TableHead>trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          không có dữ liệu thanh toán phù hợp
                        </TableCell>
                      </TableRow>
                    ) : (
                      payments.map((payment) => {
                        const inv = payment.invoice || payment.Invoice;
                        const room = inv?.household?.room_number || inv?.household_id || "n/a";

                        return (
                          <TableRow key={payment.id}>
                            <TableCell className="font-mono text-xs text-primary uppercase">
                              {inv?.invoice_number || "n/a"}
                            </TableCell>
                            <TableCell className="font-bold">
                              phòng {room}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDateTime(payment.payment_date)}
                            </TableCell>
                            <TableCell className="font-medium text-green-600">
                              +{formatCurrency(payment.amount)}
                            </TableCell>
                            <TableCell>
                              <Tag color="green">thành công</Tag>
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
