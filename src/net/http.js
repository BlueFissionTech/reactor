import { normalizeResponse } from "../core/response.js";

export class HttpRequest {
  constructor({
    method = "GET",
    url = "",
    headers = {},
    body,
    query = {},
    protocolVersion = "1.1"
  } = {}) {
    this.method = method.toUpperCase();
    this.url = url;
    this.headers = { ...headers };
    this.body = body;
    this.query = { ...query };
    this.protocolVersion = protocolVersion;
  }

  withMethod(method) {
    return new HttpRequest({ ...this, method });
  }

  withHeader(name, value) {
    return new HttpRequest({
      ...this,
      headers: {
        ...this.headers,
        [name]: value
      }
    });
  }

  withBody(body) {
    return new HttpRequest({ ...this, body });
  }

  withQuery(query) {
    return new HttpRequest({
      ...this,
      query: {
        ...this.query,
        ...query
      }
    });
  }

  toUrl(baseUrl = "") {
    const target = joinUrl(baseUrl, this.url);
    const search = new URLSearchParams();

    Object.entries(this.query || {}).forEach(([key, value]) => {
      if (value != null) {
        search.set(key, String(value));
      }
    });

    const suffix = search.toString();
    return suffix ? `${target}?${suffix}` : target;
  }
}

export class HttpResponse {
  constructor({
    statusCode = 200,
    headers = {},
    body = null,
    protocolVersion = "1.1",
    reasonPhrase = "",
    request = null
  } = {}) {
    this.statusCode = statusCode;
    this.headers = headers;
    this.body = body;
    this.protocolVersion = protocolVersion;
    this.reasonPhrase = reasonPhrase;
    this.request = request;
  }

  get ok() {
    return this.statusCode >= 200 && this.statusCode < 400;
  }

  header(name) {
    return this.headers[name] ?? this.headers[name.toLowerCase()] ?? null;
  }

  json() {
    if (typeof this.body === "string") {
      return JSON.parse(this.body);
    }

    return this.body;
  }

  normalized() {
    return normalizeResponse(this.body, {
      statusCode: this.statusCode,
      ok: this.ok
    });
  }
}

export function createHttpClient(options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch?.bind(globalThis);
  const baseUrl = options.baseUrl || "";
  const defaultHeaders = options.defaultHeaders || {};

  if (typeof fetchImpl !== "function") {
    throw new Error("createHttpClient requires a fetch implementation.");
  }

  async function send(requestLike) {
    const request = requestLike instanceof HttpRequest ? requestLike : new HttpRequest(requestLike);
    const headers = new Headers({
      ...defaultHeaders,
      ...request.headers
    });
    const body = prepareBody(request.body, headers);
    const response = await fetchImpl(request.toUrl(baseUrl), {
      method: request.method,
      headers,
      body
    });
    const payload = await parseBody(response);

    return new HttpResponse({
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body: payload,
      request
    });
  }

  return {
    send,
    get(url, options = {}) {
      return send(new HttpRequest({ ...options, method: "GET", url }));
    },
    post(url, body, options = {}) {
      return send(new HttpRequest({ ...options, method: "POST", url, body }));
    },
    put(url, body, options = {}) {
      return send(new HttpRequest({ ...options, method: "PUT", url, body }));
    },
    patch(url, body, options = {}) {
      return send(new HttpRequest({ ...options, method: "PATCH", url, body }));
    },
    delete(url, body, options = {}) {
      return send(new HttpRequest({ ...options, method: "DELETE", url, body }));
    }
  };
}

async function parseBody(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function prepareBody(body, headers) {
  if (body == null) {
    return undefined;
  }

  if (body instanceof FormData) {
    return body;
  }

  if (body instanceof URLSearchParams) {
    headers.set("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
    return body;
  }

  if (typeof body === "string") {
    headers.set("Content-Type", "application/json");
    return body;
  }

  headers.set("Content-Type", "application/json");
  return JSON.stringify(body);
}

function joinUrl(base, path) {
  const left = String(base || "").replace(/\/+$/, "");
  const right = String(path || "").replace(/^\/+/, "");

  if (!left) {
    return `/${right}`.replace(/\/+$/, "") || "/";
  }

  if (!right) {
    return left;
  }

  return `${left}/${right}`;
}
