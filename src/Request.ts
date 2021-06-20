import http from 'http';
import https from 'https';
import zlib from 'zlib';
import { URL } from 'url';
import { PassThrough } from 'stream';
import { extractContentType, isRedirect } from './utils';
import Headers from './Headers';
import ResponseImpl from './Response';
import { DEFAULT_OPTIONS, SUPPORTED_COMPRESSIONS } from './constant';
import { HEADER_MAP, METHOD_MAP } from './enum';
import type { RequestConstructorOptions, RequestOptions, Response } from './typings.d';

const adapterForHttp = (protocol: string) => {
  if (protocol === 'http:') {
    return http;
  }
  if (protocol === 'https:') {
    return https;
  }
  throw new TypeError('Only HTTP(S) protocols are supported');
};

const getRequestOptions = (constructorOptions: RequestConstructorOptions): RequestOptions => {
  const options = { ...DEFAULT_OPTIONS, ...constructorOptions };

  const { method, body, requestURL, query, headers: headerOptions } = options;

  if (body !== null && (method === METHOD_MAP.GET || method === METHOD_MAP.HEAD)) {
    throw new TypeError('Request with GET/HEAD method cannot have body');
  }

  const parsedURL = new URL(requestURL);
  if (!parsedURL.protocol || !parsedURL.hostname) {
    throw new TypeError('Only absolute URLs are supported');
  }
  if (!/^https?:$/.test(parsedURL.protocol)) {
    throw new TypeError('Only HTTP(S) protocols are supported');
  }
  if (query) {
    for (const [queryKey, queryValue] of Object.entries(query)) {
      parsedURL.searchParams.append(queryKey, queryValue);
    }
  }

  const headers = new Headers(headerOptions);
  // User cannot set content-length themself as per fetch spec
  headers.delete(HEADER_MAP.CONTENT_LENGTH);
  // Add compression header
  headers.set(HEADER_MAP.ACCEPT_ENCODING, SUPPORTED_COMPRESSIONS.join(', '));
  // Add accept header
  if (!headers.has(HEADER_MAP.ACCEPT)) {
    headers.set(HEADER_MAP.ACCEPT, '*/*');
  }
  // Add connection header
  if (!headers.has(HEADER_MAP.CONNECTION)) {
    headers.set(HEADER_MAP.CONNECTION, 'close');
  }
  // Add content type header
  if (body && !headers.has(HEADER_MAP.CONTENT_TYPE)) {
    const contentType = extractContentType(body);
    if (contentType) {
      headers.append(HEADER_MAP.CONTENT_TYPE, contentType);
    }
  }

  return {
    ...options,
    method: method.toUpperCase(),
    parsedURL,
    headers,
  };
};

class Request {
  private timeoutId: NodeJS.Timeout | null = null;
  private clientRequest: http.ClientRequest | null = null;
  private options: RequestOptions;

  constructor(constructorOptions: RequestConstructorOptions) {
    this.options = getRequestOptions(constructorOptions);
  }

  private clearRequestTimeout = () => {
    if (this.timeoutId === null) return;
    clearTimeout(this.timeoutId);
    this.timeoutId = null;
  };

  private createClientRequest = async () => {
    const {
      parsedURL: { protocol, host, hostname, port, pathname, search },
      headers,
      method,
    } = this.options;
    const clientRequest = adapterForHttp(protocol).request({
      protocol,
      host,
      hostname,
      port,
      path: `${pathname}${search || ''}`,
      headers: headers.raw(),
      method,
    });
    this.clientRequest = clientRequest;
  };

  private cancelClientRequest = () => {
    if (!this.clientRequest) return;
    // In node.js, `request.abort()` is deprecated since v14.1.0
    // Use `request.destroy()` instead.
    this.clientRequest.destroy();
  };

  public send = async (): Promise<Response> => {
    await this.createClientRequest();
    return await new Promise((resolve, reject) => {
      if (this.clientRequest) {
        const {
          method,
          body: requestBody,
          followRedirect,
          redirectCount,
          maxRedirectCount,
          requestURL,
          parsedURL,
          size,
          timeout,
        } = this.options;

        this.clientRequest.on('error', (error) => {
          this.clearRequestTimeout();
          reject(error);
        });

        this.clientRequest.on('abort', () => {
          this.clearRequestTimeout();
          reject(new Error('request was aborted by the server'));
        });

        this.clientRequest.on('response', (res) => {
          this.clearRequestTimeout();
          const headers = new Headers(res.headers);
          const { statusCode = 200 } = res;

          if (isRedirect(statusCode) && followRedirect) {
            if (maxRedirectCount && redirectCount >= maxRedirectCount) {
              reject(new Error(`maximum redirect reached at: ${requestURL}`));
            }

            if (!headers.get(HEADER_MAP.LOCATION)) {
              reject(new Error(`redirect location header missing at: ${requestURL}`));
            }

            if (
              statusCode === 303 ||
              ((statusCode === 301 || statusCode === 302) && method === METHOD_MAP.POST)
            ) {
              this.options.method = METHOD_MAP.GET;
              this.options.body = null;
              this.options.headers.delete(HEADER_MAP.CONTENT_LENGTH);
            }

            this.options.redirectCount += 1;
            this.options.parsedURL = new URL(
              String(headers.get(HEADER_MAP.LOCATION)),
              parsedURL.toString(),
            );
            resolve(this.createClientRequest().then(this.send));
          }

          let responseBody = new PassThrough();
          res.on('error', (error) => responseBody.emit('error', error));
          responseBody.on('error', this.cancelClientRequest);
          responseBody.on('cancel-request', this.cancelClientRequest);
          res.pipe(responseBody);

          const responseOptions = {
            requestURL,
            statusCode,
            headers,
            size,
            timeout,
          };

          const resolveResponse = (body: PassThrough) => {
            const response = new ResponseImpl(body, responseOptions);
            resolve(response);
          };

          const codings = headers.get(HEADER_MAP.CONTENT_ENCODING);
          if (
            method !== METHOD_MAP.HEAD &&
            codings !== null &&
            statusCode !== 204 &&
            statusCode !== 304
          ) {
            if (codings === 'gzip' || codings === 'x-gzip') {
              responseBody = responseBody.pipe(zlib.createGunzip());
            } else if (codings === 'deflate' || codings === 'x-deflate') {
              const raw = res.pipe(new PassThrough());
              raw.once('data', (chunk) => {
                // see http://stackoverflow.com/questions/37519828
                // eslint-disable-next-line no-bitwise
                if ((chunk[0] & 0x0f) === 0x08) {
                  responseBody = responseBody.pipe(zlib.createInflate());
                } else {
                  responseBody = responseBody.pipe(zlib.createInflateRaw());
                }
                resolveResponse(responseBody);
              });
              return;
            }
          }
          resolveResponse(responseBody);
        });

        if (requestBody) {
          this.clientRequest.write(requestBody);
        }

        this.clientRequest.end();
      }
    });
  };
}

export default Request;
