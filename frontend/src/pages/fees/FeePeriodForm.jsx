import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import TopBar from '../../components/ui/TopBar';
import Sidebar from '../../components/ui/Sidebar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Spinner } from '../../components/ui/Spinner';
import { Toast } from '../../components/ui/Toast';

const API = 'http://localhost:3001/api';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const MONTH_OPTIONS = [
  { value: '', label: 'Không có tháng cụ thể' },
  { value: '1', label: 'Tháng 1' },
  { value: '2', label: 'Tháng 2' },
  { value: '3', label: 'Tháng 3' },
  { value: '4', label: 'Tháng 4' },
  { value: '5', label: 'Tháng 5' },
  { value: '6', label: 'Tháng 6' },
  { value: '7', label: 'Tháng 7' },
  { value: '8', label: 'Tháng 8' },
  { value: '9', label: 'Tháng 9' },
  { value: '10', label: 'Tháng 10' },
  { value: '11', label: 'Tháng 11' },
  { value: '12', label: 'Tháng 12' },
];

const PERIOD_TYPE_OPTIONS = [
  { value: 'monthly', label: 'Hàng tháng' },
  { value: 'quarterly', label: 'Hàng quý' },
  { value: 'yearly', label: 'Hàng năm' },
];

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Nháp (Draft)' },
  { value: 'ACTIVE', label: 'Đang thu (Active)' },
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const EMPTY_FORM = {
  code: '',
  name: '',
  periodType: 'monthly',
  month: String(currentMonth),
  year: String(currentYear),
  startDate: '',
  endDate: '',
  status: 'DRAFT',
  feeTypeIds: [],
};

function FieldError({ message }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-destructive">{message}</p>;
}

