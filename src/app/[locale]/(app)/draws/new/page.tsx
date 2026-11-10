import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { DetailsForm } from "@/features/draws/components/details-form";

export default async function NewDrawPage({ params }: PageProps<"/[locale]/draws/new">) {
  const { locale } = await params;
  const t = await getTranslations("Draws");

  return (
    <div>
      <Link
        href="/draws"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t("backToList")}
      </Link>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{t("new")}</h1>
      <DetailsForm
        initial={{ name: "", eventDate: "", budget: "", message: "", locale: locale as Locale }}
      />
    </div>
  );
}
