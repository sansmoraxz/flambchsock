import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const { TABLE_NAME } = process.env;

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
    try {
        const deleteCommand = new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
                connectionId: event.requestContext.connectionId,
            },
        });
        await docClient.send(deleteCommand);
    } catch (err) {
        return {
            statusCode: 500,
            body: 'Failed to disconnect: ' + JSON.stringify(err),
        };
    }

    return {
        statusCode: 200,
        body: 'Disconnected.',
    };
};