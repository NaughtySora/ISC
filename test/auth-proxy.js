'use strict';

const { logger: log, http: { CODES },
  async, stream } = require('naughty-util');
const { request, createServer } = require('node:http');
const { PassThrough } = require('node:stream');

const TYPE_TEXT = { 'content-type': 'text/plain' };
const TYPE_JSON = { 'content-type': 'application/json' };

const fromCode = code => ({
  code,
  message: CODES[code],
});

module.exports = ({ logger = log, port, signature } = {}) => {
  let server = null;
  let stopping = false;
  return {
    async start(params) {
      if (server !== null) return;
      server = createServer(async (req, res) => {
        if (stopping) {
          res.writeHead(CODES.serviceUnavailable, TYPE_TEXT);
          res.end(CODES.serviceUnavailable);
          return;
        }
        const tee0 = PassThrough();
        const tee1 = PassThrough();
        req.pipe(tee0);
        req.pipe(tee1);
        const headers = req.headers;
        const path = req.url;
        const method = req.method;
        try {
          const json = await stream.utf8(tee0);
          const payload = [path, method, headers.ts];
          if (json) payload.push(json);
          signature.verify(payload, headers.signature);
        } catch (e) {
          logger.error(e);
          res.writeHead(CODES.forbidden, TYPE_JSON)
          res.end(JSON.stringify(fromCode(CODES.forbidden)));
          return;
        }
        const host = params.host;
        const port = params.port.toString();
        const options = {
          host,
          port,
          path,
          method,
          headers: { ...headers, host: `${host}:${port}`, },
        };
        const proxyReq = request(options, proxyRes => {
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res);
        });
        proxyReq.on('error', err => {
          logger.error(err);
          res.writeHead(CODES.badGateway, TYPE_TEXT);
          res.end('Bad Gateway: Unable to connect to upstream server.');
        });
        tee1.pipe(proxyReq);
      });
      server.listen(port, "0.0.0.0");
      logger.info(`http proxy started on port: ${port}`);
    },
    async stop(ms = 5000) {
      if (server === null || stopping) return;
      stopping = true;
      const close = async.promisify(server.close.bind(server));
      try {
        server.closeIdleConnections();
        await Promise.race([close(), async.reject(ms)]);
      } catch (err) {
        logger.error(err);
        server.closeAllConnections();
      } finally {
        server = null;
        stopping = false;
      }
      logger.info('http proxy server stopped');
    },
  };
}