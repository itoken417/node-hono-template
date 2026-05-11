import pino from 'pino';
import fs from 'fs';

const logDir = process.env.LOG_DIR ?? 'logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const baseOptions: pino.LoggerOptions = {
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
        level: (label) => ({ level: label }),
    },
};

export const accessLogger = pino(
    { ...baseOptions, level: 'info' },
    pino.destination({ dest: `${logDir}/access.log`, append: true, sync: false })
);

export const errorLogger = pino(
    { ...baseOptions, level: 'error' },
    pino.destination({ dest: `${logDir}/error.log`, append: true, sync: false })
);
