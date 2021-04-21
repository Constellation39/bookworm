import { promises as fs } from 'fs';
import prompts from 'prompts';
import Book from './Book';
import InCaptcha from './Http/Captcha/InCaptcha';
import WaitCaptcha from './Http/Captcha/WaitCaptcha';
import HttpClient from './Http/Client';
import Login from './Http/Requests/Login';
import StartSession from './Http/Requests/StartSession';
import logger from './logger';

const readJson = <T>(filename: string): Promise<T> => fs.readFile(filename, 'utf8').then(json => JSON.parse(json));
const writeJson = <T>(filename: string, content: T) => fs.writeFile(filename, JSON.stringify(content, null, 2));

const AUTH_DATA_PATH = './auth.json';
const BROWSER_ID_PATH = './browser-id.txt';
const STORAGE_PATH = './storage';
const CAPTCHA_KEY = './2captcha-key.txt';

async function main() {
    const httpClient = new HttpClient();
    const browserId = process.env.BW_BROWSER_ID || (await fs.readFile(BROWSER_ID_PATH, 'utf8').catch(() => null));
    if (browserId) {
        logger.debug(`Browser ID is detected: ${browserId}`);
        httpClient.browserId = browserId;
    }

    const auth = await readJson<IAuthData[]>(AUTH_DATA_PATH).catch(() => null) || [];
    let username, password;
    if (process.env.BW_USERNAME && process.env.BW_PASSWORD) {
        username = process.env.BW_USERNAME;
        password = process.env.BW_PASSWORD;
    } else {
        if (!auth || auth && auth.length === 0) {
            auth[0] = await readUser();
            username = auth[0].username;
            password = auth[0].password;
        } else {
            const data = await selectUser(auth);
            username = data.username;
            password = data.password;
        }
    }

    logger.debug(`Input username: ${username} password: ${password}`);
    logger.info(`Auth is detected: ${username}`);
    let body: { [x: string]: string } = { 'loginBtn': 'login' };
    const reCaptchaCode = await new StartSession().execute(httpClient);
    if (reCaptchaCode) {
        logger.info('Server has reCaptcha enabled, Login takes more time');
        const captchaKey = await fs.readFile(CAPTCHA_KEY, 'utf8').catch(() => null);
        if (captchaKey == null) {
            throw new Error('Server has reCaptcha enabled, but captchaKey not found');
        }
        const waitKey = await new InCaptcha(captchaKey, reCaptchaCode).execute(httpClient);
        logger.debug(`InCaptcha ${waitKey}`);
        const captcha = await new WaitCaptcha(captchaKey, waitKey).execute(httpClient);
        logger.debug(`WaitCaptcha ${captcha}`);
        body = { 'g-recaptcha-response': captcha };
    }
    if (!(await new Login(username, password, body).execute(httpClient))) {
        throw new Error('Incorrect username/password');
    }
    logger.info('Session started');

    if (process.env.BW_DONT_SAVE_AUTH !== '1') {
        await writeJson<IAuthData>(AUTH_DATA_PATH, { username, password })
            .then(() => {
                logger.info(`Auth data saved to ${AUTH_DATA_PATH}`);
            })
            .catch(err => {
                logger.warning(`Failed to save auth data to ${AUTH_DATA_PATH}:`, err.stack);
            });
    }

    let link: string;

    if (process.env.BW_LINK) {
        link = process.env.BW_LINK;
    } else {
        const value = await prompts({
            message: 'Bookwalker Link: ',
            name: 'link',
            type: 'text',
            validate: data => (data && data.match(/(\w+-){4}\w+/g) ? true : 'Link Error'),
        });
        link = value.link;
    }

    const book = await Book.load(link, httpClient);
    logger.info('Book loaded');


    await book.download(STORAGE_PATH);
    logger.info('Done!');

    await fs.writeFile(BROWSER_ID_PATH, httpClient.browserId);
}

main().catch(error => {
    logger.error(error);
    process.exit();
});

async function selectUser(auth: IAuthData[]): Promise<IAuthData> {

    if (!('map' in auth)) {
        throw new Error(`The auth.json file is in the wrong format, please delete the file`);
    }

    const userProxy = new Map<string, string>();

    const userMap = auth.map(a => {
        userProxy.set(a.username, a.password);
        return { title: a.username, value: a.username };
    });

    const { user } = await prompts({
        type: 'select',
        name: 'user',
        message: 'Pick a User',
        choices: userMap.concat({ title: 'add User', value: 'addUser' }),
        initial: 0,
    });

    if (user === 'addUser') {
        const data = await readUser();
        auth[auth.length] = { username: data.username, password: data.password };
        return { username: data.username, password: data.password };
    }

    return { username: user, password: userProxy.get(user) as string };
}

async function readUser(): Promise<IAuthData> {
    return await prompts([
        {
            message: 'Username: ',
            name: 'username',
            type: 'text',
            validate: data => (data !== '' ? true : 'Username input is empty'),
        },
        {
            message: 'Password: ',
            name: 'password',
            type: 'password',
            validate: data => (data !== '' ? true : 'Password input is empty'),
        },
    ]);
}

export function sleep(time = 0) {
    return new Promise(resolve => setTimeout(resolve, time));
}

interface IAuthData {
    username: string;
    password: string;
}
