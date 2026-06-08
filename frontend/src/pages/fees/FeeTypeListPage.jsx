import { useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';

import TopBar from '../../components/ui/TopBar';
import Sidebar from '../../components/ui/Sidebar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { Tag } from '../../components/ui/Tag';
import { Toast } from '../../components/ui/Toast';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '../../components/ui/Table';

const API = 'http://localhost:3001/api';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const CALCULATION_TYPE_OPTIONS = [
  { value: 'per_m2', label: 'Theo diện tích (m²)' },
  { value: 'fixed', label: 'Cố định mỗi hộ' },
  { value: 'voluntary', label: 'Tự nguyện' },
];

const INVOICE_MODE_OPTIONS = [
  { value: 'auto', label: 'Tự động' },
  { value: 'manual', label: 'Thủ công' },
];

const CALC_TYPE_COLORS = {
  per_m2: 'blue',
  fixed: 'green',
  voluntary: 'yellow',
};

const CALC_TYPE_LABELS = {
  per_m2: 'Theo m²',
  fixed: 'Cố định',
  voluntary: 'Tự nguyện',
};

const formatCurrency = (val) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(val || 0));

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

const EMPTY_FORM = {
  code: '',
  name: '',
  calculationType: 'fixed',
  unit: '',
  unitPrice: '',
  invoiceGenerationMode: 'auto',
};

export default function FeeTypeListPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [feeTypes, setFeeTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState({ open: false, variant: 'success', title: '', description: '' });

  const showToast = (variant, title, description = '') =>
    setToast({ open: true, variant, title, description });

  useEffect(() => {
    let cancelled = false;
    const fetchFeeTypes = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/fee-types?pageSize=100`, { headers: authHeaders() });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.message || 'Không thể tải danh sách loại phí');
        setFeeTypes(data.data || []);
      } catch (err) {
        if (!cancelled) showToast('error', 'Lỗi', err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchFeeTypes();
    return () => { cancelled = true; };
  }, [reloadKey]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/fee-types`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          code: form.code,
          name: form.name,
          calculationType: form.calculationType,
          unit: form.unit || undefined,
          unitPrice: Number(form.unitPrice),
          invoiceGenerationMode: form.invoiceGenerationMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể tạo loại phí');
      showToast('success', 'Thành công', `Đã tạo loại phí "${form.name}"`);
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      setReloadKey((k) => k + 1);
    } catch (err) {
      showToast('error', 'Lỗi', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id, name) => {
    if (!window.confirm(`Bạn có chắc muốn vô hiệu hóa loại phí "${name}"?`)) return;
    try {
      const res = await fetch(`${API}/fee-types/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể vô hiệu hóa');
      showToast('success', 'Thành công', `Đã vô hiệu hóa "${name}"`);
      setReloadKey((k) => k + 1);
    } catch (err) {
      showToast('error', 'Lỗi', err.message);
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
                <h1 className="text-3xl font-bold tracking-tight">Loại phí</h1>
                <p className="mt-1 text-muted-foreground">Quản lý các loại phí áp dụng cho căn hộ</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setReloadKey((k) => k + 1)} className="gap-2">
                  <RefreshCw size={16} /> Làm mới
                </Button>
                <Button onClick={() => setCreateOpen(true)} className="gap-2">
                  <Plus size={16} /> Tạo loại phí
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
                      <TableHead>Mã phí</TableHead>
                      <TableHead>Tên loại phí</TableHead>
                      <TableHead>Loại tính</TableHead>
                      <TableHead>Đơn giá</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeTypes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                          Chưa có loại phí nào
                        </TableCell>
                      </TableRow>
                    ) : (
                      feeTypes.map((ft) => (
                        <TableRow key={ft.id}>
                          <TableCell className="font-mono text-xs">{ft.code}</TableCell>
                          <TableCell className="font-medium">{ft.name}</TableCell>
                          <TableCell>
                            <Tag color={CALC_TYPE_COLORS[ft.calculation_type] || 'gray'}>
                              {CALC_TYPE_LABELS[ft.calculation_type] || ft.calculation_type}
                            </Tag>
                          </TableCell>
                          <TableCell>{formatCurrency(ft.unit_price)}{ft.unit ? ` / ${ft.unit}` : ''}</TableCell>
                          <TableCell>
                            <Tag color={ft.is_active ? 'green' : 'red'}>
                              {ft.is_active ? 'Đang dùng' : 'Vô hiệu'}
                            </Tag>
                          </TableCell>
                          <TableCell>
                            {ft.is_active && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeactivate(ft.id, ft.name)}
                              >
                                Vô hiệu hóa
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
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
          <ModalHeader>Tạo loại phí mới</ModalHeader>
          <ModalBody className="space-y-4">
            <FieldRow label="Mã phí *">
              <TextInput
                value={form.code}
                onChange={(v) => setForm((f) => ({ ...f, code: v }))}
                placeholder="PHI_QUAN_LY"
                required
              />
            </FieldRow>
            <FieldRow label="Tên loại phí *">
              <TextInput
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
                placeholder="Phí quản lý"
                required
              />
            </FieldRow>
            <FieldRow label="Loại tính phí *">
              <Select
                value={form.calculationType}
                onValueChange={(v) => setForm((f) => ({ ...f, calculationType: v }))}
                options={CALCULATION_TYPE_OPTIONS}
                className="w-full"
              />
            </FieldRow>
            <FieldRow label="Đơn vị (tùy chọn)">
              <TextInput
                value={form.unit}
                onChange={(v) => setForm((f) => ({ ...f, unit: v }))}
                placeholder="m², hộ, ..."
              />
            </FieldRow>
            <FieldRow label="Đơn giá (VNĐ) *">
              <TextInput
                type="number"
                value={form.unitPrice}
                onChange={(v) => setForm((f) => ({ ...f, unitPrice: v }))}
                placeholder="15000"
                required
                min="0"
              />
            </FieldRow>
            <FieldRow label="Chế độ tạo hóa đơn *">
              <Select
                value={form.invoiceGenerationMode}
                onValueChange={(v) => setForm((f) => ({ ...f, invoiceGenerationMode: v }))}
                options={INVOICE_MODE_OPTIONS}
                className="w-full"
              />
            </FieldRow>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Đang lưu...' : 'Tạo loại phí'}
            </Button>
          </ModalFooter>
        </form>
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
