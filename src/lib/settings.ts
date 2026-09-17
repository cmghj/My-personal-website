import "server-only";

import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";

export type SiteSettings = {
  siteTitle: string;
  siteDescription: string;
  homeIntro: string;
};

export const defaultSiteSettings: SiteSettings = {
  siteTitle: "我的记录",
  siteDescription: "记录生活、照片与影像的个人小站",
  homeIntro: "在这里，我慢慢记录生活里的光——一些照片、一些影像，和一些想留住的心情。",
};

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const supabase = createPublicClient();
  if (!supabase) return defaultSiteSettings;

  const { data, error } = await supabase
    .from("site_settings")
    .select("site_title,site_description,home_intro")
    .eq("id", true)
    .maybeSingle();

  if (error || !data) return defaultSiteSettings;

  return {
    siteTitle: data.site_title || defaultSiteSettings.siteTitle,
    siteDescription: data.site_description || defaultSiteSettings.siteDescription,
    homeIntro: data.home_intro || defaultSiteSettings.homeIntro,
  };
});
