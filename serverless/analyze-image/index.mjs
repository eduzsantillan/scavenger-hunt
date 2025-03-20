import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { RekognitionClient, DetectLabelsCommand } from '@aws-sdk/client-rekognition';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const s3Client = new S3Client();
const rekognitionClient = new RekognitionClient();
const snsClient = new SNSClient();

export const handler = async (event) => {
  try {
    const payload = event.Records[0].s3;
    if (!payload) {
      throw new Error('Invalid S3 event payload, this function only handles S3 events');
    }

    const s3Bucket = payload.bucket.name;
    const s3Key = decodeURIComponent(payload.object.key.replace(/\+/g, ' '));
    
    console.log(`Processing image: ${s3Key} from bucket: ${s3Bucket}`);
    
    const headObjectCommand = new HeadObjectCommand({
      Bucket: s3Bucket,
      Key: s3Key
    });
    const objectData = await s3Client.send(headObjectCommand);

    const metadata = objectData.Metadata || {};
    console.log('Object metadata:', JSON.stringify(metadata));
    let requiredList = [];
    try {
      if (metadata.requiredlist) {
        requiredList = JSON.parse(metadata.requiredlist);
        console.log('Parsed requiredList:', requiredList);
      } else {
        console.warn('No requiredList found in metadata');
      }
    } catch (error) {
      console.error('Error parsing requiredList:', error);
      requiredList = [];
    }
    const detectLabelsparams = {
      Image: {
        S3Object: {
          Bucket: s3Bucket,
          Name: s3Key,
        },
      },
      MaxLabels: 20,
      MinConfidence: 70
    };
    const detectLabelsCommand = new DetectLabelsCommand(detectLabelsparams);
    const rekogResult = await rekognitionClient.send(detectLabelsCommand);
    console.log('Rekognition results:', JSON.stringify(rekogResult, null, 2));
    const labels = rekogResult.Labels.map(label => label.Name.toLowerCase());
    
    const matchedItems = requiredList.filter(item => {
      console.log(`Checking if ${item} is in labels: ${labels.includes(item)}`);
        return labels.includes(item);
    });
    const isMatch = matchedItems.length > 0;
    
    //sessionId/itemId/image.jpg
    const sessionId = s3Key.split('/')[0];
    const itemId = s3Key.split('/')[1];


    const message = {
      imageKey: s3Key,
      sessionId: sessionId,
      itemId: itemId,
      isMatch: isMatch,
      matchedItems: matchedItems,
      allDetectedLabels: labels,
      timestamp: Date.now()
    };
    console.log(`Publishing message to SNS: ${JSON.stringify(message)}`);
    const publishCommand = new PublishCommand({
      TopicArn: process.env.SNS_TOPIC_ARN,
      Message: JSON.stringify(message),
    });
    await snsClient.send(publishCommand);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Image analysis complete: ${isMatch ? 'Match found' : 'No match found'}`,
        matchedItems: matchedItems
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process image' })
    };
  }
};
