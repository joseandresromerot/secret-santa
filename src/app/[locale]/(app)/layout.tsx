import { Gift } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { Link, redirect } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { UserMenu } from "@/components/user-menu";

export default async function AppLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  const session = await auth();
  if (!session?.user?.id) return redirect({ href: "/", locale });

  const t = await getTranslations("Common");
  const { name, email, image } = session.user;

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-4">
          <Link href="/draws" className="flex items-center gap-2 font-semibold">
            <Gift className="size-5 text-primary" />
            {t("appName")}
          </Link>
          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            <UserMenu name={name ?? null} email={email ?? ""} image={image ?? null} />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
