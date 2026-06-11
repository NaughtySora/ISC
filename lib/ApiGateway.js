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

export class ApiGateway {
  #options = null;

  constructor(options = {}) {
    this.#options = options;
    this.#options.name ??= '';
  }

  #signal() {
    const ms = this.#options.timeout;
    if (typeof ms !== "number" || ms <= 0) return null;
    return AbortSignal.timeout(ms);
  }

  async #parse(parser, response) {
    if (response.body === null) return null;
    const fn = parser ?? this.#options.parser;
    try {
      if (!fn) return await response.json();
      return await fn(response);
    } catch (e) {
      return null;
    }
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
    if (!res.ok) {
      NetworkError.throw(
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
    if (parseBody) return await this.#parse(parser, res);
    return null;
  }

  async #request(path, method, options) {
    return await this.request(
      Object.assign({ path, method }, options),
    );
  }

  async get(path, options) {
    return await this.#request(
      path,
      "GET",
      Object.assign({ parseBody: true }, options),
    );
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

  async head(path, options) {
    return await this.#request(path, 'HEAD', options);
  }
}
