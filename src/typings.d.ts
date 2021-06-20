import type { Stream } from 'stream';
import type { WriteStream } from 'fs';
import type { URL } from 'url';
import type Headers from './Headers';

export interface Options {
  /**
   * Request method
   * @default 'GET'
   */
  method?: string;
  /**
   * Request body
   * @default null
   */
  body?: string | null | Buffer | Stream;
  /**
   * Request headers
   */
  headers?: Record<string, string>;
  /**
   * Request query
   */
  query?: Record<string, string>;
  /**
   * Allow redirect
   * @default true
   */
  followRedirect?: boolean;
  /**
   * Maximum redirect count. 0 to not follow redirect
   * @default 20
   */
  maxRedirectCount?: number;
  /**
   * Request/Response timeout in ms. 0 to disable
   * @default 0
   */
  timeout?: number;
  /**
   * Maximum response body size in bytes. 0 to disable
   * @default 0
   */
  size?: number;
}

export interface Response {
  /** Convenience property representing if the request ended normally */
  ok: boolean;
  /** Return origin stream */
  stream: Stream;
  /**
   * Download file to destination
   * @param {WriteStream} dest  Download write stream
   * @param {ProgressCallback=} onProgress Download progress callback
   */
  download: (dest: WriteStream, onProgress?: ProgressCallback) => Promise<void>;
  /** Decode response as ArrayBuffer */
  arrayBuffer(): Promise<ArrayBuffer>;
  /** Decode response as Blob */
  blob(): Promise<Blob>;
  /** Decode response as text */
  text(): Promise<string>;
  /** Decode response as json */
  json<T>(): Promise<T>;
  /** Decode response as buffer */
  buffer(): Promise<Buffer>;
}

export interface DefaultOptions {
  method: string;
  body: string | null | Buffer | Stream;
  followRedirect: boolean;
  maxRedirectCount: number;
  timeout: number;
  size: number;
  redirectCount: number;
}

export interface RequestConstructorOptions extends Options {
  requestURL: string;
}

export interface RequestOptions
  extends Omit<RequestConstructorOptions, keyof DefaultOptions>,
    DefaultOptions {
  parsedURL: URL;
  headers: Headers;
}

export interface ProgressInfo {
  /** Total file bytes */
  total: number;
  /** Delta file bytes */
  delta: number;
  /** Transferred file bytes */
  transferred: number;
  /** Transferred percentage */
  percent: number;
  /** Bytes transferred per second */
  bytesPerSecond: number;
}

export type ProgressCallback = (progressInfo: ProgressInfo) => void;

export interface Blob {
  size: number;
  type: string;
  isClosed: boolean;
  content: Buffer;
  slice(start?: number, end?: number, type?: string): Blob;
  close(): void;
  toString(): string;
}
