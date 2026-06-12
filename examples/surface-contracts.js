import {
  SurfaceFamilies,
  SurfaceUpdateSources,
  createSurfaceContract,
  createSurfaceManifest
} from "../src/index.js";

const guidedSurface = createSurfaceContract({
  name: "guided-rich-surface",
  family: SurfaceFamilies.SCENE,
  description: "A guided interactive surface with media, dialogue, choice, and overlay responsibilities.",
  components: {
    media: {
      family: SurfaceFamilies.MEDIA,
      responsibility: "Show the current media asset and playback state.",
      states: {
        ready: "boolean",
        asset: "string"
      },
      bindings: {
        region: "selector"
      }
    },
    dialogue: {
      family: SurfaceFamilies.DIALOGUE,
      responsibility: "Present authored or generated text turns.",
      states: {
        activeTurn: "string"
      },
      events: ["advance"]
    },
    choices: {
      family: SurfaceFamilies.CHOICE,
      responsibility: "Expose available user choices and command handoffs.",
      events: ["choose"]
    }
  },
  updateRules: {
    authoredStep: {
      source: SurfaceUpdateSources.SCRIPTED,
      trigger: "step.ready",
      deterministic: true,
      lane: "story",
      priority: 10
    },
    userChoice: {
      source: SurfaceUpdateSources.REACTIVE,
      trigger: "choice.selected",
      deterministic: false,
      lane: "interaction",
      priority: 20
    }
  },
  pulses: [
    {
      name: "show-intro-media",
      surface: "media",
      source: SurfaceUpdateSources.SCRIPTED,
      action: "replace",
      target: "region",
      payload: {
        asset: "intro"
      },
      timing: {
        duration: 300,
        lane: "story"
      }
    }
  ],
  ownership: {
    reactor: [
      "surface descriptor shape",
      "state and pulse naming conventions"
    ],
    host: [
      "asset loading",
      "route handoff",
      "visual rendering"
    ],
    upstream: [
      "response and event semantics"
    ]
  }
});

const operationalSurface = createSurfaceContract({
  name: "operational-control-surface",
  family: SurfaceFamilies.PANEL,
  description: "An operational surface with status, notifications, and command handoff areas.",
  components: {
    status: {
      family: SurfaceFamilies.PANEL,
      responsibility: "Render the current operational state and selected record.",
      states: {
        selectedId: "string",
        busy: "boolean"
      }
    },
    notifications: {
      family: SurfaceFamilies.NOTIFICATION,
      responsibility: "Display status and error messages.",
      events: ["notify"]
    },
    commands: {
      family: SurfaceFamilies.COMMAND,
      responsibility: "Expose explicit commands for the host workflow.",
      events: ["execute", "cancel"]
    }
  },
  updateRules: {
    commandResult: {
      source: SurfaceUpdateSources.SYSTEM,
      trigger: "command.completed",
      deterministic: true,
      lane: "status",
      priority: 5
    }
  }
});

const commandHandoffSurface = createSurfaceContract({
  name: "command-result-handoff-surface",
  family: SurfaceFamilies.PANEL,
  description: "A command-result surface with explicit review state, diagnostics, and evidence references.",
  components: {
    result: {
      family: SurfaceFamilies.COMMAND,
      responsibility: "Expose command result metadata without deciding approval state in renderer logic.",
      states: {
        status: "string",
        outputId: "string",
        waiting: "boolean",
        completed: "boolean"
      },
      bindings: {
        summaryRegion: "selector",
        diagnosticsRegion: "selector"
      }
    },
    review: {
      family: SurfaceFamilies.CHOICE,
      responsibility: "Publish explicit review choices supplied by the host workflow.",
      states: {
        reviewState: "string"
      },
      events: ["approve", "reject", "request-more-context"]
    },
    evidence: {
      family: SurfaceFamilies.PANEL,
      responsibility: "Render evidence references and provenance metadata.",
      states: {
        evidenceRefs: "array"
      },
      events: ["inspect-evidence"]
    }
  },
  updateRules: {
    commandCompleted: {
      source: SurfaceUpdateSources.SYSTEM,
      trigger: "command.completed",
      deterministic: true,
      lane: "result",
      priority: 15
    },
    reviewSelected: {
      source: SurfaceUpdateSources.REACTIVE,
      trigger: "review.selected",
      deterministic: false,
      lane: "approval",
      priority: 30
    }
  },
  pulses: [
    {
      name: "publish-command-result",
      surface: "result",
      source: SurfaceUpdateSources.SYSTEM,
      action: "replace",
      target: "summaryRegion",
      payload: {
        status: "completed",
        output_id: "command-output-id",
        diagnostics: [],
        evidence_refs: [],
        semantic_meta: {}
      },
      timing: {
        lane: "result"
      }
    }
  ],
  ownership: {
    reactor: [
      "surface descriptor shape",
      "explicit result and review state vocabulary"
    ],
    host: [
      "command execution",
      "approval policy",
      "evidence retrieval",
      "renderer behavior"
    ],
    upstream: [
      "command result envelope"
    ]
  }
});

const manifest = createSurfaceManifest([
  guidedSurface,
  operationalSurface,
  commandHandoffSurface
]);

console.log(JSON.stringify(manifest.describe(), null, 2));
