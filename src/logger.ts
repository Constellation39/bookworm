import { join } from 'path';
import { createLogger, format, transports } from 'winston';

const { timestamp, combine, errors, splat, simple, printf } = format;

const logger = createLogger({
    transports: [
        new transports.Console({
            level: 'silly',
        }),
        new transports.File({
            dirname: join(process.cwd(), 'log'),
            filename: 'combined.log',
            level: 'debug',
            options: { flags: 'w' },
        }),
    ],
    format: combine(
        timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        errors({ stack: true }),
        simple(),
        splat(),
        // tslint:disable-next-line:no-shadowed-variable
        printf(({ level, message, timestamp }) => {
            if (typeof message === 'object') {
                message = JSON.stringify(message);
            }
            return `${timestamp} [${level}]: ${message}`;
        }),
    ),
});

export default logger;