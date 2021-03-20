import Request from './Request';
import type { Readable } from 'stream';
import type { Options } from './typing';

// 默认的配置
const defaultOptions = {
  timeout: 15000,
  followRedirects: true,
  compress: true,
};

const streamRequest = (options: Options): Promise<Readable> =>
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
        const { statusCode } = response;
        if (statusCode && statusCode >= 200 && statusCode < 300) {
          resolve(stream);
        } else {
          reject(
            new Error(`Server responded with ${response.statusCode}: ${response.statusMessage}`),
          );
        }
      })
      .catch(reject);
  });

export default streamRequest;
