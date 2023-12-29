import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { ApiGatewayManagementApi, GoneException } from '@aws-sdk/client-apigatewaymanagementapi';
import { scanWSConnections, deleteWSConnection } from './manage_connection_table';

export default async function broadcastMessage(
    docClient: DynamoDBDocumentClient,
    apigwManagementApi: ApiGatewayManagementApi,
    message: string,
): Promise<{ statusCode: number; body: string }> {
    const connectionData = await scanWSConnections(docClient);

    const postCalls = connectionData?.Items?.map(async ({ connectionId }) => {
        try {
            await apigwManagementApi.postToConnection({
                ConnectionId: connectionId,
                Data: message,
            });
        } catch (e) {
            if (e instanceof GoneException) {
                console.warn(`Found stale connection, deleting ${connectionId}`);
                await deleteWSConnection(docClient, connectionId);
            } else {
                throw e;
            }
        }
    });

    if (!postCalls) {
        return { statusCode: 304, body: 'No connections found.' };
    }

    try {
        await Promise.all(postCalls);
    } catch (e) {
        console.error('Failed to send message. ', e);
        return { statusCode: 400, body: 'Failed to send message. ' + JSON.stringify(e) };
    }

    return { statusCode: 200, body: 'Data sent.' };
}
