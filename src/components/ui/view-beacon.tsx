'use client';

import { useEffect } from 'react';

/** Reports a page view for a tool once per mount. No content, no cookies. */
export function ViewBeacon({ tool }: { tool: string }) {
  useEffect(() => {
    fetch('/api/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'tool_viewed', tool }),
      keepalive: true,
      credentials: 'same-origin',
    }).catch(() => {});
  }, [tool]);
  return null;
}
