import React, { useState, useEffect } from "react";
import { UserPlus, Search, UserCheck, UserMinus, Edit2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import TopBar from "../../components/ui/TopBar";
import Sidebar from "../../components/ui/Sidebar";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { Tag } from "../../components/ui/Tag";
import { Spinner } from "../../components/ui/Spinner";
import { Toast } from "../../components/ui/Toast";
import { Input } from "../../components/ui/Input";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "../../components/ui/Modal";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from "../../components/ui/Form";
import { Select } from "../../components/ui/Select";

export default function UserManagementPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({
    open: false,
    variant: "success",
    title: "",
    description: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const roleOptions = [
    { value: "admin", label: "Quản trị viên" },
    { value: "accountant", label: "Kế toán" },
    { value: "staff", label: "Nhân viên" },
  ];

  const statusOptions = [
    { value: true, label: "Hoạt động" },
    { value: false, label: "Bị khóa" },
  ];

  const addForm = useForm({
    defaultValues: { username: "", password: "", role: "staff" },
  });

  const editForm = useForm();

  const [isSubmitting, setIsSubmitting] = useState(false);

const roleToIdMap = {
  admin: 1,
  accountant: 2,
  staff: 3,
};

const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3001/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (response.ok) {
        setUsers(result.data || result);
      } else {
        throw new Error(result.message || "không có quyền truy cập dữ liệu này");
      }
    } catch (error) {
      setToast({
        open: true,
        variant: "error",
        title: "lỗi bảo mật",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = async (values) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3001/api/users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password,
          role_id: roleToIdMap[values.role],
          is_active: true,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setToast({
          open: true,
          variant: "success",
          title: "thành công",
          description: `đã tạo tài khoản ${values.username}`,
        });
        setIsAddModalOpen(false);
        addForm.reset();
        fetchUsers();
      } else {
        throw new Error(result.message || "không thể tạo tài khoản");
      }
    } catch (error) {
      setToast({
        open: true,
        variant: "error",
        title: "lỗi",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    editForm.reset({
      username: user.username,
      role: user.role?.name || user.role,
      is_active: user.is_active,
    });
    setIsEditModalOpen(true);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase());
    const role = (user.role?.name || user.role || "").toLowerCase();

    if (searchCategory === "all") return matchesSearch;
    return matchesSearch && role === searchCategory;
  });

  const getRoleBadge = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case "admin":
        return <Tag color="red">Quản trị viên</Tag>;
      case "accountant":
        return <Tag color="green">Kế toán</Tag>;
      case "staff":
        return <Tag color="yellow">Nhân viên</Tag>;
      default:
        return <Tag color="green">Cư dân</Tag>;
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
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Quản lý người dùng
                </h1>
                <p className="text-muted-foreground mt-1">
                  Chào mừng quay trở lại, Admin.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-2 items-center bg-card p-1.5 rounded-2xl border border-border shadow-sm  transition-all w-full max-w-2xl">
                <Select
                  variant="subtle"
                  size="sm"
                  value={searchCategory}
                  onValueChange={setSearchCategory}
                  options={[
                    { value: "all", label: "tất cả nhân sự" },
                    { value: "admin", label: "quản trị viên" },
                    { value: "accountant", label: "kế toán" },
                    { value: "staff", label: "nhân viên" }
                  ]}
                  className="h-9 rounded-xl bg-muted/50 border-none font-medium min-w-[120px]"
                />

                <div className="h-6 w-px bg-border" />

                <Input
                  placeholder="Tìm kiếm người dùng theo tên đăng nhập..."
                  className="border-none bg-transparent focus-visible:ring-0 text-base h-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  rightIcon={
                    searchQuery.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full"
                        onClick={() => setSearchQuery("")}
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
                >
                  <Search size={18} />
                </Button>
              </div>

              <Button
                className="gap-2"
                variant="default"
                onClick={() => setIsAddModalOpen(true)}
              >
                <UserPlus size={18} /> Thêm tài khoản
              </Button>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              {loading ? (
                <div className="flex h-64 w-full flex-col items-center justify-center gap-4">
                  <Spinner size="lg" className="text-primary" />
                  <p className="text-muted-foreground animate-pulse font-medium">
                    Đang tải danh sách người dùng...
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Tên đăng nhập</TableHead>
                      <TableHead>Vai trò</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            #{user.id}
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-foreground">
                              {user.username}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getRoleBadge(user.role?.name || user.role)}
                          </TableCell>
                          <TableCell>
                            {user.is_active ? (
                              <div className="flex items-center gap-1.5 text-green-600 font-medium text-xs">
                                <UserCheck size={14} /> Hoạt động
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-destructive font-medium text-xs">
                                <UserMinus size={14} /> Bị khóa
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(user.created_at).toLocaleDateString(
                              "vi-VN",
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditModal(user)}
                            >
                              <Edit2 size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="h-32 text-center text-muted-foreground"
                        >
                          Không tìm thấy người dùng nào phù hợp.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </main>
      </div>

      <Modal open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
  <ModalHeader>Thêm tài khoản nhân sự</ModalHeader>
  <ModalBody className="overflow-visible"> 
    <Form {...addForm}>
      <form id="add-user-form" onSubmit={addForm.handleSubmit(handleAddUser)} className="space-y-4">
        <FormField
          name="username"
          rules={{ required: "vui lòng nhập tên đăng nhập" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên đăng nhập</FormLabel>
              <FormControl>
                <Input placeholder="vd: nv_quanly_01" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          name="password"
          rules={{ required: "vui lòng nhập mật khẩu" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mật khẩu</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          name="role"
          render={({ field }) => (
            <FormItem className="space-x-5">
              <FormLabel>Vai trò hệ thống</FormLabel>
              <FormControl>
                <Select
                  options={roleOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  className="w-full"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </form>
    </Form>
  </ModalBody>
  <ModalFooter>
    <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
      hủy
    </Button>
    <Button type="submit" form="add-user-form" loading={isSubmitting}>
      tạo tài khoản nhân sự
    </Button>
  </ModalFooter>
</Modal>

      <Modal open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <ModalHeader>Chỉnh sửa tài khoản: {selectedUser?.username}</ModalHeader>
        <ModalBody>
          <Form {...editForm}>
            <form className="space-y-4">
              <FormField
                name="role"
                render={({ field }) => (
                  <FormItem className="space-x-5">
                    <FormLabel>Vai trò</FormLabel>
                    <FormControl className="overflow-visible">
                      <Select
                        options={roleOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        className="w-full"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                name="is_active"
                render={({ field }) => (
                  <FormItem className="space-x-5 overflow-visible">
                    <FormLabel>Trạng thái</FormLabel>
                    <FormControl className="overflow-visible">
                      <Select
                        options={statusOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        className="w-full"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
            Hủy
          </Button>
          <Button onClick={() => setIsEditModalOpen(false)}>Cập nhật</Button>
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
