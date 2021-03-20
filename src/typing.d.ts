export type Dict<T> = Record<string, T | undefined>;

export type HTTPAlias = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface RequestOptions {
  headers?: Dict<unknown>;
  body?: Dict<unknown>;
  query?: Dict<unknown>;
  method?: HTTPAlias;
  timeout?: number;
  compress?: boolean;
  followRedirects?: boolean;
}

export interface Options extends RequestOptions {
  url: string;
}
