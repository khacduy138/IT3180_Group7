import React, { useState, useEffect, useCallback } from "react";
import { Download, FileText, Printer, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import TopBar from "../../components/ui/TopBar";
import Sidebar from "../../components/ui/Sidebar";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "../../components/ui/Table";
import { Tag } from "../../components/ui/Tag";
import { Toast } from "../../components/ui/Toast";
import { Select } from "../../components/ui/Select";
import SmartSearch from "../../components/ui/SmartSearch";

const STATUS_MAP = {
  PAID: { label: "đã nộp", color: "green" },
  PARTIAL: { label: "nộp một phần", color: "yellow" },
  PENDING: { label: "chưa nộp", color: "red" },
};

export default function ReportPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, currentPage: 1, totalPages: 1 });
  const [toast, setToast] = useState({ open: false, variant: "success", title: "", description: "" });
  const [filters, setFilters] = useState({
    q: "",
    status: "all",
    startDate: "",
    endDate: "",
    periodId: "all",
    page: 1,
    limit: 15
  });
  const [filterOptions, setFilterOptions] = useState({
    periods: [],
    households: []
  });

  const fetchFilters = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      const resBase = await fetch("http://localhost:3001/api/reports/filters", { headers });
      const resultBase = await resBase.json();
      
      const resPeriods = await fetch("http://localhost:3001/api/fees/fee-periods", { headers });
      const resultPeriods = await resPeriods.json();

      setFilterOptions({
        households: resultBase.success ? resultBase.data.households : [],
        periods: resultPeriods.success ? resultPeriods.data.map(p => ({ value: p.id.toString(), label: p.name })) : []
      });
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        q: filters.q,
        status: filters.status,
        startDate: filters.startDate,
        endDate: filters.endDate,
        periodId: filters.periodId === "all" ? "" : filters.periodId,
        page: filters.page,
        limit: filters.limit
      });

      const res = await fetch(`http://localhost:3001/api/reports/invoices?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
        setPagination(result.pagination);
      }
    } catch (error) {
      setToast({ open: true, variant: "error", title: "lỗi", description: "không thể tải báo cáo" });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const formatCurrency = (val) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/reports/export', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timeFrame: "custom",
          customDate: { start: filters.startDate || "2025-01-01", end: filters.endDate || "2026-12-31" },
          format: "excel",
          activeTab: "invoice",
          config: {
            columns: ["invoice_number", "total_amount", "paid_amount", "status"],
            filters: { household: "all", type: "all" }
          }
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `baocao_chi_tiet_${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (error) {
      setToast({ open: true, variant: "error", title: "lỗi", description: "không thể xuất file" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      <div className="flex">
        <Sidebar open={sidebarOpen} />
        <main className={`flex-1 p-8 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"}`}>
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground">Báo cáo chi tiết</h1>
                <p className="text-muted-foreground mt-1 text-sm">Truy xuất và đối soát dữ liệu thu phí hệ thống</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2" onClick={handleExport}>
                  <Download size={18} /> Xuất excel
                </Button>
                <Button variant="outline" className="gap-2" onClick={handlePrint}>
                  <Printer size={18} /> In báo cáo
                </Button>
              </div>
            </div>

            <Card className="p-4 space-y-6">
              <div className="flex-col">
                <div className="w-full lg:flex-1 mb-4">
                  <SmartSearch
                    endpoint="http://localhost:3001/api/dashboard/search"
                    categories={[
                      { value: "finance", label: "tài chính" },
                      { value: "people", label: "nhân khẩu" }
                    ]}
                    placeholder="nhập tên cư dân hoặc mã hóa đơn để lọc nhanh..."
                    onResultSelect={(type, item) => setFilters({...filters, q: item.invoice_number || item.room_number})}
                  />
                </div>
                <div className="flex flex-wrap justify-end items-center gap-3 w-full lg:w-auto">
                  
                  <Select
                    variant="subtle"
                    value={filters.periodId}
                    onValueChange={(val) => setFilters({...filters, periodId: val, page: 1})}
                    options={[{ value: "all", label: "tất cả kỳ thu" }, ...filterOptions.periods]}
                    className="w-40 h-10 rounded-xl"
                  />
                  <Select
                    variant="subtle"
                    value={filters.status}
                    onValueChange={(val) => setFilters({...filters, status: val, page: 1})}
                    options={[
                      { value: "all", label: "tất cả trạng thái" },
                      { value: "PAID", label: "đã nộp" },
                      { value: "PENDING", label: "chưa nộp" },
                      { value: "PARTIAL", label: "nộp một phần" }
                    ]}
                    className="w-40 h-10 rounded-xl"
                  />
                  <Button variant="icon" size="icon" className="rounded-xl h-10 w-10" onClick={fetchReportData}>
                    <RefreshCw size={18} />
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden border-none shadow-sm">
              <div className="relative">
                {loading && (
                  <div className="absolute inset-0 bg-background/60 z-20 flex flex-col items-center justify-center gap-2 backdrop-blur-[1px]">
                    <Spinner size="lg" />
                    <span className="text-xs font-medium animate-pulse text-foreground">đang truy xuất dữ liệu...</span>
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>số hóa đơn</TableHead>
                      <TableHead>phòng</TableHead>
                      <TableHead>kỳ thu</TableHead>
                      <TableHead>tổng cộng</TableHead>
                      <TableHead>đã nộp</TableHead>
                      <TableHead>dư nợ</TableHead>
                      <TableHead>trạng thái</TableHead>
                      <TableHead className="text-right">thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.length === 0 && !loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-64 text-center">
                          <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                            <FileText size={40} className="opacity-10" />
                            <p className="text-sm">không tìm thấy bản ghi nào phù hợp với bộ lọc</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.map((invoice) => {
                        const statusInfo = STATUS_MAP[invoice.status] || { label: invoice.status, color: "gray" };
                        const debt = Number(invoice.total_amount) - Number(invoice.paid_amount);
                        return (
                          <TableRow key={invoice.id} className="group">
                            <TableCell className="font-mono text-xs text-primary">{invoice.invoice_number}</TableCell>
                            <TableCell className="font-bold text-sm">{invoice.household?.room_number || invoice.Household?.room_number}</TableCell>
                            <TableCell className="text-sm">{invoice.fee_period?.name || invoice.FeePeriod?.name}</TableCell>
                            <TableCell className="text-sm">{formatCurrency(invoice.total_amount)}</TableCell>
                            <TableCell className="text-green-600 text-sm">{formatCurrency(invoice.paid_amount)}</TableCell>
                            <TableCell className={`text-sm ${debt > 0 ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                              {formatCurrency(debt)}
                            </TableCell>
                            <TableCell><Tag color={statusInfo.color}>{statusInfo.label}</Tag></TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-all text-xs">chi tiết</Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between p-6 border-t border-border bg-muted/10">
                <p className="text-xs text-muted-foreground font-medium">
                  đang hiển thị {data.length} trên {pagination.total} kết quả (trang {pagination.currentPage}/{pagination.totalPages})
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" size="sm" className="h-9 px-4 rounded-xl text-xs"
                    disabled={filters.page === 1}
                    onClick={() => setFilters({...filters, page: filters.page - 1})}
                  >
                    <ChevronLeft size={16} /> trước
                  </Button>
                  <Button 
                    variant="outline" size="sm" className="h-9 px-4 rounded-xl text-xs"
                    disabled={filters.page >= pagination.totalPages}
                    onClick={() => setFilters({...filters, page: filters.page + 1})}
                  >
                    sau <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </Card>
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