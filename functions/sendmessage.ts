import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

import { ApiGatewayManagementApi } from '@aws-sdk/client-apigatewaymanagementapi';
import { ScanCommand, DeleteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const { TABLE_NAME } = process.env;

// body payload schema
type MessagePayloadSchema = {
    data?: string;
    action: string;
};

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
    console.log('event', event);

    let body: MessagePayloadSchema;
    try {
        body = JSON.parse(event.body || '');
    } catch (err) {
        console.error('Failed to parse body: ', err);
        return {
            statusCode: 500,
            body: 'Failed to parse body: ' + JSON.stringify(err),
        };
    }

    let connectionData;
    try {
        const scanCommand = new ScanCommand({
            TableName: process.env.TABLE_NAME,
            ProjectionExpression: 'connectionId',
        });
        connectionData = await docClient.send(scanCommand);
    } catch (err) {
        console.error('Failed to connect to db: ', err);
        return {
            statusCode: 500,
            body: 'Failed to connect to db: ' + JSON.stringify(err),
        };
    }

    const apigwManagementApi = new ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: event.requestContext.domainName + '/' + event.requestContext.stage,
    });

    const postData = body?.data;

    if (!postData) {
        return {
            statusCode: 500,
            body: 'Data is required.',
        };
    }

    const postCalls = connectionData?.Items?.map(async ({ connectionId }) => {
        try {
            await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: postData });
        } catch (e: any) {
            if (e.statusCode === 410) {
                console.log(`Found stale connection, deleting ${connectionId}`);
                const deleteCommand = new DeleteCommand({
                    TableName: TABLE_NAME,
                    Key: {
                        connectionId: connectionId,
                    },
                });
                await docClient.send(deleteCommand);
            } else {
                throw e;
            }
        }
    });

    if (!postCalls) {
        console.error('No connections found.');
        return {
            statusCode: 500,
            body: 'No connections found.',
        };
    }

    try {
        await Promise.all(postCalls);
    } catch (err) {
        console.error('Failed to send data', err);
        return {
            statusCode: 500,
            body: 'Failed to send data: ' + JSON.stringify(err),
        };
    }

    return {
        statusCode: 200,
        body: 'Data sent.',
    };
};
