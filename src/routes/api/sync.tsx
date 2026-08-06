// src/routes/api/sync.tsx
import { json } from '@tanstack/react-router';
import { mainSync } from '../../sync';

export function action({ request }: { request: Request }) {
  return mainSync({} as any).then(() => {
    return json({ success: true, message: 'Sync triggered' });
  }).catch((error) => {
    return json({ success: false, error: String(error) }, { status: 500 });
  });
}