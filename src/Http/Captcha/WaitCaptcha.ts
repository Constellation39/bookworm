import { sleep } from '../../index';
import IHttpClient from '../IHttpClient';
import IHttpRequest from '../IHttpRequest';

export default class WaitCaptcha implements IHttpRequest<string> {
    constructor(private readonly captchaKey: string, private readonly resultKey: string) {
    }

    public async execute(client: IHttpClient): Promise<string> {
        let stop = false;

        setTimeout(() => {
            stop = true;
        }, 1000 * 300);

        // tslint:disable-next-line:no-constant-condition
        while (true) {
            const { status, request }: { status: number, request: string } = await client.execute({
                url: 'https://2captcha.com/res.php',
                qs: {
                    key: this.captchaKey,
                    action: 'get',
                    id: this.resultKey,
                    json: 1,
                },
                json: true,
            });
            if (status === 1) {
                return request;
            } else if (status === 0) {
                if (stop) {
                    throw new Error('Waiting for https://2captcha.com/res.php response timeout');
                }
                await sleep(2000);
            } else {
                throw new Error(`WaitCaptcha response status: ${status}`);
            }
        }
    }
}
