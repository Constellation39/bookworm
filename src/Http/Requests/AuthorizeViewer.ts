import IHttpClient from '../IHttpClient';
import IHttpRequest from '../IHttpRequest';

export default class AuthorizeViewer implements IHttpRequest<string> {
    public static readonly REFERER = 'https://global.bookwalker.jp/holdBooks/';

    public constructor(private readonly link: string) {
    }


    public execute(client: IHttpClient): Promise<string> {
        return client.execute({
            url: this.link,
            headers: {
                Referer: AuthorizeViewer.REFERER,
            },
            resolveWithFullResponse: true,
        }).then(response => {
            return response.request.href;
        });
    }
}
