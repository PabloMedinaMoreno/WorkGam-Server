// This file initializes the server and connects to the database
// It also checks the connection to the S3 bucket and starts the server
// Finally, it logs the server URL and the environment

import { server } from './server.js';
import { connectDB, initializeDatabase } from './databases/db.js';
import { checkS3Connection, checkBucketAccess } from './databases/s3.js';
import { PORT, BACKEND_URL, NODE_ENV } from './config/config.js';

/**
 * Main function to start the server
 */
async function main() {
  try {
    await connectDB();
    // await initializeDatabase();
    await checkS3Connection();
    await checkBucketAccess();
    server.listen(PORT, () => {
      console.log(`Server listening on ${BACKEND_URL}`);
    });
    console.log(`Environment: ${NODE_ENV}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();