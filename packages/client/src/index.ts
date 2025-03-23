import type Net from "node:net";

export interface IMessageResult<T=any> {
  /**
   * 执行状态
   */
  code: number;

  errorMsg?: string;

  /**
   * 行为
   */
  action: string;

  data?: T;
}



export interface  ICallServiceMethodOptions {
  timeout?: number;
}

export class ServiceClient {
  private __net: typeof Net;
  private __pipeName;
  private __pluginName;

  /**
   * 调用服务
   * @param net node:net
   * @param pipeName 管道名称
   * @param pluginName 自身插件名称
   * @param isWindow 是否是 window utools 环境不需要传递
   */
  constructor(net: any, pipeName: string, pluginName: string, isWindow?: boolean) {
    // 兼容之前版本问题
    if (pipeName.split("\\")[0].length > 1) {
      const paths = pipeName.split("\\");
      pipeName = paths[paths.length - 1];
    } else if (pipeName.split("/").length > 1) {
      const paths = pipeName.split("/");
      pipeName = paths[paths.length - 1];
    }
    this.__net = net;
    if(isWindow === undefined) {
      if (!window.utools) {
        throw new Error("Interconnect service requires isWindow parameter");
      }
      isWindow = utools.isWindows();
    }

    if (isWindow) {
      this.__pipeName = `\\\\.\\pipe\\${pipeName}`;
    } else {
      const tempPath = utools.getPath('temp').endsWith('/') ? utools.getPath('temp') : `${utools.getPath('temp')}/`;
      this.__pipeName = tempPath + pipeName;
    }
    console.log('pipeName', this.__pipeName);
    this.__pluginName = pluginName;
  }

  /**
   * 调用服务
   * @param action 调用方法
   * @param params 方法参数
   * @param options
   */
   callServiceMethod<T>(action: string,
                        params: any = {},
                        options: ICallServiceMethodOptions = {}): Promise<T | undefined> {
    const {timeout = 15 * 1000} = options;
    return new Promise((resolve, reject) => {
      try {

        const client = this.__net.connect(this.__pipeName, () => {
          // 发送消息
          client.write(JSON.stringify({
            action,
            pluginName: this.__pluginName,
            params,
          }));
        });

        let dataBuffer: string | undefined = ''; // 用于缓存接收到的数据

        const timer = setTimeout(() => {
          client.end();
          reject(new Error("time out"));
        }, timeout);

        client.on('data', (chunk: any) => {
          console.log('data', chunk)
          try {
            // 将新接收的数据追加到缓存
            dataBuffer += chunk.toString();
            // 尝试解析完整的 JSON
            const obj = JSON.parse(dataBuffer!) as IMessageResult;
            dataBuffer = undefined;
            // 如果解析成功，说明数据接收完整
            clearTimeout(timer);
            client.end();
            if (obj.code === 0) {
              resolve(obj.data);
            } else {
              reject({
                code: obj.code,
                errorMsg: obj.errorMsg,
              });
            }
          } catch (e) {
            // JSON 解析失败，说明数据还未接收完整
            // 继续等待更多数据
          }
        });

        client.on('error', (err: any) => {
          clearTimeout(timeout);
          client.end();
          reject(err);
        });
      }catch (e) {
        reject(e);
      }
    });
  }
}
