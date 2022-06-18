### Promise-A-Plus


```txt
promiseA+: node / ts
```

### Debug

```bash
npm i

npm start
```


### Testing

```bash
npm run test
```

###  Note

##### Promise 实现过程中需要注意的几个细节

```txt
* executor
  1. executor 中报错视为 reject; (try...catch)
  2. executor 中是可以异步执行 resolve / reject; (先订阅后发布)

* resolve
  1. resolve 参数中可以是嵌套 promise

* then
  1. promise.then 可以链式调用; (return new Promise)
  3. promise.then 没有传 onRejected 默认会往下传递 reason;
  3. promise.catch 是没有 onFulfilled 的 then;

* onFulfilled / onRejected
  1. 返回值可以是普通值, 也可以是 promise
  2. 可以 throw new Error()
  3. 异步执行
```

### Refer

```
refer: https://promisesaplus.com/
```