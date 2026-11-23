"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Users,
  UserPlus,
  Search,
  ShieldCheck,
  Award,
  Edit,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Mail,
  X,
  Save,
} from "lucide-react";
import { UserItem } from "@/lib/store";
import ImageUploadWithPreview from "@/components/admin/ImageUploadWithPreview";
import CustomSelect from "@/components/admin/CustomSelect";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [tierFilter, setTierFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modal State for Create/Edit User
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [formData, setFormData] = useState<Partial<UserItem>>({
    fullName: "",
    email: "",
    phone: "",
    role: "CUSTOMER",
    tier: "Silver",
    points: 0,
    avatar: "",
    isActive: true,
  });
  const [modalSaving, setModalSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách người dùng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      role: "CUSTOMER",
      tier: "Silver",
      points: 0,
      avatar: "",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    setFormData({ ...user, password: "" });
    setIsModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!formData.fullName?.trim() || !formData.email?.trim()) {
      alert("Vui lòng điền họ tên và email người dùng!");
      return;
    }

    setModalSaving(true);
    try {
      const isEdit = Boolean(editingUser);
      const url = isEdit ? `/api/users/${editingUser!.id}` : "/api/users";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          formData.password ? formData : { ...formData, password: undefined },
        ),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchUsers();
      } else {
        alert("Lưu thất bại: " + data.error);
      }
    } catch {
      alert("Lỗi kết nối khi lưu người dùng");
    } finally {
      setModalSaving(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${name}"?`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      } else {
        alert("Xóa thất bại: " + data.error);
      }
    } catch {
      alert("Lỗi khi xóa người dùng");
    }
  };

  const handleToggleStatus = async (user: UserItem) => {
    const newStatus = !user.isActive;
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isActive: newStatus } : u))
        );
      }
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái người dùng:", err);
    }
  };

  // Filter
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm);

    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchesTier = tierFilter === "ALL" || u.tier === tierFilter;

    return matchesSearch && matchesRole && matchesTier;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const getRoleBadge = (role: UserItem["role"]) => {
    switch (role) {
      case "SUPER_ADMIN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/30">
            <ShieldCheck className="w-3 h-3" /> Quản Trị Tối Cao
          </span>
        );
      case "CONTENT_EDITOR":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-950/60 text-blue-400 border border-blue-800/60">
            Biên Tập Viên
          </span>
        );
      case "CUSTOMER":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-stone-800 text-stone-300">
            Khách Hàng
          </span>
        );
    }
  };

  const getTierBadge = (tier: UserItem["tier"]) => {
    switch (tier) {
      case "Platinum":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
            <Award className="w-3 h-3" /> VIP Platinum
          </span>
        );
      case "Gold":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-800/60">
            <Award className="w-3 h-3 text-[#C5A880]" /> Gold Member
          </span>
        );
      case "Silver":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-stone-800 text-stone-400">
            Silver
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-wide">
            Quản Lý Người Dùng & Hội Viên
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Tổng cộng <span className="text-[#C5A880] font-semibold">{users.length}</span> tài khoản bao gồm Quản trị viên, Biên tập và Khách hàng thân thiết
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            className="px-3.5 py-2 bg-stone-800/80 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-lg border border-stone-700/60 flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Làm mới
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-[#C5A880] hover:bg-[#b59870] text-black text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-md shadow-[#C5A880]/20"
          >
            <UserPlus className="w-4 h-4" /> Thêm Người Dùng Mới
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#141417] border border-stone-800/80 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, email hoặc số điện thoại..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg pl-10 pr-4 py-2 text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-[#C5A880]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Role Filter */}
          <div className="flex items-center gap-2 min-w-[200px]">
            <span className="text-xs text-stone-400 shrink-0">Vai trò:</span>
            <CustomSelect
              value={roleFilter}
              onChange={(val) => {
                setRoleFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: "ALL", label: "Tất cả vai trò" },
                { value: "SUPER_ADMIN", label: "Quản Trị Tối Cao" },
                { value: "CONTENT_EDITOR", label: "Biên Tập Viên" },
                { value: "CUSTOMER", label: "Khách Hàng" },
              ]}
              searchable={false}
              size="sm"
            />
          </div>

          {/* Tier Filter */}
          <div className="flex items-center gap-2 min-w-[180px]">
            <span className="text-xs text-stone-400 shrink-0">Hạng VIP:</span>
            <CustomSelect
              value={tierFilter}
              onChange={(val) => {
                setTierFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: "ALL", label: "Tất cả hạng" },
                { value: "Platinum", label: "VIP Platinum" },
                { value: "Gold", label: "Gold" },
                { value: "Silver", label: "Silver" },
              ]}
              searchable={false}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#141417] border border-stone-800/80 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-stone-800/80 bg-[#17171A] text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                <th className="py-3.5 px-4">Người Dùng</th>
                <th className="py-3.5 px-4">Số Điện Thoại</th>
                <th className="py-3.5 px-4">Vai Trò</th>
                <th className="py-3.5 px-4">Hạng & Điểm Tích Lũy</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                <th className="py-3.5 px-4">Ngày Tham Gia</th>
                <th className="py-3.5 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/40 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#C5A880] mb-2" />
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-500">
                    Không tìm thấy người dùng nào phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-stone-800/30 transition-colors group"
                    >
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-stone-700 shrink-0">
                              <Image
                                src={user.avatar}
                                alt={user.fullName}
                                fill
                                className="object-cover"
                                sizes="36px"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-stone-800 to-stone-900 border border-stone-700 flex items-center justify-center text-xs font-bold text-[#C5A880] shrink-0">
                              {user.fullName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-stone-200 truncate">
                              {user.fullName}
                            </div>
                            <div className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5 truncate">
                              <Mail className="w-3 h-3 text-stone-500 shrink-0" />
                              <span>{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono text-stone-300 whitespace-nowrap">
                        {user.phone || "—"}
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>

                      {/* Tier & Points */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getTierBadge(user.tier)}
                          <span className="text-[11px] font-mono text-stone-300">
                            {user.points.toLocaleString("vi-VN")} pts
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                            user.isActive
                              ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/60"
                              : "bg-red-950/60 text-red-400 border border-red-800/60 hover:bg-red-900/60"
                          }`}
                          title="Bấm để đổi trạng thái khóa/mở"
                        >
                          {user.isActive ? (
                            <>
                              <CheckCircle className="w-3 h-3" /> Hoạt động
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" /> Đang khóa
                            </>
                          )}
                        </button>
                      </td>

                      {/* Join Date */}
                      <td className="py-3.5 px-4 text-stone-400 text-[11px] whitespace-nowrap font-mono">
                        {user.createdAt}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 rounded-lg bg-stone-800 hover:bg-[#C5A880] text-stone-300 hover:text-black transition-colors"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.fullName)}
                            className="p-1.5 rounded-lg bg-red-950/30 hover:bg-red-900/60 text-red-400 hover:text-red-200 transition-colors"
                            title="Xóa tài khoản này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-[#17171A] border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
          <div>
            Hiển thị <span className="font-semibold text-stone-200">{filteredUsers.length === 0 ? 0 : startIndex + 1}</span> -{" "}
            <span className="font-semibold text-stone-200">
              {Math.min(startIndex + itemsPerPage, filteredUsers.length)}
            </span>{" "}
            trong tổng số <span className="font-semibold text-stone-200">{filteredUsers.length}</span> người dùng
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-stone-800 bg-[#1A1A1D] hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed text-stone-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 bg-stone-900 border border-stone-800 rounded-lg font-mono text-xs text-stone-300">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-stone-800 bg-[#1A1A1D] hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed text-stone-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141417] border border-stone-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#C5A880]" />
                {editingUser ? `Chỉnh Sửa Người Dùng: ${editingUser.fullName}` : "Thêm Tài Khoản Mới"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* Avatar Upload */}
              <ImageUploadWithPreview
                label="Ảnh Đại Diện (Avatar)"
                value={formData.avatar || ""}
                onChange={(url) => setFormData({ ...formData, avatar: url })}
                aspectRatio="square"
                placeholderText="Tải ảnh chân dung hoặc avatar"
              />

              <div>
                <label className="text-stone-300 font-medium block mb-1">
                  {editingUser ? "Đặt lại mật khẩu" : "Mật khẩu"}
                </label>
                <input
                  type="text"
                  autoComplete="new-password"
                  data-testid="user-password"
                  value={formData.password || ""}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? "Để trống nếu không đổi" : "Tối thiểu 8 ký tự, gồm chữ và số"}
                  className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 font-mono focus:outline-none focus:border-[#C5A880]"
                />
                <p className="text-stone-500 mt-1">
                  Khi chưa cấu hình SMTP, khách quên mật khẩu sẽ liên hệ shop: đặt mật khẩu tạm ở đây rồi báo khách đăng nhập và đổi lại trong Tài khoản.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-stone-300 font-medium block mb-1">
                    Họ và tên <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName || ""}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="text-stone-300 font-medium block mb-1">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="text-stone-300 font-medium block mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 font-mono focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="text-stone-300 font-medium block mb-1">Điểm tích lũy</label>
                  <input
                    type="number"
                    value={formData.points || 0}
                    onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                    className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg p-2.5 text-stone-200 font-mono focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="text-stone-300 font-medium block mb-1">Vai trò hệ thống</label>
                  <CustomSelect
                    value={formData.role || "CUSTOMER"}
                    onChange={(val) => setFormData({ ...formData, role: val as UserItem["role"] })}
                    options={[
                      { value: "CUSTOMER", label: "Khách Hàng (Customer)" },
                      { value: "CONTENT_EDITOR", label: "Biên Tập Viên (Content Editor)" },
                      { value: "SUPER_ADMIN", label: "Quản Trị Tối Cao (Super Admin)" },
                    ]}
                    searchable={false}
                  />
                </div>

                <div>
                  <label className="text-stone-300 font-medium block mb-1">Hạng thành viên VIP</label>
                  <CustomSelect
                    value={formData.tier || "Silver"}
                    onChange={(val) => setFormData({ ...formData, tier: val as UserItem["tier"] })}
                    options={[
                      { value: "Silver", label: "Silver (Bạc)" },
                      { value: "Gold", label: "Gold (Vàng)" },
                      { value: "Platinum", label: "Platinum (Bạch Kim)" },
                    ]}
                    searchable={false}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="userActiveCheck"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded bg-stone-900 border-stone-700 text-[#C5A880] focus:ring-[#C5A880]"
                />
                <label htmlFor="userActiveCheck" className="text-stone-300 cursor-pointer">
                  Kích hoạt tài khoản (Cho phép đăng nhập và sử dụng dịch vụ)
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-800 bg-[#17171A] flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium rounded-lg transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveUser}
                disabled={modalSaving}
                className="px-5 py-2 bg-[#C5A880] hover:bg-[#b59870] text-black text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" /> {modalSaving ? "Đang lưu..." : "Lưu Người Dùng"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
