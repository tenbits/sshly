
// source ./RootModule.js
(function(){
	
	var _src_Ssh = {};
var _src_SshActions = {};

// source ./ModuleSimplified.js
var _src_Ssh;
(function () {
    // ensure AMD is not active for the model, so that any UMD exports as commonjs
    var define = null;
    var exports = _src_Ssh != null ? _src_Ssh : {};
    var module = { exports: exports };

    "use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ssh = void 0;
const atma_io_1 = require("atma-io");
const ssh2_1 = require("ssh2");
const memd_1 = require("memd");
const atma_utils_1 = require("atma-utils");
class Ssh {
    constructor(opts) {
        this.opts = opts;
        this.client = new ssh2_1.Client();
    }
    async exec(command, params) {
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
                    });
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
    async readAsync(remotePath) {
        let { localPath } = await this.download(remotePath);
        let path = `file://${localPath}`;
        let content = await atma_io_1.File.readAsync(path, { skipHooks: true, encoding: 'binary' });
        atma_io_1.File.removeAsync(path).then(_ => { }, e => { });
        return content.toString();
    }
    async writeAsync(remotePath, content) {
        let localPath = new atma_utils_1.class_Uri(atma_io_1.env.getTmpPath(Date.now() + '' + (Math.random() * 10 ** 5 | 0))).toLocalFile();
        await atma_io_1.File.writeAsync(`file://${localPath}`, content);
        await this.upload(localPath, remotePath);
        await atma_io_1.File.removeAsync(`file://${localPath}`);
    }
    async download(remotePath, localPath, opts) {
        let sftp = await this.sftp();
        if (localPath == null) {
            let filename = new atma_utils_1.class_Uri(`file://` + remotePath).file;
            localPath = new atma_utils_1.class_Uri(atma_io_1.env.getTmpPath(filename)).toLocalFile();
        }
        await cb_toPromise(sftp, sftp.fastGet, remotePath, localPath, { step: opts?.onProgress });
        return { localPath };
    }
    async upload(localPath, remotePath, opts) {
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
    async remove(remotePath) {
        let sftp = await this.sftp();
        await cb_toPromise(sftp, sftp.unlink, remotePath);
    }
    async chmod(remotePath, mode) {
    }
    async mkdir(remotePath) {
        await this.exec(`mkdir -p ${remotePath}`);
    }
    close() {
        this.client.end();
    }
    async connect() {
        this.onReady();
        this.client.connect({
            host: this.opts.host,
            port: this.opts.port ?? 22,
            username: this.opts.username ?? 'root',
            password: this.opts.password ?? void 0,
            passphrase: this.opts.passphrase ?? void 0,
            privateKey: await atma_io_1.File.readAsync(this.opts.privateKeyPath, { encoding: 'binary' })
        });
        return this.onReady();
    }
    async onReady() {
        return new Promise((resolve, reject) => {
            this.client.on('ready', () => {
                resolve(null);
            });
        });
    }
    async sftp() {
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
__decorate([
    memd_1.default.deco.memoize()
], Ssh.prototype, "connect", null);
__decorate([
    memd_1.default.deco.memoize()
], Ssh.prototype, "onReady", null);
exports.Ssh = Ssh;
function cb_toPromise(ctx, fn, ...args) {
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
//# sourceMappingURL=Ssh.js.map
//# sourceMappingURL=Ssh.ts.map;

    function __isObj(x) {
        return x != null && typeof x === 'object' && x.constructor === Object;
    }
    if (_src_Ssh === module.exports) {
        // do nothing if
    } else if (__isObj(_src_Ssh) && __isObj(module.exports)) {
        Object.assign(_src_Ssh, module.exports);
    } else {
        _src_Ssh = module.exports;
    }

    ;
}());

// end:source ./ModuleSimplified.js


// source ./ModuleSimplified.js
var _src_SshActions;
(function () {
    // ensure AMD is not active for the model, so that any UMD exports as commonjs
    var define = null;
    var exports = _src_SshActions != null ? _src_SshActions : {};
    var module = { exports: exports };

    "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SshActions = void 0;
const Ssh_1 = _src_Ssh;
const atma_io_1 = require("atma-io");
class SshActions {
    constructor(options) {
        this.options = options;
        this.ssh = new Ssh_1.Ssh(this.options.ssh);
        this.handlers = [
            new UploadModifiedAction(this.ssh, this.options.params),
            new NginxAction(this.ssh, this.options.params),
        ];
    }
    async execute(actions) {
        let handlerRgx = /^:(?<name>\w+)/;
        for (let action of actions) {
            let handlerMatch = handlerRgx.exec(action);
            if (handlerMatch == null) {
                await this.execCommand(action);
                continue;
            }
            let name = handlerMatch.groups.name;
            let params = action.replace(handlerRgx, '').trim();
            let handler = this.handlers.find(x => x.canHandle(name));
            if (handler == null) {
                throw new Error(`Handler ${name} not found`);
            }
            await handler.process(params);
        }
    }
    async execCommand(command) {
        console.log(`\n\n\nRUN: ${command}`);
        let result = await this.ssh.exec(command, {
            onStderr(line) {
                console.error(`REMOTE ERROR`, line);
            },
            onStdout(line) {
                console.error(`REMOTE`, line);
            },
        });
        console.log(`Completed ${command}. Return Code: ${result.code}\n\n`);
    }
}
exports.SshActions = SshActions;
class UploadModifiedAction {
    constructor(ssh, fileParams) {
        this.ssh = ssh;
        this.fileParams = fileParams;
    }
    canHandle(name) {
        return name === 'upload';
    }
    async process(params) {
        let [from, to] = params.split(' ');
        let time = Date.now();
        console.log(`Upload ${from} ${to}`);
        let content = await atma_io_1.File.readAsync(from, { skipHooks: true, encoding: 'utf8' });
        content = content.replace(/%(?<field>[\w\.]+)%/g, (match, field) => {
            let value = this.fileParams[field];
            if (value == null) {
                throw new Error(`Value undefined ${field}`);
            }
            return value;
        });
        await this.ssh.writeAsync(to, content);
        console.log(`Upload OK in ${Date.now() - time}ms`);
    }
}
class NginxAction {
    constructor(ssh, fileParams) {
        this.ssh = ssh;
        this.fileParams = fileParams;
    }
    canHandle(name) {
        return name === 'nginx';
    }
    async process(templatePath) {
        console.log(`Upload ngix ${templatePath}`);
        let time = Date.now();
        let content = await atma_io_1.File.readAsync(templatePath, { skipHooks: true, encoding: 'utf8' });
        content = content.replace(/%(?<field>[\w\.]+)%/g, (match, field) => {
            let value = this.fileParams[field];
            if (value == null) {
                throw new Error(`Value undefined ${field}`);
            }
            return value;
        });
        let to = `/etc/nginx/sites-available/default`;
        await this.ssh.writeAsync(to, content);
        console.log(`Upload OK in ${Date.now() - time}ms`);
    }
}
//# sourceMappingURL=SshActions.js.map
//# sourceMappingURL=SshActions.ts.map;

    function __isObj(x) {
        return x != null && typeof x === 'object' && x.constructor === Object;
    }
    if (_src_SshActions === module.exports) {
        // do nothing if
    } else if (__isObj(_src_SshActions) && __isObj(module.exports)) {
        Object.assign(_src_SshActions, module.exports);
    } else {
        _src_SshActions = module.exports;
    }

    ;
}());

// end:source ./ModuleSimplified.js

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SshActions = exports.Ssh = void 0;
var Ssh_1 = _src_Ssh;
Object.defineProperty(exports, "Ssh", { enumerable: true, get: function () { return Ssh_1.Ssh; } });
var SshActions_1 = _src_SshActions;
Object.defineProperty(exports, "SshActions", { enumerable: true, get: function () { return SshActions_1.SshActions; } });
//# sourceMappingURL=exports.js.map
//# sourceMappingURL=exports.ts.map

}());
// end:source ./RootModule.js
