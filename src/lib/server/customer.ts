import type { BespokeRequest, CMSDatabase, OrderItem, UserItem } from "@/lib/store";

const norm = (v?: string) => (v || "").trim().toLowerCase();

/** Orders that belong to the user: linked by id, or guest orders with the user's verified email. */
export function ordersOf(db: CMSDatabase, user: UserItem): OrderItem[] {
  return (db.orders || []).filter(
    (o) =>
      o.customerId === user.id ||
      (!o.customerId && user.emailVerified && norm(o.email) === norm(user.email)),
  );
}

export function bespokeOf(db: CMSDatabase, user: UserItem): BespokeRequest[] {
  return (db.bespokeRequests || []).filter(
    (b) =>
      b.customerId === user.id ||
      (!b.customerId && user.emailVerified && norm(b.email) === norm(user.email)),
  );
}

/** Links unclaimed guest orders/requests with this (verified) email to the user. */
export function claimByVerifiedEmail(db: CMSDatabase, user: UserItem) {
  if (!user.emailVerified) return 0;
  let n = 0;
  for (const o of db.orders || []) {
    if (!o.customerId && norm(o.email) === norm(user.email)) { o.customerId = user.id; n++; }
  }
  for (const b of db.bespokeRequests || []) {
    if (!b.customerId && norm(b.email) === norm(user.email)) { b.customerId = user.id; n++; }
  }
  return n;
}

/** What a customer may see of an order (no internal notes). */
export function customerOrderView(o: OrderItem) {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    date: o.date,
    total: o.total,
    shippingFee: o.shippingFee,
    discountAmount: o.discountAmount,
    status: o.status,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    customerName: o.customerName,
    phone: o.phone,
    email: o.email,
    address: o.address,
    trackingCode: o.trackingCode,
    timeline: (o.timeline || []).map(({ time, title, note }) => ({ time, title, note })),
    items: o.items,
    expectedMinDays: o.expectedMinDays,
    expectedMaxDays: o.expectedMaxDays,
    hasEngraving: o.hasEngraving,
  };
}

export function customerBespokeView(b: BespokeRequest) {
  return {
    id: b.id,
    code: b.code,
    createdAt: b.createdAt,
    status: b.status,
    occasion: b.occasion,
    flowerPreference: b.flowerPreference,
    colorPreference: b.colorPreference,
    engravingText: b.engravingText,
    notes: b.notes,
    attachments: b.attachments,
    revisionCount: b.revisionCount,
    maxRevisions: b.maxRevisions,
    quoteAmount: b.quoteAmount,
  };
}
