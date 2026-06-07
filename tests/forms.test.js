import test from "node:test";
import assert from "node:assert/strict";

import {
  FormStatus,
  createFormController,
  normalizeFormErrors,
  serializeFormInput
} from "../src/ui/forms.js";
import { createSignal } from "../src/core/signals.js";

test("form serialization handles form data, repeated keys, signals, and plain values", () => {
  const formData = new FormData();
  formData.append("tag", "a");
  formData.append("tag", "b");
  formData.append("title", "Launch");

  assert.deepEqual(serializeFormInput(formData), {
    tag: ["a", "b"],
    title: "Launch"
  });
  assert.deepEqual(serializeFormInput({
    title: createSignal("Draft"),
    count: 3,
    ignored() {
      return "skip";
    }
  }), {
    title: "Draft",
    count: 3
  });
});

test("form controllers return validation errors without submitting", async () => {
  let submitted = false;
  const controller = createFormController({
    validate(payload) {
      return payload.email ? null : { email: ["Email is required"] };
    },
    submit() {
      submitted = true;
    }
  });

  const response = await controller.submit({ email: "" });

  assert.equal(submitted, false);
  assert.equal(controller.status.value, FormStatus.INVALID);
  assert.equal(controller.submitting.value, false);
  assert.deepEqual(controller.errors.value, ["Email is required"]);
  assert.deepEqual(controller.fieldErrors.value, { email: ["Email is required"] });
  assert.equal(response.ok, false);
  assert.equal(response.status, "Validation failed");
});

test("form controllers submit through transport and expose response state", async () => {
  const statuses = [];
  const transportCalls = [];
  const controller = createFormController({
    endpoint: "settings",
    method: "PATCH",
    transport: {
      async request(path, options) {
        transportCalls.push({ path, options });
        return {
          ok: true,
          statusCode: 200,
          data: { saved: true }
        };
      }
    },
    onStatus({ status }) {
      statuses.push(status);
    }
  });

  const response = await controller.submit({ theme: "dark" }, {
    options: {
      headers: {
        "X-Trace": "abc123"
      }
    }
  });

  assert.deepEqual(transportCalls, [{
    path: "settings",
    options: {
      headers: {
        "X-Trace": "abc123"
      },
      method: "PATCH",
      body: { theme: "dark" }
    }
  }]);
  assert.equal(response.ok, true);
  assert.equal(controller.status.value, FormStatus.SUCCESS);
  assert.equal(controller.response.value.data.saved, true);
  assert.deepEqual(controller.errors.value, []);
  assert.deepEqual(statuses, [FormStatus.SUBMITTING, FormStatus.SUCCESS]);
});

test("form controllers submit through resource actions and normalize field errors", async () => {
  const controller = createFormController({
    action: "create",
    resource: {
      async create(payload) {
        return {
          ok: false,
          errors: {
            name: "Name is required"
          }
        };
      }
    }
  });

  const response = await controller.submit({ name: "" });

  assert.equal(response.ok, false);
  assert.equal(controller.status.value, FormStatus.ERROR);
  assert.deepEqual(controller.fieldErrors.value, { name: ["Name is required"] });
  assert.deepEqual(controller.errors.value, ["Name is required"]);

  controller.reset();

  assert.equal(controller.status.value, FormStatus.IDLE);
  assert.equal(controller.response.value, null);
});

test("form error normalization keeps message and field views", () => {
  assert.deepEqual(normalizeFormErrors("Failed"), {
    messages: ["Failed"],
    fields: {}
  });
  assert.deepEqual(normalizeFormErrors({ name: ["Required"], email: "Invalid" }), {
    messages: ["Required", "Invalid"],
    fields: {
      name: ["Required"],
      email: ["Invalid"]
    }
  });
});
