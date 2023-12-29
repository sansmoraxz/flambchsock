import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';

import { docClient } from '/config/clients';
import { deleteWSConnection } from '/utils/manage_connection_table';

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
    try {
        await deleteWSConnection(docClient, event.requestContext.connectionId);
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
