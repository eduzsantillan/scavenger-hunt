import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const dynamoClient = new DynamoDBClient();
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

async function checkAndUpdateTeamCompletion(teamId) {
  try {
    const queryParams = {
      TableName: process.env.TEAM_ITEMS_TABLE_NAME,
      KeyConditionExpression: "team_id = :teamId",
      ExpressionAttributeValues: {
        ":teamId": teamId
      }
    };
    
    const queryCommand = new QueryCommand(queryParams);
    const teamItemsResult = await dynamoDocClient.send(queryCommand);
    
    if (!teamItemsResult.Items || teamItemsResult.Items.length === 0) {
      console.log(`No team items found for team ${teamId}`);
      return;
    }
    
    const allCollected = teamItemsResult.Items.every(item => item.is_collected === true);
    
    if (allCollected) {
      console.log(`All items collected for team ${teamId}. Updating team completion status.`);
      
      const updateTeamParams = {
        TableName: process.env.TEAMS_TABLE_NAME,
        Key: {
          team_id: teamId
        },
        UpdateExpression: "SET is_completed = :isCompleted",
        ExpressionAttributeValues: {
          ":isCompleted": true
        }
      };
      
      const updateTeamCommand = new UpdateCommand(updateTeamParams);
      await dynamoDocClient.send(updateTeamCommand);
      console.log(`Successfully updated team ${teamId} completion status to true`);
    } else {
      console.log(`Not all items collected for team ${teamId}. Team completion status unchanged.`);
    }
  } catch (error) {
    console.error("Error checking team completion status:", error);
  }
}

export const handler = async (event) => {
  try {
    console.log("Received SNS event:", JSON.stringify(event, null, 2));
    const message = JSON.parse(event.Records[0].Sns.Message);
    if (!message) {
      throw new Error("Invalid SNS message");
    }

    const { imageKey, teamId, itemId, allDetectedLabels, isMatch } = message;
    const isCollected = isMatch === true;
    console.log(`Updating team_items table for teamId: ${teamId}, itemId: ${itemId}, isCollected: ${isCollected}`);
    
    const getParams = {
      TableName: process.env.TEAM_ITEMS_TABLE_NAME,
      Key: {
        team_id: teamId,
        item_id: itemId
      }
    };
    
    const getCommand = new GetCommand(getParams);
    const existingRecord = await dynamoDocClient.send(getCommand);
    
    const updateParams = {
      TableName: process.env.TEAM_ITEMS_TABLE_NAME,
      Key: {
        team_id: teamId,
        item_id: itemId
      },
      UpdateExpression: "SET is_collected = :isCollected, labels_detected = :labelsDetected, img_key = :imageKey",
      ExpressionAttributeValues: {
        ":isCollected": isCollected,
        ":labelsDetected": allDetectedLabels,
        ":imageKey": imageKey
      },
      ReturnValues: "ALL_NEW"
    };
    
    const updateCommand = new UpdateCommand(updateParams);
    const result = await dynamoDocClient.send(updateCommand);
    console.log("Successfully updated team item record in DynamoDB");
    
    if (isCollected) {
      await checkAndUpdateTeamCompletion(teamId);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Team item record updated successfully",
        teamId,
        itemId,
        isCollected,
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to update team item record" }),
    };
  }
};
