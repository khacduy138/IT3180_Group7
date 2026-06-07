import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Car, Users, Clock, RefreshCw, X } from 'lucide-react';

import TopBar from '../../components/ui/TopBar';
import Sidebar from '../../components/ui/Sidebar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { Tag } from '../../components/ui/Tag';
import { Toast } from '../../components/ui/Toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
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

const formatDate = (val) => {
  if (!val) return '-';
  return new Intl.DateTimeFormat('vi-VN').format(new Date(`${val}T00:00:00`));
};

const CHANGE_TYPE_LABELS = {
  absence: 'Tạm vắng',
  temporary_residence: 'Tạm trú',
  transfer: 'Chuyển đi',
};

const CHANGE_TYPE_COLORS = {
  absence: 'yellow',
  temporary_residence: 'blue',
  transfer: 'red',
};

const CHANGE_TYPE_OPTIONS = [
  { value: 'absence', label: 'Tạm vắng' },
  { value: 'temporary_residence', label: 'Tạm trú' },
  { value: 'transfer', label: 'Chuyển đi' },
];

const VEHICLE_TYPE_OPTIONS = [
  { value: 'motorcycle', label: 'Xe máy' },
  { value: 'car', label: 'Ô tô' },
];

const GENDER_OPTIONS = [
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' },
];

