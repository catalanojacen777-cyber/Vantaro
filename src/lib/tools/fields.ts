import type { Field, NumberField, TextareaField, TextField } from './types';

/** Reusable field builders. Each tool still chooses its own fields and copy. */
export const F = {
  business: (label = 'What does your business do?', help?: string): Field => ({
    type: 'textarea',
    name: 'business',
    label,
    required: true,
    min: 20,
    max: 1200,
    help: help ?? 'What you sell, who it is for, and anything that makes it different.',
  }),
  audience: (required = false, label = 'Who is it for?'): Field => ({
    type: 'text',
    name: 'audience',
    label,
    required,
    max: 300,
    placeholder: 'e.g. first-time homeowners in Austin',
  }),
  text: (name: string, label: string, opts: Partial<TextField> = {}): Field => ({ max: 300, ...opts, type: 'text', name, label }),
  area: (name: string, label: string, opts: Partial<TextareaField> = {}): Field => ({ max: 1200, ...opts, type: 'textarea', name, label }),
  select: (name: string, label: string, options: readonly string[], opts: { required?: boolean; help?: string; default?: string } = {}): Field => ({
    type: 'select',
    name,
    label,
    options,
    default: opts.default ?? options[0],
    ...opts,
  }),
  tone: (): Field => ({
    type: 'select',
    name: 'tone',
    label: 'Tone',
    options: ['Clear and direct', 'Warm and friendly', 'Confident', 'Playful', 'Premium', 'Plain-spoken'],
    default: 'Clear and direct',
  }),
  number: (name: string, label: string, opts: Partial<NumberField> = {}): Field => ({ ...opts, type: 'number', name, label }),
};

export const PLATFORMS_SOCIAL = ['Instagram', 'LinkedIn', 'Facebook', 'TikTok', 'X (Twitter)', 'Threads', 'YouTube'] as const;
export const PLATFORMS_ADS = ['Google Search', 'Meta (Facebook and Instagram)', 'LinkedIn', 'TikTok', 'YouTube', 'Pinterest'] as const;
export const STAGES = ['Idea', 'Pre-launch', 'Early customers', 'Growing', 'Established'] as const;
