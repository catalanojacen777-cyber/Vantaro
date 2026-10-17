'use client';

import { Icon } from '@/components/ui/icons';

export function PrintButton() {
  return (
    <button className="btn btn-primary" onClick={() => window.print()}>
      <Icon.Print /> Print or save as PDF
    </button>
  );
}
