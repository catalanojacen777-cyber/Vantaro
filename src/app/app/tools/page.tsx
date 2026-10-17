import type { Metadata } from 'next';
import { PageHeader } from '@/components/app/page-header';
import { AppToolDirectory } from '@/components/app/app-tool-directory';
import { CATEGORY_ORDER, toolIndex } from '@/lib/tools/registry';
import { CATEGORIES } from '@/lib/tools/types';

export const metadata: Metadata = { title: 'Tools' };

export default function AppToolsPage() {
  return (
    <>
      <PageHeader title="Tools" description="Every tool starts from your business brief. Results can be saved to this workspace." />
      <AppToolDirectory tools={toolIndex()} categories={CATEGORY_ORDER.map((k) => ({ key: k, label: CATEGORIES[k].label }))} />
    </>
  );
}
