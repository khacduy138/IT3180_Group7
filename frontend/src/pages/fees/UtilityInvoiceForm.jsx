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

const UTILITY_TYPE_OPTIONS = [
  { value: 'electricity', label: 'Điện' },
  { value: 'water', label: 'Nước' },
  { value: 'internet', label: 'Internet' },
];

const UTILITY_LABELS = {
  electricity: { unit: 'kWh', placeholder: 'Số kWh', label: 'Điện' },
  water: { unit: 'm³', placeholder: 'Số m³', label: 'Nước' },
  internet: { unit: null, placeholder: null, label: 'Internet (cố định)' },
};

const EMPTY_FORM = {
  feePeriodId: '',
  householdId: '',
  utilityType: 'electricity',
  previousReading: '',
  currentReading: '',
  usageAmount: '',
  unitPrice: '',
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

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));

export default function UtilityInvoiceForm() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [feePeriods, setFeePeriods] = useState([]);
  const [loadingPeriods, setLoadingPeriods] = useState(true);

  const [households, setHouseholds] = useState([]);
  const [loadingHouseholds, setLoadingHouseholds] = useState(true);

  const [toast, setToast] = useState({ open: false, variant: 'success', title: '', description: '' });

  const showToast = (variant, title, description = '') =>
    setToast({ open: true, variant, title, description });

  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        const res = await fetch(`${API}/fee-periods?status=ACTIVE&pageSize=100`, {
          headers: authHeaders(),
        });
        const data = await res.json();
        if (res.ok) setFeePeriods(data.data || []);
      } catch {
        /* ignore */
      } finally {
        setLoadingPeriods(false);
      }
    };
    fetchPeriods();
  }, []);

  useEffect(() => {
    const fetchHouseholds = async () => {
      try {
        const res = await fetch(`${API}/households?pageSize=200`, {
          headers: authHeaders(),
        });
        const data = await res.json();
        if (res.ok) setHouseholds(data.data || []);
      } catch {
        /* ignore */
      } finally {
        setLoadingHouseholds(false);
      }
    };
    fetchHouseholds();
  }, []);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const isInternet = form.utilityType === 'internet';
  const utilInfo = UTILITY_LABELS[form.utilityType] || UTILITY_LABELS.electricity;

  const computedUsage = (() => {
    if (isInternet) return null;
    const prev = Number(form.previousReading);
    const curr = Number(form.currentReading);
    if (form.previousReading !== '' && form.currentReading !== '' && !Number.isNaN(prev) && !Number.isNaN(curr)) {
      return curr - prev;
    }
    if (form.usageAmount !== '') return Number(form.usageAmount);
    return null;
  })();

  const estimatedTotal = (() => {
    if (form.unitPrice === '') return null;
    const price = Number(form.unitPrice);
    if (Number.isNaN(price) || price < 0) return null;
    if (isInternet) return price;
    if (computedUsage !== null && computedUsage >= 0) return computedUsage * price;
    return null;
  })();

  const feePeriodOptions = feePeriods.map((fp) => ({
    value: String(fp.id),
    label: `${fp.name} (${fp.code})`,
  }));

  const householdOptions = households.map((hh) => ({
    value: String(hh.id),
    label: `Phòng ${hh.room_number}${hh.square_meters ? ` — ${hh.square_meters} m²` : ''}`,
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});

    const payload = {
      feePeriodId: Number(form.feePeriodId),
      householdId: Number(form.householdId),
      utilityType: form.utilityType,
      unitPrice: Number(form.unitPrice),
    };

    if (isInternet) {
      payload.usageAmount = 1;
    } else if (form.previousReading !== '' && form.currentReading !== '') {
      payload.previousReading = Number(form.previousReading);
      payload.currentReading = Number(form.currentReading);
    } else {
      payload.usageAmount = Number(form.usageAmount);
    }

    try {
      const res = await fetch(`${API}/utility-invoices`, {
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
        showToast('error', 'Lỗi', data.message || 'Không thể tạo hóa đơn tiện ích');
        return;
      }

      showToast('success', 'Thành công', 'Đã lưu hóa đơn tiện ích');
      setForm(EMPTY_FORM);
    } catch {
      showToast('error', 'Lỗi', 'Không thể kết nối đến máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  const loading = loadingPeriods || loadingHouseholds;

  return (
    <div className="min-h-screen bg-background">
      <TopBar onToggleSidebar={() => setSidebarOpen((c) => !c)} sidebarOpen={sidebarOpen} />

      <div className="flex">
        <Sidebar open={sidebarOpen} />

        <main className={`flex-1 p-8 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Nhập hóa đơn tiện ích</h1>
                <p className="mt-1 text-muted-foreground">Nhập chỉ số điện, nước hoặc internet cho hộ gia đình</p>
              </div>
              <Button type="button" variant="outline" onClick={() => navigate('/fees')}>
                Quay lại
              </Button>
            </div>

            {loading ? (
              <Card className="flex min-h-40 items-center justify-center gap-2 text-muted-foreground">
                <Spinner className="h-5 w-5" /> Đang tải dữ liệu...
              </Card>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="space-y-4">
                  <h2 className="text-base font-semibold">Thông tin chung</h2>

                  <FieldRow label="Đợt thu" required error={fieldErrors.feePeriodId}>
                    {feePeriods.length === 0 ? (
                      <p className="text-sm text-destructive">Không có đợt thu nào đang hoạt động (ACTIVE).</p>
                    ) : (
                      <Select
                        value={form.feePeriodId}
                        onValueChange={(v) => setField('feePeriodId', v)}
                        options={feePeriodOptions}
                        placeholder="Chọn đợt thu"
                        className="w-full"
                        aria-invalid={!!fieldErrors.feePeriodId}
                      />
                    )}
                  </FieldRow>

                  <FieldRow label="Hộ gia đình" required error={fieldErrors.householdId}>
                    {households.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Không có hộ gia đình nào.</p>
                    ) : (
                      <Select
                        value={form.householdId}
                        onValueChange={(v) => setField('householdId', v)}
                        options={householdOptions}
                        placeholder="Chọn hộ gia đình"
                        className="w-full"
                        aria-invalid={!!fieldErrors.householdId}
                      />
                    )}
                  </FieldRow>

                  <FieldRow label="Loại tiện ích" required error={fieldErrors.utilityType}>
                    <Select
                      value={form.utilityType}
                      onValueChange={(v) => {
                        setField('utilityType', v);
                        setField('previousReading', '');
                        setField('currentReading', '');
                        setField('usageAmount', '');
                      }}
                      options={UTILITY_TYPE_OPTIONS}
                      className="w-full"
                    />
                  </FieldRow>
                </Card>

                <Card className="space-y-4">
                  <h2 className="text-base font-semibold">Chỉ số tiêu thụ</h2>

                  {isInternet ? (
                    <p className="text-sm text-muted-foreground">
                      Internet là phí cố định — chỉ cần nhập đơn giá bên dưới.
                    </p>
                  ) : (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FieldRow
                          label={`Chỉ số cũ (${utilInfo.unit})`}
                          error={fieldErrors.previousReading}
                        >
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            value={form.previousReading}
                            onChange={(e) => setField('previousReading', e.target.value)}
                            placeholder="Chỉ số kỳ trước"
                            variant={fieldErrors.previousReading ? 'error' : 'default'}
                          />
                        </FieldRow>

                        <FieldRow
                          label={`Chỉ số mới (${utilInfo.unit})`}
                          error={fieldErrors.currentReading}
                        >
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            value={form.currentReading}
                            onChange={(e) => setField('currentReading', e.target.value)}
                            placeholder="Chỉ số kỳ này"
                            variant={fieldErrors.currentReading ? 'error' : 'default'}
                          />
                        </FieldRow>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-xs text-muted-foreground">hoặc nhập trực tiếp</span>
                        <div className="h-px flex-1 bg-border" />
                      </div>

                      <FieldRow
                        label={`Số lượng tiêu thụ (${utilInfo.unit})`}
                        error={fieldErrors.usageAmount}
                      >
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={form.usageAmount}
                          onChange={(e) => setField('usageAmount', e.target.value)}
                          placeholder={utilInfo.placeholder}
                          variant={fieldErrors.usageAmount ? 'error' : 'default'}
                          disabled={form.previousReading !== '' || form.currentReading !== ''}
                        />
                        {(form.previousReading !== '' || form.currentReading !== '') && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Sẽ tự tính từ chỉ số cũ / mới
                          </p>
                        )}
                      </FieldRow>

                      {computedUsage !== null && (
                        <div className="rounded-md bg-accent/40 px-4 py-3 text-sm">
                          <span className="text-muted-foreground">Tiêu thụ tính được: </span>
                          <span className="font-semibold">
                            {computedUsage >= 0 ? `${computedUsage} ${utilInfo.unit}` : (
                              <span className="text-destructive">Chỉ số mới phải lớn hơn chỉ số cũ</span>
                            )}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  <FieldRow label="Đơn giá (VNĐ)" required error={fieldErrors.unitPrice}>
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      value={form.unitPrice}
                      onChange={(e) => setField('unitPrice', e.target.value)}
                      placeholder={isInternet ? 'Phí internet cố định' : `Giá mỗi ${utilInfo.unit}`}
                      variant={fieldErrors.unitPrice ? 'error' : 'default'}
                      required
                    />
                  </FieldRow>

                  {estimatedTotal !== null && estimatedTotal >= 0 && (
                    <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3">
                      <p className="text-sm text-muted-foreground">Thành tiền ước tính</p>
                      <p className="text-lg font-bold text-primary">{formatCurrency(estimatedTotal)}</p>
                    </div>
                  )}
                </Card>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setForm(EMPTY_FORM); setFieldErrors({}); }}
                    disabled={submitting}
                  >
                    Đặt lại
                  </Button>
                  <Button type="submit" disabled={submitting || feePeriods.length === 0}>
                    {submitting ? 'Đang lưu...' : 'Lưu hóa đơn'}
                  </Button>
                </div>
              </form>
            )}
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
