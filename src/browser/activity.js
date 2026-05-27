export function createActivityTracker(options = {}) {
  const config = {
    initialWaitMs: options.initialWaitMs ?? 3000,
    intervalWaitMs: options.intervalWaitMs ?? 10000,
    tickMs: options.tickMs ?? 1000,
    events: options.events ?? ["mouseup", "keydown", "scroll", "mousemove"]
  };

  const state = {
    totalActiveMs: 0,
    clickCount: 0,
    buttonClicks: { total: 0 },
    linkClickCount: 0,
    keypressCount: 0,
    scrollCount: 0,
    mouseMovementCount: 0,
    page: window.location.pathname
  };

  let activeUntil = Date.now() + config.initialWaitMs;
  let tickingHandle = null;
  const listeners = [];

  function start() {
    if (tickingHandle) {
      return api;
    }

    tickingHandle = window.setInterval(() => {
      if (!document.hidden && Date.now() <= activeUntil) {
        state.totalActiveMs += config.tickMs;
        publish();
      }
    }, config.tickMs);

    config.events.forEach((eventName) => {
      const handler = (event) => {
        activeUntil = Date.now() + config.intervalWaitMs;
        captureEvent(eventName, event);
        publish();
      };

      document.addEventListener(eventName, handler);
      listeners.push([eventName, handler]);
    });

    publish();
    return api;
  }

  function stop() {
    if (tickingHandle) {
      window.clearInterval(tickingHandle);
      tickingHandle = null;
    }

    while (listeners.length > 0) {
      const [eventName, handler] = listeners.pop();
      document.removeEventListener(eventName, handler);
    }

    return api;
  }

  function reset() {
    state.totalActiveMs = 0;
    state.clickCount = 0;
    state.buttonClicks = { total: 0 };
    state.linkClickCount = 0;
    state.keypressCount = 0;
    state.scrollCount = 0;
    state.mouseMovementCount = 0;
    activeUntil = Date.now() + config.initialWaitMs;
    publish();
    return api;
  }

  function snapshot() {
    return {
      ...state,
      buttonClicks: { ...state.buttonClicks },
      totalActiveSeconds: Math.floor(state.totalActiveMs / 1000)
    };
  }

  function publish() {
    const next = snapshot();

    if (typeof options.onUpdate === "function") {
      options.onUpdate(next);
    }

    if (options.bindings) {
      writeBindings(next, options.bindings);
    }
  }

  function captureEvent(eventName, event) {
    if (eventName === "mouseup") {
      state.clickCount += 1;
      const nodeName = event.target?.nodeName;

      if (nodeName === "BUTTON") {
        const label = event.target.innerText || "button";
        if (!state.buttonClicks[label]) {
          state.buttonClicks[label] = 0;
        }

        state.buttonClicks[label] += 1;
        state.buttonClicks.total += 1;
      } else if (nodeName === "A") {
        state.linkClickCount += 1;
      }
    } else if (eventName === "keydown") {
      state.keypressCount += 1;
    } else if (eventName === "scroll") {
      state.scrollCount += 1;
    } else if (eventName === "mousemove") {
      state.mouseMovementCount += 1;
    }
  }

  const api = {
    start,
    stop,
    reset,
    snapshot
  };

  return api;
}

function writeBindings(state, bindings) {
  const mapping = {
    page: state.page,
    timer: state.totalActiveSeconds,
    click: state.clickCount,
    button: JSON.stringify(state.buttonClicks, null, 2),
    link: state.linkClickCount,
    keypress: state.keypressCount,
    scroll: state.scrollCount,
    mouse: state.mouseMovementCount
  };

  Object.entries(bindings).forEach(([key, selector]) => {
    const element = document.querySelector(selector);
    if (element && Object.prototype.hasOwnProperty.call(mapping, key)) {
      element.textContent = mapping[key];
    }
  });
}
