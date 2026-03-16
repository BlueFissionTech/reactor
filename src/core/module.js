export function createModule(name, definition = {}, options = {}) {
  const state = {
    name,
    started: false,
    destroyed: false
  };

  const context = {
    name,
    options,
    state,
    services: options.services || {},
    data: options.data || {}
  };

  const plugins = options.plugins || [];

  for (const plugin of plugins) {
    if (typeof plugin === "function") {
      plugin(context);
    }
  }

  return {
    name,
    context,
    async setup() {
      if (typeof definition.setup === "function") {
        await definition.setup(context);
      }

      return this;
    },
    async start() {
      if (state.destroyed || state.started) {
        return this;
      }

      await this.setup();

      if (typeof definition.start === "function") {
        await definition.start(context);
      }

      state.started = true;
      return this;
    },
    async stop() {
      if (!state.started) {
        return this;
      }

      if (typeof definition.stop === "function") {
        await definition.stop(context);
      }

      state.started = false;
      return this;
    },
    async destroy() {
      if (state.destroyed) {
        return this;
      }

      await this.stop();

      if (typeof definition.destroy === "function") {
        await definition.destroy(context);
      }

      state.destroyed = true;
      return this;
    }
  };
}

export function createModuleManager() {
  const modules = new Map();

  return {
    register(module) {
      modules.set(module.name, module);
      return module;
    },
    get(name) {
      return modules.get(name);
    },
    async start(name) {
      const module = modules.get(name);
      if (module) {
        await module.start();
      }
      return module;
    },
    async stop(name) {
      const module = modules.get(name);
      if (module) {
        await module.stop();
      }
      return module;
    },
    async destroy(name) {
      const module = modules.get(name);
      if (module) {
        await module.destroy();
        modules.delete(name);
      }
      return module;
    },
    list() {
      return Array.from(modules.values());
    }
  };
}
