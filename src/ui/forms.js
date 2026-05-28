import { normalizeResponse } from "../core/response.js";
import { createSignal } from "../core/signals.js";

export const FormStatus = {
  IDLE: "idle",
  SUBMITTING: "submitting",
  SUCCESS: "success",
  ERROR: "error",
  INVALID: "invalid"
};

export function createFormController(options = {}) {
  const status = createSignal(FormStatus.IDLE);
  const submitting = createSignal(false);
  const errors = createSignal([]);
  const fieldErrors = createSignal({});
  const response = createSignal(null);

  const controller = {
    status,
    submitting,
    errors,
    fieldErrors,
    response,
    serialize(input) {
      return serializeFormInput(input);
    },
    async submit(input = {}, context = {}) {
      const payload = serializeFormInput(input);
      const validation = await runValidation(options.validate, payload, context);
      const validationErrors = normalizeFormErrors(validation);

      if (hasFormErrors(validationErrors)) {
        const invalidResponse = normalizeResponse({
          ok: false,
          status: "Validation failed",
          data: payload,
          errors: validationErrors.messages,
          meta: {
            fieldErrors: validationErrors.fields
          }
        }, { ok: false });

        setFormResult(controller, invalidResponse, validationErrors, FormStatus.INVALID, options);
        await callHook(options.onInvalid, { payload, response: invalidResponse, errors: validationErrors, context, controller });
        await callHook(options.onSettled, { payload, response: invalidResponse, context, controller });
        return invalidResponse;
      }

      setStatus(controller, FormStatus.SUBMITTING, options);
      submitting.value = true;
      errors.value = [];
      fieldErrors.value = {};

      let finalPayload = payload;

      try {
        const prepared = await callHook(options.onBeforeSubmit, { payload, context, controller });
        if (prepared !== undefined) {
          finalPayload = prepared;
        }

        const result = await submitPayload(options, finalPayload, context);
        const normalized = normalizeResponse(result);
        const formErrors = normalized.ok
          ? normalizeFormErrors(null)
          : normalizeFormErrors(result?.errors ?? normalized.errors);
        const nextStatus = normalized.ok ? FormStatus.SUCCESS : FormStatus.ERROR;

        setFormResult(controller, normalized, formErrors, nextStatus, options);
        await callHook(normalized.ok ? options.onSuccess : options.onError, {
          payload: finalPayload,
          response: normalized,
          errors: formErrors,
          context,
          controller
        });
        await callHook(options.onSettled, { payload: finalPayload, response: normalized, context, controller });
        return normalized;
      } catch (error) {
        const failed = normalizeResponse({
          ok: false,
          status: error?.message || "Form submission failed",
          errors: [error?.message || "Form submission failed"],
          raw: error
        }, { ok: false });
        const formErrors = normalizeFormErrors(failed.errors);

        setFormResult(controller, failed, formErrors, FormStatus.ERROR, options);
        await callHook(options.onError, { payload: finalPayload, response: failed, errors: formErrors, context, controller });
        await callHook(options.onSettled, { payload: finalPayload, response: failed, context, controller });
        return failed;
      } finally {
        submitting.value = false;
      }
    },
    reset() {
      response.value = null;
      errors.value = [];
      fieldErrors.value = {};
      submitting.value = false;
      setStatus(controller, FormStatus.IDLE, options);
    }
  };

  return controller;
}

export function serializeFormInput(input = {}) {
  if (input == null) {
    return {};
  }

  if (isHtmlForm(input)) {
    return serializeFormInput(new FormData(input));
  }

  if (input instanceof FormData || input instanceof URLSearchParams) {
    const output = {};
    input.forEach((value, key) => {
      assignFormValue(output, key, value);
    });
    return output;
  }

  if (typeof input !== "object") {
    return input;
  }

  const output = {};

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "function") {
      continue;
    }

    output[key] = value && typeof value === "object" && "value" in value
      ? value.value
      : value;
  }

  return output;
}

export function normalizeFormErrors(value) {
  if (value == null || value === false) {
    return {
      messages: [],
      fields: {}
    };
  }

  if (typeof value === "string") {
    return {
      messages: value ? [value] : [],
      fields: {}
    };
  }

  if (Array.isArray(value)) {
    return {
      messages: value.map(String),
      fields: {}
    };
  }

  if (typeof value === "object") {
    const fields = {};
    const messages = [];

    for (const [field, errors] of Object.entries(value)) {
      const list = normalizeErrorList(errors);
      if (list.length > 0) {
        fields[field] = list;
        messages.push(...list);
      }
    }

    return { messages, fields };
  }

  return {
    messages: [String(value)],
    fields: {}
  };
}

function setFormResult(controller, nextResponse, nextErrors, nextStatus, options = {}) {
  controller.response.value = nextResponse;
  controller.errors.value = nextErrors.messages;
  controller.fieldErrors.value = nextErrors.fields;
  setStatus(controller, nextStatus, options);
}

function setStatus(controller, nextStatus, options = {}) {
  controller.status.value = nextStatus;
  callHook(options.onStatus, { status: nextStatus, controller });
}

async function submitPayload(options, payload, context) {
  if (typeof options.submit === "function") {
    return options.submit(payload, context);
  }

  if (options.resource) {
    const action = options.action || "save";
    if (typeof options.resource[action] !== "function") {
      throw new Error(`Form resource action is not available: ${action}`);
    }

    return options.resource[action](payload, context.options || {});
  }

  if (options.transport && options.endpoint) {
    return options.transport.request(options.endpoint, {
      ...(context.options || {}),
      method: options.method || "POST",
      body: payload
    });
  }

  throw new Error("createFormController requires submit, resource, or transport with endpoint.");
}

async function runValidation(validate, payload, context) {
  if (typeof validate !== "function") {
    return null;
  }

  return validate(payload, context);
}

function hasFormErrors(formErrors) {
  return formErrors.messages.length > 0 || Object.keys(formErrors.fields).length > 0;
}

function normalizeErrorList(value) {
  if (value == null || value === false) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map(String);
  }

  return [String(value)];
}

function assignFormValue(output, key, value) {
  if (!(key in output)) {
    output[key] = value;
    return;
  }

  output[key] = Array.isArray(output[key])
    ? [...output[key], value]
    : [output[key], value];
}

function isHtmlForm(input) {
  return typeof HTMLFormElement !== "undefined" && input instanceof HTMLFormElement;
}

async function callHook(hook, event) {
  if (typeof hook !== "function") {
    return undefined;
  }

  return hook(event);
}
