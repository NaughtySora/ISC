'use strict';

const {
  stream,
  http: { CODES, parseURL },
  async,
} = require('naughty-util');
const { createServer } = require('node:http');

const send = (res, data) => void res.end(JSON.stringify(data));
const TYPE_JSON = { 'content-type': 'application/json', };

const fromCode = code => ({
  code,
  message: CODES[code],
});

module.exports = () => {
  let server = null;
  let stopping = false;
  return {
    async start({ api, logger = console, port, debug = false }) {
      if (server !== null) return;
      server = createServer(async (req, res) => {
        if (stopping) {
          res.writeHead(CODES.serviceUnavailable, TYPE_JSON);
          res.end(fromCode(CODES.serviceUnavailable));
          return;
        }
        try {
          const url = parseURL(req.url);
          const method = req.method.toLowerCase();
          const key = `${url.pathname}:${method}`;
          if (debug) logger.log(key, url.searchParams.toString());
          if (!Reflect.has(api, key)) {
            res.writeHead(CODES.notFound, TYPE_JSON);
            send(res, fromCode(CODES.notFound));
            return;
          }
          const body = req.body ? await stream.utf8(req.body) : undefined;
          const processed = await api[key]({ body, search: url.searchParams });
          if (processed) {
            res.writeHead(CODES.ok, TYPE_JSON);
            send(res, processed);
          } else {
            res.writeHead(CODES.noContent);
            res.end();
          }
        } catch (e) {
          if (!res.writable || res.writableEnded) return;
          if (!res.headersSent) res.writeHead(CODES.badRequest, TYPE_JSON);
          send(res, fromCode(CODES.badRequest));
        }
      });
      server.listen(port, "0.0.0.0");
      logger.log(`http server started on port: ${port}`);
    },
    async stop(ms = 5000) {
      if (server === null || stopping) return;
      stopping = true;
      const close = async.promisify(server.close.bind(server));
      try {
        server.closeIdleConnections();
        await Promise.race([server.close(), async.reject(ms)]);
      } catch (err) {
        logger.error(err);
        server.closeAllConnections();
      } finally {
        server = null;
        stopping = false;
      }
    },
  }
};