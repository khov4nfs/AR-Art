import Link from "next/link";
import { ArrowUpRight, Camera, ImagePlus, Images, ScanLine, ShieldCheck } from "lucide-react";

const entries = [
  { href: "/ar", title: "Quét AR", description: "Mở camera và nhận diện hình ảnh để hiển thị animation bám trên ảnh gốc.", icon: ScanLine },
  { href: "/gallery", title: "Thư viện AR", description: "Khám phá sản phẩm mới xuất bản và sắp xếp theo lượt xem.", icon: Images },
  { href: "/studio/products", title: "Quản lý tác phẩm AR", description: "Quản lý tác phẩm và trạng thái xuất bản trong AR Studio.", icon: Camera },
  { href: "/create", title: "Xuất bản ảnh + video", description: "Tạo ảnh mục tiêu, upload animation và nhận QR để chia sẻ.", icon: ImagePlus },
] as const;

export default function AdminArPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-10 px-5 py-10 text-stone-200 sm:px-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.27em] text-[#C5A880]">EVERIE / Digital Atelier</p>
        <h1 className="mt-4 font-serif text-4xl text-white sm:text-5xl">Thực tế tăng cường AR</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-400">Khả năng quét ảnh, hiển thị animation, xuất bản tác phẩm và thư viện AR được tích hợp trong cùng source code với hệ thống thương mại điện tử EVERIE.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {entries.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href} className="group flex min-h-48 flex-col justify-between border border-stone-800 bg-[#18181A] p-6 transition-colors hover:border-[#C5A880]/70">
            <div className="flex items-start justify-between"><Icon className="size-7 text-[#C5A880]" strokeWidth={1.4} /><ArrowUpRight className="size-4 text-stone-500 transition group-hover:text-[#C5A880]" /></div>
            <div><h2 className="font-serif text-2xl text-white">{title}</h2><p className="mt-2 text-sm leading-6 text-stone-400">{description}</p></div>
          </Link>
        ))}
      </div>
      <div className="flex gap-4 border-l-2 border-[#C5A880] bg-[#1B1A19] p-5"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#C5A880]" /><div><p className="text-sm font-semibold text-white">Tài khoản và dữ liệu hiện tại</p><p className="mt-2 text-xs leading-6 text-stone-400">Mọi chức năng EVERIE và AR dùng chung tài khoản, quyền hạn và phiên đăng nhập EVERIE. Ảnh/video/.mind được lưu trong public/uploads/ar; dữ liệu tác phẩm và Collection lưu riêng trong data/ của EVERIE.</p></div></div>
    </main>
  );
}
