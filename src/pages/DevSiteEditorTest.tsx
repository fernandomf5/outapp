import { useState } from "react";
import { SiteEditor } from "@/components/sites/SiteEditor";
import { DEFAULT_THEME, SiteBlock, SiteTheme } from "@/components/sites/siteTypes";

export default function DevSiteEditorTest() {
  const [blocks, setBlocks] = useState<SiteBlock[]>([]);
  const [theme, setTheme] = useState<SiteTheme>(DEFAULT_THEME);
  return (
    <div className="h-screen">
      <SiteEditor blocks={blocks} theme={theme} onBlocksChange={setBlocks} onThemeChange={setTheme} />
    </div>
  );
}
