import { config } from '@/config/site';
import type { AiToolClient } from '@/components/tools/tool-runner';
import type { CalculatorClient } from '@/components/tools/calculator-runner';
import type { AiTool, CalculatorTool, Field } from './types';

/**
 * The fields an AI tool accepts, including the output-language choice when
 * more than one tested language is configured. Used by both the form and the
 * server-side validator, so a language the form offers is never dropped.
 */
export function aiToolFields(tool: AiTool): Field[] {
  const languages = config.ai.outputLanguages;
  return languages.length > 1
    ? [...tool.fields, { type: 'select', name: 'language', label: 'Output language', options: languages, default: languages[0] }]
    : tool.fields;
}

/** Serializable tool definitions for client components (no prompts). */
export function aiToolClient(tool: AiTool): AiToolClient {
  return { slug: tool.slug, name: tool.name, fields: aiToolFields(tool), examples: tool.examples, outputLabel: tool.outputLabel, view: tool.view };
}

export function calculatorClient(tool: CalculatorTool): CalculatorClient {
  return { slug: tool.slug, name: tool.name, fields: tool.fields, examples: tool.examples, methodology: tool.methodology };
}
