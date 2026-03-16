import {
  createBlueFissionApp,
  createModule,
  createSignal,
  bindText,
  bindValue
} from "../src/index.js";

const app = createBlueFissionApp({
  apiBaseUrl: "/api",
  resources: {
    user: "users"
  }
});

const name = createSignal("Reactor");

bindText("[data-message]", name);
bindValue("[name='name']", name);

const helloModule = createModule("hello", {
  start() {
    console.log("hello module started");
  }
});

app.start(helloModule);

window.app = app;
