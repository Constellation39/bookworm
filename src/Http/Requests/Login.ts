import IHttpClient from '../IHttpClient';
import IHttpRequest from '../IHttpRequest';

export default class Login implements IHttpRequest<boolean> {
    constructor(private readonly login: string, private readonly password: string, private option: { [x: string]: string }) {
    }

    public async execute(client: IHttpClient): Promise<boolean> {
        const response = await client.execute({
            url: 'https://member.bookwalker.jp/app/j_spring_security_check',
            method: 'POST',
            form: {
                j_username: this.login,
                j_password: this.password,
                j_platform_code: '03',
                loginBtn: 'login',
                ...this.option,
            },
            headers: {
                Referer: 'https://member.bookwalker.jp/app/03/login',
            },
            followRedirect: false,
            resolveWithFullResponse: true,
        });

        return response.headers.location.indexOf('my/profile') >= 0;
    }
}
