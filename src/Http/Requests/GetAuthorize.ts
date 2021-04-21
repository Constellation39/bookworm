import * as cheerio from 'cheerio';
import IHttpClient from '../IHttpClient';
import IHttpRequest from '../IHttpRequest';

export default class GetAuthorize implements IHttpRequest<string> {

    public constructor(private readonly bookId: string) {
    }

    public execute(client: IHttpClient): Promise<string> {
        return client.execute({
            url: 'https://member.bookwalker.jp/app/03/webstore/cooperation',
            qs: {
                r: this.bookId,
            },
            transform(body) {
                return cheerio.load(body);
            },
        }).then(($: cheerio.Root) => {
            const link = $('div.main-conducts-btn.main-conducts-btn--open > a').attr('href');
            if (link) {
                return link as string;
            }
            return this.subscription(client, this.bookId.slice(2));
        });
    }

    private async subscription(client: IHttpClient, uuid: string): Promise<string> {
        return await client.execute({
            url: 'https://bookwalker.jp/prx/subscription-check',
            qs: {
                uuid,
            },
            json: true,
        }).then(({ anchorUrl }: { anchorUrl: string }) => {
            if (anchorUrl) {
                return anchorUrl;
            }
            throw new Error('bookLink not found');
        });
    }
}
