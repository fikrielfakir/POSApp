import pako from 'pako';
import { ChunkMeta, QRPayload, QRCorruptError } from './qrDecoder';

export class ChunkAssembler {
  private sessions = new Map<string, Map<number, string>>();
  private sessionTotals = new Map<string, number>();

  addChunk(chunk: ChunkMeta): 'waiting' | 'complete' {
    const { session, index, total, data } = chunk;

    if (!this.sessions.has(session)) {
      this.sessions.set(session, new Map());
      this.sessionTotals.set(session, total);
    }

    const chunks = this.sessions.get(session)!;
    chunks.set(index, data);

    return chunks.size === total ? 'complete' : 'waiting';
  }

  getProgress(session: string): { received: number; total: number; pct: number } {
    const chunks = this.sessions.get(session);
    const total = this.sessionTotals.get(session) ?? 0;
    const received = chunks?.size ?? 0;
    return { received, total, pct: total > 0 ? Math.round((received / total) * 100) : 0 };
  }

  assemble(session: string): QRPayload {
    const chunks = this.sessions.get(session);
    const total = this.sessionTotals.get(session) ?? 0;

    if (!chunks || chunks.size < total) throw new QRCorruptError('Not all chunks received');

    // Concatenate all base64 chunks in order
    const combined = Array.from({ length: total }, (_, i) => chunks.get(i) ?? '').join('');

    try {
      const binaryStr = atob(combined);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const decompressed = pako.inflate(bytes, { to: 'string' });
      return JSON.parse(decompressed) as QRPayload;
    } catch {
      throw new QRCorruptError('Failed to reassemble chunked payload');
    }
  }

  reset(session?: string): void {
    if (session) {
      this.sessions.delete(session);
      this.sessionTotals.delete(session);
    } else {
      this.sessions.clear();
      this.sessionTotals.clear();
    }
  }

  isSessionActive(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }
}

export const globalChunkAssembler = new ChunkAssembler();
