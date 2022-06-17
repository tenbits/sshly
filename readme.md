# SSHly

A wrapper over the [ssh2](https://www.npmjs.com/package/ssh2) module to make the API a little bit easier.


```bash
npm i sshly
```

```ts
import { Ssh } from 'sshly'

const client = new Ssh({
    host: 'IP',
    privateKeyPath: 'my/private/key'
});


// Execute command
let { code, stdout, stderr } = await client.exec('whoami');

// Read file
let content: string = await client.readAsync('/etc/nginx/sites-available/default');

// Write to file
await client.writeAsync('/etc/nginx/sites-available/default', content);

```
