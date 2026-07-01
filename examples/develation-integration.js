import {
  BlueFissionResponse,
  Events,
  HttpResponse,
  States,
  createBehavioralObject,
  createServiceClient,
  normalizeResponse,
  renderForm,
  renderHtml,
  renderHtmlPage,
  renderResults,
  renderXml
} from "../src/index.js";

export const develationServiceEnvelope = {
  ok: true,
  status: "OK",
  statusCode: 200,
  data: {
    id: 1,
    title: "Alpha",
    status: "ready"
  },
  list: [
    { id: 1, title: "Alpha", status: "ready" },
    { id: 2, title: "Beta", status: "review" }
  ],
  id: 1,
  query: "status=ready",
  children: [],
  errors: [],
  meta: {
    source: "develation"
  }
};

export const normalizedServiceResponse = new BlueFissionResponse(develationServiceEnvelope);

export const renderedParserOutput = renderHtml({
  output: "<section><h2>Template output</h2><p>Rendered by the upstream parser.</p></section>"
});

export const renderedResults = renderResults(develationServiceEnvelope.list, {
  columns: ["title", "status"],
  headers: ["Title", "Status"],
  limit: 10
});

export const renderedEditForm = renderForm([
  { name: "title", label: "Title", value: develationServiceEnvelope.data.title, required: true },
  {
    type: "select",
    name: "status",
    label: "Status",
    value: develationServiceEnvelope.data.status,
    options: {
      Ready: "ready",
      Review: "review"
    }
  }
], {
  action: "/resources"
});

export const renderedIntegrationPage = renderHtmlPage([
  renderedParserOutput,
  renderedResults,
  renderedEditForm
], {
  title: "DevElation resource",
  description: "Rendered parser output, result records, and form fields inside the Reactor HTML scope.",
  density: "compact"
});

export const renderedXmlPayload = renderXml({
  name: "RESOURCE",
  attributes: { id: normalizedServiceResponse.id },
  content: normalizedServiceResponse.data.title
});

export const eventedRecord = createBehavioralObject(normalizedServiceResponse.data);
eventedRecord.on(Events.CHANGE, ({ type, field }) => {
  if (field !== "lastChangeType") {
    eventedRecord.field("lastChangeType", type);
  }
});
eventedRecord.enter(States.SYNCED);

export function createDevelationServiceExample() {
  return createServiceClient({
    client: {
      async send(request) {
        return new HttpResponse({
          statusCode: 200,
          headers: {
            "content-type": "application/json"
          },
          body: {
            ...develationServiceEnvelope,
            data: {
              ...develationServiceEnvelope.data,
              ...request.body,
              method: request.method,
              url: request.url,
              accept: request.headers.Accept
            }
          },
          request
        });
      }
    },
    requestProcessors: [
      (request) => request
        .withHeader("Accept", "application/json")
        .withHeader("X-Requested-With", "XMLHttpRequest")
    ],
    responseProcessors: [
      (response) => response.normalized(),
      (response) => new BlueFissionResponse(response)
    ]
  });
}

export async function saveDevelationRecord(input = {}) {
  const client = createDevelationServiceExample();
  return client.post("/resources", {
    id: normalizedServiceResponse.id,
    ...input
  });
}

export const develationIntegrationExamples = {
  normalizedServiceResponse: normalizeResponse(develationServiceEnvelope),
  renderedParserOutput,
  renderedResults,
  renderedEditForm,
  renderedIntegrationPage,
  renderedXmlPayload,
  eventedRecordSnapshot: eventedRecord.snapshot()
};
