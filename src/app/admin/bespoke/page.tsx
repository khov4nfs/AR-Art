"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Flower2,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { BespokeRequest, BespokeStatus } from "@/lib/store";
import CustomSelect from "@/components/admin/CustomSelect";
import { useLanguage } from "@/context/LanguageContext";

interface BespokeListResponse {
  success: boolean;
  data?: BespokeRequest[];
  error?: string;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "Mới", label: "Mới" },
  { value: "Đang tư vấn", label: "Đang tư vấn" },
  { value: "Chờ duyệt thiết kế", label: "Chờ duyệt thiết kế" },
  { value: "Yêu cầu sửa", label: "Yêu cầu sửa" },
  { value: "Đã duyệt", label: "Đã duyệt" },
  { value: "Đã thanh toán", label: "Đã thanh toán" },
  { value: "Đã hủy", label: "Đã hủy" },
];

function statusClass(status: BespokeStatus): string {
  switch (status) {
    case "Đã thanh toán":
    case "Đã duyệt":
      return "bg-emerald-950/60 text-emerald-400 border-emerald-800/60";
    case "Yêu cầu sửa":
      return "bg-amber-950/60 text-amber-400 border-amber-800/60";
    case "Đã hủy":
      return "bg-red-950/60 text-red-400 border-red-800/60";
    case "Đang tư vấn":
    case "Chờ duyệt thiết kế":
      return "bg-blue-950/60 text-blue-300 border-blue-800/60";
    default:
      return "bg-[#C5A880]/15 text-[#C5A880] border-[#C5A880]/30";
  }
}

export default function AdminBespokeListPage() {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<BespokeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bespoke");
      const json = (await res.json()) as BespokeListResponse;
      if (json.success && json.data) {
        setRequests(json.data);
      }
    } catch (err) {
      console.error("Lỗi khi tải yêu cầu Bespoke:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRequests();
  }, []);

  const filtered = requests.filter((row) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      row.code.toLowerCase().includes(q) ||
      row.customerName.toLowerCase().includes(q) ||
      row.email.toLowerCase().includes(q) ||
      row.phone.includes(searchTerm);
    const matchesStatus = statusFilter === "ALL" || row.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageRows = filtered.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-wide flex items-center gap-2">
            <Flower2 className="w-6 h-6 text-[#C5A880]" />
            {t("admin.nav.bespoke")}
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Tổng cộng{" "}
            <span className="text-[#C5A880] font-semibold">{requests.length}</span> yêu
            cầu thiết kế độc bản
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchRequests()}
          className="px-3.5 py-2 bg-stone-800/80 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-lg border border-stone-700/60 flex items-center gap-2 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Làm
          mới
        </button>
      </div>

      <div className="bg-[#141417] border border-stone-800/80 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã EVB, tên khách, email, điện thoại..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#1A1A1D] border border-stone-800 rounded-lg pl-10 pr-4 py-2 text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-[#C5A880]"
          />
        </div>
        <div className="flex items-center gap-2 min-w-[220px]">
          <span className="text-xs text-stone-400 shrink-0">Trạng thái:</span>
          <CustomSelect
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            options={STATUS_OPTIONS}
            searchable={false}
            size="sm"
          />
        </div>
      </div>

      <div className="bg-[#141417] border border-stone-800/80 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-stone-800/80 bg-[#17171A] text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                <th className="py-3.5 px-4">Mã</th>
                <th className="py-3.5 px-4">Khách hàng</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4">Sửa bản vẽ</th>
                <th className="py-3.5 px-4">Ngày gửi</th>
                <th className="py-3.5 px-4 text-center">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/40 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#C5A880] mb-2" />
                    Đang tải yêu cầu Bespoke...
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-500">
                    Chưa có yêu cầu Bespoke nào
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr key={row.id} className="hover:bg-stone-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        href={`/admin/bespoke/${row.id}`}
                        className="font-mono font-bold text-[#C5A880] hover:underline"
                      >
                        {row.code}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-stone-200 font-medium">{row.customerName}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{row.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${statusClass(row.status)}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-stone-300">
                      {row.revisionCount}/{row.maxRevisions}
                    </td>
                    <td className="py-3.5 px-4 text-stone-400 whitespace-nowrap">
                      {row.createdAt}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Link
                        href={`/admin/bespoke/${row.id}`}
                        className="px-2.5 py-1 bg-stone-800 hover:bg-[#C5A880] text-stone-300 hover:text-black rounded text-[11px] font-medium transition-colors"
                      >
                        Xem →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-[#17171A] border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
          <div>
            Hiển thị{" "}
            <span className="font-semibold text-stone-200">
              {filtered.length === 0 ? 0 : startIndex + 1}
            </span>{" "}
            -{" "}
            <span className="font-semibold text-stone-200">
              {Math.min(startIndex + itemsPerPage, filtered.length)}
            </span>{" "}
            trong tổng số{" "}
            <span className="font-semibold text-stone-200">{filtered.length}</span> yêu cầu
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
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
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-stone-800 bg-[#1A1A1D] hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed text-stone-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
