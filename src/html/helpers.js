export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatContent(content = "", options = {}) {
  let output = String(content ?? "");

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

export function renderTable(records = [], options = {}) {
  const columns = options.columns || inferColumns(records);
  const headers = options.headers || columns;
  const rows = records.map((record) => {
    const cells = columns.map((column) => {
      const value = typeof column === "function" ? column(record) : record?.[column];
      return `<td>${escapeHtml(value)}</td>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("");

  const thead = `<tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>`;
  return `<table><thead>${thead}</thead><tbody>${rows}</tbody></table>`;
}

export function renderFormField(config = {}) {
  const type = config.type || "text";
  const name = config.name || "";
  const label = config.label ? `<label for="${escapeHtml(config.id || name)}">${escapeHtml(config.label)}</label>` : "";
  const value = config.value ?? "";
  const id = escapeHtml(config.id || name);
  const className = escapeHtml(config.className || type);

  if (type === "textarea") {
    return `${label}<textarea id="${id}" name="${escapeHtml(name)}" class="${className}">${escapeHtml(value)}</textarea>`;
  }

  if (type === "select") {
    const optionsHtml = Object.entries(config.options || {}).map(([text, optionValue]) => {
      const selected = String(optionValue) === String(value) ? ' selected="selected"' : "";
      return `<option value="${escapeHtml(optionValue)}"${selected}>${escapeHtml(text)}</option>`;
    }).join("");

    return `${label}<select id="${id}" name="${escapeHtml(name)}" class="${className}">${optionsHtml}</select>`;
  }

  return `${label}<input type="${escapeHtml(type)}" id="${id}" name="${escapeHtml(name)}" class="${className}" value="${escapeHtml(value)}" />`;
}

function linkify(content) {
  return content
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
    .replace(/([\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/g, '<a href="mailto:$1">$1</a>');
}

function inferColumns(records) {
  return Array.isArray(records) && records.length > 0 ? Object.keys(records[0] || {}) : [];
}
