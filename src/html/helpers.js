import {
  dasherize,
  isPlainObject,
  isScalar,
  joinClassNames,
  toList
} from "../core/primitives.js";

const IMAGE_EXTENSIONS = /\.(gif|jpe?g|tiff?|png|bmp|webp|svg)$/i;
const FILE_EXTENSIONS = /\.(pdf|docx?|zip|mp3|mpe?g|mov|rar|txt|csv|xlsx?)$/i;
const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
]);

export const HtmlThemeClasses = Object.freeze({
  root: "bf-reactor-html",
  page: "bf-rx-page",
  header: "bf-rx-page__header",
  kicker: "bf-rx-page__kicker",
  title: "bf-rx-page__title",
  description: "bf-rx-page__description",
  body: "bf-rx-page__body",
  actions: "bf-rx-page__actions",
  section: "bf-rx-section",
  table: "bf-rx-table",
  results: "bf-rx-results",
  pagination: "bf-rx-pagination",
  form: "bf-rx-form",
  field: "bf-rx-field",
  control: "bf-rx-control",
  button: "bf-rx-button",
  list: "bf-rx-list",
  media: "bf-rx-media",
  fileLink: "bf-rx-file-link",
  barGraph: "bf-rx-bar-graph",
  bar: "bf-rx-bar",
  xml: "bf-rx-xml"
});

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderAttributes(attributes = {}) {
  if (!attributes) {
    return "";
  }

  if (typeof attributes === "string") {
    const raw = attributes.trim();
    return raw ? ` ${raw}` : "";
  }

  if (Array.isArray(attributes)) {
    return attributes.map((entry) => renderAttributes(entry)).join("");
  }

  return Object.entries(attributes)
    .map(([key, value]) => renderAttribute(key, value))
    .filter(Boolean)
    .join("");
}

export function renderElement(tag, content = "", attributes = {}, options = {}) {
  const tagName = normalizeTagName(tag);
  const htmlAttributes = renderAttributes(attributes);

  if (VOID_TAGS.has(tagName.toLowerCase())) {
    return `<${tagName}${htmlAttributes}>`;
  }

  return `<${tagName}${htmlAttributes}>${renderChildContent(content, options)}</${tagName}>`;
}

export function renderHtml(input = "", options = {}) {
  if (input == null) {
    return "";
  }

  if (Array.isArray(input)) {
    return input.map((item) => renderHtml(item, options)).join("");
  }

  if (isScalar(input)) {
    return options.escapeStrings ? escapeHtml(input) : String(input);
  }

  if (typeof input.render === "function") {
    return renderHtml(input.render(), options);
  }

  if (typeof input.output === "function") {
    return renderHtml(input.output(), options);
  }

  if ("html" in input) {
    return options.escapeHtmlOutput ? escapeHtml(input.html) : String(input.html ?? "");
  }

  if ("output" in input) {
    return options.escapeHtmlOutput ? escapeHtml(input.output) : String(input.output ?? "");
  }

  if ("rendered" in input) {
    return options.escapeHtmlOutput ? escapeHtml(input.rendered) : String(input.rendered ?? "");
  }

  if ("renderedOutput" in input) {
    return options.escapeHtmlOutput ? escapeHtml(input.renderedOutput) : String(input.renderedOutput ?? "");
  }

  if ("rendered_output" in input) {
    return options.escapeHtmlOutput ? escapeHtml(input.rendered_output) : String(input.rendered_output ?? "");
  }

  if ("markdown" in input) {
    return formatContent(input.markdown, { rich: input.rich ?? options.rich });
  }

  if ("text" in input) {
    return escapeHtml(input.text);
  }

  if (isElementShape(input)) {
    const tag = input.tag ?? input.nodeName ?? input.name;
    const attributes = input.attributes ?? input.attrs ?? {};
    const children = input.children ?? input.child ?? input.content ?? input.body ?? "";
    return renderElement(tag, children, attributes, options);
  }

  if ("records" in input || "rows" in input) {
    return renderTable(input.records ?? input.rows, input);
  }

  if ("fields" in input) {
    return renderForm(input.fields, input);
  }

  if ("items" in input) {
    return renderList(input.items, input);
  }

  for (const key of ["nodes", "fragments", "blocks", "children"]) {
    if (key in input) {
      return renderHtml(input[key], options);
    }
  }

  for (const key of ["content", "body", "value", "view"]) {
    if (key in input) {
      return renderHtml(input[key], options);
    }
  }

  return escapeHtml(JSON.stringify(input));
}

