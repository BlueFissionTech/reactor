import { createSignal, isSignal } from "../core/signals.js";

export function select(selector, root = document) {
  return root.querySelector(selector);
}

export function selectAll(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function bindText(selector, source, options = {}) {
  const signal = ensureSignal(source);
  const nodes = resolveNodes(selector, options.root);

  return signal.subscribe((value) => {
    const nextValue = value == null ? "" : String(value);
    for (const node of nodes) {
      node.textContent = nextValue;
    }
  });
}

export function bindValue(selector, source, options = {}) {
  const signal = ensureSignal(source);
  const nodes = resolveNodes(selector, options.root);

  for (const node of nodes) {
    const eventName = options.eventName || inferInputEvent(node);
    node.addEventListener(eventName, (event) => {
      const nextValue = readInputValue(event.currentTarget);
      if (typeof options.rejectOn === "function" && options.rejectOn(nextValue)) {
        return;
      }

      signal.value = typeof options.mutator === "function"
        ? options.mutator(nextValue)
        : nextValue;
    });
  }

  return signal.subscribe((value) => {
    for (const node of nodes) {
      writeInputValue(node, value);
    }
  });
}

export function interpolate(tag, source, options = {}) {
  const signal = ensureSignal(source);
  const token = `{${tag}}`;
  const root = options.root || document.body;
  const targets = selectAll("*", root)
    .filter((element) => element.childNodes.length === 1)
    .filter((element) => element.firstChild.nodeType === Node.TEXT_NODE)
    .filter((element) => element.textContent.includes(token));

  for (const element of targets) {
    const parts = element.textContent.split(token);
    element.textContent = "";

    parts.forEach((part, index) => {
      element.appendChild(document.createTextNode(part));

      if (index < parts.length - 1) {
        const span = document.createElement("span");
        span.dataset.reactorTag = tag;
        element.appendChild(span);
      }
    });
  }

  return bindText(`[data-reactor-tag='${tag}']`, signal, { root });
}

export function on(selector, eventName, handler, options = {}) {
  const nodes = resolveNodes(selector, options.root);

  for (const node of nodes) {
    node.addEventListener(eventName, handler);
  }

  return () => {
    for (const node of nodes) {
      node.removeEventListener(eventName, handler);
    }
  };
}

function resolveNodes(selectorOrNodes, root = document) {
  if (typeof selectorOrNodes === "string") {
    return selectAll(selectorOrNodes, root);
  }

  if (selectorOrNodes instanceof Element) {
    return [selectorOrNodes];
  }

  if (Array.isArray(selectorOrNodes)) {
    return selectorOrNodes;
  }

  return Array.from(selectorOrNodes || []);
}

function ensureSignal(source) {
  return isSignal(source) ? source : createSignal(source);
}

function inferInputEvent(node) {
  return node.tagName === "SELECT" || node.type === "checkbox" || node.type === "radio"
    ? "change"
    : "input";
}

function readInputValue(node) {
  if (node.type === "checkbox") {
    return node.checked ? node.value : "0";
  }

  if (node.type === "radio") {
    return node.checked ? node.value : undefined;
  }

  return node.value;
}

function writeInputValue(node, value) {
  if (node.tagName === "SELECT") {
    for (const option of node.options) {
      option.selected = option.value === value;
    }
    return;
  }

  if (node.type === "checkbox") {
    node.checked = value === node.value || value === true;
    return;
  }

  if (node.type === "radio") {
    node.checked = node.value === value;
    return;
  }

  node.value = value ?? "";
}
