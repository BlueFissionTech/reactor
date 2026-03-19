export function createPortletController(options = {}) {
  const selectors = {
    portlet: options.portletSelector || ".portlet",
    body: options.bodySelector || ".portlet-body"
  };

  function resolvePortlet(target) {
    const element = typeof target === "string" ? document.querySelector(target) : target;
    return element?.closest(selectors.portlet) || element;
  }

  function collapse(target) {
    const portlet = resolvePortlet(target);
    const body = portlet?.querySelector(selectors.body);

    if (body) {
      const isHidden = body.hidden || getComputedStyle(body).display === "none";
      body.hidden = !isHidden;
      body.style.display = isHidden ? "" : "none";
    }

    return body;
  }

  async function remove(target) {
    const portlet = resolvePortlet(target);
    if (!portlet) {
      return null;
    }

    if (typeof options.confirm === "function") {
      const allowed = await options.confirm(portlet);
      if (allowed === false) {
        return null;
      }
    }

    portlet.remove();
    return portlet;
  }

  return {
    collapse,
    remove
  };
}
