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
// format response to json
import { request } from 'request-pure';
// format response to stream
import { streamRequest } from 'request-pure';

const options: Options {
  /**
   * request URL
   */
  url: string;

  /**
   * request headers
   */
  headers?: Record<string, unknown>;

  /**
   * request body
   */
  body?: Record<string, unknown>;

  /**
   * request query
   */
  query?: Record<string, unknown>;

  /**
   * request methods
   * @default 'get'
   */
  method?: 'get' | 'post' | 'put' | 'patch' | 'delete';

  /**
   * request timeout
   * @default 15000
   */
  timeout?: number;

  /**
   * request compress
   * @default true
   */
  compress?: boolean;

  /**
   * enable redirect when response code is 301 or 302
   * @default true
   */
  followRedirects?: boolean;
} = {}

void (async () => {
  const response = await request(options);
})();
```

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

