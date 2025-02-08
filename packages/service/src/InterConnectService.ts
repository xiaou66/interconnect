import { ServiceMessageEvent } from "./LinkMessageEvent";
import type Net from "node:net";

export interface IMessage<T> {
  /**
   * 插件名称
   */
  pluginName: string,
  /**
   * 行为
   */
  action: string,
  /**
   * 参数
   */
  params?: any;
}

function isLinkMessageEvent(obj: Event): obj is ServiceMessageEvent {
  return obj instanceof ServiceMessageEvent
}

type CleanPipPathType = (pipPath: string) => void;

export class InterConnectService {
  private readonly __pipPath: string;
  private __service?: any;
  private readonly __net: typeof Net;
  private readonly __clean?: CleanPipPathType;

  /**
   *
   * @param pipPath 传递的目录必须存在
   * @param net net 库
   * @param clean 可以清理之前自动清理掉的管道文件
   */
  constructor(pipPath: string, net: typeof Net, clean?: CleanPipPathType) {
    this.__net = net;
    this.__pipPath = pipPath;
    this.__clean = clean;
  }

  /**
   * 启动服务
   */
  async start() {
    if (this.status) {
      return;
    }
    this.__service = this.createServer();
    console.log('this.__service', this.__service);

    return new Promise((resolve, reject) => {
      try {
        this.__clean && this.__clean(this.__pipPath);
        this.__service.listen(this.__pipPath, () => {
          resolve(1)
        });
      }catch (e) {
        reject(e);
      }
    });
  }

  /**
   * 创建管道服务
   * @private
   */
  private createServer() {
    return this.__net.createServer((socket: any) => {
      let dataBuffer = ''; // 用于缓存数据
      socket.on('data', (data: any) => {
        dataBuffer += data.toString();
        console.log('data', dataBuffer);
        try {
          // 尝试解析完整的 JSON
          const message = JSON.parse(dataBuffer) as IMessage<any>;
          console.log()
          // 解析成功,重置缓存
          dataBuffer = '';
          try {
            new ServiceMessageEvent(message, socket).dispatch();
          } catch (e: any) {
            socket.write(JSON.stringify({
              code: 400,
              error: e.message,
            }));
          }
        } catch (e) {
          // JSON 解析失败,继续等待数据
        }
      });

      socket.on('error', (e: any) => {
        console.log('服务出现异常', e);
      });

      socket.on('end', () => {
        console.log('客户端已断开连接');
      });
    })
  }

  /**
   * 停止服务
   */
  async stop() {
    if (!this.status) {
      return;
    }
    return new Promise((resolve, reject) => {
      try {
        this.__service.close(() => {
          return resolve(1);
        })
      }catch (e) {
        return reject(e);
      } finally {
        this.__service = undefined;
      }
    });
  }

  get status(): boolean {
    return !!this.__service;
  }

  /**
   * 添加服务处理
   * @param type 处理服务类型
   * @param event 事件
   */
  addServiceEventListener(type: string, event: (e: ServiceMessageEvent) => void) {
    if (!type.startsWith("service.")) {
      throw Error('必须 service. 开头')
    }

    window.addEventListener(type, (e) => {
      if (isLinkMessageEvent(e)) {
        event(e)
      }
    })
  }
}
