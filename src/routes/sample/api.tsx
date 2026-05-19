import { Hono } from 'hono';
import { issueApiKey } from '@modules/apiKey.ts';
import { ApiSamplePage } from '@pages/sample/api.tsx';

const apiSamplePageCtl = new Hono().basePath('/sample/api');

apiSamplePageCtl.get('/', (c) => {
    const key = issueApiKey('sample-page');
    return c.html(<ApiSamplePage apiKey={key} />);
});

export { apiSamplePageCtl as sampleApi };