export function renderHtmlPage(content = "", options = {}) {
  const renderOptions = options.renderOptions ?? {};
  const attributes = normalizePageAttributes(options);
  const header = renderPageHeader(options);
  const body = renderElement("div", { html: renderHtml(content, renderOptions) }, {
    class: HtmlThemeClasses.body
  });
  const actions = options.actions
    ? renderElement("div", { html: renderHtml(options.actions, renderOptions) }, { class: HtmlThemeClasses.actions })
    : "";

  return renderElement(options.tag ?? "section", { html: `${header}${body}${actions}` }, attributes);
}

export function normalizeRenderedOutput(input = "", options = {}) {
  return {
    html: renderHtml(input, options),
    source: detectRenderedOutputSource(input),
    empty: input == null || renderHtml(input, options) === ""
  };
}

export function formatContent(content = "", options = {}) {
  let output = String(content ?? "");

  if (options.escape) {
    output = escapeHtml(output);
  }

  output = output.replace(/^---$/gm, "<hr />");
  output = output.replace(/^# (.*?)$/gm, "<h1>$1</h1>");
  output = output.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
  output = output.replace(/^### (.*?)$/gm, "<h3>$1</h3>");
  output = output.replace(/^\* (.*?)$/gm, "<uli>$1</uli>");
  output = output.replace(/^\- (.*?)$/gm, "<oli>$1</oli>");
  output = output.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  output = output.replace(/\*(.*?)\*/g, "<em>$1</em>");
  output = output.replace(/_(.*?)_/g, "<u>$1</u>");
  output = output.replace(/(?<=<\/uli>)(\s*)(?=<uli>)/g, "");
  output = output.replace(/((<uli>.*<\/uli>\s*)+)/g, "<ul>$1</ul>");
  output = output.replace(/(?<=<\/oli>)(\s*)(?=<oli>)/g, "");
  output = output.replace(/((<oli>.*<\/oli>\s*)+)/g, "<ol>$1</ol>");
  output = output.replace(/<uli>/g, "<li>").replace(/<\/uli>/g, "</li>");
  output = output.replace(/<oli>/g, "<li>").replace(/<\/oli>/g, "</li>");

  if (options.rich) {
    output = linkify(output);
  }

  return output;
}

export function normalizeHref(href = "", options = {}) {
  if (href == null || href === "") {
    return options.baseUrl ?? getCurrentHref();
  }

  const value = String(href);

  if (/^(?:[a-z][a-z0-9+.-]*:|\/|#|\?)/i.test(value)) {
    return value;
  }

  if (options.baseUrl) {
    return new URL(value, options.baseUrl).toString();
  }

  if (options.absolute) {
    return `${getCurrentProtocol()}://${value}`;
  }

  return value;
}

export function renderImage(image, options = {}) {
  const config = isPlainObject(image) ? image : { image, ...options };
  const source = config.src ?? config.image ?? config.file ?? "";
  const blank = config.blank ?? "";
  const imageSource = source || blank;

  if (!imageSource) {
    return "";
  }

  if (!IMAGE_EXTENSIONS.test(imageSource) && !blank) {
    return escapeHtml(imageSource);
  }

  const dir = config.dir ?? config.directory ?? "";
  const src = `${dir}${imageSource}`;
  const attrs = {
    src: config.thumbSrc ?? src,
    alt: config.alt ?? "",
    title: config.title ?? config.alt ?? "",
    width: config.width,
    height: config.height,
    align: config.align,
    ...config.attributes
  };
  const output = renderElement("img", "", attrs);

  if (config.link) {
    return renderElement("a", { html: output }, {
      href: normalizeHref(config.href ?? src),
      target: config.target ?? "_blank"
    });
  }

  return output;
}

export function renderFileLink(file, dirOrOptions = "", options = {}) {
  const config = isPlainObject(file)
    ? file
    : { file, ...(isPlainObject(dirOrOptions) ? dirOrOptions : { dir: dirOrOptions }), ...options };
  const filename = config.file ?? config.name ?? "";

  if (!filename) {
    return "";
  }

  if (!FILE_EXTENSIONS.test(filename)) {
    return escapeHtml(filename);
  }

  const dir = config.dir ?? config.directory ?? "";
  const path = `${dir}${filename}`;
  const href = config.virtual ? `file.php?f=${encodeURIComponent(path)}` : normalizeHref(path, config);
  return renderElement("a", config.label ?? basename(filename), {
    href,
    target: config.target ?? "_blank",
    ...config.attributes
  });
}

export function renderPagination(listOrTotal, options = {}) {
  const count = Array.isArray(listOrTotal)
    ? listOrTotal.length
    : Number.isFinite(Number(listOrTotal)) ? Number(listOrTotal) : toList(listOrTotal).length;
  const start = Math.max(0, Number(options.start ?? 0));
  const limit = Math.max(1, Number(options.limit ?? options.end ?? 20));
  const beginKey = options.beginKey ?? "start";
  const endKey = options.endKey ?? "lim";
  const href = normalizeHref(options.href ?? "", { baseUrl: options.baseUrl });
  const end = Math.min(count, start + limit);
  const pages = Math.ceil(count / limit);
  const links = [];

  if (start > 0) {
    links.push(renderElement("a", "Previous", {
      href: buildPageHref(href, beginKey, Math.max(0, start - limit), endKey, limit, options.query)
    }));
  }

  for (let index = 0; index < pages; index += 1) {
    const pageStart = index * limit;
    const label = String(index + 1);
    links.push(renderElement("a", label, {
      href: buildPageHref(href, beginKey, pageStart, endKey, limit, options.query),
      "aria-current": pageStart === start ? "page" : undefined
    }));
  }

  if (end < count) {
    links.push(renderElement("a", "Next", {
      href: buildPageHref(href, beginKey, start + limit, endKey, limit, options.query)
    }));
  }

  const summary = count > 0
    ? `Showing ${start + 1}-${end} of ${count} results.`
    : "No matching results";
  const nav = links.length > 0 ? `<br />\n${links.join(" | ")}` : "";

  return `${escapeHtml(summary)}${nav}<br />\n`;
}

export function renderResults(records = [], options = {}) {
  const rows = toList(records);
  const start = Math.max(0, Number(options.start ?? 0));
  const limit = Math.max(1, Number(options.limit ?? (rows.length || 1)));
  const pageRows = rows.slice(start, start + limit);
  const table = renderTable(pageRows, options);

  if (options.paginate === false) {
    return table;
  }

  const pagination = renderPagination(rows, { ...options, start, limit });
  return `${pagination}${table}${pagination}`;
}

export function renderBaseHref(href = "", options = {}) {
  return renderElement("base", "", {
    href: normalizeHref(href, { ...options, absolute: options.absolute ?? false })
  });
}

export function renderBarGraph(data = {}, options = {}) {
  const entries = Object.entries(data || {});
  const max = Number(options.max ?? Math.max(...entries.map(([, value]) => Number(value) || 0), 0)) || 1;
  const rows = entries.map(([label, value]) => {
    const numeric = Number(value) || 0;
    const percent = Math.max(0, Math.min(100, (numeric / max) * 100));
    return {
      label,
      bar: {
        html: renderElement("div", "", {
          class: options.barClass ?? joinClassNames(HtmlThemeClasses.bar, "dev_bar"),
          style: `width: ${percent.toFixed(2)}%; height: ${options.barHeight ?? 5}px;`
        })
      },
      value: options.percent ? `${percent.toFixed(0)}%` : numeric
    };
  });

  return renderTable(rows, {
    columns: [
      "label",
      { field: "bar", html: true, label: "" },
      "value"
    ],
    headers: options.headers ?? ["", "", ""],
    attributes: {
      class: joinClassNames(HtmlThemeClasses.barGraph, options.className ?? "dev_bar_graph")
    }
  });
}

export function nl2li(value = "", options = {}) {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => renderElement("li", line, {}, options))
    .join("\n");
}

export function br2nl(value = "") {
  return String(value ?? "").replace(/<br\s*\/?>/gi, "\n");
}

export function darkenHexColor(hex = "", amount = 2) {
  const raw = String(hex ?? "");
  const prefix = raw.trim().startsWith("#") ? "#" : "";
  const color = raw.replace(/[^A-Fa-f0-9]/g, "");
  const darkened = Array.from(color)
    .map((char) => Math.max(0, parseInt(char, 16) - amount).toString(16))
    .join("");

  return `${prefix}${darkened}`;
}

export const darkerColor = darkenHexColor;

export function renderList(items = [], options = {}) {
  const tag = options.ordered ? "ol" : options.tag ?? "ul";
  const entries = toList(items).map((item) => renderElement("li", item, {}, options)).join("");
  return renderElement(tag, { html: entries }, options.attributes ?? {});
}

export function renderTable(records = [], options = {}) {
  if (isPlainObject(records) && ("records" in records || "rows" in records)) {
    options = { ...records, ...options };
    records = records.records ?? records.rows;
  }

  const rows = toList(records);
  const columns = options.columns || options.fields || inferColumns(rows);
  const headers = options.headers || columns.map((column) => columnLabel(column));
  const bodyRows = rows.map((record) => {
    const cells = columns.map((column) => {
      const value = cellValue(record, column);
      const html = column && typeof column === "object" && column.html
        ? renderHtml(value)
        : escapeHtml(value);
      return `<td>${html}</td>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("");

  const headerRow = `<tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>`;
  const attributes = {
    class: options.className ?? options.class,
    id: options.id,
    ...options.attributes
  };
  return `<table${renderAttributes(attributes)}><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table>`;
}

export function renderDropdown(records = [], options = {}) {
  const rows = toList(records);
  const valueField = options.valueField ?? inferColumns(rows)[0];
  const labelFields = options.labelFields ?? inferColumns(rows).filter((field) => field !== valueField);
  const selectOptions = {};

  for (const row of rows) {
    const label = labelFields.map((field) => row?.[field]).filter((value) => value != null && value !== "").join(" - ");
    selectOptions[label || row?.[valueField]] = row?.[valueField];
  }

  const hidden = Object.entries(options.query || {})
    .map(([name, value]) => renderFormField({ type: "hidden", name, value }))
    .join("");
  const select = renderFormField({
    type: "select",
    name: options.name ?? valueField ?? "value",
    label: options.label ?? "",
    options: { [options.placeholder ?? "-------"]: "", ...selectOptions },
    value: options.value
  });
  const submit = options.submit === false ? "" : renderFormField({
    type: "submit",
    name: options.submitName ?? "submit",
    value: options.submitLabel ?? "Submit"
  });

  return `${hidden}${select}${submit}`;
}

export function renderFormField(config = {}, ...args) {
  const field = normalizeFieldConfig(config, args);
  const type = field.type || "text";
  const name = field.name || "";
  const id = field.id || name;
  const value = field.value ?? "";
  const attributes = {
    class: field.className ?? field.class ?? type,
    readonly: field.readonly || undefined,
    required: field.required || undefined,
    ...field.attributes
  };
  const label = renderFieldLabel(field, id, type);

  if (type === "select" || type === "multiple") {
    const multiple = type === "multiple";
    const selectName = multiple && !String(name).endsWith("[]") ? `${name}[]` : name;
    const optionsHtml = renderOptionList(field.options ?? value, field.selected ?? field.value, multiple);
    return `${label}<select id="${escapeHtml(id)}" name="${escapeHtml(selectName)}"${renderAttributes({ ...attributes, multiple: multiple || undefined, size: field.size })}>${optionsHtml}</select>`;
  }

  if (type === "textarea" || type === "richtext") {
    return `${label}<textarea id="${escapeHtml(id)}" name="${escapeHtml(name)}"${renderAttributes({
      ...attributes,
      "data-richtext": type === "richtext" || undefined
    })}>${escapeHtml(value)}</textarea>`;
  }

  if (type === "checkbox" || type === "radio") {
    return renderChoiceField(type, field, id, attributes);
  }

  if (type === "date") {
    return renderDateField(name, field.label ?? "", value, { id, ...field });
  }

  if (type === "time") {
    return `${label}<input type="time" id="${escapeHtml(id)}" name="${escapeHtml(name)}"${renderAttributes({ ...attributes, value })}>`;
  }

  if (type === "static") {
    return `${field.label ? `${escapeHtml(field.label)}<br />` : ""}<span id="${escapeHtml(id)}" name="${escapeHtml(name)}"${renderAttributes(attributes)}>${escapeHtml(value)}</span>${renderFormField({ type: "hidden", name, value, id: `${id}_hidden` })}`;
  }

  const inputType = type === "calendar" ? "date" : type === "prompt" ? "text" : type;
  return `${label}<input type="${escapeHtml(inputType)}" id="${escapeHtml(id)}" name="${escapeHtml(name)}"${renderAttributes({
    ...attributes,
    value,
    placeholder: field.placeholder ?? (type === "prompt" ? value : undefined)
  })}>`;
}

export function renderDateField(name = "date", label = "Date", value = "", options = {}) {
  const id = options.id ?? name;

  if (!options.split) {
    return `${renderFieldLabel({ label, required: options.required }, id, "date")}<input type="date" id="${escapeHtml(id)}" name="${escapeHtml(name)}"${renderAttributes({
      class: options.className ?? options.class ?? "date",
      value: value || currentIsoDate(),
      readonly: options.readonly || undefined
    })}>`;
  }

  const dateValue = value || currentIsoDate();
  const month = Number(splitDate(dateValue, "month"));
  const day = Number(splitDate(dateValue, "day"));
  const year = Number(splitDate(dateValue, "year"));
  const startYear = Number(options.startYear ?? year - 50);
  const endYear = Number(options.endYear ?? year + 10);
  const monthOptions = range(1, 12);
  const dayOptions = range(1, 31);
  const yearOptions = range(startYear, endYear);

  return `${label ? `${escapeHtml(label)}: <br />` : ""}${renderSelect(`${name}_month`, monthOptions, month)} / ${renderSelect(`${name}_day`, dayOptions, day)} / ${renderSelect(`${name}_year`, yearOptions, year)}`;
}

export function splitDate(date, section = "", timestamp = false) {
  const value = String(date ?? "");
  const match = value.match(timestamp ? /^(\d{4})-(\d+)-(\d+)[\s\S]*$/ : /^(\d{4})-(\d+)-(\d+)/);

  if (!match) {
    return value;
  }

  const [, year, month, day] = match;

  if (section === "day") {
    return day;
  }

  if (section === "month") {
    return month;
  }

  if (section === "year") {
    return year;
  }

  return `${month}/${day}/${year}`;
}

export function joinDateParts(name = "date", source = {}) {
  const month = source[`${name}_month`] ?? source.month ?? "";
  const day = source[`${name}_day`] ?? source.day ?? "";
  const year = source[`${name}_year`] ?? source.year ?? "";
  return `${month}/${day}/${year}`;
}

export function renderFormOpen(options = {}) {
  const config = typeof options === "string" ? { action: options } : options;
  return `<form${renderAttributes({
    enctype: config.enctype ?? "multipart/form-data",
    method: config.method ?? "post",
    name: config.name,
    action: config.action ? normalizeHref(config.action, config) : undefined,
    ...config.attributes
  })}>`;
}

export function renderFormClose() {
  return "</form>";
}

export function renderForm(fields = [], options = {}) {
  const body = normalizeFieldList(fields)
    .map((field) => renderFormField(field))
    .join("");

  if (options.wrap === false) {
    return body;
  }

  return `${renderFormOpen(options)}${body}${renderFormClose()}`;
}

export function renderFormValidation(fieldName = "", fieldLabel = "", criteria = "") {
  if (!criteria) {
    return "";
  }

  const payload = JSON.stringify({
    field: fieldName,
    label: fieldLabel,
    criteria
  }).replace(/</g, "\\u003c");

  return renderElement("script", { html: payload }, {
    type: "application/json",
    "data-validation-field": fieldName
  });
}

export function renderXml(data = {}, options = {}) {
  if (data == null) {
    return "";
  }

  if (Array.isArray(data)) {
    return data.map((item) => renderXml(item, options)).join("");
  }

  if (isScalar(data)) {
    return escapeHtml(data);
  }

  const tag = normalizeTagName(data.name ?? data.tag ?? options.defaultTag ?? "node");
  const attributes = data.attributes ?? data.attrs ?? {};
  const content = data.child ?? data.children ?? data.content ?? "";
  return `<${tag}${renderAttributes(attributes)}>${renderXml(content, options)}</${tag}>`;
}

function renderAttribute(key, value) {
  if (value == null || value === false || typeof value === "function") {
    return "";
  }

  const name = normalizeAttributeName(key);

  if (!name) {
    return "";
  }

  if (value === true) {
    return ` ${name}`;
  }

  if (name === "style" && isPlainObject(value)) {
    value = Object.entries(value)
      .map(([styleName, styleValue]) => `${dasherize(styleName)}: ${styleValue}`)
      .join("; ");
  }

  if (Array.isArray(value)) {
    value = value.filter(Boolean).join(" ");
  }

  return ` ${name}="${escapeHtml(value)}"`;
}

function renderChildContent(content, options = {}) {
  if (isScalar(content)) {
    return options.trustedHtml ? String(content) : escapeHtml(content);
  }

  return renderHtml(content, options);
}

function renderOptionList(options = {}, selected = "", multiple = false) {
  const selectedValues = new Set(toList(selected).map((value) => String(value)));

  if (Array.isArray(options)) {
    return options.map((option) => {
      if (isPlainObject(option) && option.options) {
        return renderElement("optgroup", { html: renderOptionList(option.options, selected, multiple) }, { label: option.label });
      }

      const value = isPlainObject(option) ? option.value : option;
      const label = isPlainObject(option) ? option.label ?? option.value : option;
      return renderElement("option", label, {
        value,
        selected: selectedValues.has(String(value)) || undefined
      });
    }).join("");
  }

  return Object.entries(options || {}).map(([label, value]) => {
    if (isPlainObject(value)) {
      return renderElement("optgroup", { html: renderOptionList(value, selected, multiple) }, { label });
    }

    return renderElement("option", label, {
      value,
      selected: selectedValues.has(String(value)) || undefined
    });
  }).join("");
}

function renderChoiceField(type, field, id, attributes) {
  const choices = field.options ?? (isPlainObject(field.value) ? field.value : null);

  if (choices) {
    return Object.entries(choices).map(([label, value], index) => {
      const choiceId = `${id}_${index + 1}`;
      const checked = toList(field.checked ?? field.selected).map(String).includes(String(value));
      return `${renderElement("input", "", {
        ...attributes,
        type,
        id: choiceId,
        name: type === "checkbox" && field.multiple !== false ? `${field.name}[]` : field.name,
        value,
        checked: checked || undefined
      })}${renderElement("label", label, { for: choiceId })}`;
    }).join("");
  }

  return `${renderElement("input", "", {
    ...attributes,
    type,
    id,
    name: field.name,
    value: field.value ?? "1",
    checked: field.checked || field.value === true || undefined
  })}${field.label ? renderElement("label", field.label, { for: id }) : ""}`;
}

function renderFieldLabel(field, id, type) {
  if (!field.label || type === "hidden" || type === "static") {
    return "";
  }

  return renderElement("label", `${field.required ? "*" : ""}${field.label}`, { for: id });
}

function renderSelect(name, values, selected) {
  return `<select name="${escapeHtml(name)}">${values.map((value) => renderElement("option", value, {
    value,
    selected: Number(value) === Number(selected) || undefined
  })).join("")}</select>`;
}

function buildPageHref(href, beginKey, start, endKey, limit, query = {}) {
  const [path, existingQuery = ""] = String(href || "").split("?");
  const params = new URLSearchParams(existingQuery);

  for (const [key, value] of Object.entries(query || {})) {
    if (value != null) {
      params.set(key, value);
    }
  }

  params.set(beginKey, start);
  params.set(endKey, limit);

  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

function normalizeFieldConfig(config, args) {
  if (typeof config === "string") {
    const [name, label, value, required, id, readonly, attributes] = args;
    return { type: config, name, label, value, required, id, readonly, attributes };
  }

  return config || {};
}

function normalizeFieldList(fields) {
  if (Array.isArray(fields)) {
    return fields;
  }

  return Object.entries(fields || {}).map(([name, value]) => {
    if (isPlainObject(value)) {
      return { name, ...value };
    }

    return { name, value };
  });
}

function normalizeTagName(tag) {
  const value = String(tag || "div").trim();
  return /^[A-Za-z][A-Za-z0-9:_-]*$/.test(value) ? value : "div";
}

function normalizeAttributeName(name) {
  const value = String(name === "className" ? "class" : name === "htmlFor" ? "for" : name).trim();
  return /^[A-Za-z_:][A-Za-z0-9:._-]*$/.test(value) ? value : "";
}

function isElementShape(value) {
  if (!isPlainObject(value)) {
    return false;
  }

  if ("tag" in value || "nodeName" in value) {
    return true;
  }

  return "name" in value
    && ("child" in value || "children" in value || "content" in value || "attributes" in value)
    && !("type" in value && ("value" in value || "label" in value));
}

function detectRenderedOutputSource(input) {
  if (input == null) {
    return "empty";
  }

  if (isScalar(input)) {
    return "string";
  }

  for (const key of ["html", "output", "rendered", "renderedOutput", "rendered_output", "markdown", "text"]) {
    if (key in input) {
      return key;
    }
  }

  if ("records" in input || "rows" in input) {
    return "table";
  }

  if ("fields" in input) {
    return "form";
  }

  if ("items" in input) {
    return "list";
  }

  return "structured";
}

function normalizePageAttributes(options = {}) {
  const {
    class: attributeClass,
    className: attributeClassName,
    ...extraAttributes
  } = options.attributes ?? {};
  const className = joinClassNames(
    HtmlThemeClasses.root,
    HtmlThemeClasses.page,
    options.className ?? options.class,
    attributeClassName,
    attributeClass
  );

  return {
    ...extraAttributes,
    class: className,
    "data-reactor-html": extraAttributes["data-reactor-html"] ?? "true",
    "data-theme": options.theme ?? extraAttributes["data-theme"],
    "data-density": options.density ?? extraAttributes["data-density"]
  };
}

function renderPageHeader(options = {}) {
  const parts = [
    options.kicker ? renderElement("p", options.kicker, { class: HtmlThemeClasses.kicker }) : "",
    options.title ? renderElement(options.titleTag ?? "h1", options.title, { class: HtmlThemeClasses.title }) : "",
    options.description ? renderElement("p", options.description, { class: HtmlThemeClasses.description }) : ""
  ].filter(Boolean).join("");

  return parts
    ? renderElement("header", { html: parts }, { class: HtmlThemeClasses.header })
    : "";
}

function cellValue(record, column) {
  if (typeof column === "function") {
    return column(record);
  }

  const field = column && typeof column === "object" ? column.field ?? column.key ?? column.name : column;

  if (Array.isArray(record)) {
    return record[Number(field)];
  }

  return record?.[field];
}

function columnLabel(column) {
  if (column && typeof column === "object") {
    return column.label ?? column.header ?? column.field ?? column.key ?? "";
  }

  return column;
}

function inferColumns(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return [];
  }

  const first = records[0] || {};
  return Array.isArray(first) ? first.map((_, index) => index) : Object.keys(first);
}

function basename(path) {
  return String(path ?? "").split(/[\\/]/).pop();
}

function range(start, end) {
  const output = [];
  for (let value = start; value <= end; value += 1) {
    output.push(value);
  }
  return output;
}

function currentIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentHref() {
  return globalThis.location?.href ?? "";
}

function getCurrentProtocol() {
  return String(globalThis.location?.protocol ?? "http:").replace(/:$/, "");
}

function linkify(content) {
  return content
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
    .replace(/([\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/g, '<a href="mailto:$1">$1</a>');
}
