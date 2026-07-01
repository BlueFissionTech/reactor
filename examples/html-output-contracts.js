import {
  renderForm,
  renderHtml,
  renderHtmlPage,
  renderResults,
  renderXml
} from "../src/index.js";

const parserRenderedOutput = "<section><h1>Resource summary</h1><p>Ready.</p></section>";

const runtimeEnvelope = {
  output: "<aside data-state=\"complete\">Runtime output can pass through directly.</aside>"
};

const structuredFragment = {
  tag: "section",
  attributes: { className: "resource-panel" },
  children: [
    { tag: "h2", content: "Open records" },
    {
      records: [
        { id: 1, title: "Alpha", status: "ready" },
        { id: 2, title: "Beta", status: "review" }
      ],
      columns: ["title", "status"],
      headers: ["Title", "Status"]
    }
  ]
};

const editForm = renderForm([
  { name: "title", label: "Title", value: "Alpha" },
  {
    type: "select",
    name: "status",
    label: "Status",
    value: "ready",
    options: { Ready: "ready", Review: "review" }
  }
], {
  action: "/resources"
});

const themedPage = renderHtmlPage([
  renderHtml(structuredFragment),
  editForm
], {
  title: "Resource workspace",
  description: "Parser, runtime, record, and form output rendered inside the Reactor HTML scope.",
  actions: [
    { tag: "a", attributes: { href: "/resources" }, content: "View all" }
  ],
  density: "compact"
});

export const htmlOutputExamples = {
  parserRenderedOutput: renderHtml(parserRenderedOutput),
  runtimeEnvelope: renderHtml(runtimeEnvelope),
  structuredFragment: renderHtml(structuredFragment),
  recordResults: renderResults(structuredFragment.children[1].records, {
    columns: ["title", "status"],
    headers: ["Title", "Status"],
    limit: 2
  }),
  themedPage,
  editForm,
  xmlNode: renderXml({
    name: "RESOURCE",
    attributes: { id: "1" },
    content: "Alpha"
  })
};
