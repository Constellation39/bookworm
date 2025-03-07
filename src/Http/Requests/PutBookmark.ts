import IContentAuth from '../IContentAuth';
import IHttpClient from '../IHttpClient';
import IHttpRequest from '../IHttpRequest';
import { IGlobalConfig } from './GetConfig';

export default class PutBookmark implements IHttpRequest<IContentAuth> {
    constructor(
        private readonly config: IGlobalConfig,
        private readonly auth: IContentAuth,
        private readonly contentId: string,
        private readonly pageId: string,
        private readonly nextPageId: string,
    ) {
    }

    public async execute(client: IHttpClient): Promise<IContentAuth> {
        const url = new URL(this.config.SERVER_DOMAIN);

        const response = await client.execute({
            url: this.config.SERVER_DOMAIN + this.config.WEBAPI_PUT_BOOKMARK,
            method: 'POST',
            form: {
                cid: this.contentId,
                u1: client.getU1(url.origin),
                BID: client.browserId,
                timestamp: this.getTimestamp(),
                bookmark: JSON.stringify({
                    date: this.getTimestamp(),
                    position: this.pageId,
                    position_later_page: this.nextPageId,
                    pr: 15,
                    type: 'epub',
                    finished: 0,
                    bookmark_suffix_max: 1,
                    bookmarks: [],
                }),
            },
            headers: {
                Referer: `${url.origin}/03/9/viewer.html?cid=${this.contentId}&cty=1`,
            },
            followRedirect: false,
            resolveWithFullResponse: true,
            json: true,
        });

        delete response.body.auth_info.uuid;
        return response.body.auth_info;
    }

    private getTimestamp() {
        const date = new Date();
        let result = String(date.getFullYear()) + '-';

        result += ('0' + String(date.getMonth() + 1)).slice(-2) + '-';
        result += ('0' + String(date.getDate())).slice(-2) + 'T';
        result += ('0' + String(date.getHours())).slice(-2) + ':';
        result += ('0' + String(date.getMinutes())).slice(-2) + ':';
        result += ('0' + String(date.getSeconds())).slice(-2) + '+0900';

        return result;
    }
}
