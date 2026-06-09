import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Plus, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';

import TopBar from '../../components/ui/TopBar';
import Sidebar from '../../components/ui/Sidebar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
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

function TextInput({ value, onChange, placeholder, type = 'text', required }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

function FieldRow({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

export default function HouseholdsListPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [households, setHouseholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ roomNumber: '', squareMeters: '', status: 'active' });

  const [toast, setToast] = useState({ open: false, variant: 'success', title: '', description: '' });

  const showToast = (variant, title, description = '') =>
    setToast({ open: true, variant, title, description });

  useEffect(() => {
    let cancelled = false;
    const fetchHouseholds = async () => {
      setLoading(true);
      const params = new URLSearchParams({ pageNumber: String(pageNumber), pageSize: '20' });
      if (search.trim()) params.set('search', search.trim());

      try {
        const res = await fetch(`${API}/households?${params}`, { headers: authHeaders() });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.message || 'Không thể tải danh sách hộ');
        setHouseholds(data.data || []);
        setPagination(data.pagination || null);
      } catch (err) {
        if (!cancelled) showToast('error', 'Lỗi', err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchHouseholds();
    return () => { cancelled = true; };
  }, [pageNumber, search, reloadKey]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPageNumber(1);
    setReloadKey((k) => k + 1);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/households`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          roomNumber: form.roomNumber,
          squareMeters: Number(form.squareMeters),
          status: form.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể tạo hộ mới');
      showToast('success', 'Thành công', `Đã tạo căn hộ ${form.roomNumber}`);
      setCreateOpen(false);
      setForm({ roomNumber: '', squareMeters: '', status: 'active' });
      setReloadKey((k) => k + 1);
    } catch (err) {
      showToast('error', 'Lỗi', err.message);
    } finally {
      setSubmitting(false);
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
                <h1 className="text-3xl font-bold tracking-tight">Hộ gia đình</h1>
                <p className="mt-1 text-muted-foreground">Quản lý danh sách căn hộ và nhân khẩu</p>
              </div>
              <Button onClick={() => setCreateOpen(true)} className="gap-2">
                <Plus size={16} /> Thêm căn hộ
              </Button>
            </div>

            <div className="flex gap-2 items-center bg-card p-1.5 rounded-2xl border border-border shadow-sm transition-all w-full max-w-2xl">
  <Input
    placeholder="tìm theo số phòng..."
    className="border-none bg-transparent focus-visible:ring-0 text-base h-10 w-full"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit(e)}
    rightIcon={
      search.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-full"
          onClick={() => {
            setSearch("");
            setPageNumber(1);
            setReloadKey((k) => k + 1);
          }}
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
    onClick={handleSearchSubmit}
  >
    <Search className="h-[16px] w-[16px]" />
  </Button>

  <div className="h-6 w-px bg-border" />

  <Button
    variant="outline"
    className="rounded-xl h-10 px-4 flex gap-2 shrink-0 border-none hover:bg-muted font-medium text-sm"
    onClick={() => {
      setSearch("");
      setPageNumber(1);
      setReloadKey((k) => k + 1);
    }}
  >
    <RefreshCw size={16} />
    làm mới
  </Button>
</div>

            <Card className="p-0">
              {loading ? (
                <div className="flex min-h-64 items-center justify-center gap-3 text-muted-foreground">
                  <Spinner className="h-6 w-6 text-primary" /> Đang tải...
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Số phòng</TableHead>
                        <TableHead>Diện tích</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {households.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                            Không tìm thấy căn hộ nào
                          </TableCell>
                        </TableRow>
                      ) : (
                        households.map((hh) => (
                          <TableRow
                            key={hh.id}
                            className="cursor-pointer"
                            onClick={() => navigate(`/households/${hh.id}`)}
                          >
                            <TableCell className="font-medium">{hh.room_number}</TableCell>
                            <TableCell>{hh.square_meters} m²</TableCell>
                            <TableCell>
                              <Tag color={hh.status === 'active' ? 'green' : 'red'}>
                                {hh.status === 'active' ? 'Đang ở' : 'Không hoạt động'}
                              </Tag>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); navigate(`/households/${hh.id}`); }}
                              >
                                Xem chi tiết
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-border px-4 py-3">
                      <p className="text-sm text-muted-foreground">
                        Trang {pagination.pageNumber} / {pagination.totalPages} &middot; {pagination.totalRecords} căn hộ
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!pagination.hasPreviousPage}
                          onClick={() => setPageNumber((p) => p - 1)}
                          className="gap-1"
                        >
                          <ChevronLeft size={14} /> Trước
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!pagination.hasNextPage}
                          onClick={() => setPageNumber((p) => p + 1)}
                          className="gap-1"
                        >
                          Sau <ChevronRight size={14} />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          </div>
        </main>
      </div>

      <Modal open={createOpen} onOpenChange={setCreateOpen}>
        <form onSubmit={handleCreate}>
          <ModalHeader>Thêm căn hộ mới</ModalHeader>
          <ModalBody className="space-y-4">
            <FieldRow label="Số phòng *">
              <TextInput
                value={form.roomNumber}
                onChange={(v) => setForm((f) => ({ ...f, roomNumber: v }))}
                placeholder="A101"
                required
              />
            </FieldRow>
            <FieldRow label="Diện tích (m²) *">
              <TextInput
                type="number"
                value={form.squareMeters}
                onChange={(v) => setForm((f) => ({ ...f, squareMeters: v }))}
                placeholder="50"
                required
              />
            </FieldRow>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Đang lưu...' : 'Tạo căn hộ'}
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
