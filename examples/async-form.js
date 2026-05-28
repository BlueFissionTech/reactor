import {
  createFormController,
  createTransport
} from "../src/index.js";

const transport = createTransport({
  baseUrl: "/api",
  csrfToken: () => document.querySelector("meta[name='csrf-token']")?.content
});

const settingsForm = createFormController({
  endpoint: "settings",
  method: "PATCH",
  transport,
  validate(payload, context) {
    return Object.fromEntries(
      (context.requiredFields || [])
        .filter((field) => !payload[field])
        .map((field) => [field, `${field} is required.`])
    );
  },
  onSuccess({ response }) {
    console.log("Settings saved", response.data);
  },
  onError({ errors }) {
    console.warn("Settings save failed", errors.messages);
  }
});

document.querySelector("[data-settings-form]")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const requiredFields = Array.from(event.currentTarget.querySelectorAll("[data-required][name]"))
    .map((field) => field.name);

  await settingsForm.submit(new FormData(event.currentTarget), { requiredFields });
});

settingsForm.status.subscribe((status) => {
  document.querySelector("[data-settings-status]").textContent = status;
});
