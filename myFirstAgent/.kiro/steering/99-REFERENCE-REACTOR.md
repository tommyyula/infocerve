---
inclusion: fileMatch
fileMatchPattern: "**/gateway/**/*.java,**/*Reactive*.java,**/*Flux*.java,**/*Mono*.java"
---

# Reactor 响应式编程检查清单

> 教训来源：WCS-1645 Gateway 重复认证问题

---

## 核心陷阱：冷流多次订阅

### 问题
```java
// 错误：switchIfEmpty 可能导致上游流被重新订阅
return getTokenByValue(token)
    .flatMap(tokenInfo -> buildRequest(tokenInfo))
    .switchIfEmpty(Mono.defer(() -> {
        // 上游已成功后仍可能被触发！
        return validateTokenViaRpc(token);
    }));
```

### 解决方案
```java
// 正确：使用 .cache() 防止多次订阅
return getTokenByValue(token)
    .cache()  // 关键！
    .flatMap(tokenInfo -> buildRequest(tokenInfo))
    .switchIfEmpty(Mono.defer(() -> validateTokenViaRpc(token)));
```


---

## 常见陷阱检查清单

多次订阅
- 错误：mono.subscribe() 多次
- 正确：.cache()

switchIfEmpty 副作用
- 错误：直接执行
- 正确：先 .cache()

阻塞操作
- 错误：Mono.just(blocking())
- 正确：Mono.fromCallable().subscribeOn(Schedulers.boundedElastic())

flatMap 返回 null
- 错误：return null
- 正确：return Mono.empty()

---

## 推荐模式

### hasElement() + flatMap（替代 switchIfEmpty）
```java
Mono<TokenInfo> tokenMono = getTokenByValue(token).cache();

return tokenMono.hasElement()
    .flatMap(hasToken -> {
        if (hasToken) {
            return tokenMono.flatMap(this::processToken);
        } else {
            return fallbackToRpc(token);
        }
    });
```

### 阻塞操作切换线程
```java
return Mono.fromCallable(() -> blockingService.call())
    .subscribeOn(Schedulers.boundedElastic());
```

---

## 记住

- 冷流：每次订阅都重新执行
- 热流：.cache() 共享执行结果
- switchIfEmpty 可能导致上游重新订阅
- 阻塞操作必须切换到弹性线程池

---

教训来源：WCS-1645
最后更新：2025-12-22
