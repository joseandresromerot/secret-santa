import { ArrowLeft, ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";

type Props = { backHref?: string; nextHref?: string; nextLabel?: string };

export async function StepFooter({ backHref, nextHref, nextLabel }: Props) {
  const t = await getTranslations("Common");
  return (
    <div className="mt-8 flex items-center justify-between gap-4 border-t pt-6">
      {backHref ? (
        <Link href={backHref} className={buttonVariants({ variant: "outline", size: "lg" })}>
          <ArrowLeft />
          {t("back")}
        </Link>
      ) : (
        <span />
      )}
      {nextHref && (
        <Link href={nextHref} className={buttonVariants({ size: "lg" })}>
          {nextLabel ?? t("next")}
          <ArrowRight />
        </Link>
      )}
    </div>
  );
}