function FieldRow({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

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

export default function HouseholdDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [household, setHousehold] = useState(null);
  const [residents, setResidents] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ open: false, variant: 'success', title: '', description: '' });

  const [addResidentOpen, setAddResidentOpen] = useState(false);
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [addChangeOpen, setAddChangeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [residentForm, setResidentForm] = useState({
    fullName: '', gender: '', citizenId: '', dateOfBirth: '', phoneNumber: '', relationshipToHead: '', moveInDate: '',
  });

  const [vehicleForm, setVehicleForm] = useState({
    licensePlate: '', vehicleType: '', registeredAt: '',
  });

  const [changeForm, setChangeForm] = useState({
    changeType: '', residentId: '', startDate: '', endDate: '', destination: '', originAddress: '', note: '',
  });

  const showToast = (variant, title, description = '') =>
    setToast({ open: true, variant, title, description });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [hhRes, resRes, vehRes, chgRes] = await Promise.all([
        fetch(`${API}/households/${id}`, { headers: authHeaders() }),
        fetch(`${API}/households/${id}/residents?pageSize=100`, { headers: authHeaders() }),
        fetch(`${API}/households/${id}/vehicles`, { headers: authHeaders() }),
        fetch(`${API}/demographic-changes?householdId=${id}`, { headers: authHeaders() }),
      ]);

      const [hhData, resData, vehData, chgData] = await Promise.all([
        hhRes.json(), resRes.json(), vehRes.json(), chgRes.json(),
      ]);

      if (hhRes.ok) setHousehold(hhData.data);
      if (resRes.ok) setResidents(resData.data || []);
      if (vehRes.ok) setVehicles(vehData.data || []);
      if (chgRes.ok) setChanges(chgData.data || []);
    } catch {
      showToast('error', 'Lỗi kết nối', 'Không thể tải dữ liệu hộ gia đình');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleAddResident = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/households/${id}/residents`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(residentForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể thêm nhân khẩu');
      showToast('success', 'Thành công', 'Đã thêm nhân khẩu vào hộ');
      setAddResidentOpen(false);
      setResidentForm({ fullName: '', gender: '', citizenId: '', dateOfBirth: '', phoneNumber: '', relationshipToHead: '', moveInDate: '' });
      fetchAll();
    } catch (err) {
      showToast('error', 'Lỗi', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveResident = async (residentId) => {
    if (!window.confirm('Bạn có chắc muốn xóa nhân khẩu này khỏi hộ?')) return;
    try {
      const res = await fetch(`${API}/households/${id}/residents/${residentId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể xóa nhân khẩu');
      showToast('success', 'Thành công', 'Đã xóa nhân khẩu');
      fetchAll();
    } catch (err) {
      showToast('error', 'Lỗi', err.message);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/households/${id}/vehicles`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(vehicleForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể thêm phương tiện');
      showToast('success', 'Thành công', 'Đã đăng ký phương tiện');
      setAddVehicleOpen(false);
      setVehicleForm({ licensePlate: '', vehicleType: '', registeredAt: '' });
      fetchAll();
    } catch (err) {
      showToast('error', 'Lỗi', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveVehicle = async (vehicleId) => {
    if (!window.confirm('Bạn có chắc muốn xóa phương tiện này?')) return;
    try {
      const res = await fetch(`${API}/households/${id}/vehicles/${vehicleId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể xóa phương tiện');
      showToast('success', 'Thành công', 'Đã xóa phương tiện');
      fetchAll();
    } catch (err) {
      showToast('error', 'Lỗi', err.message);
    }
  };

  const handleAddChange = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const { changeType, residentId: rId, startDate, endDate, destination, originAddress, note } = changeForm;
    const endpoint = changeType === 'absence'
      ? `${API}/residents/${rId}/absence`
      : changeType === 'temporary_residence'
        ? `${API}/residents/${rId}/temporary-residence`
        : `${API}/residents/${rId}/transfer`;

    const body = changeType === 'absence'
      ? { startDate, endDate, destination, householdId: Number(id) }
      : changeType === 'temporary_residence'
        ? { originAddress, startDate, householdId: Number(id) }
        : { householdId: Number(id), destination, note };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể tạo biến động');
      showToast('success', 'Thành công', 'Đã ghi nhận biến động nhân khẩu');
      setAddChangeOpen(false);
      setChangeForm({ changeType: '', residentId: '', startDate: '', endDate: '', destination: '', originAddress: '', note: '' });
      fetchAll();
    } catch (err) {
      showToast('error', 'Lỗi', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const activeResidents = residents.filter((m) => !m.move_out_date);
  const residentOptions = activeResidents.map((m) => ({
    value: String(m.resident?.id),
    label: m.resident?.full_name || `Cư dân #${m.resident_id}`,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
        <div className="flex h-[80vh] items-center justify-center">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      </div>
    );
  }

  if (!household) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Không tìm thấy hộ gia đình</p>
          <Button variant="outline" onClick={() => navigate('/households')}>
            <ArrowLeft size={16} /> Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />

      <div className="flex">
        <Sidebar open={sidebarOpen} />

        <main className={`flex-1 p-8 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="mx-auto max-w-7xl space-y-6">

            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate('/households')} className="gap-2">
                <ArrowLeft size={16} /> Quay lại
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Căn hộ {household.room_number}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {household.square_meters} m² &middot; Trạng thái:{' '}
                  <Tag color={household.status === 'active' ? 'green' : 'red'}>
                    {household.status === 'active' ? 'Đang ở' : 'Không hoạt động'}
                  </Tag>
                </p>
              </div>
              <Button variant="outline" className="ml-auto gap-2" onClick={fetchAll}>
                <RefreshCw size={16} /> Làm mới
              </Button>
            </div>

            <Tabs defaultValue="residents">
              <TabsList className="mb-4">
                <TabsTrigger value="residents" className="gap-2">
                  <Users size={15} /> Nhân khẩu ({activeResidents.length})
                </TabsTrigger>
                <TabsTrigger value="vehicles" className="gap-2">
                  <Car size={15} /> Phương tiện ({vehicles.length})
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <Clock size={15} /> Lịch sử biến động ({changes.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="residents">
                <Card className="p-0">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <h2 className="font-semibold">Danh sách nhân khẩu</h2>
                    <Button onClick={() => setAddResidentOpen(true)} className="gap-2">
                      <Plus size={16} /> Thêm nhân khẩu
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Họ tên</TableHead>
                        <TableHead>CCCD/CMND</TableHead>
                        <TableHead>Giới tính</TableHead>
                        <TableHead>Ngày sinh</TableHead>
                        <TableHead>Quan hệ chủ hộ</TableHead>
                        <TableHead>Ngày vào</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {residents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                            Chưa có nhân khẩu nào
                          </TableCell>
                        </TableRow>
                      ) : (
                        residents.map((member) => (
                          <TableRow key={member.id}>
                            <TableCell className="font-medium">{member.resident?.full_name || '-'}</TableCell>
                            <TableCell>{member.resident?.citizen_id || '-'}</TableCell>
                            <TableCell>{member.resident?.gender || '-'}</TableCell>
                            <TableCell>{formatDate(member.resident?.date_of_birth)}</TableCell>
                            <TableCell>{member.relationship_to_head || '-'}</TableCell>
                            <TableCell>{formatDate(member.move_in_date)}</TableCell>
                            <TableCell>
                              {member.move_out_date ? (
                                <Tag color="red">Đã rời</Tag>
                              ) : member.is_temporary_absent ? (
                                <Tag color="yellow">Tạm vắng</Tag>
                              ) : (
                                <Tag color="green">Đang ở</Tag>
                              )}
                            </TableCell>
                            <TableCell>
                              {!member.move_out_date && (
                                <Button
                                  variant="icon-square"
                                  onClick={() => handleRemoveResident(member.resident_id)}
                                  title="Xóa khỏi hộ"
                                >
                                  <X size={14} />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              <TabsContent value="vehicles">
                <Card className="p-0">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <h2 className="font-semibold">Phương tiện đã đăng ký</h2>
                    <Button onClick={() => setAddVehicleOpen(true)} className="gap-2">
                      <Plus size={16} /> Đăng ký xe
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Biển số</TableHead>
                        <TableHead>Loại xe</TableHead>
                        <TableHead>Ngày đăng ký</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                            Chưa có phương tiện nào
                          </TableCell>
                        </TableRow>
                      ) : (
                        vehicles.map((vehicle) => (
                          <TableRow key={vehicle.id}>
                            <TableCell className="font-medium">{vehicle.license_plate}</TableCell>
                            <TableCell>
                              <Tag color={vehicle.vehicle_type === 'car' ? 'blue' : 'gray'}>
                                {vehicle.vehicle_type === 'car' ? 'Ô tô' : 'Xe máy'}
                              </Tag>
                            </TableCell>
                            <TableCell>{formatDate(vehicle.registered_at)}</TableCell>
                            <TableCell>
                              <Button
                                variant="icon-square"
                                onClick={() => handleRemoveVehicle(vehicle.id)}
                                title="Xóa phương tiện"
                              >
                                <X size={14} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <Card className="p-0">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <h2 className="font-semibold">Lịch sử biến động nhân khẩu</h2>
                    <Button onClick={() => setAddChangeOpen(true)} className="gap-2">
                      <Plus size={16} /> Ghi nhận biến động
                    </Button>
                  </div>

                  {changes.length === 0 ? (
                    <div className="py-10 text-center text-muted-foreground">
                      Chưa có biến động nào được ghi nhận
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {changes.map((change) => (
                        <div
                          key={change.id}
                          className="flex items-start gap-4 rounded-lg border border-border bg-card p-4"
                        >
                          <div className="mt-0.5 flex-shrink-0">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                              <Clock size={16} />
                            </span>
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Tag color={CHANGE_TYPE_COLORS[change.change_type] || 'gray'}>
                                {CHANGE_TYPE_LABELS[change.change_type] || change.change_type}
                              </Tag>
                              <span className="font-medium">
                                {change.resident?.full_name || `Cư dân #${change.resident_id}`}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-0.5">
                              {change.start_date && (
                                <p>Từ: {formatDate(change.start_date)}{change.end_date ? ` → ${formatDate(change.end_date)}` : ''}</p>
                              )}
                              {change.destination && <p>Nơi đến: {change.destination}</p>}
                              {change.origin_address && <p>Nơi đến từ: {change.origin_address}</p>}
                              {change.note && <p>Ghi chú: {change.note}</p>}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground flex-shrink-0">
                            {new Date(change.created_at).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      <Modal open={addResidentOpen} onOpenChange={setAddResidentOpen}>
        <form onSubmit={handleAddResident}>
          <ModalHeader>Thêm nhân khẩu</ModalHeader>
          <ModalBody className="space-y-4">
            <FieldRow label="Họ và tên *">
              <TextInput
                value={residentForm.fullName}
                onChange={(v) => setResidentForm((f) => ({ ...f, fullName: v }))}
                placeholder="Nguyễn Văn A"
                required
              />
            </FieldRow>
            <FieldRow label="Giới tính *">
              <Select
                value={residentForm.gender}
                onValueChange={(v) => setResidentForm((f) => ({ ...f, gender: v }))}
                options={GENDER_OPTIONS}
                placeholder="Chọn giới tính"
                className="w-full"
              />
            </FieldRow>
            <FieldRow label="CCCD/CMND">
              <TextInput
                value={residentForm.citizenId}
                onChange={(v) => setResidentForm((f) => ({ ...f, citizenId: v }))}
                placeholder="012345678901"
              />
            </FieldRow>
            <FieldRow label="Ngày sinh">
              <TextInput
                type="date"
                value={residentForm.dateOfBirth}
                onChange={(v) => setResidentForm((f) => ({ ...f, dateOfBirth: v }))}
              />
            </FieldRow>
            <FieldRow label="Số điện thoại">
              <TextInput
                value={residentForm.phoneNumber}
                onChange={(v) => setResidentForm((f) => ({ ...f, phoneNumber: v }))}
                placeholder="0901234567"
              />
            </FieldRow>
            <FieldRow label="Quan hệ với chủ hộ">
              <TextInput
                value={residentForm.relationshipToHead}
                onChange={(v) => setResidentForm((f) => ({ ...f, relationshipToHead: v }))}
                placeholder="Vợ/Chồng, Con, ..."
              />
            </FieldRow>
            <FieldRow label="Ngày chuyển vào *">
              <TextInput
                type="date"
                value={residentForm.moveInDate}
                onChange={(v) => setResidentForm((f) => ({ ...f, moveInDate: v }))}
                required
              />
            </FieldRow>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setAddResidentOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Đang lưu...' : 'Thêm nhân khẩu'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      <Modal open={addVehicleOpen} onOpenChange={setAddVehicleOpen}>
        <form onSubmit={handleAddVehicle}>
          <ModalHeader>Đăng ký phương tiện</ModalHeader>
          <ModalBody className="space-y-4">
            <FieldRow label="Biển số xe *">
              <TextInput
                value={vehicleForm.licensePlate}
                onChange={(v) => setVehicleForm((f) => ({ ...f, licensePlate: v }))}
                placeholder="29A-12345"
                required
              />
            </FieldRow>
            <FieldRow label="Loại xe *">
              <Select
                value={vehicleForm.vehicleType}
                onValueChange={(v) => setVehicleForm((f) => ({ ...f, vehicleType: v }))}
                options={VEHICLE_TYPE_OPTIONS}
                placeholder="Chọn loại xe"
                className="w-full"
              />
            </FieldRow>
            <FieldRow label="Ngày đăng ký *">
              <TextInput
                type="date"
                value={vehicleForm.registeredAt}
                onChange={(v) => setVehicleForm((f) => ({ ...f, registeredAt: v }))}
                required
              />
            </FieldRow>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setAddVehicleOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Đang lưu...' : 'Đăng ký'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      <Modal open={addChangeOpen} onOpenChange={setAddChangeOpen}>
        <form onSubmit={handleAddChange}>
          <ModalHeader>Ghi nhận biến động nhân khẩu</ModalHeader>
          <ModalBody className="space-y-4">
            <FieldRow label="Loại biến động *">
              <Select
                value={changeForm.changeType}
                onValueChange={(v) => setChangeForm((f) => ({ ...f, changeType: v }))}
                options={CHANGE_TYPE_OPTIONS}
                placeholder="Chọn loại biến động"
                className="w-full"
              />
            </FieldRow>
            {changeForm.changeType && (
              <FieldRow label="Cư dân *">
                <Select
                  value={changeForm.residentId}
                  onValueChange={(v) => setChangeForm((f) => ({ ...f, residentId: v }))}
                  options={residentOptions}
                  placeholder="Chọn cư dân"
                  className="w-full"
                />
              </FieldRow>
            )}
            {changeForm.changeType === 'absence' && (
              <>
                <FieldRow label="Ngày bắt đầu *">
                  <TextInput
                    type="date"
                    value={changeForm.startDate}
                    onChange={(v) => setChangeForm((f) => ({ ...f, startDate: v }))}
                    required
                  />
                </FieldRow>
                <FieldRow label="Ngày kết thúc *">
                  <TextInput
                    type="date"
                    value={changeForm.endDate}
                    onChange={(v) => setChangeForm((f) => ({ ...f, endDate: v }))}
                    required
                  />
                </FieldRow>
                <FieldRow label="Nơi đến *">
                  <TextInput
                    value={changeForm.destination}
                    onChange={(v) => setChangeForm((f) => ({ ...f, destination: v }))}
                    placeholder="Địa chỉ nơi đến"
                    required
                  />
                </FieldRow>
              </>
            )}
            {changeForm.changeType === 'temporary_residence' && (
              <>
                <FieldRow label="Địa chỉ gốc *">
                  <TextInput
                    value={changeForm.originAddress}
                    onChange={(v) => setChangeForm((f) => ({ ...f, originAddress: v }))}
                    placeholder="Địa chỉ nơi thường trú"
                    required
                  />
                </FieldRow>
                <FieldRow label="Ngày bắt đầu tạm trú *">
                  <TextInput
                    type="date"
                    value={changeForm.startDate}
                    onChange={(v) => setChangeForm((f) => ({ ...f, startDate: v }))}
                    required
                  />
                </FieldRow>
              </>
            )}
            {changeForm.changeType === 'transfer' && (
              <>
                <FieldRow label="Nơi chuyển đến">
                  <TextInput
                    value={changeForm.destination}
                    onChange={(v) => setChangeForm((f) => ({ ...f, destination: v }))}
                    placeholder="Địa chỉ nơi chuyển đến"
                  />
                </FieldRow>
                <FieldRow label="Ghi chú">
                  <TextInput
                    value={changeForm.note}
                    onChange={(v) => setChangeForm((f) => ({ ...f, note: v }))}
                    placeholder="Lý do chuyển đi..."
                  />
                </FieldRow>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setAddChangeOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting || !changeForm.changeType || !changeForm.residentId}>
              {submitting ? 'Đang lưu...' : 'Ghi nhận'}
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
