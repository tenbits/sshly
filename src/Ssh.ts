import { File, env } from 'atma-io'
import { Client, SFTPWrapper } from 'ssh2'
import memd from 'memd'
import { class_Uri } from 'atma-utils';

export class Ssh {

    client = new Client();

    constructor(public opts: {
        host: string
        port?: number | 22
        username?: string | 'root'
        password?: string
        privateKeyPath: string
        passphrase?: string
    }) {


    }


    async exec(command: string, params?: {
        onStdout: (line: string) => void,
        onStderr: (line: string) => void,
    }): Promise<{ code, stdout, stderr, signal?}> {

        await this.connect();
        return new Promise((resolve, reject) => {
            let stdout = [];
            let stderr = [];
            this.client.exec(command, (err, stream) => {
                if (err) {
                    reject(err);
                    return;
                }

                stream
                    .on('close', (code, signal) => {
                        resolve({
                            code,
                            signal,
                            stdout,
                            stderr
                        })
                    })
                    .on('data', (data) => {
                        let line = data.toString();
                        stdout.push(line);
                        params?.onStdout?.(line?.trim());
                    })
                    .stderr
                    .on('data', (data) => {
                        let line = data.toString();
                        stderr.push(line);
                        params?.onStderr?.(line?.trim());
                    });
            });
        });
    }

    async readAsync(remotePath: string): Promise<string> {
        let { localPath } = await this.download(remotePath);

        let path = `file://${localPath}`;
        let content = await File.readAsync<Buffer>(path, { skipHooks: true, encoding: 'binary' });

        File.removeAsync(path).then(_ => { }, e => { });
        return content.toString();
    }

    async writeAsync(remotePath: string, content: string | Buffer): Promise<void> {

        let localPath = new class_Uri(env.getTmpPath(Date.now() + '' + (Math.random() * 10 ** 5 | 0))).toLocalFile();
        await File.writeAsync(`file://${localPath}`, content);
        await this.upload(localPath, remotePath);
        await File.removeAsync(`file://${localPath}`);
    }

    async download(remotePath: string, localPath?: string, opts?: {
        onProgress?: (total_transferred: number, chunk: number, total: number) => void
    }): Promise<{ localPath }> {

        let sftp = await this.sftp();

        if (localPath == null) {
            let filename = new class_Uri(`file://` + remotePath).file;
            localPath = new class_Uri(env.getTmpPath(filename)).toLocalFile();
        }

        await cb_toPromise<SFTPWrapper, [string, string, any]>(sftp, sftp.fastGet, remotePath, localPath, { step: opts?.onProgress })
        return { localPath };
    }

    async upload(localPath: string, remotePath: string, opts?: {
        mode?: number | string
        onProgress?: (total_transferred: number, chunk: number, total: number) => void
    }): Promise<{}> {

        let sftp = await this.sftp();
        return new Promise((resolve, reject) => {
            sftp.fastPut(localPath, remotePath, { mode: opts?.mode, step: opts?.onProgress }, async (err) => {
                if (err) {
                    if (/No such file/i.test(err.message)) {
                        let directory = remotePath.replace(/\/[^\/]+$/, '');
                        await this.mkdir(directory);
                        this.upload(localPath, remotePath, opts).then(resolve, reject);
                        return;
                    }
                    reject(err);
                    return;
                }
                resolve({});
            });
        });
    }

    async remove(remotePath: string): Promise<void> {
        let sftp = await this.sftp();
        await cb_toPromise(sftp, sftp.unlink, remotePath);
    }

    async chmod(remotePath: string, mode: string): Promise<void> {

    }

    async mkdir(remotePath: string): Promise<void> {
        await this.exec(`mkdir -p ${remotePath}`);
    }

    close() {
        this.client.end();
    }

    @memd.deco.memoize()
    private async connect() {
        this.onReady();
        this.client.connect({
            host: this.opts.host,
            port: this.opts.port ?? 22,
            username: this.opts.username ?? 'root',
            password: this.opts.password ?? void 0,
            passphrase: this.opts.passphrase ?? void 0,
            privateKey: await File.readAsync(this.opts.privateKeyPath, { encoding: 'binary' })
        });

        return this.onReady();
    }

    @memd.deco.memoize()
    private async onReady() {
        return new Promise((resolve, reject) => {
            this.client.on('ready', () => {
                resolve(null);
            })
        })
    }

    private async sftp(): Promise<SFTPWrapper> {
        await this.connect();
        return new Promise((resolve, reject) => {
            this.client.sftp(async (err, sftp) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(sftp);
            });
        });
    }
}


type TCallback<TResult = any> = (error: Error, result?: TResult) => void
type TFnWithCallback<TArgs extends any[], TResult> = (...args: [...TArgs, TCallback<TResult>]) => void
function cb_toPromise<TResult, TArgs extends any[]>(ctx: any, fn: TFnWithCallback<TArgs, TResult>, ...args: TArgs): Promise<TResult> {
    return new Promise((resolve, reject) => {
        fn.call(ctx, ...args, (error, result) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(result);
        });
    });
}
