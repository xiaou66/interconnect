# 互联 SDK

## 介绍
本仓库采用本地管道通信，并提供一套客户端和服务端的 SDK。

## 客户端
- 目录: packages/client

### 安装

```shell
npm install @xiaou66/interconnect-client
```
```shell
yarn add @xiaou66/interconnect-client
```
```shell
pnpm add @xiaou66/interconnect-client
```
### 快速使用

```typescript
const { ServiceClient } = require('@xiaou66/interconnect-client');
const path = require('path');
const pipPath = '具体的提供服务的软件/插件提供';
try {
  const client = new ServiceClient(require('net'),
    path.join(pipPath, 'picture-bed-plus'),
    '当前软件/插件名');
  
  const res: ConfigItem[] = await client.callServiceMethod('服务提供者,提供服务名称');
}catch (e) {
  // 链接失败, 可以做出提醒或者使用跳转「图床 Plus」插件上传
}
```


## 服务端
- 目录: packages/service

### 安装
```shell
npm install @xiaou66/interconnect-service
```
```shell
yarn add @xiaou66/interconnect-service
```
```shell
pnpm add @xiaou66/interconnect-service
```

### 快速使用
#### 第一步 初始化服务
```typescript
const { InterconnectService } = require('@xiaou66/interconnect-service');
const path = require('path');
const fs = require('fs');
// 管道目录
const pipDir = path.join(utools.getPath('userData'), '.pip');
// 目录是否存在
FileUtils.createDirIfAbsent(pipDir);
window.linkService = new InterconnectService(window.path.join(pipDir, '管道名称'),
  require('net'), (path) => {
    if (fs.existsSync(path)) {
      fs.rmSync(path);
    }
});
```
#### 第二步 提供服务
```typescript
import { ServiceMessageEvent } from '@xiaou66/interconnect-service'
window.linkService.addServiceEventListener('service.具体名称',
  (e: ServiceMessageEvent) => {
  // TODO 处理函数
})
```
#### 第三步 开启服务
```typescript
window.linkService.start();
```

当然在开启服务后也可以继续添加提供服务的函数
