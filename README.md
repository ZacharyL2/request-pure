# request-pure

> Zero-dependency, lightweight http request client for nodejs

## Install

```bash
npm install request-pure --save
# or
yarn add request-pure
```

## Usage

```ts
import request from 'request-pure';

void (async () => {
  const url = 'https://github.com/';
  const defaultOptions = {
    method: 'GET',
    body: null,
    followRedirect: true,
    maxRedirectCount: 20,
    timeout: 0,
    size: 0,
  };
  const response = await request(url, defaultOptions);
  const text = await response.text();
})();
```

## API

### request(url[, options])

- url: Request URL

- options: Options

  ```ts
  interface Options {
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
  ```

### Response

```ts
interface Response {
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

/** Download progress information */
interface ProgressInfo {
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
```

## License

[MIT License](./LICENSE)

## request-pure vs. the Competition

| Package | Size |
| --- | --- |
| request | [![request package size](https://packagephobia.now.sh/badge?p=request)](https://packagephobia.now.sh/result?p=request) |
| superagent | [![superagent package size](https://packagephobia.now.sh/badge?p=superagent)](https://packagephobia.now.sh/result?p=superagent) |
| got | [![got package size](https://packagephobia.now.sh/badge?p=got)](https://packagephobia.now.sh/result?p=got) |
| axios | [![axios package size](https://packagephobia.now.sh/badge?p=axios)](https://packagephobia.now.sh/result?p=axios) |
| isomorphic-fetch | [![isomorphic-fetch package size](https://packagephobia.now.sh/badge?p=isomorphic-fetch)](https://packagephobia.now.sh/result?p=isomorphic-fetch) |
| r2 | [![r2 package size](https://packagephobia.now.sh/badge?p=r2)](https://packagephobia.now.sh/result?p=r2) |
| node-fetch | [![node-fetch package size](https://packagephobia.now.sh/badge?p=node-fetch)](https://packagephobia.now.sh/result?p=node-fetch) |
| phin | [![phin package size](https://packagephobia.now.sh/badge?p=phin)](https://packagephobia.now.sh/result?p=phin) |
| request-pure | [![request-pure package size](https://packagephobia.now.sh/badge?p=request-pure)](https://packagephobia.now.sh/result?p=request-pure) |
