import { useEffect, useState } from "react";
import { RefreshCw, Search, X, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

import TopBar from "../../components/ui/TopBar";
import Sidebar from "../../components/ui/Sidebar";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Spinner } from "../../components/ui/Spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/Table";
import { Tag } from "../../components/ui/Tag";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PARTIAL", label: "Partially paid" },
  { value: "PAID", label: "Paid" },
];

const STATUS_TAGS = {
  PENDING: { label: "Pending", color: "red" },
  PARTIAL: { label: "Partially paid", color: "yellow" },
  PAID: { label: "Paid", color: "green" },
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("vi-VN").format(new Date(`${value}T00:00:00`));
};

export default function InvoiceListPage() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [periodId, setPeriodId] = useState("");
  const [status, setStatus] = useState("");
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const fetchInvoices = async () => {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({ pageSize: "100" });
      if (periodId.trim()) {
        params.set("feePeriodId", periodId.trim());
      }
      if (status) {
        params.set("status", status);
      }

      try {
        const response = await fetch(
          `http://localhost:3001/api/invoices?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            signal: controller.signal,
          },
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Unable to load invoices");
        }

        setInvoices(result.data || []);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setInvoices([]);
          setError(requestError.message || "Unable to connect to the server");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchInvoices();
    return () => controller.abort();
  }, [periodId, status, reloadKey]);

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
            sidebarOpen ? "ml-64" : "ml-0"
          }`}
        >
          <div className="mx-auto max-w-7xl space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Hóa đơn</h1>
              <p className="mt-1 text-muted-foreground">
                Xem và quản lý hóa đơn của các hộ gia đình.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-2 items-center bg-card p-1.5 rounded-2xl border border-border shadow-sm transition-all w-full max-w-2xl">
                <Select
                  variant="subtle"
                  size="sm"
                  value={status}
                  onValueChange={setStatus}
                  options={STATUS_OPTIONS}
                  className="h-9 rounded-xl bg-muted/50 border-none font-medium min-w-[150px]"
                />

                <div className="h-6 w-px bg-border" />

                <Input
                  type="number"
                  min="1"
                  placeholder="nhập mã kỳ thu phí..."
                  className="border-none bg-transparent focus-visible:ring-0 text-base h-10 w-full"
                  value={periodId}
                  onChange={(e) => setPeriodId(e.target.value)}
                  rightIcon={
                    periodId.toString().length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full"
                        onClick={() => setPeriodId("")}
                      >
                        <X size={16} />
                      </Button>
                    )
                  }
                />

                <div className="h-6 w-px bg-border" />

                <Button
                  variant="icon"
                  className="rounded-xl h-10 w-12 p-0 flex shrink-0"
                  onClick={() => setReloadKey((prev) => prev + 1)}
                >
                  <Search size={18} />
                </Button>

                <div className="h-6 w-px bg-border" />

                <Button
                  variant="outline"
                  className="rounded-xl h-10 px-4 flex gap-2 shrink-0 border-none hover:bg-muted font-medium text-sm"
                  onClick={() => {
                    setPeriodId("");
                    setStatus("");
                    setReloadKey((prev) => prev + 1);
                  }}
                >
                  <RefreshCw size={16} />
                  làm mới
                </Button>
              </div>

              <Button
                variant="default"
                
                onClick={() => {
                  navigate("/payments/history");
                }}
              >

                <ExternalLink/>Lịch sử giao dịch
              </Button>
            </div>

            <Card className="p-0">
              {loading ? (
                <div className="flex min-h-64 items-center justify-center gap-3 text-muted-foreground">
                  <Spinner className="h-6 w-6 text-primary" />
                  Loading invoices...
                </div>
              ) : error ? (
                <div className="min-h-64 p-8 text-center text-destructive">
                  {error}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã hóa đơn</TableHead>
                      <TableHead>Hộ gia đình / Phòng</TableHead>
                      <TableHead>Tổng số tiền</TableHead>
                      <TableHead>Số tiền đã thanh toán</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày đáo hạn</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-12 text-center text-muted-foreground"
                        >
                          No invoices match the selected filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoices.map((invoice) => {
                        const statusTag = STATUS_TAGS[invoice.status] || {
                          label: invoice.status,
                          color: "red",
                        };

                        return (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">
                              {invoice.invoice_number}
                            </TableCell>
                            <TableCell>
                              {invoice.household?.room_number ||
                                invoice.household_id}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(invoice.total_amount)}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(invoice.paid_amount)}
                            </TableCell>
                            <TableCell>
                              <Tag color={statusTag.color}>
                                {statusTag.label}
                              </Tag>
                            </TableCell>
                            <TableCell>
                              {formatDate(invoice.due_date)}
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
