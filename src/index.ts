import { promises as fs } from 'fs';
import path from 'path';
import prompts from 'prompts';
import Book from './Book';
import { exists } from './exists';
import HttpClient from './Http/Client';
import Login from './Http/Requests/Login';
import StartSession from './Http/Requests/StartSession';
import logger from './logger';

const readJson = <T>(filename: string): Promise<T> => fs.readFile(filename, 'utf8').then(json => JSON.parse(json));
const writeJson = <T>(filename: string, content: T) => fs.writeFile(filename, JSON.stringify(content, null, 2));

const AUTH_DATA_PATH = './auth.json';
const BROWSER_ID_PATH = './browser-id.txt';
const STORAGE_PATH = './storage';

async function main() {
    const httpClient = new HttpClient();
    const browserId = process.env.BW_BROWSER_ID || (await fs.readFile(BROWSER_ID_PATH, 'utf8').catch(() => null));
    if (browserId) {
        logger.debug(`Browser ID is detected: ${browserId}`);
        httpClient.browserId = browserId;
    }

    let username, password;
    if (process.env.BW_USERNAME && process.env.BW_PASSWORD) {
        username = process.env.BW_USERNAME;
        password = process.env.BW_PASSWORD;
    } else {
        const auth = await readJson<IAuthData>(AUTH_DATA_PATH).catch(() => null);

        if (auth && auth.username && auth.password) {
            username = auth.username;
            password = auth.password;
        } else {
            const pAuth = await prompts([
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

            username = pAuth.username;
            password = pAuth.password;
        }
    }

    logger.info(`Auth is detected: ${username}`);
    await new StartSession().execute(httpClient);
    if (!(await new Login(username, password).execute(httpClient))) {
        throw new Error('Incorrect username/password');
    }
    logger.info('Session started');

    if (process.env.BW_DONT_SAVE_AUTH !== '1') {
        writeJson<IAuthData>(AUTH_DATA_PATH, { username, password })
            .then(() => {
                logger.info(`Auth data saved to ${AUTH_DATA_PATH}`);
            })
            .catch(err => {
                logger.warning(`Failed to save auth data to ${AUTH_DATA_PATH}:`, err.stack);
            });
    }

    let contentId: string;

    if (process.env.BW_CONTENT_ID) {
        contentId = process.env.BW_CONTENT_ID;
    } else {
        const { id } = await prompts({
            message: 'Content ID: ',
            name: 'id',
            type: 'text',
            validate: data => (data && data.match(/(\w+-){4}\w+/g) ? true : 'Link Error'),
        });
        contentId = id;
    }

    const book = await Book.load(contentId, httpClient);
    logger.info('Book loaded');

    const target = path.join(STORAGE_PATH, contentId);
    if (!(await exists(target))) await fs.mkdir(target);
    await book.download(target);
    logger.info('Done!');

    await fs.writeFile(BROWSER_ID_PATH, httpClient.browserId);
}

main().catch(logger.error);

interface IAuthData {
    username: string;
    password: string;
}
