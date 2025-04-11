import { S3Client } from '@aws-sdk/client-s3';
import {
  AWS_ACCESS_KEY_ID,
  AWS_REGION,
  AWS_SECRET_ACCESS_KEY,
  AWS_BUCKET_NAME,
} from '../config/config.js';
import { ListBucketsCommand } from '@aws-sdk/client-s3';
import { HeadBucketCommand } from '@aws-sdk/client-s3';

// Create an S3 client
// This client is used to interact with the S3 service
export const s3 = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Checks the connection to AWS S3 by listing the available buckets.
 * This function sends a `ListBucketsCommand` to AWS S3 and logs the names of available buckets.
 *
 * @async
 * @returns {Promise<void>} Resolves when the connection is successful and the available buckets are logged.
 * @throws {Error} If the connection to AWS S3 fails.
 */
export async function checkS3Connection() {
  try {
    const data = await s3.send(new ListBucketsCommand({}));
    console.log(
      '✅ Conectado a S3. Buckets disponibles:',
      data.Buckets.map((b) => b.Name),
    );
  } catch (error) {
    console.error('❌ Error conectando con S3:', error);
  }
}

/**
 * Checks the access to the specified S3 bucket.
 * This function sends a `HeadBucketCommand` to AWS S3 to verify access to the bucket.
 *
 * @async
 * @returns {Promise<void>} Resolves when access to the bucket is confirmed.
 * @throws {Error} If access to the specified bucket fails.
 */
export async function checkBucketAccess() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: AWS_BUCKET_NAME }));
    console.log(`✅ Acceso confirmado al bucket: ${AWS_BUCKET_NAME}`);
  } catch (error) {
    console.error(`❌ No se pudo acceder al bucket: ${AWS_BUCKET_NAME}`, error);
  }
}
