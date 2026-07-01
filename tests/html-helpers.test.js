import test from "node:test";
import assert from "node:assert/strict";

import {
  br2nl,
  darkenHexColor,
  formatContent,
  joinDateParts,
  normalizeHref,
  normalizeRenderedOutput,
  nl2li,
  renderAttributes,
  renderBarGraph,
  renderBaseHref,
  renderDateField,
  renderDropdown,
  renderElement,
  renderFileLink,
  renderForm,
  renderFormField,
  renderFormValidation,
  renderHtml,
  renderImage,
  renderList,
  renderResults,
  renderTable,
  renderXml,
  splitDate
} from "../src/html/helpers.js";
import {
  renderHtml as renderHtmlFromIndex,
  renderXml as renderXmlFromIndex
} from "../src/index.js";

test("renderHtml accepts rendered parser and runtime output envelopes", () => {
  assert.equal(renderHtml("<main><h1>Ready</h1></main>"), "<main><h1>Ready</h1></main>");
  assert.equal(renderHtml({ output: "<section>Parser output</section>" }), "<section>Parser output</section>");
  assert.equal(renderHtml({ rendered_output: "<article>Runtime output</article>" }), "<article>Runtime output</article>");
  assert.equal(renderHtml({ text: "<script>alert(1)</script>" }), "&lt;script&gt;alert(1)&lt;/script&gt;");

  const normalized = normalizeRenderedOutput({ markdown: "# Heading\n* One" });

  assert.equal(normalized.source, "markdown");
  assert.match(normalized.html, /<h1>Heading<\/h1>/);
  assert.match(normalized.html, /<ul><li>One<\/li><\/ul>/);
  assert.equal(renderHtmlFromIndex({ output: "<p>indexed</p>" }), "<p>indexed</p>");
});

test("structured html fragments render elements, attributes, lists, and text safely", () => {
  assert.equal(
    renderAttributes({
      className: ["one", "two"],
      hidden: false,
      disabled: true,
      style: { backgroundColor: "red" }
    }),
    ' class="one two" disabled style="background-color: red"'
  );

  assert.equal(
    renderHtml({
      tag: "article",
      attributes: { className: "card", "data-id": "1" },
      children: [
        { tag: "h2", content: "<Alpha>" },
        { text: "Beta & Co" }
      ]
    }),
    '<article class="card" data-id="1"><h2>&lt;Alpha&gt;</h2>Beta &amp; Co</article>'
  );

  assert.equal(
    renderList(["A&B", { html: "<strong>B</strong>" }]),
    "<ul><li>A&amp;B</li><li><strong>B</strong></li></ul>"
  );
  assert.equal(renderElement("img", "", { src: "logo.png", alt: "Logo" }), '<img src="logo.png" alt="Logo">');
});

test("content and link helpers represent the DevElation HTML utility surface", () => {
  assert.equal(formatContent("## Title\n- First"), "<h2>Title</h2>\n<ol><li>First</li></ol>");
  assert.equal(normalizeHref("example.com", { absolute: true }), "http://example.com");
  assert.equal(renderBaseHref("/app/"), '<base href="/app/">');
  assert.equal(
    renderImage({ src: "photo.png", alt: "Photo", width: 50 }),
    '<img src="photo.png" alt="Photo" title="Photo" width="50">'
  );
  assert.equal(
    renderFileLink("report.pdf", "/docs/"),
    '<a href="/docs/report.pdf" target="_blank">report.pdf</a>'
  );
  assert.equal(nl2li("One\n\nTwo"), "<li>One</li>\n<li>Two</li>");
  assert.equal(br2nl("One<br />Two<br>Three"), "One\nTwo\nThree");
  assert.equal(darkenHexColor("#345"), "#123");
});

test("table, results, and graph helpers normalize record-oriented payloads", () => {
  const table = renderTable([{ id: 1, name: "Ada & Co" }], {
    columns: ["id", "name"],
    headers: ["ID", "Name"]
  });

  assert.match(table, /<th>ID<\/th><th>Name<\/th>/);
  assert.match(table, /<td>Ada &amp; Co<\/td>/);

  const results = renderResults([
    { id: 1, name: "Ada" },
    { id: 2, name: "Linus" }
  ], {
    columns: ["name"],
    start: 0,
    limit: 1
  });

  assert.match(results, /Showing 1-1 of 2 results\./);
  assert.match(results, /<td>Ada<\/td>/);
  assert.doesNotMatch(results, /<td>Linus<\/td>/);

  const graph = renderBarGraph({ done: 5, total: 10 }, { max: 10 });
  assert.match(graph, /dev_bar_graph/);
  assert.match(graph, /width: 50\.00%/);
});

test("form helpers cover fields, dropdowns, wrappers, and date splitting", () => {
  const select = renderFormField({
    type: "select",
    name: "status",
    label: "Status",
    options: { Open: "open", Closed: "closed" },
    value: "closed"
  });

  assert.match(select, /<label for="status">Status<\/label>/);
  assert.match(select, /<option value="closed" selected>Closed<\/option>/);

  const form = renderForm([
    { name: "title", label: "Title", value: "A&B" },
    { type: "checkbox", name: "published", label: "Published", checked: true }
  ], {
    action: "/save"
  });

  assert.match(form, /^<form/);
  assert.match(form, /action="\/save"/);
  assert.match(form, /value="A&amp;B"/);
  assert.match(form, /type="checkbox"[^>]+checked/);

  const dropdown = renderDropdown([{ id: 9, title: "Choice" }], {
    name: "record_id",
    valueField: "id",
    labelFields: ["title"],
    query: { token: "abc" }
  });

  assert.match(dropdown, /type="hidden"[^>]+name="token"[^>]+value="abc"/);
  assert.match(dropdown, /<option value="9">Choice<\/option>/);

  const split = renderDateField("due", "Due", "2026-07-01", {
    split: true,
    startYear: 2026,
    endYear: 2026
  });

  assert.match(split, /name="due_month"/);
  assert.match(split, /<option value="7" selected>7<\/option>/);
  assert.equal(splitDate("2026-07-01", "year"), "2026");
  assert.equal(joinDateParts("due", { due_month: 7, due_day: 1, due_year: 2026 }), "7/1/2026");

  const validation = renderFormValidation("title", "Title", "required<unsafe>");
  assert.match(validation, /type="application\/json"/);
  assert.match(validation, /required\\u003cunsafe>/);
});

test("xml-like node data can be rebuilt for parser and document helper output", () => {
  const xml = renderXml({
    name: "ITEM",
    attributes: { id: "1" },
    child: [
      { name: "TITLE", content: "A & B" }
    ]
  });

  assert.equal(xml, '<ITEM id="1"><TITLE>A &amp; B</TITLE></ITEM>');
  assert.equal(renderXmlFromIndex({ name: "ROOT", content: "Value" }), "<ROOT>Value</ROOT>");
});
