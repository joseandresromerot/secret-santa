import { Gift, Mail, ShieldCheck, Users } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/google-icon";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { signInWithGoogle } from "@/features/auth/actions";

export default async function LandingPage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (session?.user?.id) redirect({ href: "/draws", locale });

  const t = await getTranslations("Landing");
  const features = [
    { icon: Users, title: t("feature1Title"), text: t("feature1Text") },
    { icon: ShieldCheck, title: t("feature2Title"), text: t("feature2Text") },
    { icon: Mail, title: t("feature3Title"), text: t("feature3Text") },
  ];

  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2 font-semibold">
          <Gift className="size-5 text-primary" />
          {t("brand")}
        </div>
        <LocaleSwitcher />
      </div>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <Gift className="size-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">{t("title")}</h1>
        <p className="mt-4 max-w-xl text-lg text-pretty text-muted-foreground">{t("subtitle")}</p>
        <form action={signInWithGoogle.bind(null, locale)} className="mt-8">
          <Button type="submit" size="lg" variant="outline" className="h-11 gap-3 px-5 text-base">
            <GoogleIcon className="size-5" />
            {t("signInGoogle")}
          </Button>
        </form>

        <div className="mt-16 grid w-full gap-4 text-left sm:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border bg-card p-5">
              <Icon className="mb-3 size-5 text-primary" />
              <h2 className="font-medium">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
