import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const dynamoClient = new DynamoDBClient();
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler = async (event) => {
  try {
    console.log("Received SNS event:", JSON.stringify(event, null, 2));
    const message = JSON.parse(event.Records[0].Sns.Message);
    if (!message) {
      throw new Error("Invalid SNS message");
    }

    const { imageKey, sessionId, itemId, allDetectedLabels, isMatch } = message;
    const isCollected = isMatch === true;
    console.log(`Updating session table for sessionId: ${sessionId}, itemId: ${itemId}, isCollected: ${isCollected}`);
    const getParams = {
      TableName: process.env.SESSION_TABLE_NAME,
      Key: {
        sessionId,
        itemId
      }
    };
    
    const getCommand = new GetCommand(getParams);
    const existingRecord = await dynamoDocClient.send(getCommand);
    
    const updateParams = {
      TableName: process.env.SESSION_TABLE_NAME,
      Key: {
        sessionId,
        itemId
      },
      UpdateExpression: "SET isCollected = :isCollected, processedAt = :processedAt, allDetectedLabels = :allDetectedLabels, imageKey = :imageKey",
      ExpressionAttributeValues: {
        ":isCollected": isCollected,
        ":processedAt": new Date().toISOString(),
        ":allDetectedLabels": allDetectedLabels,
        ":imageKey": imageKey
      },
      ReturnValues: "ALL_NEW"
    };
    
    const updateCommand = new UpdateCommand(updateParams);
    const result = await dynamoDocClient.send(updateCommand);
    console.log("Successfully updated session record in DynamoDB");

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Session record updated successfully",
        sessionId,
        itemId,
        isCollected,
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to update session record" }),
    };
  }
};
