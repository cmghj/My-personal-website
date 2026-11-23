import { updateSiteSettings } from "@/app/studio/actions";
import { requireOwner } from "@/lib/studio";
import FormSubmitButton from "../FormSubmitButton";

export const metadata = { title: "网站设置" };

export default async function SiteSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ supabase }, query] = await Promise.all([requireOwner(), searchParams]);
  const { data, error } = await supabase
    .from("site_settings")
    .select("site_title,site_description,home_intro")
    .eq("id", true)
    .single();

  if (error) throw new Error(`读取网站设置失败：${error.message}`);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="studio-page-heading">
        <h1>网站设置</h1>
      </div>

      {query.saved && (
        <div role="status" className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          ✓ 网站设置已保存。
        </div>
      )}

      <form action={updateSiteSettings} className="studio-card space-y-6 p-6 sm:p-8">
        <div>
          <label htmlFor="siteTitle" className="studio-label">网站名称</label>
          <input id="siteTitle" name="siteTitle" required maxLength={60} defaultValue={data.site_title} className="studio-input" />
          <p className="mt-1.5 text-xs text-muted">显示在导航、页脚和浏览器标签标题中。</p>
        </div>
        <div>
          <label htmlFor="siteDescription" className="studio-label">网站简介</label>
          <textarea id="siteDescription" name="siteDescription" required maxLength={160} rows={3} defaultValue={data.site_description} className="studio-input resize-y" />
          <p className="mt-1.5 text-xs text-muted">用于页脚、搜索引擎和分享预览说明。</p>
        </div>
        <div>
          <label htmlFor="homeIntro" className="studio-label">首页开场白</label>
          <textarea id="homeIntro" name="homeIntro" required maxLength={300} rows={5} defaultValue={data.home_intro} className="studio-input resize-y" />
          <p className="mt-1.5 text-xs text-muted">显示在首页开头，向访客介绍这个小站。</p>
        </div>
        <div className="flex justify-end border-t border-line pt-6">
          <FormSubmitButton
            idleLabel="保存网站设置"
            pendingLabel="正在保存…"
            className="studio-primary-button"
          />
        </div>
      </form>
    </div>
  );
}
