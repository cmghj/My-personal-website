import type { Metadata } from "next";
import SiteShell from "@/components/SiteShell";
import { getSiteSettings } from "@/lib/settings";
import "./globals.css";

// 网站正式网址（Vercel 部署时自动填入；本地为 localhost）
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: settings.siteTitle,
      template: `%s · ${settings.siteTitle}`,
    },
    description: settings.siteDescription,
    openGraph: {
      title: settings.siteTitle,
      description: settings.siteDescription,
      type: "website",
      locale: "zh_CN",
      images: ["/og-default.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: settings.siteTitle,
      description: settings.siteDescription,
      images: ["/og-default.png"],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col overflow-x-hidden bg-paper text-ink">
        <SiteShell siteTitle={settings.siteTitle} siteDescription={settings.siteDescription}>
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
