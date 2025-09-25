import chalk from 'chalk';

export enum LogLevel {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  DEBUG = 'debug',
}

export class Logger {
  private static instance: Logger;
  private context: string;

  private constructor(context: string = 'App') {
    this.context = context;
  }

  public static getInstance(context?: string): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(context);
    }
    if (context) {
      Logger.instance.context = context;
    }
    return Logger.instance;
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    ...args: unknown[]
  ): string {
    const timestamp = new Date().toISOString().substring(11, 23);
    const contextStr = chalk.blue(`[${this.context}]`);
    const timeStr = chalk.gray(`[${timestamp}]`);

    let levelStr: string;
    let messageStr = message;

    switch (level) {
      case LogLevel.INFO:
        levelStr = chalk.cyan('[INFO]');
        break;
      case LogLevel.SUCCESS:
        levelStr = chalk.green('[SUCCESS]');
        break;
      case LogLevel.WARNING:
        levelStr = chalk.yellow('[WARNING]');
        break;
      case LogLevel.ERROR:
        levelStr = chalk.red('[ERROR]');
        messageStr = chalk.red(message);
        break;
      case LogLevel.DEBUG:
        levelStr = chalk.magenta('[DEBUG]');
        break;
      default:
        levelStr = chalk.white('[LOG]');
    }

    const formattedArgs =
      args.length > 0
        ? ' ' +
          args
            .map((arg) =>
              typeof arg === 'object'
                ? JSON.stringify(arg, null, 2)
                : String(arg),
            )
            .join(' ')
        : '';

    return `${timeStr} ${contextStr} ${levelStr} ${messageStr}${formattedArgs}`;
  }

  public info(message: string, ...args: unknown[]): void {
    console.log(this.formatMessage(LogLevel.INFO, message, ...args));
  }

  public success(message: string, ...args: unknown[]): void {
    console.log(this.formatMessage(LogLevel.SUCCESS, message, ...args));
  }

  public warning(message: string, ...args: unknown[]): void {
    console.log(this.formatMessage(LogLevel.WARNING, message, ...args));
  }

  public error(message: string, ...args: unknown[]): void {
    console.error(this.formatMessage(LogLevel.ERROR, message, ...args));
  }

  public debug(message: string, ...args: unknown[]): void {
    console.log(this.formatMessage(LogLevel.DEBUG, message, ...args));
  }

  public separator(char: string = '=', length: number = 50): void {
    const separator = char.repeat(length);
    console.log(chalk.gray(separator));
  }

  public step(stepNumber: number, title: string): void {
    const stepStr = chalk.blue(`[步骤${stepNumber}]`);
    const titleStr = chalk.bold(title);
    console.log(`\n${stepStr} ${titleStr}`);
  }

  public toolCall(toolName: string, args?: unknown): void {
    const toolStr = chalk.cyan(`[工具调用]`);
    const nameStr = chalk.bold(toolName);
    const argsStr = args
      ? chalk.gray(`参数: ${JSON.stringify(args, null, 2)}`)
      : '';
    console.log(`${toolStr} ${nameStr} ${argsStr}`);
  }

  public toolResult(success: boolean, result?: unknown): void {
    const resultStr = success
      ? chalk.green('[工具结果]')
      : chalk.red('[工具失败]');
    const statusStr = success ? chalk.green('成功') : chalk.red('失败');
    const resultContent = result
      ? chalk.gray(`结果: ${JSON.stringify(result, null, 2)}`)
      : '';
    console.log(`${resultStr} ${statusStr} ${resultContent}`);
  }

  public performance(operation: string, duration: number): void {
    const perfStr = chalk.blue('[性能]');
    const opStr = chalk.bold(operation);
    const durationStr = chalk.yellow(`${duration}ms`);
    console.log(`${perfStr} ${opStr} 执行时间: ${durationStr}`);
  }
}