function FieldRow({ label, required, children, error }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

export default function FeePeriodForm() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [feeTypes, setFeeTypes] = useState([]);
  const [loadingFeeTypes, setLoadingFeeTypes] = useState(true);

  const [toast, setToast] = useState({ open: false, variant: 'success', title: '', description: '' });

  const showToast = (variant, title, description = '') =>
    setToast({ open: true, variant, title, description });

  useEffect(() => {
    const fetchFeeTypes = async () => {
      try {
        const res = await fetch(`${API}/fee-types?isActive=true&pageSize=100`, {
          headers: authHeaders(),
        });
        const data = await res.json();
        if (res.ok) {
          setFeeTypes(data.data || []);
        }
      } catch {
        /* ignore */
      } finally {
        setLoadingFeeTypes(false);
      }
    };
    fetchFeeTypes();
  }, []);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggleFeeType = (id) => {
    setForm((prev) => {
      const ids = prev.feeTypeIds.includes(id)
        ? prev.feeTypeIds.filter((x) => x !== id)
        : [...prev.feeTypeIds, id];
      return { ...prev, feeTypeIds: ids };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});

    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      periodType: form.periodType,
      month: form.month ? Number(form.month) : undefined,
      year: Number(form.year),
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.status,
      feeTypeIds: form.feeTypeIds,
    };

    try {
      const res = await fetch(`${API}/fee-periods`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const errs = {};
          data.errors.forEach((err) => {
            if (err.field) errs[err.field] = err.message;
          });
          setFieldErrors(errs);
        }
        showToast('error', 'Lỗi', data.message || 'Không thể tạo đợt thu');
        return;
      }

      showToast('success', 'Thành công', `Đã tạo đợt thu "${data.data?.name}"`);
      setTimeout(() => navigate('/fees'), 1200);
    } catch {
      showToast('error', 'Lỗi', 'Không thể kết nối đến máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  const previewFeeTypes = feeTypes.filter((ft) => form.feeTypeIds.includes(ft.id));

  return (
    <div className="min-h-screen bg-background">
      <TopBar onToggleSidebar={() => setSidebarOpen((c) => !c)} sidebarOpen={sidebarOpen} />

      <div className="flex">
        <Sidebar open={sidebarOpen} />

        <main className={`flex-1 p-8 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Tạo đợt thu mới</h1>
                <p className="mt-1 text-muted-foreground">Thiết lập thông tin đợt thu và chọn loại phí áp dụng</p>
              </div>
              <Button type="button" variant="outline" onClick={() => navigate('/fees')}>
                Quay lại
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Card className="space-y-4">
                <h2 className="text-base font-semibold">Thông tin đợt thu</h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldRow label="Mã đợt thu" required error={fieldErrors.code}>
                    <Input
                      value={form.code}
                      onChange={(e) => setField('code', e.target.value)}
                      placeholder="VD: DOTHU-2025-06"
                      variant={fieldErrors.code ? 'error' : 'default'}
                      required
                    />
                  </FieldRow>

                  <FieldRow label="Tên đợt thu" required error={fieldErrors.name}>
                    <Input
                      value={form.name}
                      onChange={(e) => setField('name', e.target.value)}
                      placeholder="VD: Đợt thu tháng 6/2025"
                      variant={fieldErrors.name ? 'error' : 'default'}
                      required
                    />
                  </FieldRow>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <FieldRow label="Loại chu kỳ" required error={fieldErrors.periodType}>
                    <Select
                      value={form.periodType}
                      onValueChange={(v) => setField('periodType', v)}
                      options={PERIOD_TYPE_OPTIONS}
                      className="w-full"
                    />
                  </FieldRow>

                  <FieldRow label="Tháng" error={fieldErrors.month}>
                    <Select
                      value={form.month}
                      onValueChange={(v) => setField('month', v)}
                      options={MONTH_OPTIONS}
                      className="w-full"
                    />
                  </FieldRow>

                  <FieldRow label="Năm" required error={fieldErrors.year}>
                    <Input
                      type="number"
                      min="2000"
                      max="2100"
                      value={form.year}
                      onChange={(e) => setField('year', e.target.value)}
                      variant={fieldErrors.year ? 'error' : 'default'}
                      required
                    />
                  </FieldRow>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldRow label="Ngày bắt đầu" required error={fieldErrors.startDate}>
                    <Input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setField('startDate', e.target.value)}
                      variant={fieldErrors.startDate ? 'error' : 'default'}
                      required
                    />
                  </FieldRow>

                  <FieldRow label="Ngày kết thúc" required error={fieldErrors.endDate}>
                    <Input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setField('endDate', e.target.value)}
                      variant={fieldErrors.endDate ? 'error' : 'default'}
                      required
                    />
                  </FieldRow>
                </div>

                <FieldRow label="Trạng thái" required error={fieldErrors.status}>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setField('status', v)}
                    options={STATUS_OPTIONS}
                    className="w-full sm:w-64"
                  />
                </FieldRow>
              </Card>

              <Card className="space-y-4">
                <h2 className="text-base font-semibold">Loại phí áp dụng</h2>
                {loadingFeeTypes ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Spinner className="h-4 w-4" /> Đang tải loại phí...
                  </div>
                ) : feeTypes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Không có loại phí nào đang hoạt động.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {feeTypes.map((ft) => {
                      const checked = form.feeTypeIds.includes(ft.id);
                      return (
                        <label
                          key={ft.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors ${
                            checked ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleFeeType(ft.id)}
                            className="h-4 w-4 accent-primary"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{ft.name}</p>
                            <p className="text-xs text-muted-foreground">{ft.code} · {ft.calculation_type}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </Card>

              {previewFeeTypes.length > 0 && (
                <Card className="space-y-3">
                  <h2 className="text-base font-semibold">Xem trước — loại phí đã chọn</h2>
                  <div className="divide-y divide-border rounded-md border border-border">
                    {previewFeeTypes.map((ft) => (
                      <div key={ft.id} className="flex items-center justify-between px-4 py-3 text-sm">
                        <div>
                          <span className="font-medium">{ft.name}</span>
                          <span className="ml-2 text-muted-foreground">({ft.calculation_type})</span>
                        </div>
                        <span className="text-muted-foreground">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(ft.unit_price || 0))}
                          {ft.unit ? ` / ${ft.unit}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => navigate('/fees')} disabled={submitting}>
                  Hủy
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : 'Tạo đợt thu'}
                </Button>
              </div>
            </form>
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
