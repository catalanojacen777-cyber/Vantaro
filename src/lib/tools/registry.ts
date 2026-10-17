import { calculatorTools } from './calculators';
import { audienceTools, brandTools } from './defs/audience-brand';
import { contentTools } from './defs/content';
import { advertisingTools, conversionTools, planningTools } from './defs/growth';
import { strategyTools } from './defs/strategy';
import { CATEGORIES, type CategoryKey, type Tool } from './types';

export const TOOLS: Tool[] = [
  ...strategyTools,
  ...audienceTools,
  ...brandTools,
  ...contentTools,
  ...advertisingTools,
  ...conversionTools,
  ...planningTools,
  ...calculatorTools,
].sort((a, b) => a.name.localeCompare(b.name));

export const TOOL_BY_SLUG: Record<string, Tool> = Object.fromEntries(TOOLS.map((t) => [t.slug, t]));

export const CATEGORY_ORDER: CategoryKey[] = ['strategy', 'audience', 'branding', 'content', 'advertising', 'conversion', 'planning', 'calculators'];

export function toolsByCategory() {
  return CATEGORY_ORDER.map((key) => ({ key, ...CATEGORIES[key], tools: TOOLS.filter((t) => t.category === key) }));
}

export function relatedTools(tool: Tool): Tool[] {
  return tool.related.map((slug) => TOOL_BY_SLUG[slug]).filter(Boolean);
}

/** Light, serializable index for directories, search and client components. */
export function toolIndex() {
  return TOOLS.map((t) => ({ slug: t.slug, name: t.name, category: t.category, summary: t.summary, kind: t.kind }));
}
export type ToolIndexItem = ReturnType<typeof toolIndex>[number];
