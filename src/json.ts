import type http from 'http';
import Request from './Request';
import type { Options } from './typing';

class Response {
  body: Buffer;
  statusCode: number | undefined;

  constructor(response: http.IncomingMessage) {
    this.body = Buffer.alloc(0);
    this.statusCode = response.statusCode;
  }

  // 收集chunk
  addChunk = (chunk: Buffer): void => {
    this.body = Buffer.concat([this.body, chunk]);
  };
}

// 能接受的最长Buffer 50 MB
const maxBuffer = 50 * 1000000;
// 默认的配置
const defaultOptions = {
  timeout: 5000,
  followRedirects: true,
  compress: true,
};

const request = <T>(options: Options): Promise<T> =>
  new Promise((resolve, reject) => {
    const { url, method = 'get', compress, followRedirects, timeout, headers, query, body } = {
      ...defaultOptions,
      ...options,
    };

    const req = new Request(url, method);

    if (timeout) req.timeout(timeout);
    if (followRedirects) req.redirect();
    if (compress) req.compress();

    if (headers) req.setHeader(headers);
    if (query) req.setQuery(query);
    if (body) req.setBody(body);

    req
      .send()
      .then(({ stream, response }) => {
        // 自定义的response 用于收集流式数据 集体返回
        const res = new Response(response);

        // 错误监听
        stream.on('error', (err) => {
          reject(err);
        });

        stream.on('data', (chunk: Buffer) => {
          // 收集
          res.addChunk(chunk);
          // 如果body长度大于可承受的Buffer长度
          if (res.body.length > maxBuffer) {
            stream.destroy();
            reject(new Error('Exceed the acceptable buffer length'));
          }
        });

        stream.on('end', () => {
          const { statusCode } = res;
          if (statusCode && statusCode >= 200 && statusCode < 300) {
            resolve(JSON.parse(res.body.toString()));
          } else {
            reject(
              new Error(`Server responded with ${response.statusCode}: ${response.statusMessage}`),
            );
          }
        });
      })
      .catch(reject);
  });

export default request;
