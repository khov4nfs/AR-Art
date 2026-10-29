"use client";

import { QrCode } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

export function ArtworkArQrCode({ href, title }: { href: string; title: string }) {
  const [qr, setQr] = useState<{ href: string; url: string } | null>(null);
  const qrDataUrl = qr?.href === href ? qr.url : null;

  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(new URL(href, window.location.origin).toString(), {
      width: 384,
      margin: 2,
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (active) setQr({ href, url });
      })
      .catch(() => {
        if (active) setQr(null);
      });

    return () => {
      active = false;
    };
  }, [href]);

  return (
    <a
      href={href}
      aria-label={`Open ${title} in AR`}
      className="group inline-flex flex-col items-end gap-3"
    >
      <span className="rounded-[5px] bg-white p-2.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-4 group-focus-visible:outline-violet-200">
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUrl}
            alt={`QR code to open ${title} in AR`}
            width={128}
            height={128}
            className="size-32"
          />
        ) : (
          <span className="flex size-32 items-center justify-center text-black/30" aria-hidden="true">
            <QrCode className="size-8" />
          </span>
        )}
      </span>
      <span className="text-[0.62rem] font-medium uppercase tracking-[0.15em] text-white/45 transition-colors group-hover:text-white/80">
        Scan to open AR
      </span>
    </a>
  );
}