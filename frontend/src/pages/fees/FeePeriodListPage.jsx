import { useEffect, useState } from 'react';
import { Plus, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

import TopBar from '../../components/ui/TopBar';
import Sidebar from '../../components/ui/Sidebar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { Tag } from '../../components/ui/Tag';
import { Toast } from '../../components/ui/Toast';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '../../components/ui/Table';

const API = 'http://localhost:3001/api';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const STATUS_COLORS = {
  DRAFT: 'yellow',
  ACTIVE: 'green',
  CLOSED: 'red',
};

const STATUS_LABELS = {
  DRAFT: 'Nháp',
  ACTIVE: 'Đang thu',
  CLOSED: 'Đã đóng',
};

const PERIOD_TYPE_OPTIONS = [
  { value: 'monthly', label: 'Hàng tháng' },
  { value: 'quarterly', label: 'Hàng quý' },
  { value: 'annual', label: 'Hàng năm' },
];

const MONTH_OPTIONS = [
  { value: '', label: '— Không chọn —' },
  ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Tháng ${i + 1}` })),
];

function FieldRow({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text', required, min }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      min={min}
      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

function SelectNative({ value, onChange, options, required }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

const EMPTY_FORM = {
  code: '',
  name: '',
  periodType: 'monthly',
  month: '',
  year: String(new Date().getFullYear()),
  startDate: '',
  endDate: '',
  feeTypeIds: [],
};

export default function FeePeriodListPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [feePeriods, setFeePeriods] = useState([]);
  const [feeTypes, setFeeTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [expandedId, setExpandedId] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const [generateModal, setGenerateModal] = useState({ open: false, period: null, loading: false });

  const [toast, setToast] = useState({ open: false, variant: 'success', title: '', description: '' });

  const showToast = (variant, title, description = '') =>
    setToast({ open: true, variant, title, description });

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [periodsRes, typesRes] = await Promise.all([
          fetch(`${API}/fee-periods?pageSize=100`, { headers: authHeaders() }),
          fetch(`${API}/fee-types?pageSize=100&isActive=true`, { headers: authHeaders() }),
        ]);
        const [periodsData, typesData] = await Promise.all([periodsRes.json(), typesRes.json()]);
        if (cancelled) return;
        if (!periodsRes.ok) throw new Error(periodsData.message || 'Không thể tải đợt thu');
        setFeePeriods(periodsData.data || []);
        setFeeTypes(typesData.data || []);
      } catch (err) {
        if (!cancelled) showToast('error', 'Lỗi', err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, [reloadKey]);

  const toggleFeeTypeId = (id) => {
    setForm((f) => ({
      ...f,
      feeTypeIds: f.feeTypeIds.includes(id)
        ? f.feeTypeIds.filter((x) => x !== id)
        : [...f.feeTypeIds, id],
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/fee-periods`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          code: form.code,
          name: form.name,
          periodType: form.periodType,
          month: form.month ? Number(form.month) : null,
          year: Number(form.year),
          startDate: form.startDate,
          endDate: form.endDate,
          feeTypeIds: form.feeTypeIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể tạo đợt thu');
      showToast('success', 'Thành công', `Đã tạo đợt thu "${form.name}"`);
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      setReloadKey((k) => k + 1);
    } catch (err) {
      showToast('error', 'Lỗi', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivate = async (period) => {
    try {
      const res = await fetch(`${API}/fee-periods/${period.id}/activate`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể kích hoạt');
      showToast('success', 'Thành công', `Đã kích hoạt đợt thu "${period.name}"`);
      setReloadKey((k) => k + 1);
    } catch (err) {
      showToast('error', 'Lỗi', err.message);
    }
  };

  const handleGenerateInvoices = async () => {
    const period = generateModal.period;
    setGenerateModal((s) => ({ ...s, loading: true }));
    try {
      const res = await fetch(`${API}/fee-periods/${period.id}/generate-invoices`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể generate hóa đơn');
      const { createdCount, failedCount } = data.data || {};
      showToast('success', 'Generate hoàn tất', `Tạo ${createdCount} hóa đơn, ${failedCount} lỗi`);
      setGenerateModal({ open: false, period: null, loading: false });
    } catch (err) {
      showToast('error', 'Lỗi', err.message);
      setGenerateModal((s) => ({ ...s, loading: false }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar onToggleSidebar={() => setSidebarOpen((c) => !c)} sidebarOpen={sidebarOpen} />

      <div className="flex">
        <Sidebar open={sidebarOpen} />

        <main className={`flex-1 p-8 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="mx-auto max-w-7xl space-y-6">

            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Đợt thu phí</h1>
                <p className="mt-1 text-muted-foreground">Quản lý các kỳ thu phí và generate hóa đơn</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setReloadKey((k) => k + 1)} className="gap-2">
                  <RefreshCw size={16} /> Làm mới
                </Button>
                <Button onClick={() => setCreateOpen(true)} className="gap-2">
                  <Plus size={16} /> Tạo đợt thu
                </Button>
              </div>
            </div>

            <Card className="p-0">
              {loading ? (
                <div className="flex min-h-64 items-center justify-center gap-3 text-muted-foreground">
                  <Spinner className="h-6 w-6 text-primary" /> Đang tải...
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã đợt</TableHead>
                      <TableHead>Tên đợt thu</TableHead>
                      <TableHead>Kỳ</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Loại phí</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feePeriods.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                          Chưa có đợt thu nào
                        </TableCell>
                      </TableRow>
                    ) : (
                      feePeriods.map((fp) => (
                        <>
                          <TableRow key={fp.id}>
                            <TableCell className="font-mono text-xs">{fp.code}</TableCell>
                            <TableCell className="font-medium">{fp.name}</TableCell>
                            <TableCell>
                              {fp.month ? `T${fp.month}/${fp.year}` : String(fp.year)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {fp.start_date} → {fp.end_date}
                            </TableCell>
                            <TableCell>
                              <Tag color={STATUS_COLORS[fp.status] || 'gray'}>
                                {STATUS_LABELS[fp.status] || fp.status}
                              </Tag>
                            </TableCell>
                            <TableCell>
                              <button
                                type="button"
                                onClick={() => setExpandedId(expandedId === fp.id ? null : fp.id)}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                              >
                                {fp.fee_types?.length || 0} loại phí
                                {expandedId === fp.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              </button>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {fp.status === 'DRAFT' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleActivate(fp)}
                                  >
                                    Kích hoạt
                                  </Button>
                                )}
                                {fp.status === 'ACTIVE' && (
                                  <Button
                                    size="sm"
                                    onClick={() => setGenerateModal({ open: true, period: fp, loading: false })}
                                  >
                                    Generate hóa đơn
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>

                          {expandedId === fp.id && fp.fee_types?.length > 0 && (
                            <TableRow key={`${fp.id}-expanded`}>
                              <TableCell colSpan={7} className="bg-muted/30 px-6 py-3">
                                <div className="flex flex-wrap gap-2">
                                  {fp.fee_types.map((ft) => (
                                    <Tag key={ft.id} color="blue">{ft.name}</Tag>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </Card>
          </div>
        </main>
      </div>

      <Modal open={createOpen} onOpenChange={setCreateOpen}>
        <form onSubmit={handleCreate}>
          <ModalHeader>Tạo đợt thu phí mới</ModalHeader>
          <ModalBody className="space-y-4">
            <FieldRow label="Mã đợt *">
              <TextInput
                value={form.code}
                onChange={(v) => setForm((f) => ({ ...f, code: v }))}
                placeholder="DOT-2026-01"
                required
              />
            </FieldRow>
            <FieldRow label="Tên đợt thu *">
              <TextInput
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="Thu phí tháng 1/2026"
                required
              />
            </FieldRow>
            <div className="grid grid-cols-3 gap-3">
              <FieldRow label="Loại kỳ *">
                <SelectNative
                  value={form.periodType}
                  onChange={(v) => setForm((f) => ({ ...f, periodType: v }))}
                  options={PERIOD_TYPE_OPTIONS}
                  required
                />
              </FieldRow>
              <FieldRow label="Tháng">
                <SelectNative
                  value={form.month}
                  onChange={(v) => setForm((f) => ({ ...f, month: v }))}
                  options={MONTH_OPTIONS}
                />
              </FieldRow>
              <FieldRow label="Năm *">
                <TextInput
                  type="number"
                  value={form.year}
                  onChange={(v) => setForm((f) => ({ ...f, year: v }))}
                  placeholder="2026"
                  required
                  min="2000"
                />
              </FieldRow>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FieldRow label="Ngày bắt đầu *">
                <TextInput
                  type="date"
                  value={form.startDate}
                  onChange={(v) => setForm((f) => ({ ...f, startDate: v }))}
                  required
                />
              </FieldRow>
              <FieldRow label="Ngày kết thúc *">
                <TextInput
                  type="date"
                  value={form.endDate}
                  onChange={(v) => setForm((f) => ({ ...f, endDate: v }))}
                  required
                />
              </FieldRow>
            </div>
            <FieldRow label="Chọn loại phí áp dụng">
              {feeTypes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có loại phí nào đang hoạt động</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 rounded-md border border-border p-3">
                  {feeTypes.map((ft) => (
                    <label key={ft.id} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.feeTypeIds.includes(ft.id)}
                        onChange={() => toggleFeeTypeId(ft.id)}
                        className="rounded border-border"
                      />
                      <span>{ft.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </FieldRow>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Đang lưu...' : 'Tạo đợt thu'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      <Modal open={generateModal.open} onOpenChange={(open) => !generateModal.loading && setGenerateModal({ open, period: null, loading: false })}>
        <ModalHeader>Xác nhận generate hóa đơn</ModalHeader>
        <ModalBody>
          <p className="text-sm text-muted-foreground">
            Bạn sắp tạo hóa đơn tự động cho tất cả hộ đang hoạt động trong đợt thu{' '}
            <span className="font-semibold text-foreground">
              {generateModal.period?.name}
            </span>.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Thao tác này không thể hoàn tác. Hóa đơn đã tồn tại sẽ bị bỏ qua (409).
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            disabled={generateModal.loading}
            onClick={() => setGenerateModal({ open: false, period: null, loading: false })}
          >
            Hủy
          </Button>
          <Button onClick={handleGenerateInvoices} disabled={generateModal.loading}>
            {generateModal.loading ? 'Đang tạo...' : 'Xác nhận generate'}
          </Button>
        </ModalFooter>
      </Modal>

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
