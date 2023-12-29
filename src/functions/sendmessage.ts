import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';

import { ApiGatewayManagementApi } from '@aws-sdk/client-apigatewaymanagementapi';
import broadcastMessage from '/utils/broadcast_messages';

import { docClient } from '/config/clients';

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
    let body: MessagePayloadSchema;
    try {
        body = JSON.parse(event.body || '');
    } catch (err) {
        console.error('Failed to parse body: ', err);
        return { statusCode: 500, body: 'Failed to parse body: ' + JSON.stringify(err) };
    }

    const apigwManagementApi = new ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: 'https://' + event.requestContext.domainName + '/' + event.requestContext.stage,
    });

    if (!body.data) {
        return { statusCode: 500, body: 'Data is required.' };
    }

    // for now just send the message to everyone
    return await broadcastMessage(docClient, apigwManagementApi, body.data);
};
