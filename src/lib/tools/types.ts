import type { Schema } from '@/lib/ai/schema';
import type { ViewBlock } from '@/lib/view';

export type CategoryKey = 'strategy' | 'audience' | 'branding' | 'content' | 'advertising' | 'conversion' | 'planning' | 'calculators';

export const CATEGORIES: Record<CategoryKey, { label: string; description: string }> = {
  strategy: { label: 'Strategy and research', description: 'Test ideas, models and markets before you commit.' },
  audience: { label: 'Audience', description: 'Describe who you serve and what they need to hear.' },
  branding: { label: 'Brand and messaging', description: 'Names, slogans, missions and value propositions.' },
  content: { label: 'Content', description: 'Ideas and drafts for blogs, social and email.' },
  advertising: { label: 'Advertising and copy', description: 'Ad copy, landing pages and product descriptions.' },
  conversion: { label: 'Funnels and conversion', description: 'Lead magnets, funnels and headline feedback.' },
  planning: { label: 'Planning', description: 'Plans and tactics organized into work you can do.' },
  calculators: { label: 'Calculators', description: 'Transparent arithmetic with every assumption visible.' },
};

type TextBase = {
  name: string;
  label: string;
  required?: boolean;
  max: number;
  min?: number;
  placeholder?: string;
  help?: string;
};
export type TextField = TextBase & { type: 'text' };
export type TextareaField = TextBase & { type: 'textarea' };
export type SelectField = { type: 'select'; name: string; label: string; options: readonly string[]; required?: boolean; help?: string; default?: string };
export type NumberField = {
  type: 'number';
  name: string;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  required?: boolean;
  help?: string;
  default?: number;
};
export type Field = TextField | TextareaField | SelectField | NumberField;

export type ToolExample = { label: string; values: Record<string, string | number> };

type ToolBase = {
  slug: string;
  name: string;
  category: CategoryKey;
  /** One line for directory cards. */
  summary: string;
  /** A direct, two-to-three sentence answer to "what does this tool do?" */
  answer: string;
  fields: Field[];
  examples: ToolExample[];
  /** What the visitor gets, as a short noun phrase: "Ten business ideas". */
  outputLabel: string;
  limitations: string[];
  related: string[];
  keywords?: string[];
};

export type AiTool = ToolBase & {
  kind: 'ai';
  schema: Schema;
  view: ViewBlock[];
  /** Task instructions appended to the shared system rules. */
  task: string;
  /** Field whose value names the subject (used for titles and preview text). */
  subjectField: string;
  promptVersion: string;
  maxTokens?: number;
};

export type CalcLine = { label: string; value: string; formula?: string; emphasis?: boolean };
export type CalcResult = {
  ok: boolean;
  errors: string[];
  headline?: { label: string; value: string };
  lines: CalcLine[];
  scenarios?: { label: string; value: string; note?: string }[];
  assumptions: string[];
  warnings: string[];
};

export type CalculatorTool = ToolBase & {
  kind: 'calculator';
  methodology: string[];
};

export type Tool = AiTool | CalculatorTool;
