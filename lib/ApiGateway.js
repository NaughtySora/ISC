'use strict';

class NetworkError extends Error {
  constructor(message, options) {
    super(message, { cause: options?.cause });
    Error.captureStackTrace(this, NetworkError);
    this.method = options?.method;
    this.url = options?.url;
    this.code = options?.code;
    this.status = options?.status;
    this.details = options?.details;
  }

  toJSON() {
    return {
      method: this.method,
      url: this.url,
      code: this.code,
      status: this.status,
      details: this.details,
    };
  }

  static throw(message, options) {
    throw new NetworkError(message, options);
  }
}

class ApiGateway {
  #options = null;

  constructor(options = {}) {
    this.#options = options;
    this.#options.name ??= '';
  }

  #signal() {
    const ms = this.#options.timeout;
    if (typeof ms !== 'number' || ms <= 0) return null;
    return AbortSignal.timeout(ms);
  }

  async #parse(parser, response) {
    if (response.body === null) return null;
    const fn = parser ?? this.#options.parser;
    if (!fn) return await response.json();
    return await fn(response);
  }

  async request(options) {
    const { headers, path, signal,
      parseBody = true, parser, ...rest } = options;
    const url = `${this.#options.baseurl}${path}`;
    const res = await fetch(url, {
      ...rest,
      headers: Object.assign({}, this.#options.headers, headers),
      signal: signal ?? this.#signal(),
    });
    if (res.ok) {
      if (parseBody) return await this.#parse(parser, res);
      return null;
    }
    throw new NetworkError(
      `ApiGateway ${this.#options.name} request failed`,
      {
        method: options.method,
        code: res.status,
        status: res.statusText,
        url,
        details: await this.#parse(parser, res),
      },
    )
  }

  async #request(path, method, options) {
    return await this.request(
      Object.assign({ path, method }, options),
    );
  }

  async get(path, options) {
    return await this.#request(path, 'GET', options);
  }

  async post(path, options) {
    return await this.#request(path, 'POST', options);
  }

  async put(path, options) {
    return await this.#request(path, 'PUT', options);
  }

  async patch(path, options) {
    return await this.#request(path, 'PATCH', options);
  }

  async delete(path, options) {
    return await this.#request(path, 'DELETE', options);
  }

  async head(path, options) {
    return await this.#request(path, 'HEAD', options);
  }
}

module.exports = {
  ApiGateway,
  NetworkError,
};
