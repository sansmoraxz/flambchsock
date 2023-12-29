import { DynamoDBDocumentClient, ScanCommand, DeleteCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { TABLE_NAME } from '/config/const';

export const scanWSConnections = async (docClient: DynamoDBDocumentClient) => {
    const scanCommand = new ScanCommand({
        TableName: TABLE_NAME,
        ProjectionExpression: 'connectionId',
    });
    return await docClient.send(scanCommand);
};

export const deleteWSConnection = async (docClient: DynamoDBDocumentClient, connectionId: string) => {
    const deleteCommand = new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { connectionId: connectionId },
    });
    return await docClient.send(deleteCommand);
};

export const addWSConnection = async (docClient: DynamoDBDocumentClient, connectionId: string) => {
    const putCommand = new PutCommand({
        TableName: TABLE_NAME,
        Item: {
            connectionId: connectionId,
        },
    });
    return await docClient.send(putCommand);
};
