export class Template {
  constructor(template, data = {}) {
    this.template = template;
    this.data = data;
    this.output = resolveTemplateHtml(template);
  }

  render(data = this.data) {
    let html = resolveTemplateHtml(this.template);

    for (const [key, rawValue] of Object.entries(data || {})) {
      const value = unwrapValue(rawValue);
      const pattern = new RegExp(`{{\\s?${escapeRegExp(key)}\\s?}}`, "ig");
      html = html.replace(pattern, value ?? "");
    }

    this.output = html;
    return html;
  }

  swap(target) {
    const element = typeof target === "string" ? document.querySelector(target) : target;
    if (!element) {
      return;
    }

    const replacement = createFragment(this.output);
    element.replaceWith(replacement);
  }
}

export function renderTemplate(template, data) {
  return new Template(template, data).render();
}

function resolveTemplateHtml(template) {
  if (typeof template === "string") {
    const selected = document.querySelector(template);
    if (selected) {
      return selected.innerHTML;
    }

    return template;
  }

  if (template instanceof Element) {
    return template.innerHTML;
  }

  return "";
}

function createFragment(html) {
  const range = document.createRange();
  return range.createContextualFragment(html.trim());
}

function unwrapValue(value) {
  if (value && typeof value === "object" && "value" in value) {
    return value.value;
  }

  return value;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
