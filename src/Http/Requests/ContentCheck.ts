import IContentCheckResponse from '../IContentCheckResponse';
import IHttpClient from '../IHttpClient';
import IHttpRequest from '../IHttpRequest';
import { IGlobalConfig } from './GetConfig';

export default class ContentCheck implements IHttpRequest<IContentCheckResponse> {
    public constructor(
        private readonly config: IGlobalConfig,
        private readonly contentId: string,
        private readonly cr: string) {
    }

    public async execute(client: IHttpClient): Promise<IContentCheckResponse> {

        const url = new URL(this.config.SERVER_DOMAIN);

        return client.execute({
            url: this.config.SERVER_DOMAIN + this.config.WEBAPI_CONTENT_CHECK,
            qs: {
                cid: this.contentId,
                u1: client.getU1(url.origin),
                BID: client.browserId,
                cr: this.cr,
            },
            headers: {
                Referer: `${url.origin}/03/5/viewer.html?cid=${this.contentId}&cty=1`,
            },
            json: true,
        });
    }
}
