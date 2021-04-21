import { promises as fs } from 'fs';
import path from 'path';
import Config, { IConfigBookConfiguration } from './Config';
import { exists } from './exists';
import ClientWithRetries from './Http/ClientWithRetries';
import ClientWithThrottle from './Http/ClientWithThrottle';
import IContentAuth from './Http/IContentAuth';
import IContentCheckResponse from './Http/IContentCheckResponse';
import IHttpClient from './Http/IHttpClient';
import AuthorizeViewer from './Http/Requests/AuthorizeViewer';
import BookConfig from './Http/Requests/BookConfig';
import ContentCheck from './Http/Requests/ContentCheck';
import GetAuthorize from './Http/Requests/GetAuthorize';
import GetConfig, { IGlobalConfig } from './Http/Requests/GetConfig';
import GetLoader from './Http/Requests/GetLoader';
import PutBookmark from './Http/Requests/PutBookmark';
import logger from './logger';
import Page from './Page';

function getId(link: string): string {
    const ids = link.match(/(\w+-){4}\w+/g);
    if (ids == null) {
        throw new Error(`${link} not found id`);
    }
    return ids[0];
}

function getBaseLink(link: string): string {
    const base = link.match(/https:\/\/.*\//g);
    if (base == null) {
        throw new Error(`${link} not found base`);
    }
    return base[0];
}

export default class Book {
    // tslint:disable-next-line:function-name
    public static async load(link: string, httpClient: IHttpClient): Promise<Book> {
        const bookId = getId(link);
        const bookLink = await new GetAuthorize(bookId).execute(httpClient);
        const contentId = getId(bookLink);
        const viewerLink = await new AuthorizeViewer(bookLink).execute(httpClient);
        const baseLink = getBaseLink(viewerLink);
        const config = await new GetConfig(baseLink).execute(httpClient);
        const cr = await new GetLoader(config).execute(httpClient);
        const contentConfig = await new ContentCheck(config, contentId, cr).execute(httpClient);
        if (contentConfig.status !== '200') {
            throw new Error(`Unexpected config response status: ${contentConfig.status}`);
        }
        const encodedBookConfig = await new BookConfig(contentConfig.url, contentConfig.auth_info).execute(httpClient);

        return new Book(config, contentId, httpClient, contentConfig, encodedBookConfig);
    }

    public readonly pages: ReadonlyArray<Page>;
    private readonly throttledHttpClient: IHttpClient;
    private auth: IContentAuth;

    public constructor(
        private readonly iConfig: IGlobalConfig,
        private readonly contentId: string,
        private readonly httpClient: IHttpClient,
        private readonly contentConfig: IContentCheckResponse,
        encodedBookConfig: string,
    ) {
        this.throttledHttpClient = new ClientWithRetries(
            new ClientWithThrottle(httpClient, {
                frame: 60,
                limit: parseInt(process.env.BW_THROTTLE || '10', 10),
            }),
            { max: 3, delay: 30000 },
        );
        const config = new Config(encodedBookConfig, BookConfig.FILENAME).decode();
        const configuration: IConfigBookConfiguration = config[0].configuration as any;
        this.pages = configuration.contents.map(pageInfo => {
            const pageConfig = config[0][pageInfo.file];
            return new Page(
                pageInfo.index,
                pageInfo.file,
                pageConfig,
                this.throttledHttpClient,
                config[4],
                config[5],
                config[6],
                contentConfig.url,
            );
        });
        this.auth = contentConfig.auth_info;
    }

    public async download(folder: string) {
        folder = path.join(folder, this.contentConfig.cti);
        if (!(await exists(folder))) await fs.mkdir(folder);
        const items = this.pages.map((page, index) => {
            const nextPage = this.pages[index + 1];

            return {
                page,
                nextPage,
            };
        });

        logger.info('Downloading:');
        let ready = 0;
        const total = items.length.toString();
        for (const item of items) {
            const readyStr = (++ready).toString().padStart(total.length, '0');
            const filename = `page-${readyStr}.png`;
            const filepath = path.join(folder, filename);
            const logPrefix = `\t[${readyStr}/${total}] ${filename}:`;

            if (await exists(filepath)) {
                logger.info(logPrefix, `File already exists`);
            } else {
                try {
                    const image = await item.page.image(this.auth);
                    await fs.writeFile(filepath, image);
                    logger.info(`${logPrefix} Success`);

                    if (item.nextPage) {
                        const pb = new PutBookmark(this.iConfig, this.auth, this.contentId, item.page.pageId, item.nextPage.pageId);
                        const auth = await pb.execute(this.httpClient);
                        this.auth = {
                            ...this.auth,
                            ...auth,
                        };
                    }
                } catch (err) {
                    console.warn(`${logPrefix} Failed %s`, err.stack);
                }
            }
        }
    }
}
