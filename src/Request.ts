import http from 'http';
import https from 'https';
import zlib from 'zlib';
import { URL } from 'url';
import type { Readable } from 'stream';
import type { HTTPAlias, Dict } from './typing';

// 支持的压缩算法
const supportedCompressions = ['gzip', 'deflate'];
// http https适配器
const adapterForHttp = (protocol: string) => {
  if (protocol === 'http:') {
    return http;
  }
  if (protocol === 'https:') {
    return https;
  }
  throw new Error(`Wrong url protocol: ${protocol}`);
};

class Request {
  url: URL;
  method: HTTPAlias;
  body: string;
  reqHeaders: Dict<string>;
  compressionEnabled: boolean;
  redirectEnabled: boolean;
  timeoutTime: number;

  constructor(url: string, method: HTTPAlias) {
    this.url = new URL(url);
    this.method = method;
    this.compressionEnabled = false;
    this.redirectEnabled = false;
    this.timeoutTime = 0;
    this.reqHeaders = {};
    this.body = '';
  }

  redirect = () => {
    this.redirectEnabled = true;
  };

  timeout = (timeout: number) => {
    this.timeoutTime = timeout;
  };

  compress = () => {
    this.compressionEnabled = true;
    if (!this.reqHeaders.hasOwnProperty('accept-encoding')) {
      this.reqHeaders['accept-encoding'] = supportedCompressions.join(', ');
    }
  };

  setHeader = (headerData: Dict<unknown>) => {
    Object.entries(headerData).forEach(([headerKey, headerValue]) => {
      this.reqHeaders[headerKey.toLowerCase()] = String(headerValue);
    });
  };

  setQuery = (queryData: Dict<unknown>) => {
    Object.entries(queryData).forEach(([queryKey, queryValue]) => {
      this.url.searchParams.append(queryKey, String(queryValue));
    });
  };

  setBody = (bodyData: Dict<unknown>) => {
    this.body = JSON.stringify(bodyData);
  };

  send = (): Promise<{ stream: Readable; response: http.IncomingMessage }> =>
    new Promise((resolve, reject) => {
      // 如果含有body 则设置内容类型和内容长度 暂设类型为json
      if (this.body) {
        if (!this.reqHeaders.hasOwnProperty('content-type')) {
          this.reqHeaders['content-type'] = 'application/json';
        }
        if (!this.reqHeaders.hasOwnProperty('content-length')) {
          this.reqHeaders['content-length'] = String(Buffer.byteLength(this.body));
        }
      }

      // http.RequestOptions
      const options = {
        protocol: this.url.protocol,
        host: this.url.hostname,
        port: this.url.port,
        path: `${this.url.pathname}${this.url.search === null ? '' : this.url.search}`,
        method: this.method.toUpperCase(),
        headers: this.reqHeaders,
      };

      // http.ClientRequest
      const req: http.ClientRequest = adapterForHttp(options.protocol).request(
        options,
        (res: http.IncomingMessage) => {
          // 重定向 并且重定向启用
          if (res.headers.location && this.redirectEnabled) {
            // 进行拼接重新发送请求
            this.url = new URL(res.headers.location, this.url.toString());
            this.send().then(resolve).catch(reject);
          } else {
            let stream = res as Readable;
            // 如果启用压缩算法 则通过zlib解压缩
            if (this.compressionEnabled) {
              const encodingType = res.headers['content-encoding'];
              if (encodingType === 'gzip') {
                stream = res.pipe(zlib.createGunzip());
              } else if (encodingType === 'deflate') {
                stream = res.pipe(zlib.createInflate());
              }
            }
            resolve({ stream, response: res });
          }
        },
      );

      // 如果含有body 则写入
      if (this.body) {
        req.write(this.body);
      }

      // 如果设置超时
      if (this.timeoutTime) {
        req.setTimeout(this.timeoutTime, () => {
          req.destroy();
          reject(new Error('Timeout'));
        });
      }

      req.on('error', reject);

      req.end();
    });
}

export default Request;
