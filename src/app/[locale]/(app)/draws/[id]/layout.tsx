import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Stepper } from "@/features/draws/components/stepper";
import { loadDraw } from "@/features/draws/lib/load-draw";

export default async function DrawLayout({ children, params }: LayoutProps<"/[locale]/draws/[id]">) {
  const { id } = await params;
  const draw = await loadDraw(id);
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
      <h1 className="mb-6 truncate text-2xl font-semibold tracking-tight">{draw.name}</h1>
      {draw.status === "draft" && <Stepper drawId={draw.id} />}
      {children}
    </div>
  );
}
