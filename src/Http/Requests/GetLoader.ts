import vm from 'vm';
import IHttpClient from '../IHttpClient';
import IHttpRequest from '../IHttpRequest';
import { IGlobalConfig } from './GetConfig';

// tslint:disable-next-line:function-name
function _eval(code: string): string {
    const ctx: any = { c4g: null };
    const script = new vm.Script(code, { filename: 'GetLoader' });
    script.runInNewContext(ctx);
    return ctx.c4g();
}

export default class GetLoader implements IHttpRequest<string> {
    public constructor(private readonly config: IGlobalConfig) {
    }

    public async execute(client: IHttpClient): Promise<string> {

        return await client.execute({
            url: this.config.SERVER_DOMAIN + '/03/getLoader',
        }).then((body: string) => {
            const data = body.match(/c4g=function\(\)\{.+'\;\}/g);
            if (data == null) {
                throw new Error('function c4g not found');
            }
            return _eval(data[0]);
        });
    }
}
