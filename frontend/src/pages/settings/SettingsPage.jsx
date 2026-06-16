import React, { useState } from "react";
import {
  User,
  Lock,
  Bell,
  Building2,
  CreditCard,
  Shield,
  ChevronRight,
  Save,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import TopBar from "../../components/ui/TopBar";
import Sidebar from "../../components/ui/Sidebar";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Toast } from "../../components/ui/Toast";
import { Card } from "../../components/ui/Card";
import { cn } from "../../lib/utils";

const SECTIONS = [
  { id: "profile", label: "Tài khoản", icon: User },
  { id: "security", label: "Bảo mật", icon: Lock },
  { id: "notifications", label: "Thông báo", icon: Bell },
  { id: "building", label: "Thông tin tòa nhà", icon: Building2 },
  { id: "billing", label: "Phí & Thanh toán", icon: CreditCard },
  { id: "permissions", label: "Phân quyền", icon: Shield },
];

function SectionNav({ active, onChange }) {
  return (
    <nav className="flex flex-col gap-1">
      {SECTIONS.map((s) => {
        const Icon = s.icon;
        const isActive = active === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon size={16} className="shrink-0" />
            {s.label}
            {!isActive && <ChevronRight size={14} className="ml-auto opacity-40" />}
          </button>
        );
      })}
    </nav>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="shrink-0 w-64">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        checked ? "bg-primary" : "bg-muted",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

function ProfileSection({ onSave }) {
  const [form, setForm] = useState({
    displayName: localStorage.getItem("username") || "",
    email: "",
    phone: "",
    avatar: "",
  });

  const handleSave = () => {
    localStorage.setItem("username", form.displayName);
    onSave("success", "Đã lưu thông tin tài khoản");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Tài khoản</h2>
        <p className="text-sm text-muted-foreground mt-1">Thông tin cá nhân của quản lý</p>
      </div>

      <Card className="divide-y divide-border p-0 overflow-hidden">
        <div className="p-6 flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
            {(form.displayName || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold">{form.displayName || "Quản lý"}</p>
            <p className="text-xs text-muted-foreground">
              {localStorage.getItem("userRole") || "manager"}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-0 divide-y divide-border">
          <SettingRow label="Tên hiển thị" description="Tên xuất hiện trên giao diện hệ thống">
            <Input
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              placeholder="Nguyễn Văn A"
            />
          </SettingRow>
          <SettingRow label="Email liên hệ" description="Dùng để nhận thông báo hệ thống">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="manager@bluemoon.vn"
            />
          </SettingRow>
          <SettingRow label="Số điện thoại" description="Liên hệ khẩn cấp">
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="09xx xxx xxx"
            />
          </SettingRow>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Save size={16} /> Lưu thay đổi
        </Button>
      </div>
    </div>
  );
}

function SecuritySection({ onSave }) {
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [twoFactor, setTwoFactor] = useState(false);

  const handleChangePassword = () => {
    if (!form.oldPassword || !form.newPassword) {
      onSave("error", "Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      onSave("error", "Mật khẩu xác nhận không khớp");
      return;
    }
    if (form.newPassword.length < 8) {
      onSave("error", "Mật khẩu mới phải có ít nhất 8 ký tự");
      return;
    }
    onSave("success", "Đã đổi mật khẩu thành công");
    setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Bảo mật</h2>
        <p className="text-sm text-muted-foreground mt-1">Quản lý mật khẩu và cài đặt bảo mật</p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 bg-muted/30 border-b border-border">
          <p className="text-sm font-semibold">Đổi mật khẩu</p>
        </div>
        <div className="p-6 space-y-0 divide-y divide-border">
          <SettingRow label="Mật khẩu hiện tại">
            <div className="relative">
              <Input
                type={showOld ? "text" : "password"}
                value={form.oldPassword}
                onChange={(e) => setForm({ ...form, oldPassword: e.target.value })}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowOld(!showOld)}
              >
                {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </SettingRow>
          <SettingRow label="Mật khẩu mới" description="Tối thiểu 8 ký tự, bao gồm chữ và số">
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </SettingRow>
          <SettingRow label="Xác nhận mật khẩu mới">
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </SettingRow>
        </div>
        <div className="px-6 pb-6 flex justify-end">
          <Button onClick={handleChangePassword} className="gap-2">
            <Lock size={16} /> Cập nhật mật khẩu
          </Button>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 bg-muted/30 border-b border-border">
          <p className="text-sm font-semibold">Phiên đăng nhập</p>
        </div>
        <div className="p-6 divide-y divide-border">
          <SettingRow
            label="Thời gian hết phiên"
            description="Tự động đăng xuất sau thời gian không hoạt động"
          >
            <Select
              value={sessionTimeout}
              onValueChange={setSessionTimeout}
              options={[
                { value: "15", label: "15 phút" },
                { value: "30", label: "30 phút" },
                { value: "60", label: "1 giờ" },
                { value: "120", label: "2 giờ" },
                { value: "0", label: "Không giới hạn" },
              ]}
              className="w-full"
            />
          </SettingRow>
          <SettingRow
            label="Xác thực 2 bước"
            description="Tăng cường bảo mật bằng mã OTP khi đăng nhập"
          >
            <div className="flex justify-end">
              <Toggle checked={twoFactor} onChange={setTwoFactor} />
            </div>
          </SettingRow>
        </div>
      </Card>
    </div>
  );
}

function NotificationsSection({ onSave }) {
  const [notif, setNotif] = useState({
    overdueInvoice: true,
    newPayment: true,
    residentChange: true,
    systemAlert: true,
    weeklyReport: false,
    monthlyReport: true,
    emailNotif: true,
    inAppNotif: true,
    overdueReminder: "3",
  });

  const toggle = (key) => setNotif((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Thông báo</h2>
        <p className="text-sm text-muted-foreground mt-1">Cài đặt các loại thông báo nhận được</p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 bg-muted/30 border-b border-border">
          <p className="text-sm font-semibold">Thông báo thu phí</p>
        </div>
        <div className="p-6 divide-y divide-border">
          <SettingRow label="Hóa đơn quá hạn" description="Cảnh báo khi có hộ nợ phí quá hạn">
            <div className="flex justify-end">
              <Toggle checked={notif.overdueInvoice} onChange={() => toggle("overdueInvoice")} />
            </div>
          </SettingRow>
          <SettingRow
            label="Nhắc nhở trước hạn (ngày)"
            description="Số ngày trước hạn để gửi nhắc nhở cư dân"
          >
            <Select
              value={notif.overdueReminder}
              onValueChange={(v) => setNotif({ ...notif, overdueReminder: v })}
              options={[
                { value: "1", label: "1 ngày trước" },
                { value: "3", label: "3 ngày trước" },
                { value: "5", label: "5 ngày trước" },
                { value: "7", label: "7 ngày trước" },
              ]}
              className="w-full"
            />
          </SettingRow>
          <SettingRow label="Thanh toán mới" description="Khi có giao dịch thanh toán thành công">
            <div className="flex justify-end">
              <Toggle checked={notif.newPayment} onChange={() => toggle("newPayment")} />
            </div>
          </SettingRow>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 bg-muted/30 border-b border-border">
          <p className="text-sm font-semibold">Thông báo nhân khẩu & hệ thống</p>
        </div>
        <div className="p-6 divide-y divide-border">
          <SettingRow
            label="Biến động nhân khẩu"
            description="Tạm vắng, tạm trú, chuyển đến / chuyển đi"
          >
            <div className="flex justify-end">
              <Toggle checked={notif.residentChange} onChange={() => toggle("residentChange")} />
            </div>
          </SettingRow>
          <SettingRow label="Cảnh báo hệ thống" description="Lỗi, sự cố kết nối hoặc bảo trì">
            <div className="flex justify-end">
              <Toggle checked={notif.systemAlert} onChange={() => toggle("systemAlert")} />
            </div>
          </SettingRow>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 bg-muted/30 border-b border-border">
          <p className="text-sm font-semibold">Báo cáo định kỳ</p>
        </div>
        <div className="p-6 divide-y divide-border">
          <SettingRow label="Báo cáo tuần" description="Tổng hợp thu chi mỗi tuần">
            <div className="flex justify-end">
              <Toggle checked={notif.weeklyReport} onChange={() => toggle("weeklyReport")} />
            </div>
          </SettingRow>
          <SettingRow label="Báo cáo tháng" description="Báo cáo tổng kết cuối tháng">
            <div className="flex justify-end">
              <Toggle checked={notif.monthlyReport} onChange={() => toggle("monthlyReport")} />
            </div>
          </SettingRow>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 bg-muted/30 border-b border-border">
          <p className="text-sm font-semibold">Kênh nhận thông báo</p>
        </div>
        <div className="p-6 divide-y divide-border">
          <SettingRow label="Thông báo trong ứng dụng" description="Hiển thị popup / badge trong app">
            <div className="flex justify-end">
              <Toggle checked={notif.inAppNotif} onChange={() => toggle("inAppNotif")} />
            </div>
          </SettingRow>
          <SettingRow label="Thông báo qua Email" description="Gửi email đến địa chỉ đã đăng ký">
            <div className="flex justify-end">
              <Toggle checked={notif.emailNotif} onChange={() => toggle("emailNotif")} />
            </div>
          </SettingRow>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => onSave("success", "Đã lưu cài đặt thông báo")} className="gap-2">
          <Save size={16} /> Lưu cài đặt
        </Button>
      </div>
    </div>
  );
}

function BuildingSection({ onSave }) {
  const [form, setForm] = useState({
    buildingName: "BlueMoon Apartment",
    address: "",
    totalFloors: "",
    totalUnits: "",
    managementFeeRate: "",
    parkingFeeMotorbike: "",
    parkingFeeCar: "",
    currency: "VND",
    dateFormat: "dd/MM/yyyy",
    fiscalMonthStart: "1",
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Thông tin tòa nhà</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Cấu hình thông tin cơ bản của chung cư
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 bg-muted/30 border-b border-border">
          <p className="text-sm font-semibold">Thông tin cơ bản</p>
        </div>
        <div className="p-6 divide-y divide-border">
          <SettingRow label="Tên tòa nhà" description="Tên hiển thị trên hóa đơn và báo cáo">
            <Input
              value={form.buildingName}
              onChange={(e) => setForm({ ...form, buildingName: e.target.value })}
              placeholder="BlueMoon Apartment"
            />
          </SettingRow>
          <SettingRow label="Địa chỉ">
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="123 Đường ABC, Quận 1, TP.HCM"
            />
          </SettingRow>
          <SettingRow label="Số tầng">
            <Input
              type="number"
              value={form.totalFloors}
              onChange={(e) => setForm({ ...form, totalFloors: e.target.value })}
              placeholder="20"
            />
          </SettingRow>
          <SettingRow label="Tổng số căn hộ">
            <Input
              type="number"
              value={form.totalUnits}
              onChange={(e) => setForm({ ...form, totalUnits: e.target.value })}
              placeholder="200"
            />
          </SettingRow>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 bg-muted/30 border-b border-border">
          <p className="text-sm font-semibold">Phí quản lý mặc định</p>
        </div>
        <div className="p-6 divide-y divide-border">
          <SettingRow
            label="Phí quản lý (VNĐ/m²/tháng)"
            description="Áp dụng mặc định khi tạo đợt thu mới"
          >
            <Input
              type="number"
              value={form.managementFeeRate}
              onChange={(e) => setForm({ ...form, managementFeeRate: e.target.value })}
              placeholder="7000"
            />
          </SettingRow>
          <SettingRow label="Phí giữ xe máy (VNĐ/tháng)">
            <Input
              type="number"
              value={form.parkingFeeMotorbike}
              onChange={(e) => setForm({ ...form, parkingFeeMotorbike: e.target.value })}
              placeholder="100000"
            />
          </SettingRow>
          <SettingRow label="Phí giữ ô tô (VNĐ/tháng)">
            <Input
              type="number"
              value={form.parkingFeeCar}
              onChange={(e) => setForm({ ...form, parkingFeeCar: e.target.value })}
              placeholder="1200000"
            />
          </SettingRow>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 bg-muted/30 border-b border-border">
          <p className="text-sm font-semibold">Cài đặt địa phương</p>
        </div>
        <div className="p-6 divide-y divide-border">
          <SettingRow label="Đơn vị tiền tệ">
            <Select
              value={form.currency}
              onValueChange={(v) => setForm({ ...form, currency: v })}
              options={[
                { value: "VND", label: "VNĐ - Việt Nam Đồng" },
                { value: "USD", label: "USD - Đô la Mỹ" },
              ]}
              className="w-full"
            />
          </SettingRow>
          <SettingRow label="Định dạng ngày tháng">
            <Select
              value={form.dateFormat}
              onValueChange={(v) => setForm({ ...form, dateFormat: v })}
              options={[
                { value: "dd/MM/yyyy", label: "DD/MM/YYYY" },
                { value: "MM/dd/yyyy", label: "MM/DD/YYYY" },
                { value: "yyyy-MM-dd", label: "YYYY-MM-DD" },
              ]}
              className="w-full"
            />
          </SettingRow>
          <SettingRow
            label="Ngày bắt đầu kỳ thu"
            description="Ngày trong tháng bắt đầu chu kỳ thu phí"
          >
            <Select
              value={form.fiscalMonthStart}
              onValueChange={(v) => setForm({ ...form, fiscalMonthStart: v })}
              options={Array.from({ length: 28 }, (_, i) => ({
                value: String(i + 1),
                label: `Ngày ${i + 1}`,
              }))}
              className="w-full"
            />
          </SettingRow>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => onSave("success", "Đã lưu thông tin tòa nhà")} className="gap-2">
          <Save size={16} /> Lưu cài đặt
        </Button>
      </div>
    </div>
  );
}

function BillingSection({ onSave }) {
  const [form, setForm] = useState({
    invoicePrefix: "INV",
    autoGenerateInvoice: true,
    autoSendReminder: true,
    reminderDaysBefore: "5",
    lateFeeEnabled: true,
    lateFeeType: "percent",
    lateFeeValue: "2",
    invoiceFooter: "",
    allowPartialPayment: true,
  });

  const toggle = (key) => setForm((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Phí & Thanh toán</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Cấu hình hóa đơn và quy tắc thanh toán
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 bg-muted/30 border-b border-border">
          <p className="text-sm font-semibold">Hóa đơn</p>
        </div>
        <div className="p-6 divide-y divide-border">
          <SettingRow label="Tiền tố mã hóa đơn" description="VD: INV → INV-2024-001">
            <Input
              value={form.invoicePrefix}
              onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
              placeholder="INV"
            />
          </SettingRow>
          <SettingRow
            label="Tự động tạo hóa đơn"
            description="Tạo hóa đơn cho tất cả hộ khi mở đợt thu mới"
          >
            <div className="flex justify-end">
              <Toggle checked={form.autoGenerateInvoice} onChange={() => toggle("autoGenerateInvoice")} />
            </div>
          </SettingRow>
          <SettingRow
            label="Cho phép thanh toán một phần"
            description="Hộ có thể nộp thiếu, trạng thái sẽ là 'Nộp một phần'"
          >
            <div className="flex justify-end">
              <Toggle checked={form.allowPartialPayment} onChange={() => toggle("allowPartialPayment")} />
            </div>
          </SettingRow>
          <SettingRow label="Nội dung cuối hóa đơn" description="Ghi chú hiển thị ở cuối mỗi hóa đơn">
            <Input
              value={form.invoiceFooter}
              onChange={(e) => setForm({ ...form, invoiceFooter: e.target.value })}
              placeholder="Vui lòng nộp phí đúng hạn. Xin cảm ơn!"
            />
          </SettingRow>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 bg-muted/30 border-b border-border">
          <p className="text-sm font-semibold">Phí trễ hạn</p>
        </div>
        <div className="p-6 divide-y divide-border">
          <SettingRow label="Áp dụng phí trễ hạn" description="Tính thêm phí khi hộ nộp trễ">
            <div className="flex justify-end">
              <Toggle checked={form.lateFeeEnabled} onChange={() => toggle("lateFeeEnabled")} />
            </div>
          </SettingRow>
          <SettingRow label="Kiểu phí trễ hạn">
            <Select
              value={form.lateFeeType}
              onValueChange={(v) => setForm({ ...form, lateFeeType: v })}
              options={[
                { value: "percent", label: "Phần trăm (%/tháng)" },
                { value: "fixed", label: "Số tiền cố định (VNĐ)" },
              ]}
              className="w-full"
              disabled={!form.lateFeeEnabled}
            />
          </SettingRow>
          <SettingRow
            label={form.lateFeeType === "percent" ? "Tỷ lệ phí trễ hạn (%)" : "Mức phí cố định (VNĐ)"}
          >
            <Input
              type="number"
              value={form.lateFeeValue}
              onChange={(e) => setForm({ ...form, lateFeeValue: e.target.value })}
              placeholder={form.lateFeeType === "percent" ? "2" : "50000"}
              disabled={!form.lateFeeEnabled}
            />
          </SettingRow>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 bg-muted/30 border-b border-border">
          <p className="text-sm font-semibold">Nhắc nhở thanh toán</p>
        </div>
        <div className="p-6 divide-y divide-border">
          <SettingRow
            label="Tự động nhắc nhở"
            description="Gửi thông báo nhắc nhở trước ngày hết hạn"
          >
            <div className="flex justify-end">
              <Toggle checked={form.autoSendReminder} onChange={() => toggle("autoSendReminder")} />
            </div>
          </SettingRow>
          <SettingRow label="Nhắc trước hạn" description="Số ngày trước khi gửi nhắc nhở lần đầu">
            <Select
              value={form.reminderDaysBefore}
              onValueChange={(v) => setForm({ ...form, reminderDaysBefore: v })}
              options={[
                { value: "3", label: "3 ngày trước hạn" },
                { value: "5", label: "5 ngày trước hạn" },
                { value: "7", label: "7 ngày trước hạn" },
                { value: "14", label: "14 ngày trước hạn" },
              ]}
              className="w-full"
              disabled={!form.autoSendReminder}
            />
          </SettingRow>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => onSave("success", "Đã lưu cài đặt phí & thanh toán")} className="gap-2">
          <Save size={16} /> Lưu cài đặt
        </Button>
      </div>
    </div>
  );
}

function PermissionsSection({ onSave }) {
  const [permissions, setPermissions] = useState({
    manager: {
      viewDashboard: true,
      manageHouseholds: true,
      manageResidents: true,
      createInvoices: true,
      viewPayments: true,
      processPayments: false,
      manageUsers: false,
      viewReports: true,
      exportData: true,
    },
    accountant: {
      viewDashboard: true,
      manageHouseholds: false,
      manageResidents: false,
      createInvoices: true,
      viewPayments: true,
      processPayments: true,
      manageUsers: false,
      viewReports: true,
      exportData: true,
    },
    staff: {
      viewDashboard: true,
      manageHouseholds: true,
      manageResidents: true,
      createInvoices: false,
      viewPayments: false,
      processPayments: false,
      manageUsers: false,
      viewReports: false,
      exportData: false,
    },
  });

  const [activeRole, setActiveRole] = useState("manager");

  const PERM_LABELS = [
    { key: "viewDashboard", label: "Xem Dashboard", description: "Thống kê tổng quan" },
    { key: "manageHouseholds", label: "Quản lý căn hộ", description: "Thêm, sửa, xóa hộ gia đình" },
    { key: "manageResidents", label: "Quản lý nhân khẩu", description: "Thêm, sửa cư dân & biến động" },
    { key: "createInvoices", label: "Tạo hóa đơn", description: "Tạo đợt thu và hóa đơn mới" },
    { key: "viewPayments", label: "Xem thanh toán", description: "Xem lịch sử giao dịch" },
    { key: "processPayments", label: "Xử lý thanh toán", description: "Ghi nhận và xác nhận thanh toán" },
    { key: "manageUsers", label: "Quản lý tài khoản", description: "Tạo, sửa, khóa tài khoản nhân sự" },
    { key: "viewReports", label: "Xem báo cáo", description: "Truy cập báo cáo thống kê" },
    { key: "exportData", label: "Xuất dữ liệu", description: "Xuất file Excel/PDF" },
  ];

  const ROLES = [
    { id: "manager", label: "Quản lý" },
    { id: "accountant", label: "Kế toán" },
    { id: "staff", label: "Nhân viên" },
  ];

  const toggle = (key) => {
    setPermissions((prev) => ({
      ...prev,
      [activeRole]: { ...prev[activeRole], [key]: !prev[activeRole][key] },
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Phân quyền</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Cấu hình quyền truy cập cho từng vai trò trong hệ thống
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 bg-muted/30 border-b border-border flex items-center gap-2">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setActiveRole(r.id)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeRole === r.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="p-6 divide-y divide-border">
          {PERM_LABELS.map(({ key, label, description }) => (
            <SettingRow key={key} label={label} description={description}>
              <div className="flex items-center justify-end gap-3">
                {permissions[activeRole][key] && (
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <Check size={12} /> Được phép
                  </span>
                )}
                <Toggle
                  checked={permissions[activeRole][key]}
                  onChange={() => toggle(key)}
                />
              </div>
            </SettingRow>
          ))}
        </div>
      </Card>

      <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-800">
        <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium">
          Lưu ý: Thay đổi phân quyền có hiệu lực ngay khi lưu và áp dụng cho tất cả tài khoản cùng vai trò.
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => onSave("success", "Đã cập nhật phân quyền")} className="gap-2">
          <Save size={16} /> Lưu phân quyền
        </Button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("profile");
  const [toast, setToast] = useState({
    open: false,
    variant: "success",
    title: "",
    description: "",
  });

  const showToast = (variant, description) => {
    setToast({ open: true, variant, title: variant === "success" ? "Thành công" : "Lỗi", description });
  };

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return <ProfileSection onSave={showToast} />;
      case "security":
        return <SecuritySection onSave={showToast} />;
      case "notifications":
        return <NotificationsSection onSave={showToast} />;
      case "building":
        return <BuildingSection onSave={showToast} />;
      case "billing":
        return <BillingSection onSave={showToast} />;
      case "permissions":
        return <PermissionsSection onSave={showToast} />;
      default:
        return null;
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
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Cài đặt</h1>
              <p className="text-muted-foreground mt-1">
                Quản lý cấu hình hệ thống và tùy chọn cá nhân
              </p>
            </div>

            <div className="flex gap-8 items-start">
              <aside className="w-52 shrink-0 sticky top-24">
                <SectionNav active={activeSection} onChange={setActiveSection} />
              </aside>

              <div className="flex-1 min-w-0">{renderSection()}</div>
            </div>
          </div>
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
