/** English labels for the Vietnamese status values stored in the CMS. */
const EN: Record<string, string> = {
  "Chờ xác nhận": "Awaiting confirmation",
  "Đang chế tác": "Crafting",
  "Đang xử lý": "Processing",
  "Đang vận chuyển": "Shipping",
  "Đã giao hàng": "Delivered",
  "Hư hỏng khi vận chuyển": "Damaged in transit",
  "Đã hủy": "Cancelled",
  "Chưa thanh toán": "Unpaid",
  "Đã thanh toán": "Paid",
  "Đã hoàn tiền": "Refunded",
  "Mới": "New",
  "Đang tư vấn": "In consultation",
  "Chờ duyệt thiết kế": "Design awaiting approval",
  "Yêu cầu sửa": "Revision requested",
  "Đã duyệt": "Approved",
};

export function statusText(value: string | undefined, lang: string): string {
  if (!value) return "";
  return lang === "en" ? EN[value] || value : value;
}
