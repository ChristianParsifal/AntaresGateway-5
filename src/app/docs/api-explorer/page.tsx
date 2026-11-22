import { brandDocsText } from "@/lib/docsBrand";
import { Metadata } from "next";
import { ApiExplorerClient } from "../components/ApiExplorerClient";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("docs");
  return {
    title: brandDocsText(t("apiExplorerMetadataTitle")),
    description: brandDocsText(t("apiExplorerMetadataDescription")),
  };
}

export default function ApiExplorerPage() {
  const t = useTranslations("docs");
  return (
    <div>
      <h1 className="ci-heading text-3xl mb-2">{brandDocsText(t("apiExplorerTitle"))}</h1>
      <p className="text-text-muted mb-8">{brandDocsText(t("apiExplorerDescription"))}</p>
      <ApiExplorerClient />
    </div>
  );
}
