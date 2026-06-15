import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Download,
  Users,
  Home,
  CreditCard,
  AlertCircle,
  Filter,
  ExternalLink, 
  Search
} from "lucide-react";

// Import Layout & UI Components
import TopBar from "../../components/ui/TopBar";
import Sidebar from "../../components/ui/Sidebar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardValue,
  CardFooter,
} from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "../../components/ui/Modal";
import SmartSearch from "../../components/ui/SmartSearch";
import { Spinner } from "../../components/ui/Spinner";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../../components/ui/Table";
import { Tag } from "../../components/ui/Tag";
import { Toast } from "../../components/ui/Toast";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/ui/Tabs";
import { Select } from "../../components/ui/Select";
import { Input } from "../../components/ui/Input";

const STATUS_MAP = {
  PAID: { label: "Đã nộp", color: "green" },
  PARTIAL: { label: "Nộp một phần", color: "yellow" },
  PENDING: { label: "Chưa nộp", color: "red" },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({
    totalCollected: 0,
    collectionRate: 0,
    householdsWithDebt: 0,
    totalHouseholds: 0,
    revenueGrowth: 0,
    occupancyRate: 0,
  });
  const [trendData, setTrendData] = useState([]);
  const [distributionData, setDistributionData] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);

  const [tableData, setTableData] = useState([]);
  const [tablePagination, setTablePagination] = useState({
    total: 0,
    currentPage: 1,
    totalPages: 1,
  });
  const [tableFilters, setTableFilters] = useState({
    q: "",
    status: "all",
    startDate: "",
    endDate: "",
    page: 1,
  });
  const [isTableLoading, setIsTableLoading] = useState(false);

  const fetchTableData = useCallback(async () => {
  setIsTableLoading(true);
  try {
    const token = localStorage.getItem("token");
    const params = new URLSearchParams({
      q: tableFilters.q,
      status: tableFilters.status,
      startDate: tableFilters.startDate,
      endDate: tableFilters.endDate,
      page: tableFilters.page,
      limit: 10,
    });
    
    const res = await fetch(
      `http://localhost:3001/api/dashboard/invoices-table?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Kiểm tra xem res có phải là JSON không để tránh lỗi Syntax Error khi gặp HTML 404
    if (!res.ok) {
      console.error("Lỗi HTTP:", res.status);
    }

    const result = await res.json();
    
    if (result.success) {
      setTableData(result.data);
      setTablePagination(result.pagination);
    } else {
      // In ra lỗi từ Backend
      console.error("Lỗi từ backend:", result.message);
    }
  } catch (error) {
    console.error("Lỗi sập mạng hoặc parse JSON:", error);
  } finally {
    setIsTableLoading(false);
  }
}, [tableFilters]);

  useEffect(() => {
    fetchTableData();
  }, [fetchTableData]);

  const [demoData, setDemoData] = useState({
    totalResidents: 0,
    genderDistribution: [],
    changesSummary: [],
    recentChangesCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({
    open: false,
    variant: "success",
    title: "",
    description: "",
  });

  const [selectedItem, setSelectedItem] = useState(null); // { type: 'residents', data: {...} }
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const handleResultSelect = (type, data) => {
    setSelectedItem({ type, data });
    setIsDetailModalOpen(true);
  };

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    timeFrame: "1",
    customDate: { start: "", end: "" },
    format: "excel",
    people: { columns: ["name", "cccd"], filters: { household: "all" } },
    household: { columns: ["room", "area"], filters: { floor: "all" } },
    invoice: {
      columns: ["id", "amount", "status"],
      filters: { household: "all", type: "all" },
    },
  });
  const [filterOptions, setFilterOptions] = useState({
    households: [],
    floors: [],
    feeTypes: [],
  });

  const handleExport = () => {
    setIsExportModalOpen(true);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [summaryRes, trendRes, distRes, payRes, demoRes] =
          await Promise.all([
            fetch("http://localhost:3001/api/dashboard/summary", { headers }),
            fetch("http://localhost:3001/api/dashboard/trending", { headers }),
            fetch("http://localhost:3001/api/dashboard/distribution", {
              headers,
            }),
            fetch("http://localhost:3001/api/dashboard/recent-payments", {
              headers,
            }),
            fetch("http://localhost:3001/api/dashboard/demographics", {
              headers,
            }),
          ]);

        const summaryData = await summaryRes.json();
        const trendDataRes = await trendRes.json();
        const distData = await distRes.json();
        const payData = await payRes.json();
        const demo = await demoRes.json();

        if (summaryRes.ok && summaryData.success) {
          setStats(summaryData.data);
        } else {
          setToast({
            open: true,
            variant: "error",
            title: "Lỗi",
            description: "Không thể tải dữ liệu thống kê",
          });
        }

        if (trendRes.ok && trendDataRes.success) {
          setTrendData(trendDataRes.data);
        }

        if (distRes.ok && distData.success) {
          setDistributionData(distData.data);
        }

        if (payRes.ok && payData.success) {
          setRecentPayments(payData.data);
        }

        if (demo.success) setDemoData(demo.data);
      } catch (error) {
        console.error("Dashboard Fetch Error:", error);
        setToast({
          open: true,
          variant: "error",
          title: "Lỗi kết nối",
          description: "Vui lòng kiểm tra server",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const COLORS = ["#DBEAFE", "#93C5FD", "#3B82F6", "#1D4ED8", "#1E3A8A"];
  const formatCurrency = (val) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);

  const maleCount =
    demoData.genderDistribution.find((g) => g.gender === "Male")?.count || 0;
  const femaleCount =
    demoData.genderDistribution.find((g) => g.gender === "Female")?.count || 0;
  const totalGender = maleCount + femaleCount || 1;
  const malePercent = Math.round((maleCount / totalGender) * 100);
  const femalePercent = 100 - malePercent;

  const [activeExportTab, setActiveExportTab] = useState("people");

  const fetchFilters = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(
      "http://localhost:3001/api/dashboard/export-filters",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const result = await res.json();
    if (result.success) setFilterOptions(result.data);
  };

  useEffect(() => {
    if (isExportModalOpen) fetchFilters();
  }, [isExportModalOpen]);

  const handleConfirmExport = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:3001/api/dashboard/export",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            timeFrame: exportConfig.timeFrame,
            customDate: exportConfig.customDate,
            format: exportConfig.format,
            activeTab: activeExportTab,
            config: exportConfig[activeExportTab],
          }),
        },
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `baocao_${activeExportTab}_${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setIsExportModalOpen(false);
      }
    } catch (error) {
      setToast({
        open: true,
        variant: "error",
        title: "lỗi",
        description: "không thể xuất file",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />

      <div className="flex">
        <Sidebar open={sidebarOpen} />

        <main
          className={`flex-1 p-8 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"}`}
        >
          {loading ? (
            <div className="flex h-[60vh] w-full items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Spinner className="h-8 w-8 text-primary" />{" "}
                <p className="text-muted-foreground animate-pulse">
                  Đang tải dữ liệu...
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Dashboard
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Chào mừng quay trở lại, Admin.
                  </p>
                </div>
                <div className="flex gap-2">
                <Button
                variant="outline"
                  className="gap-2"
                  onClick={() => navigate("/reports")}>
                       <ExternalLink size={16} /> Chi tiết tình trạng thu phí
                </Button>
                <Button
                  variant="default"
                  className="gap-2"
                  onClick={handleExport}
                >
                  <Download size={16} /> Xuất báo cáo nhanh
                </Button>
                </div>
              </div>
              <SmartSearch
                endpoint="http://localhost:3001/api/dashboard/search"
                categories={[
                  { value: "all", label: "Tất cả" },
                  { value: "people", label: "Nhân khẩu" },
                  { value: "finance", label: "Tài chính" },
                ]}
                placeholder="Tra cứu cư dân, hóa đơn hoặc số phòng..."
                onResultSelect={handleResultSelect}
              />

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>Tổng thu tháng này</CardTitle>
                    <CreditCard className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardValue>{formatCurrency(stats.totalCollected)}</CardValue>
                  <CardFooter>
                    <p
                      className={`text-xs font-medium ${stats.revenueGrowth >= 0 ? "text-green-500" : "text-red-500"}`}
                    >
                      {stats.revenueGrowth >= 0 ? "↑" : "↓"}{" "}
                      {Math.abs(stats.revenueGrowth)}% so với tháng trước
                    </p>
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
                        style={{ width: `${stats.collectionRate}%` }}
                      ></div>
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
                    <p className="text-xs text-muted-foreground">
                      Cần gửi thông báo nhắc nhở
                    </p>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>Tổng số căn hộ</CardTitle>
                    <Users className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardValue>{stats.totalHouseholds}</CardValue>
                  <CardFooter>
                    <p className="text-xs text-muted-foreground">
                      {stats.occupancyRate}% đang có người ở
                    </p>
                  </CardFooter>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-3 mt-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Tổng cư dân</CardTitle>
                  </CardHeader>
                  <CardValue>{demoData.totalResidents}</CardValue>
                  <CardFooter>
                    <p className="text-xs text-muted-foreground">
                      Người dân đang sinh sống
                    </p>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Biến động mới</CardTitle>
                  </CardHeader>
                  <CardValue>+{demoData.recentChangesCount}</CardValue>
                  <CardFooter>
                    <p className="text-xs text-muted-foreground">
                      Trong 30 ngày qua
                    </p>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Tạm vắng / Tạm trú</CardTitle>
                  </CardHeader>
                  <CardValue>
                    {demoData.changesSummary.find(
                      (c) => c.change_type === "absence",
                    )?.count || 0}{" "}
                    /{" "}
                    {demoData.changesSummary.find(
                      (c) => c.change_type === "temporary_residence",
                    )?.count || 0}
                  </CardValue>
                  <CardFooter>
                    <p className=" text-xs text-muted-foreground">
                      Số lượng hồ sơ hiện tại
                    </p>
                  </CardFooter>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* 1. MAIN REVENUE TREND (Bar Chart) - Occupies 4/7 cols */}
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Xu hướng thu phí (6 tháng)</CardTitle>
                  </CardHeader>
                  <div className="h-[300px] w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trendData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="name"
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${value / 1000000}M`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                          }}
                          itemStyle={{ fontSize: "12px" }}
                        />
                        <Legend
                          verticalAlign="top"
                          align="right"
                          iconType="circle"
                          iconSize={6}
                          formatter={(value) => (
                            <span className="text-xs text-muted-foreground">
                              {value}
                            </span>
                          )}
                        />
                        <Bar
                          dataKey="total"
                          name="Chỉ tiêu"
                          fill="#e2e8f0"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="collected"
                          name="Thực thu"
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* 2. FEE DISTRIBUTION (Pie Chart) - Occupies 3/7 cols */}
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Cơ cấu nguồn thu</CardTitle>
                  </CardHeader>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {distributionData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                          layout="vertical"
                          align="right"
                          verticalAlign="middle"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              {/* --- SECTION: BOTTOM GRID --- */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mt-6">
                {/* 3. RECENT ACTIVITY (Live Feed) - Occupies 4/7 cols */}
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle className="flex items-center pl-2">
                      Giao dịch gần đây
                    </CardTitle>
                  </CardHeader>
                  <div className="px-4 py-4">
                    <div className="space-y-4">
                      {recentPayments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between border-b border-border pb-2 last:border-0"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">
                              Phòng {payment.invoice?.household?.room_number}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(payment.payment_date).toLocaleString(
                                "vi-VN",
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-green-600">
                              +{formatCurrency(payment.amount)}
                            </span>
                            <Tag color="green">Thành công</Tag>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* 4. PERFORMANCE RADIAL (Collection Efficiency) - 3/7 cols */}
                <div className="col-span-3 space-y-6 flex flex-col">
                  <Card className="flex-1">
                    <CardHeader>
                      <CardTitle>Hiệu suất thu nợ</CardTitle>
                    </CardHeader>
                    <div className="h-[250px] flex flex-col items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
                          <defs>
                            <linearGradient
                              id="colorRate"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#3b82f6"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="#3b82f6"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="collected"
                            stroke="#3b82f6"
                            fillOpacity={1}
                            fill="url(#colorRate)"
                          />
                          <Tooltip />
                        </AreaChart>
                      </ResponsiveContainer>
                      <div className="text-center mt-2">
                        <p className="text-2xl font-bold">
                          {stats.collectionRate}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Tỷ lệ hoàn thành mục tiêu
                        </p>
                      </div>
                    </div>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        Cơ cấu giới tính
                      </CardTitle>
                    </CardHeader>
                    <div className="px-6 pb-4">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-xs text-muted-foreground">
                          Nam / Nữ
                        </span>
                        <span className="text-xs font-bold">
                          {demoData.genderDistribution.find(
                            (g) => g.gender === "Male",
                          )?.count || 0}{" "}
                          :{" "}
                          {demoData.genderDistribution.find(
                            (g) => g.gender === "Female",
                          )?.count || 0}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 flex overflow-hidden">
                        <div
                          className="bg-blue-600 h-full transition-all duration-500"
                          style={{ width: `${malePercent}%` }}
                        ></div>
                        <div
                          className="bg-blue-400 h-full transition-all duration-500"
                          style={{ width: `${femalePercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
                <div className="items-center justify-between gap-4">
                    <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold mb-4">
                    Tình trạng thu phí hệ thống
                  </h2>
                  <Button variant="default" size="sm" onClick={() => navigate("/reports")}>
                    <ExternalLink  size={16} /> Xem chi tiết
                  </Button>
                  </div>
                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className=""> 
                    <Input
                      placeholder="tìm phòng, mã hđ..."
                      className="w-48"
                      value={tableFilters.q}
                      onChange={(e) =>
                        setTableFilters({ ...tableFilters, q: e.target.value })
                      }
                      onKeyDown={(e) => e.key === "Enter" && fetchTableData()}
                      leftIcon={<Search className="w-[16px] h-[16px]" />}
                    />
                    </div>
                    <div className="flex items-center gap-2">
                    <Select
                      variant="outline"
                      size="sm"
                      value={tableFilters.status}
                      onValueChange={(val) =>
                        setTableFilters({
                          ...tableFilters,
                          status: val,
                          page: 1,
                        })
                      }
                      options={[
                        { value: "all", label: "tất cả trạng thái" },
                        { value: "PAID", label: "đã nộp" },
                        { value: "PENDING", label: "chưa nộp" },
                        { value: "PARTIAL", label: "nộp một phần" },
                      ]}
                      className="w-40 h-9"
                    />
                    <div className="flex items-center gap-2 px-3 py-1 ">
                      <input
                        type="date"
                        className="bg-transparent text-xs outline-none"
                        value={tableFilters.startDate}
                        onChange={(e) =>
                          setTableFilters({
                            ...tableFilters,
                            startDate: e.target.value,
                            page: 1,
                          })
                        }
                      />
                      <span className="text-muted-foreground">→</span>
                      <input
                        type="date"
                        className="bg-transparent text-xs outline-none"
                        value={tableFilters.endDate}
                        onChange={(e) =>
                          setTableFilters({
                            ...tableFilters,
                            endDate: e.target.value,
                            page: 1,
                          })
                        }
                      />
                    </div>
                    <Button
                      variant="icon"
                      size="sm"
                      onClick={fetchTableData}
                    >
                      <Filter size={16} /> 
                    </Button>
                  </div>
                  </div>
                </div>

                <div className="relative">
                  {isTableLoading && (
                    <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center">
                      <Spinner size="md" />
                    </div>
                  )}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>số hóa đơn</TableHead>
                        <TableHead>mã hộ</TableHead>
                        <TableHead>kỳ thu</TableHead>
                        <TableHead>số tiền</TableHead>
                        <TableHead>trạng thái</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center text-muted-foreground py-8"
                          >
                            chưa có dữ liệu hóa đơn
                          </TableCell>
                        </TableRow>
                      ) : (
                        tableData.map((invoice) => {
                          const statusInfo = STATUS_MAP[invoice.status] || {
                            label: invoice.status,
                            color: "gray",
                          };
                          const room = invoice.household?.room_number || "-";
                          return (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-medium text-xs">
                                {invoice.invoice_number}
                              </TableCell>
                              <TableCell className="font-bold">
                                {room}
                              </TableCell>
                              <TableCell>{invoice.fee_period?.name}</TableCell>
                              <TableCell>
                                {formatCurrency(invoice.total_amount)}
                              </TableCell>
                              <TableCell>
                                <Tag color={statusInfo.color}>
                                  {statusInfo.label}
                                </Tag>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    hiển thị trang {tablePagination.currentPage} trên tổng số{" "}
                    {tablePagination.totalPages} ({tablePagination.total} kết
                    quả)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={tableFilters.page === 1}
                      onClick={() =>
                        setTableFilters({
                          ...tableFilters,
                          page: tableFilters.page - 1,
                        })
                      }
                    >
                      trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        tableFilters.page === tablePagination.totalPages
                      }
                      onClick={() =>
                        setTableFilters({
                          ...tableFilters,
                          page: tableFilters.page + 1,
                        })
                      }
                    >
                      sau
                    </Button>
                  </div>
                </div>
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
      <Modal open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <ModalHeader>
          {selectedItem?.type === "residents" && "Thông tin chi tiết Cư dân"}
          {selectedItem?.type === "households" && "Thông tin chi tiết Căn hộ"}
          {selectedItem?.type === "invoices" && "Thông tin chi tiết Hóa đơn"}
        </ModalHeader>
        <ModalBody>
          {selectedItem && (
            <div className="space-y-6">
              {selectedItem.type === "residents" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 flex items-center gap-4 p-4 rounded-xl border border-border">
                    <div className="border border-border h-16 w-16 rounded-full  flex items-center justify-center text-2xl font-bold">
                      {selectedItem.data.full_name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">
                        {selectedItem.data.full_name}
                      </h3>
                      <Tag color="green">Cư dân chính thức</Tag>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                      Số định danh (CCCD)
                    </p>
                    <p className="font-medium">
                      {selectedItem.data.citizen_id || "Chưa cập nhật"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                      Số điện thoại
                    </p>
                    <p className="font-medium text-primary underline">
                      {selectedItem.data.phone_number || "Chưa có"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                      Giới tính
                    </p>
                    <p className="font-medium">{selectedItem.data.gender}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                      Ngày sinh
                    </p>
                    <p className="font-medium">
                      {new Date(
                        selectedItem.data.created_at,
                      ).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-border">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">
                      Mã định danh hệ thống (UUID)
                    </p>
                    <code className="text-[10px] bg-muted p-2 rounded block break-all">
                      {selectedItem.data.uuid}
                    </code>
                  </div>
                </div>
              )}

              {selectedItem.type === "households" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-black text-primary">
                        Phòng {selectedItem.data.room_number}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Tình trạng:{" "}
                        {selectedItem.data.status === "active"
                          ? "Đang hoạt động"
                          : "Trống"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {selectedItem.data.square_meters}{" "}
                        <span className="text-sm">m²</span>
                      </p>
                      <p className="text-[10px]  text-muted-foreground">
                        Diện tích thông thủy
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="border border-border p-3 rounded-xl text-center">
                      <p className="text-xs text-muted-foreground">Tầng</p>
                      <p>{selectedItem.data.room_number?.substring(1, 2)}</p>
                    </div>
                    <div className="border border-border p-3 rounded-xl text-center">
                      <p className="text-xs text-muted-foreground">Phân khu</p>
                      <p>
                        Block {selectedItem.data.room_number?.substring(0, 1)}
                      </p>
                    </div>
                    <div className="border border-border p-3 rounded-xl text-center">
                      <p className="text-xs text-muted-foreground">Hướng</p>
                      <p>Đông Nam</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-dashed border-border">
                    <p className="text-xs text-muted-foreground italic">
                      "Căn hộ thuộc diện quản lý ưu tiên, không có tranh chấp nợ
                      phí trong 3 tháng gần nhất."
                    </p>
                  </div>
                </div>
              )}

              {selectedItem.type === "invoices" && (
                <div className="space-y-5">
                  <div className="flex justify-between items-center border-b border-border pb-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">
                        Mã hóa đơn
                      </p>
                      <p className="text-lg font-mono font-bold text-primary">
                        {selectedItem.data.invoice_number}
                      </p>
                    </div>
                    <Tag
                      color={
                        selectedItem.data.status === "PAID" ? "green" : "yellow"
                      }
                    >
                      {selectedItem.data.status}
                    </Tag>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tổng cộng:</span>
                      <span className="font-bold">
                        {new Intl.NumberFormat("vi-VN").format(
                          selectedItem.data.total_amount,
                        )}
                        đ
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Đã thanh toán:
                      </span>
                      <span className="font-bold text-green-600">
                        {new Intl.NumberFormat("vi-VN").format(
                          selectedItem.data.paid_amount,
                        )}
                        đ
                      </span>
                    </div>
                    <div className="flex justify-between text-sm p-3 rounded-lg ">
                      <span className="font-bold">Còn nợ:</span>
                      <span className="font-black">
                        {new Intl.NumberFormat("vi-VN").format(
                          selectedItem.data.total_amount -
                            selectedItem.data.paid_amount,
                        )}
                        đ
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">
                      Ghi chú hệ thống
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Hóa đơn được khởi tạo tự động vào ngày{" "}
                      {new Date(
                        selectedItem.data.created_at,
                      ).toLocaleDateString("vi-VN")}
                      . Hạn nộp cuối cùng: 30/
                      {new Date(selectedItem.data.created_at).getMonth() + 1}
                      /2026.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
            Đóng
          </Button>
          <Button
            variant="default"
            onClick={() => {
              setIsDetailModalOpen(false);
              if (selectedItem.type === "households")
                window.location.href = `/households/${selectedItem.data.id}`;
            }}
          >
            Xem chi tiết hồ sơ
          </Button>
        </ModalFooter>
      </Modal>

      <Modal open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <ModalHeader>Cấu hình xuất dữ liệu</ModalHeader>
        <ModalBody className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              Phạm vi thời gian
            </p>
            <Select
              value={exportConfig.timeFrame}
              onValueChange={(val) =>
                setExportConfig({ ...exportConfig, timeFrame: val })
              }
              options={[
                { value: "1", label: "Trong 1 tháng gần nhất" },
                { value: "3", label: "Trong 3 tháng gần nhất" },
                { value: "6", label: "Trong 6 tháng gần nhất" },
                { value: "custom", label: "Tùy chọn khoảng thời gian" },
              ]}
              className="w-full"
            />
            {exportConfig.timeFrame === "custom" && (
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border">
                <Input
                  type="date"
                  value={exportConfig.customDate.start}
                  onChange={(e) =>
                    setExportConfig({
                      ...exportConfig,
                      customDate: {
                        ...exportConfig.customDate,
                        start: e.target.value,
                      },
                    })
                  }
                  className="bg-transparent border-none h-8"
                />
                <span className="text-muted-foreground">→</span>
                <Input
                  type="date"
                  value={exportConfig.customDate.end}
                  onChange={(e) =>
                    setExportConfig({
                      ...exportConfig,
                      customDate: {
                        ...exportConfig.customDate,
                        end: e.target.value,
                      },
                    })
                  }
                  className="bg-transparent border-none h-8"
                />
              </div>
            )}
          </div>

          <Tabs
            value={activeExportTab}
            onValueChange={setActiveExportTab}
            className="w-full"
          >
            <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent h-auto p-0 mb-4">
              <TabsTrigger
                value="people"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
              >
                Người dân
              </TabsTrigger>
              <TabsTrigger
                value="household"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
              >
                Hộ gia đình
              </TabsTrigger>
              <TabsTrigger
                value="invoice"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
              >
                Hóa đơn
              </TabsTrigger>
            </TabsList>

            <TabsContent value="people" className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "full_name", label: "họ tên" },
                  { id: "citizen_id", label: "căn cước công dân" },
                  { id: "phone_number", label: "số điện thoại" },
                  { id: "gender", label: "giới tính" },
                  { id: "date_of_birth", label: "ngày sinh" },
                ].map((col) => (
                  <label
                    key={col.id}
                    className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={exportConfig.people.columns.includes(col.id)}
                      onChange={(e) => {
                        const cols = e.target.checked
                          ? [...exportConfig.people.columns, col.id]
                          : exportConfig.people.columns.filter(
                              (c) => c !== col.id,
                            );
                        setExportConfig({
                          ...exportConfig,
                          people: { ...exportConfig.people, columns: cols },
                        });
                      }}
                      className="accent-primary h-4 w-4"
                    />
                    {col.label}
                  </label>
                ))}
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-xs font-bold text-muted-foreground uppercase mb-2">
                  bộ lọc nâng cao
                </p>
                <Select
                  placeholder="lọc theo hộ gia đình"
                  value={exportConfig.people.filters.household}
                  onValueChange={(val) =>
                    setExportConfig({
                      ...exportConfig,
                      people: {
                        ...exportConfig.people,
                        filters: { household: val },
                      },
                    })
                  }
                  options={[
                    { value: "all", label: "tất cả hộ gia đình" },
                    ...filterOptions.households,
                  ]}
                  className="w-full"
                />
              </div>
            </TabsContent>

            <TabsContent value="household" className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "room_number", label: "số phòng" },
                  { id: "square_meters", label: "diện tích" },
                  { id: "status", label: "trạng thái" },
                ].map((col) => (
                  <label
                    key={col.id}
                    className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={exportConfig.household.columns.includes(col.id)}
                      onChange={(e) => {
                        const cols = e.target.checked
                          ? [...exportConfig.household.columns, col.id]
                          : exportConfig.household.columns.filter(
                              (c) => c !== col.id,
                            );
                        setExportConfig({
                          ...exportConfig,
                          household: {
                            ...exportConfig.household,
                            columns: cols,
                          },
                        });
                      }}
                      className="accent-primary h-4 w-4"
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="invoice" className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "invoice_number", label: "mã hóa đơn" },
                  { id: "total_amount", label: "tổng tiền" },
                  { id: "paid_amount", label: "đã nộp" },
                  { id: "status", label: "trạng thái" },
                ].map((col) => (
                  <label
                    key={col.id}
                    className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={exportConfig.invoice.columns.includes(col.id)}
                      onChange={(e) => {
                        const cols = e.target.checked
                          ? [...exportConfig.invoice.columns, col.id]
                          : exportConfig.invoice.columns.filter(
                              (c) => c !== col.id,
                            );
                        setExportConfig({
                          ...exportConfig,
                          invoice: { ...exportConfig.invoice, columns: cols },
                        });
                      }}
                      className="accent-primary h-4 w-4"
                    />
                    {col.label}
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border">
                <div className="col-span-2 text-xs font-bold text-muted-foreground uppercase mb-1">
                  bộ lọc nâng cao
                </div>
                <Select
                  placeholder="theo phòng"
                  value={exportConfig.invoice.filters.household}
                  onValueChange={(val) =>
                    setExportConfig({
                      ...exportConfig,
                      invoice: {
                        ...exportConfig.invoice,
                        filters: {
                          ...exportConfig.invoice.filters,
                          household: val,
                        },
                      },
                    })
                  }
                  options={[
                    { value: "all", label: "tất cả phòng" },
                    ...filterOptions.households,
                  ]}
                />
                <Select
                  placeholder="theo loại phí"
                  value={exportConfig.invoice.filters.type}
                  onValueChange={(val) =>
                    setExportConfig({
                      ...exportConfig,
                      invoice: {
                        ...exportConfig.invoice,
                        filters: { ...exportConfig.invoice.filters, type: val },
                      },
                    })
                  }
                  options={[
                    { value: "all", label: "tất cả loại phí" },
                    ...filterOptions.feeTypes,
                  ]}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="pt-4 border-t border-border space-y-3">
            <p className="text-sm font-medium text-foreground">
              Định dạng tập tin
            </p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="excel"
                  checked={exportConfig.format === "excel"}
                  onChange={(e) =>
                    setExportConfig({ ...exportConfig, format: e.target.value })
                  }
                  className="accent-primary h-4 w-4"
                />
                <span className="text-sm text-foreground">
                  Microsoft excel (.xlsx)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  checked={exportConfig.format === "pdf"}
                  onChange={(e) =>
                    setExportConfig({ ...exportConfig, format: e.target.value })
                  }
                  className="accent-primary h-4 w-4"
                />
                <span className="text-sm text-foreground">
                  Portable document (.pdf)
                </span>
              </label>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setIsExportModalOpen(false)}>
            Đóng
          </Button>
          <Button variant="default" onClick={handleConfirmExport}>
            Bắt đầu xuất dữ liệu
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
