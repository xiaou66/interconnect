import type { IMessage } from './index';

export interface IMessageResult {
  /**
   * 执行状态
   */
  code: number;

  errorMsg?: string;

  /**
   * 行为
   */
  action: string;

  data?: any;
}
/**
 * 链接消息
 */
export class ServiceMessageEvent<T = any> extends CustomEvent<any> {
  public params: T = {} as T;
  private message: IMessage<T>;
  private socket: any;

  /**
   * 返回数据
   */
  private __returnResult?: any;

  private __errorResult?: { code: number; message: string };

  constructor(message: IMessage<T>, socket: any) {
    super(message.action)
    this.params = message.params;
    this.message = message;
    this.socket = socket;
  }


  private sendSuccess(data: any) {
    this.socket.write(JSON.stringify({
      code: 0,
      action: this.message.action,
      data,
    } as IMessageResult));
  }

  private sendError(code: number, errorMsg: any) {
    this.socket.write(JSON.stringify({
      code,
      action: this.message.action,
      errorMsg,
    } as IMessageResult));
  }

  set errorResult(errorResult: { code: number; message: string }) {
    this.sendError(errorResult.code, errorResult.message);
  }

  set returnResult(data: any) {
    this.sendSuccess(data);
  }



  dispatch() {
    window.dispatchEvent(this)
    return this
  }
}
