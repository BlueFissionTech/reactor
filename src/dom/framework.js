import { createSignal, computed, isSignal } from "../core/signals.js";

export class El {
  constructor(element) {
    if (!element) {
      throw new Error("El requires a DOM element.");
    }

    this._el = element;
  }

  append(value) {
    if (value instanceof El) {
      this._el.appendChild(value._el);
    } else if (typeof value === "string") {
      this._el.appendChild(document.createTextNode(value));
    } else if (value instanceof Node) {
      this._el.appendChild(value);
    }

    return this;
  }

  on(eventName, handler, options) {
    this._el.addEventListener(eventName, handler, options);
    return this;
  }

  bind(name, source, options = {}) {
    const signal = resolveSignal(source, options);
    const tagName = this._el.tagName.toLowerCase();
    const inputType = this._el.type;

    if (name === "value" && isFormElement(tagName)) {
      const eventName = inputType === "checkbox" || inputType === "radio" || tagName === "select"
        ? "change"
        : "input";

      this.on(eventName, (event) => {
        const rawValue = readValue(event.currentTarget);
        const nextValue = typeof options.mutator === "function"
          ? options.mutator(rawValue)
          : rawValue;

        if (typeof options.rejectOn === "function" && options.rejectOn(nextValue)) {
          return;
        }

        if (nextValue !== undefined) {
          signal.value = nextValue;
        }
      });

      signal.subscribe((value) => {
        writeValue(this._el, value);
      });
    } else if (name === "textContent") {
      signal.subscribe((value) => {
        this._el.textContent = value ?? "";
      });
    } else {
      signal.subscribe((value) => {
        this._el.setAttribute(name, value ?? "");
      });
    }

    return this;
  }

  showIf(source, options = {}) {
    const signal = resolveSignal(source, options);
    signal.subscribe((value) => {
      this._el.style.display = value ? "" : "none";
    });
    return this;
  }

  addClassIf(className, source, options = {}) {
    const signal = resolveSignal(source, options);
    signal.subscribe((value) => {
      this._el.classList.toggle(className, Boolean(value));
    });
    return this;
  }

  removeIf(source, options = {}) {
    const signal = resolveSignal(source, options);
    signal.subscribe((value) => {
      if (value && this._el.parentNode) {
        this._el.parentNode.removeChild(this._el);
      }
    });
    return this;
  }
}

export function get(selector, root = document) {
  return new El(root.querySelector(selector));
}

export function set(selector, value, attribute = "textContent", options = {}) {
  Array.from((options.root || document).querySelectorAll(selector)).forEach((element) => {
    new El(element).bind(attribute, value, options);
  });
}

export function assign(tag, value, options = {}) {
  const signal = resolveSignal(value, options);
  const token = `{${tag}}`;
  const root = options.root || document.body;

  Array.from(root.querySelectorAll("*")).forEach((element) => {
    if (element.tagName.toLowerCase() === "script") {
      return;
    }

    if (element.childNodes.length === 1 && element.firstChild.nodeType === Node.TEXT_NODE) {
      const textContent = element.textContent;
      if (!textContent.includes(token)) {
        return;
      }

      const parts = textContent.split(token);
      element.textContent = "";

      parts.forEach((part, index) => {
        element.appendChild(document.createTextNode(part));

        if (index < parts.length - 1) {
          const span = document.createElement("span");
          span.className = `__${tag}`;
          element.appendChild(span);
        }
      });
    }
  });

  Array.from(root.getElementsByClassName(`__${tag}`)).forEach((element) => {
    new El(element).bind("textContent", signal);
  });
}

export function create(tagName) {
  return new El(document.createElement(tagName));
}

function resolveSignal(source, options) {
  if (isSignal(source)) {
    return source;
  }

  if (typeof source === "function") {
    if (Array.isArray(options.dependencies) && options.dependencies.length > 0) {
      return computed(source, options.dependencies);
    }

    return createSignal(source());
  }

  return createSignal(source);
}

function isFormElement(tagName) {
  return tagName === "input" || tagName === "textarea" || tagName === "select";
}

function readValue(element) {
  if (element.type === "checkbox") {
    return element.checked ? element.value : "0";
  }

  if (element.type === "radio") {
    return element.checked ? element.value : undefined;
  }

  return element.value;
}

function writeValue(element, value) {
  const tagName = element.tagName.toLowerCase();

  if (tagName === "select") {
    Array.from(element.options).forEach((option) => {
      option.selected = option.value === value;
    });
    return;
  }

  if (element.type === "checkbox") {
    element.checked = value === element.value || value === true;
    return;
  }

  if (element.type === "radio") {
    element.checked = element.value === value;
    return;
  }

  element.value = value ?? "";
}
