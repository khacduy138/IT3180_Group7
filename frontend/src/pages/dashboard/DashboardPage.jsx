import React, { useState, useEffect } from "react";
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
  Activity,
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

const STATUS_MAP = {
  PAID: { label: "Đã nộp", color: "green" },
  PARTIAL: { label: "Nộp một phần", color: "yellow" },
  PENDING: { label: "Chưa nộp", color: "red" },
};

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({
    totalCollected: 0,
    collectionRate: 0,
    householdsWithDebt: 0,
    totalHouseholds: 0,
    revenueGrowth: 0,
    occupancyRate: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [distributionData, setDistributionData] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [summaryRes, trendRes, distRes, payRes, invoicesRes, demoRes] =
          await Promise.all([
            fetch("http://localhost:3001/api/dashboard/summary", { headers }),
            fetch("http://localhost:3001/api/dashboard/trending", { headers }),
            fetch("http://localhost:3001/api/dashboard/distribution", {
              headers,
            }),
            fetch("http://localhost:3001/api/dashboard/recent-payments", {
              headers,
            }),
            fetch("http://localhost:3001/api/billing?pageSize=5", { headers }),
            fetch("http://localhost:3001/api/dashboard/demographics", {
              headers,
            }),
          ]);

        const summaryData = await summaryRes.json();
        const trendDataRes = await trendRes.json();
        const distData = await distRes.json();
        const payData = await payRes.json();
        const invoicesData = await invoicesRes.json();
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

        if (invoicesRes.ok) {
          setRecentInvoices(invoicesData.data || []);
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
        console.error("Dashboard Fetch Error:", error); // Helpful for debugging
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

  const maleCount = demoData.genderDistribution.find((g) => g.gender === "Male")?.count || 0;
  const femaleCount = demoData.genderDistribution.find((g) => g.gender === "Female")?.count || 0;
  const totalGender = maleCount + femaleCount || 1;
  const malePercent = Math.round((maleCount / totalGender) * 100);
  const femalePercent = 100 - malePercent; 

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
                {/* Hoặc dùng component Spinner của Trung */}
                <p className="text-muted-foreground animate-pulse">
                  Đang tải dữ liệu...
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight text-foreground">
                    Dashboard
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Chào mừng quay trở lại, Admin.
                  </p>
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
                    <p className={`text-xs font-medium ${stats.revenueGrowth >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {stats.revenueGrowth >= 0 ? "↑" : "↓"} {Math.abs(stats.revenueGrowth)}% so với tháng trước
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
                    <CardTitle >
                      Tổng cư dân
                    </CardTitle>
                  </CardHeader>
                  <CardValue>
                    {demoData.totalResidents}
                  </CardValue>
                  <CardFooter>
                    <p className="text-xs text-muted-foreground">
                      Người dân đang sinh sống
                    </p>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>
                      Biến động mới
                    </CardTitle>
                  </CardHeader>
                  <CardValue >
                    +{demoData.recentChangesCount}
                  </CardValue>
                  <CardFooter>
                    <p className="text-xs text-muted-foreground">
                      Trong 30 ngày qua
                    </p>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle >
                      Tạm vắng / Tạm trú
                    </CardTitle>
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
                    <CardTitle className="flex items-center gap-2">
                      <Activity size={18} /> Giao dịch gần đây
                    </CardTitle>
                  </CardHeader>
                  <div className="px-4 pb-4">
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
                      <CardTitle className="text-sm font-semibold">
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

              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">
                    Tình trạng thu phí gần đây
                  </h2>
                  <Button variant="link" size="sm">
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
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground py-8"
                        >
                          Chưa có dữ liệu hóa đơn
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentInvoices.map((invoice) => {
                        const statusInfo = STATUS_MAP[invoice.status] || {
                          label: invoice.status,
                          color: "gray",
                        };
                        return (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">
                              {invoice.invoice_number}
                            </TableCell>
                            <TableCell>
                              {invoice.household?.room_number ?? "-"}
                            </TableCell>
                            <TableCell>
                              {invoice.fee_period?.name ?? "-"}
                            </TableCell>
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
