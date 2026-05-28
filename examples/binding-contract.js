import {
  createBindingContract,
  createBindingManifest
} from "../src/index.js";

const workspaceContract = createBindingContract({
  name: "resource-workspace",
  description: "A generic resource workspace with list, detail, and command bindings.",
  inputs: {
    resource: {
      type: "resource-client",
      required: true,
      description: "Client with list, read, save, and remove operations."
    },
    record: {
      type: "signal-map",
      required: true,
      description: "Editable signal-backed record state."
    },
    collection: {
      type: "record-set",
      description: "Optional list state for visible resource rows."
    }
  },
  outputs: {
    listRegion: {
      type: "selector",
      description: "Host-owned selector for list rendering."
    },
    detailRegion: {
      type: "selector",
      description: "Host-owned selector for detail rendering."
    }
  },
  events: {
    read: {
      type: "resource-event",
      description: "Raised after a resource record is read."
    },
    save: {
      type: "command",
      description: "Raised when editable state should be persisted."
    },
    error: {
      type: "exception",
      description: "Raised when resource or binding work fails."
    }
  },
  lifecycle: {
    setup: {
      description: "Resolve selectors and connect state to bindings."
    },
    start: {
      description: "Load initial state and publish the ready view."
    },
    stop: {
      description: "Dispose event handlers and subscriptions."
    }
  },
  ownership: {
    reactor: [
      "binding descriptor shape",
      "state handoff conventions",
      "optional compatibility adapters"
    ],
    application: [
      "selectors",
      "screen layout",
      "resource names",
      "product workflow"
    ],
    upstream: [
      "response envelope",
      "behavior and state naming"
    ]
  }
});

const manifest = createBindingManifest([workspaceContract]);

console.log(JSON.stringify(manifest.describe(), null, 2));
