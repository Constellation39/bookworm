import IHttpClient from '../IHttpClient';
import IHttpRequest from '../IHttpRequest';

export default class InCaptcha implements IHttpRequest<string> {
    private readonly url = 'https://member.bookwalker.jp/app/03/login';

    constructor(private readonly captchaKey: string, private readonly siteKey: string) {
    }

    public execute(client: IHttpClient): Promise<string> {
        return client.execute({
            url: 'https://2captcha.com/in.php',
            qs: {
                key: this.captchaKey,
                method: 'userrecaptcha',
                googlekey: this.siteKey,
                pageurl: this.url,
                json: 1,
            },
            json: true,
        }).then(({ request }: { status: number, request: string }) => {
            return request;
        });
    }
}
