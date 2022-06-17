import { Ssh } from './Ssh';
import { File } from 'atma-io'

export class SshActions {

    ssh = new Ssh(this.options.ssh);

    handlers: IActionHandler[] = [
        new UploadModifiedAction(this.ssh, this.options.params),
        new NginxAction(this.ssh, this.options.params),
    ]

    constructor (public options: {
        ssh: ConstructorParameters<typeof Ssh>[0],
        params: any
    }) {

    }


    async execute (actions: string[]) {
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


    private async execCommand (command: string) {
        console.log(`\n\n\nRUN: ${command}`);
        let result = await this.ssh.exec(command, {
            onStderr (line) {
                console.error(`REMOTE ERROR`, line);
            },
            onStdout(line) {
                console.error(`REMOTE`, line);
            },
        });
        console.log(`Completed ${command}. Return Code: ${result.code}\n\n`);
    }
}

interface IActionHandler {
    canHandle(name: string): boolean
    process (params: string): Promise<void>
}

class UploadModifiedAction {
    constructor (public ssh: Ssh, public fileParams) {

    }
    canHandle (name) {
        return name === 'upload';
    }
    async process (params) {
        let [from, to] =  params.split(' ');
        let time = Date.now();
        console.log(`Upload ${from} ${to}`);

        let content = await File.readAsync<string>(from, { skipHooks: true, encoding: 'utf8' });

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
    constructor (public ssh: Ssh, public fileParams) {

    }
    canHandle (name) {
        return name === 'nginx';
    }
    async process (templatePath: string) {
        console.log(`Upload ngix ${templatePath}`);

        let time = Date.now();
        let content = await File.readAsync<string>(templatePath, { skipHooks: true, encoding: 'utf8' });

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
