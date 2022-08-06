'use strict';

import * as xml2js from 'xml2js';
import { ApiRequestConfig, HttpUtils } from './httpUtils';
import { Utils } from './utils';

interface Token {
	rest_instance_url: string;
	soap_instance_url: string;
	access_token: string;
	token_type: string;
	expires_in: number;
	scope: string;
	expires: Date;
}

export interface Connection {
	name: string;
	account_id: string;
	authBaseUri: string;
	client_id: string;
	client_secret: string;
	grant_type: string | undefined;
}

export class APIException extends Error {
	public message: string;
	public details: string;
	public data: string;
	public readonly innerException: any;

	constructor(message: string, details: string, innerException?: any) {
		super();
		this.message = message;
		this.details = details;
		this.data = '';
		this.innerException = innerException;

		const data = this.innerException?.response?.data;

		if (data?.errors) {
			this.data = 'Errors: ' + data?.errors?.map((err: any) => err.message)?.join(' | ') || '';
		}
		else if (data?.error_description) {
			this.data = 'Errors: ' + data?.error_description;
		}
		else {
			this.data = JSON.stringify(data);
		}
	}
}

export enum SoapOperation {
	RETRIEVE = "Retrieve",
	UPDATE = "Update"
}

export interface SoapRequestConfig {
	operation: SoapOperation;
	transformResponse?: (responseBody: any) => any;
	body: any;
}

export class ConnectionController {
	private connections: Map<string, Connection>;
	private tokens: Map<string, Promise<Token>>;

	private static instance: ConnectionController | null = null;

	constructor() {
		this.connections = new Map<string, Connection>();
		this.tokens = new Map<string, Promise<Token>>();
	}

	static getInstance(): ConnectionController {
		if (ConnectionController.instance === null) {
			ConnectionController.instance = new ConnectionController();
		}
		return ConnectionController.instance;
	}

	setConnections(connections: Array<Connection>): void {
		connections.forEach(c => {
			if (c.grant_type === undefined) {
				c.grant_type = 'client_credentials'
			}
			this.connections.set(c.account_id, c);
		});
	}

	async hasTokenRequiredScopes(connectionId: string, scopes: Array<string>): Promise<boolean> {
		const token = await this.getToken(connectionId);

		for (const scope of scopes) {
			if (!token.scope.includes(scope)) return false;
		}

		return true;
	}

	async getToken(connectionId: string): Promise<Token> {
		const pToken: Promise<Token> = this.tokens.get(connectionId) || this.refreshToken(connectionId);
		let error: any = undefined;

		try {
			let token = await pToken;

			if (token.expires == null || token.expires < new Date()) {
				token = await this.refreshToken(connectionId);
			}

			if (token !== undefined) {
				return token;
			}
		}
		catch (err: any) {
			error = err;
		}

		throw new APIException(
			'Connection Issue',
			`Failed to get a token for connection "${connectionId}"
			Check your configuration and make sure that all required 
			permissions were set for the installed Package`,
			error
		);
	}

	async refreshToken(connectionId: string): Promise<Token> {
		const connection = this.connections.get(connectionId);

		if (connection === undefined) {
			throw new APIException(
				'Connection Issue',
				`Connection "${connectionId}" has not been found in the Connection Manager`);
		}

		const now = new Date().getTime();
        
        const apiConfig = new ApiRequestConfig({
            baseURL: connection.authBaseUri,
            method: "POST",
            url: "/v2/token",
            data: JSON.stringify(connection)
        });

        const pToken = HttpUtils.getInstance().makeRestApiCall(apiConfig).then(tokenData => {
            const token = tokenData as Token;
			token.expires = new Date(now + (token.expires_in - 5) * 1000);
            Utils.getInstance().log(`Token object is ready for ${connectionId}: ${JSON.stringify(token.token_type)}`);
			return token;            
        }).catch(err => {
            Utils.getInstance().logError(err);
            throw err;
        });

        this.tokens.set(connectionId, pToken);

        Utils.getInstance().log(`Token for ${connectionId} is added to the connections pool: size=${this.tokens?.size}`);

		return pToken;
	}

	async restRequest(connectionId: string, config: ApiRequestConfig): Promise<any> {
		try {
			const token: Token = await this.getToken(connectionId);

			config.baseURL = token.rest_instance_url;
			config.headers = {
				'Authorization': `${token.token_type} ${token.access_token}`
			};

			const data = await HttpUtils.getInstance().makeRestApiCall(config);
            return data;
            
		}
		catch (ex: any) {
			throw (ex instanceof APIException ? ex : new APIException('REST API failed', ex.message, ex));
		}
	}

	async soapRequest(connectionId: string, config: SoapRequestConfig): Promise<any> {
		try {
			const token: Token = await this.getToken(connectionId);
			const xmlBuilder = new xml2js.Builder();

			const body: any = {
				Envelope: {
					$: {
						"xmlns": "http://schemas.xmlsoap.org/soap/envelope/",
						"xmlns:xsd": "http://www.w3.org/2001/XMLSchema",
						"xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
					},
					Header: {
						fueloauth: {
							$: {
								"xmlns": "http://exacttarget.com"
							},
							_: token.access_token
						}
					},
					Body: config.body
				}
			};

			const requestConfig: ApiRequestConfig = new ApiRequestConfig({
				baseURL: token.soap_instance_url,
				url: '/Service.asmx',
				method: 'post',
				data: xmlBuilder.buildObject(body),
				headers: {
					'Content-Type': 'text/xml',
					'SOAPAction': config.operation
				}
            });

            const responseData = await HttpUtils.getInstance().makeApiCall(requestConfig);
            const parser = new xml2js.Parser();
            
            return parser.parseStringPromise(responseData).then(result => {
                const body = result["soap:Envelope"]["soap:Body"];
                return config.transformResponse === undefined ? body : config.transformResponse(body);
            });
		}
		catch (ex: any) {
			throw (ex instanceof APIException ? ex : new APIException('SOAP API failed', ex.message, ex));
		}
	}

}