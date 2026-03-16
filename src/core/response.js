const DEFAULT_RESPONSE = {
  ok: true,
  status: "",
  statusCode: 200,
  data: null,
  list: [],
  id: null,
  query: "",
  children: [],
  errors: [],
  meta: {},
  raw: null
};

export class BlueFissionResponse {
  constructor(payload = {}) {
    Object.assign(this, normalizeResponse(payload));
  }
}

export function normalizeResponse(payload, options = {}) {
  const statusCode = options.statusCode ?? payload?.statusCode ?? payload?.code ?? 200;
  const raw = payload;
  const parsed = coercePayload(payload);
  const response = {
    ...DEFAULT_RESPONSE,
    ...parsed,
    statusCode,
    raw
  };

  response.ok = resolveOk(response, options);
  response.errors = normalizeErrors(response.errors, response);
  response.meta = response.meta && typeof response.meta === "object" ? response.meta : {};
  response.list = Array.isArray(response.list) ? response.list : [];
  response.children = Array.isArray(response.children) ? response.children : [];

  return response;
}

function coercePayload(payload) {
  if (payload == null) {
    return {};
  }

  if (typeof payload === "string") {
    try {
      return JSON.parse(payload);
    } catch {
      return {
        data: payload,
        status: "Unparsed response"
      };
    }
  }

  if (typeof payload === "object") {
    return payload;
  }

  return {
    data: payload
  };
}

function resolveOk(response, options) {
  if (typeof options.ok === "boolean") {
    return options.ok;
  }

  if (typeof response.ok === "boolean") {
    return response.ok;
  }

  return response.statusCode >= 200 && response.statusCode < 400 && response.errors.length === 0;
}

function normalizeErrors(errors, response) {
  if (Array.isArray(errors)) {
    return errors;
  }

  if (errors && typeof errors === "object") {
    return Object.values(errors).flat();
  }

  if (typeof errors === "string" && errors.length > 0) {
    return [errors];
  }

  if (response.ok) {
    return [];
  }

  if (response.status) {
    return [response.status];
  }

  return ["Unknown error"];
}
