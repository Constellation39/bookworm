import vm from 'vm';
import IHttpClient from '../IHttpClient';
import IHttpRequest from '../IHttpRequest';

// @ts-ignore
// tslint:disable-next-line:no-empty
const _ctx={NFBR:{GlobalConfig:{},a0X:{},LocaleConfig:{},Locale:{setLocale(...arr){},},},Cldr:{_resolved:{}},Globalize:{loadTranslations(...arr){},},document:{createElement(...arr){return{type:'',src:''}},getElementsByTagName(...arr){return[{appendChild:()=>{},}]},},};

export interface IGlobalConfig {
    SERVER_DOMAIN: string
    JSON_KEY_STATUS_CODE: string
    JSON_KEY_CONTENT_URL: string
    JSON_KEY_PREVIEW_PAGE: string
    JSON_KEY_CONTENT_TITLE: string
    JSON_KEY_CONTENT_TYPE: string
    JSON_KEY_LOOKINSIDE_SPEC: string
    JSON_KEY_LAST_PAGE_SPEC: string
    JSON_KEY_BOOKMARK_SHERED: string
    JSON_KEY_MARKER_SHARED: string
    JSON_KEY_TWITTER_ENABLED: string
    JSON_KEY_FACEBOOK_ENABLED: string
    JSON_KEY_USER_ID: string
    JSON_KEY_TRACKING_IMAGE: string
    JSON_KEY_AUTH_INFO: string
    JSON_KEY_LIMITED_FREE: string
    JSON_VALUE_READ_FROM_LOCAL: string
    WEBAPI_RATE_PAGE: string
    WEBAPI_CONTENT_CHECK: string
    WEBAPI_LAST_PAGE_INFO: string
    WEBAPI_LOOKINSIDE_CHECK: string
    WEBAPI_GET_BOOKMARK: string
    WEBAPI_PUT_BOOKMARK: string
    WEBAPI_GET_MARKER: string
    WEBAPI_PUT_MARKER: string
    WEBAPI_PAGE_FROM_CFI: string
    WEBAPI_REGION_INDEX_FROM_CFI: string
    WEBAPI_GET_CFI_FROM_REGION_INDEX: string
    WEBAPI_SEARCH_CONTENT: string
    WEBAPI_TWITTER_MESSAGE: string
    WEBAPI_FACEBOOK_MESSAGE: string
    WEBAPI_CONTENT_BY_RESOLUTION: string
    WEBAPI_COUNT_VIEWING_TIME: string
    COUNT_VIEWING_TIME_INTERVAL: string
    WEBAPI_POST_TEXT_PLAIN: string
    SEND_BROWSER_ID: string
    BROWSER_ID_SUFFIX: string
    SESSION_ID_SUFFIX: string
    LOCALSTORAGE_KEY_BID: string
}

// tslint:disable-next-line:function-name
function _eval(code: string): IGlobalConfig {
    const ctx = _ctx;
    const script = new vm.Script(code, { filename: 'GetConfig' });
    script.runInNewContext(ctx);
    return ctx.NFBR.GlobalConfig as IGlobalConfig;
}


export default class GetConfig implements IHttpRequest<IGlobalConfig> {
    constructor(private base: string) {
    }

    public async execute(client: IHttpClient): Promise<IGlobalConfig> {
        return client.execute({
            url: this.base + 'js/config.js',
        }).then(body => {
            const code = body.replace('.call(this);', '()');
            return _eval(code);
        });
    }
}
