import { handle } from '@/lib/api';
import { requireWorkspace } from '@/lib/auth/session';
import { fileSafe, strategyToMarkdown } from '@/lib/strategy/export';
import { requireStrategy } from '@/lib/strategy/repo';

export const GET = handle<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const { workspace } = await requireWorkspace();
  const { id } = await params;
  const st = requireStrategy(workspace.id, id);
  return new Response(strategyToMarkdown(st, { includeBrief: true }), {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'content-disposition': `attachment; filename="${fileSafe(st.title)}.md"`,
      'cache-control': 'private, no-store',
    },
  });
});
