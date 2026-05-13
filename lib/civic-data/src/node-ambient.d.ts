declare module "node:fs" {
  export function readFileSync(path: string, encoding: string): string;
  export function writeFileSync(path: string, data: string, encoding?: string): void;
  export function mkdirSync(path: string, options?: { recursive?: boolean }): void;
}

declare module "node:path" {
  export function join(...parts: string[]): string;
  export function dirname(path: string): string;
}

declare const process: {
  cwd(): string;
  env: Record<string, string | undefined>;
};

declare const console: {
  log(...args: unknown[]): void;
  warn(...args: unknown[]): void;
};

declare const fetch: (input: string, init?: unknown) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

declare class AbortController {
  readonly signal: AbortSignal;
  abort(reason?: unknown): void;
}

declare interface AbortSignal {}

declare class URLSearchParams {
  constructor(init?: Record<string, string> | string[][] | string);
  append(name: string, value: string): void;
  toString(): string;
}

declare function setTimeout(handler: (...args: unknown[]) => void, timeout?: number): unknown;
declare function clearTimeout(timeoutId: unknown): void;
