export function createJQueryBridge($) {
  if (typeof $ !== "function") {
    throw new Error("createJQueryBridge requires a jQuery instance.");
  }

  return {
    onReady(callback) {
      $(callback);
    },
    on(rootSelector, eventName, targetSelector, handler) {
      $(rootSelector).on(eventName, targetSelector, handler);
      return () => {
        $(rootSelector).off(eventName, targetSelector, handler);
      };
    },
    onDirect(selector, eventName, handler) {
      $(selector).on(eventName, handler);
      return () => {
        $(selector).off(eventName, handler);
      };
    },
    show(selector) {
      $(selector).show();
    },
    hide(selector) {
      $(selector).hide();
    },
    fadeSwap(fromSelector, toSelector, duration = 200) {
      $(fromSelector).fadeOut(duration, () => {
        $(toSelector).fadeIn(duration);
      });
    },
    modal(selector, action = "show") {
      if (typeof $(selector).modal === "function") {
        $(selector).modal(action);
      }
    },
    dataTableReload(selector) {
      if ($.fn?.DataTable) {
        $(selector).DataTable().ajax.reload();
      }
    },
    ajax(options) {
      return $.ajax(options);
    }
  };
}

export function createJQueryNotifier({ toastr, notyf } = {}) {
  return {
    success(message) {
      if (notyf?.success) {
        notyf.success(message);
        return;
      }

      if (toastr?.success) {
        toastr.success(message);
        return;
      }

      console.log(message);
    },
    error(message) {
      if (notyf?.error) {
        notyf.error(message);
        return;
      }

      if (toastr?.error) {
        toastr.error(message);
        return;
      }

      console.error(message);
    }
  };
}
