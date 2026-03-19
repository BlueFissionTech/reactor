export function createPanelRegistry(initialPanels = {}) {
  const panels = new Map(Object.entries(initialPanels));

  return {
    register(name, panel) {
      panels.set(name, panel);
      return panel;
    },
    get(name) {
      return panels.get(name);
    },
    list() {
      return Array.from(panels.entries()).map(([name, panel]) => ({ name, panel }));
    },
    async activate(name, context = {}) {
      const panel = panels.get(name);
      if (!panel) {
        return null;
      }

      if (typeof panel.start === "function") {
        await panel.start(context);
      } else if (typeof panel.init === "function") {
        await panel.init(context);
      }

      return panel;
    }
  };
}
