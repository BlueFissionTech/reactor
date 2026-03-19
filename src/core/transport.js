import { normalizeResponse } from "./response.js";

export function createTransport(options = {}) {
  const {
    baseUrl = "",
    fetchImpl = globalThis.fetch?.bind(globalThis),
    csrfToken,
    defaultHeaders = {},
    onRequest,
    onResponse
  } = options;

  if (typeof fetchImpl !== "function") {
    throw new Error("createTransport requires a fetch implementation.");
  }

  async function request(path = "", requestOptions = {}) {
    const url = joinUrl(baseUrl, path);
    const method = (requestOptions.method || "GET").toUpperCase();
    const headers = new Headers(defaultHeaders);
    const body = prepareBody(requestOptions.body, headers);

    if (csrfToken) {
      headers.set("X-CSRF-TOKEN", resolveValue(csrfToken));
    }

    if (requestOptions.headers) {
      for (const [key, value] of Object.entries(requestOptions.headers)) {
        headers.set(key, value);
      }
    }

    const finalRequest = {
      ...requestOptions,
      method,
      headers,
      body
    };

    if (typeof onRequest === "function") {
      onRequest({ url, request: finalRequest });
    }

    const httpResponse = await fetchImpl(url, finalRequest);
    const payload = await parseBody(httpResponse);
    const normalized = normalizeResponse(payload, {
      statusCode: httpResponse.status,
      ok: httpResponse.ok
    });

    if (typeof onResponse === "function") {
      onResponse({ url, request: finalRequest, response: normalized, httpResponse });
    }

    return normalized;
  }

  return {
    request,
    get(path, options = {}) {
      return request(path, { ...options, method: "GET" });
    },
    post(path, body, options = {}) {
      return request(path, { ...options, method: "POST", body });
    },
    put(path, body, options = {}) {
      return request(path, { ...options, method: "PUT", body });
    },
    patch(path, body, options = {}) {
      return request(path, { ...options, method: "PATCH", body });
    },
    delete(path, body, options = {}) {
      return request(path, { ...options, method: "DELETE", body });
    }
  };
}

export function createResource(transport, endpoint) {
  if (!transport || typeof transport.request !== "function") {
    throw new Error("createResource requires a transport.");
  }

  return {
    endpoint,
    list(params) {
      return transport.get(endpointWithQuery(endpoint, params));
    },
    read(id, options = {}) {
      return transport.get(joinUrl(endpoint, String(id)), options);
    },
    create(data, options = {}) {
      return transport.post(endpoint, serializeModel(data), options);
    },
    update(id, data, options = {}) {
      const serialized = serializeModel(data);
      if (serialized instanceof FormData) {
        const payload = cloneFormDataWithMethod(serialized, "put");
        return transport.post(joinUrl(endpoint, String(id)), payload, options);
      }

      return transport.put(joinUrl(endpoint, String(id)), serialized, options);
    },
    save(data, options = {}) {
      const serialized = serializeModel(data);
      const id = resolveResourceId(serialized, endpoint);
      return id == null
        ? transport.post(endpoint, serialized, options)
        : this.update(id, serialized, options);
    },
    remove(id, options = {}) {
      return transport.delete(joinUrl(endpoint, String(id)), null, options);
    },
    call(action, { method = "POST", data, query, ...options } = {}) {
      const path = endpointWithQuery(joinUrl(endpoint, action), query);
      return transport.request(path, {
        ...options,
        method,
        body: serializeModel(data)
      });
    }
  };
}

export function createResourceFromDefinition(transport, definition, fallbackEndpoint = "resource") {
  if (typeof definition === "string") {
    return createResource(transport, definition);
  }

  if (!definition || typeof definition !== "object") {
    throw new Error("createResourceFromDefinition requires a string endpoint or definition object.");
  }

  const endpoint = definition.endpoint || definition.path || fallbackEndpoint;
  const resource = createResource(transport, endpoint);
  resource.definition = definition;

  attachActions(resource, transport, definition.actions || {});

  return resource;
}

export function createResourceRegistry(transport, resources = {}) {
  const registry = {};

  for (const [key, definition] of Object.entries(resources)) {
    registry[key] = createResourceFromDefinition(transport, definition, key);
  }

  return registry;
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

async function parseBody(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function serializeModel(value) {
  if (value == null || value instanceof FormData) {
    return value;
  }

  if (typeof value !== "object") {
    return value;
  }

  const output = {};

  for (const [key, candidate] of Object.entries(value)) {
    if (typeof candidate === "function") {
      continue;
    }

    output[key] = candidate && typeof candidate === "object" && "value" in candidate
      ? candidate.value
      : candidate;
  }

  return output;
}

function resolveResourceId(value, endpoint) {
  if (value == null) {
    return null;
  }

  if (value instanceof FormData) {
    return value.get("id") ?? value.get(`${singularKey(endpoint)}_id`);
  }

  if (typeof value !== "object") {
    return null;
  }

  return value.id ?? value[`${singularKey(endpoint)}_id`] ?? null;
}

function cloneFormDataWithMethod(formData, method) {
  const payload = new FormData();

  formData.forEach((value, key) => {
    payload.append(key, value);
  });

  if (!payload.has("_method")) {
    payload.append("_method", method);
  }

  return payload;
}

function attachActions(resource, transport, actions = {}) {
  for (const [name, definition] of Object.entries(actions)) {
    resource[name] = async (input, options = {}) => {
      if (typeof definition === "function") {
        return definition({
          input,
          options,
          resource,
          transport
        });
      }

      const action = normalizeActionDefinition(definition);
      const method = action.method.toUpperCase();
      const path = resolveActionPath(resource.endpoint, action.path, action.absolute);
      const query = action.query ?? ((method === "GET" || method === "HEAD") ? input : undefined);
      const data = action.data ?? ((method === "GET" || method === "HEAD") ? undefined : input);

      return transport.request(endpointWithQuery(path, query), {
        ...options,
        method,
        body: serializeModel(data)
      });
    };
  }
}

function endpointWithQuery(endpoint, params) {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }

  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value == null) {
      continue;
    }

    search.set(key, String(value));
  }

  return `${endpoint}?${search.toString()}`;
}

function normalizeActionDefinition(definition) {
  if (typeof definition === "string") {
    return {
      path: definition,
      method: "POST"
    };
  }

  return {
    path: "",
    method: "POST",
    absolute: false,
    ...definition
  };
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

function resolveActionPath(endpoint, actionPath, absolute = false) {
  if (!actionPath) {
    return endpoint;
  }

  if (absolute || String(actionPath).startsWith("/")) {
    return actionPath;
  }

  return joinUrl(endpoint, actionPath);
}

function resolveValue(value) {
  return typeof value === "function" ? value() : value;
}

function singularKey(endpoint) {
  const segments = endpoint.split("/");
  const last = segments[segments.length - 1] || "record";
  return last.endsWith("s") ? last.slice(0, -1) : last;
}
