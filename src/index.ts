import { PromiseAPlus } from "./promise";
import promisesAplusTests from "promises-aplus-tests";

Object.assign(PromiseAPlus, {
  deferred: () => {
    let provider = {};
    return Object.assign(provider, {
      promise: new Promise((resolve, reject) => {
        Object.assign(provider, { resolve, reject });
      }),
    });
  },
});

promisesAplusTests(PromiseAPlus, console.log);
