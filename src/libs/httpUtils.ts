import { URL } from 'url';
import { Buffer } from 'buffer';
import * as https from 'https';
import { ClientRequest, IncomingMessage, RequestOptions } from 'http';
import * as zlib from 'zlib';

export class ApiRequestConfig {
    public method = '';
    public url = '';
    public data = '';
    public params: any = null;
    public baseURL = '';
    public headers: any = {};

    public constructor(config: any){
        this.method = config.method;
        this.url = config.url;
        this.data = config.data;
        this.params = config.params;
        this.baseURL = config.baseURL;
        this.headers = config.headers || {};
    }

    public getURL(): URL {
        const url = new URL(this.url, this.baseURL);

        if(this.params){
            const searchParams = new URLSearchParams(this.params);
            url.search = searchParams.toString();
        }

        return url;
    }
}

export class HttpUtils {
	private static instance: HttpUtils | null = null;

	static getInstance(): HttpUtils {
		if (HttpUtils.instance === null) {
			HttpUtils.instance = new HttpUtils();
		}

		return HttpUtils.instance;
	}

    makeRestApiCall(config: ApiRequestConfig): Promise<any>{
        config.headers['Content-Type'] = 'application/json';
        return this.makeApiCall(config).then(data => JSON.parse(data));
    }

    makeApiCall(config: ApiRequestConfig): Promise<string>{
        const options: RequestOptions = {
            method: config.method,
            headers: config.headers
        };

        return new Promise((resolve: any, reject: any) => {
            const req: ClientRequest = https.request(config.getURL().toString(), options, (res: IncomingMessage) => {
                const chunks: Array<Buffer> = [];

                res.on('data', (data: Buffer) => {
                    chunks.push(data);
                });

                res.on('end', () => {
					const buffer = Buffer.concat(chunks);

					if(res.headers['content-encoding'] == 'gzip'){
						zlib.gunzip(buffer, (err, output: Buffer) => {
							if(!err && res?.statusCode && res.statusCode >= 200 && res.statusCode < 300){
								resolve(output.toString());
							}
							else{
								reject(err);
							}
						});
					}
					else{
						const output = buffer.toString();
						if(res?.statusCode && res.statusCode >= 200 && res.statusCode < 300){
							resolve(output);
						}
						else{
							reject(output);
						}
					}
				});
            });

            req.on('error', (err) => { 
                reject(err); 
            });

            if (config.data) {
                const data = typeof config.data === 'object' ? JSON.stringify(config.data) : config.data;
                req.write(data);
            }

            req.end();
        });
    }
}