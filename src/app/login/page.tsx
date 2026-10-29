import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { BackLink } from "@/components/atoms/back-link";
import { EverieBrand } from "@/components/atoms/everie-brand";
import { ImmersiveGalleryShowcase } from "@/components/organisms/immersive-gallery-showcase";
import { AuthForm } from "@/features/auth/presentation/components/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="auth-page min-h-screen overflow-hidden bg-[#050507] text-white">
      <div className="auth-orb auth-orb-a pointer-events-none fixed rounded-full bg-violet-700/10 blur-[140px]" />
      <div className="auth-orb auth-orb-b pointer-events-none fixed rounded-full bg-cyan-600/6 blur-[130px]" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-[100rem] lg:grid-cols-[1.06fr_0.94fr]">
        <section className="relative hidden min-h-screen overflow-hidden border-r border-white/10 bg-[#030305] lg:block">
          <ImmersiveGalleryShowcase />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_35%,transparent_18%,rgba(3,3,5,0.3)_56%,rgba(3,3,5,0.94)_100%)]" />
          <div className="auth-home-enter absolute inset-x-0 top-0 p-8">
            <EverieBrand />
          </div>
          <div className="absolute inset-x-0 bottom-0 p-10 xl:p-14">
            <h1 className="auth-copy-item auth-copy-title max-w-2xl font-serif text-6xl leading-[0.88] tracking-[-0.05em] xl:text-8xl">
              Keep the works<br /><span className="bg-gradient-to-r from-violet-200 to-cyan-200 bg-clip-text italic text-transparent">you truly discover.</span>
            </h1>
            <p className="auth-copy-item auth-copy-description mt-6 max-w-lg text-sm leading-6 text-white/42">
              Your Collection records artwork only after the AR camera recognizes its target, then keeps that discovery with your account.
            </p>
          </div>
        </section>

        <section className="relative flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-14 xl:px-20">
          <div className="auth-home-enter everie-nav-surface relative grid grid-cols-[1fr_auto_1fr] items-center rounded-[6px] px-4 py-4">
            <BackLink href="/" />
            <EverieBrand />
            <span aria-hidden="true" />
          </div>

          <div className="relative flex flex-1 items-center py-12 sm:py-14">
            <div className="w-full max-w-lg">
              <h2 className="auth-copy-item auth-copy-title font-serif text-5xl leading-[0.94] tracking-[-0.045em] sm:text-6xl">
                Your collection,<br /><span className="text-violet-100 italic">kept together.</span>
              </h2>
              <p className="auth-copy-item auth-copy-description mt-4 max-w-md text-sm leading-6 text-white/38">
                Sign in to keep recognized works across devices and manage your own published AR products.
              </p>
              <AuthForm nextPath={next} />
            </div>
          </div>

          <div className="auth-home-enter relative flex justify-end pt-5 text-[0.6rem] uppercase tracking-[0.14em] text-white/28">
            <Link href="/collection" className="inline-flex items-center gap-2 transition hover:text-white">
              View collection <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
