import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
    const putParams = {
        TableName: process.env.TABLE_NAME,
        Item: {
            connectionId: event.requestContext.connectionId,
        },
    };

    try {
        const putCommand = new PutCommand({
            TableName: process.env.TABLE_NAME,
            Item: {
                connectionId: event.requestContext.connectionId,
            },
        });
        await docClient.send(putCommand);
    } catch (err) {
        return {
            statusCode: 500,
            body: 'Failed to connect: ' + JSON.stringify(err),
        };
    }

    return {
        statusCode: 200,
        body: 'Connected.',
    };
};
