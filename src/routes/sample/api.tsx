import { Hono } from 'hono';
import { issueApiKey, validateApiKey } from '@modules/apiKey.ts';
import { ApiSamplePage } from '@pages/sample/api.tsx';

const apiSamplePageCtl = new Hono().basePath('/sample/api');

apiSamplePageCtl.get('/', (c) => {
    const session = c.get('session');
    let key = session.get('api_key') as string | undefined;
    if (!key || !validateApiKey(key)) {
        key = issueApiKey('sample-page');
        session.set('api_key', key);
    }
    return c.html(<ApiSamplePage apiKey={key} />);
});

export { apiSamplePageCtl as sampleApi };
