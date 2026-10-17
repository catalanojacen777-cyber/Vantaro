'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { SavedOutput } from '@/lib/outputs/repo';
import type { CalcResult } from '@/lib/tools/types';
import { toMarkdown, toPlainText, type ViewBlock } from '@/lib/view';
import { api } from '@/lib/client-api';
import { PageHeader } from './page-header';
import { CalcResultView } from '@/components/tools/calculator-runner';
import { CopyButton } from '@/components/ui/copy-button';
import { Dialog } from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icons';
import { StructuredView } from '@/components/ui/structured-view';
import { toast } from '@/components/ui/toast';

export function OutputDetail({ output, toolName, toolSlug, view, fields, canEdit }: { output: SavedOutput; toolName: string; toolSlug: string; view: ViewBlock[] | null; fields: { name: string; label: string }[]; canEdit: boolean }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [title, setTitle] = useState(output.title);
  const [renaming, setRenaming] = useState(false);
  const calc = output.mode === 'calculated' ? (output.output as CalcResult) : null;

  function download() {
    const body = view ? toMarkdown(view, output.output, 2) : calc ? [calc.headline ? `**${calc.headline.label}:** ${calc.headline.value}` : '', '', ...calc.lines.map((l) => `- ${l.label}: ${l.value}${l.formula ? ` (${l.formula})` : ''}`), '', '## Assumptions', ...calc.assumptions.map((a) => `- ${a}`)].join('\n') : '';
    const md = `# ${title}\n\n${output.mode === 'preview' ? '> Preview output: placeholder text produced without an AI provider.\n\n' : ''}${body}\n`;
    const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${toolSlug}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function rename(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api(`/api/outputs/${output.id}`, { method: 'PATCH', body: { title } });
      setRenaming(false);
      toast('Renamed');
      router.refresh();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  return (
    <>
      <PageHeader
        crumbs={[{ href: '/app/outputs', label: 'Saved outputs' }]}
        title={title}
        description={<>{toolName}, saved {new Date(output.created_at).toLocaleString()}</>}
        actions={
          <>
            <CopyButton text={() => (view ? toPlainText(view, output.output) : calc ? calc.lines.map((l) => `${l.label}: ${l.value}`).join('\n') : '')} className="btn btn-secondary btn-sm" />
            <button className="btn btn-secondary btn-sm" onClick={download}><Icon.Download /> Download</button>
            {canEdit ? <button className="btn btn-secondary btn-sm" onClick={() => setRenaming(true)}><Icon.Edit /> Rename</button> : null}
            {canEdit ? <button className="btn btn-danger btn-sm" onClick={() => setConfirm(true)}><Icon.Trash /> Delete</button> : null}
          </>
        }
      />
      {output.mode === 'preview' ? <div className="notice notice-warn mb-5"><Icon.Info /><span><strong>Preview output.</strong> Created without an AI provider; placeholder text only.</span></div> : null}
      <div className="panel panel-pad">
        {view ? <StructuredView view={view} data={output.output} /> : calc ? <CalcResultView result={calc} /> : <p className="muted">This tool is no longer available.</p>}
      </div>
      <details className="method panel panel-pad mt-5">
        <summary>Inputs used</summary>
        <dl className="sv-dl sv-dl-wide mt-4">
          {fields.filter((f) => output.input[f.name] !== undefined && output.input[f.name] !== '').map((f) => (
            <div key={f.name}><dt>{f.label}</dt><dd>{String(output.input[f.name])}</dd></div>
          ))}
        </dl>
        <Link href={`/app/tools/${toolSlug}`} className="btn btn-secondary btn-sm mt-4">Run {toolName} again</Link>
      </details>
      {renaming ? (
        <Dialog title="Rename saved output" onClose={() => setRenaming(false)}>
          <form onSubmit={rename} className="stack">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} aria-label="Title" />
            <div className="cluster" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setRenaming(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={!title.trim()}>Save name</button>
            </div>
          </form>
        </Dialog>
      ) : null}
      {confirm ? (
        <Dialog
          title="Delete this saved output?"
          description="This cannot be undone."
          onClose={() => setConfirm(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setConfirm(false)}>Keep it</button>
              <button
                className="btn btn-danger"
                onClick={async () => {
                  try {
                    await api(`/api/outputs/${output.id}`, { method: 'DELETE' });
                    toast('Deleted');
                    router.replace('/app/outputs');
                    router.refresh();
                  } catch (err) {
                    toast((err as Error).message, 'error');
                  }
                }}
              >
                Delete
              </button>
            </>
          }
        />
      ) : null}
    </>
  );
}
