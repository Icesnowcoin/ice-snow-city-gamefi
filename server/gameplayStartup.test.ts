import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('gameplay-first server startup', () => {
  it('serves the game without constructing a blockchain client or on-chain event poller', () => {
    const source = readFileSync(resolve(process.cwd(), 'server/_core/index.ts'), 'utf8');
    expect(source).not.toMatch(/new\s+(BlockchainService|EventListenerService|EnhancedEventListener)\s*\(/);
    expect(source).not.toMatch(/eventListenerService\.(initialize|start|stop)\s*\(/);
    expect(source).toContain('"/api/trpc"');
    expect(source).toContain('serveStatic(app)');
  });
});
