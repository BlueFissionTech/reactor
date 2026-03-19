import { HttpRequest, createHttpClient } from "../net/http.js";

export function createGateway(processors = []) {
  const pipeline = [...processors];

  return {
    use(processor) {
      pipeline.push(processor);
      return this;
    },
    async process(input, context = {}) {
      let current = input;

      for (const processor of pipeline) {
        const result = await processor(current, context);
        if (result !== undefined) {
          current = result;
        }
      }

      return current;
    }
  };
}

export function createServiceClient(options = {}) {
  const client = options.client || createHttpClient(options);
  const requestGateway = createGateway(options.requestProcessors || []);
  const responseGateway = createGateway(options.responseProcessors || []);

  async function request(input, context = {}) {
    const preparedInput = input instanceof HttpRequest ? input : new HttpRequest(input);
    const preparedRequest = await requestGateway.process(preparedInput, context);
    const response = await client.send(preparedRequest);
    return responseGateway.process(response, {
      ...context,
      request: preparedRequest
    });
  }

  return {
    request,
    get(url, options = {}, context = {}) {
      return request(new HttpRequest({ ...options, method: "GET", url }), context);
    },
    post(url, body, options = {}, context = {}) {
      return request(new HttpRequest({ ...options, method: "POST", url, body }), context);
    },
    put(url, body, options = {}, context = {}) {
      return request(new HttpRequest({ ...options, method: "PUT", url, body }), context);
    },
    patch(url, body, options = {}, context = {}) {
      return request(new HttpRequest({ ...options, method: "PATCH", url, body }), context);
    },
    delete(url, body, options = {}, context = {}) {
      return request(new HttpRequest({ ...options, method: "DELETE", url, body }), context);
    }
  };
}
