import cheerio from 'cheerio';
import IHttpClient from '../IHttpClient';
import IHttpRequest from '../IHttpRequest';

export default class StartSession implements IHttpRequest<string> {
    public execute(client: IHttpClient): Promise<string> {
        return client.execute({
            url: 'https://member.bookwalker.jp/app/03/login',
            transform(body) {
                return cheerio.load(body);
            },
        }).then($ => {
            return $('#recaptchaLoginBtn').attr('data-sitekey');
        });
    }
}
