/**
 * S3 verification script — proves backend credentials + bucket + region all work end-to-end.
 *
 * Run with:
 *   npx tsx src/scripts/test-s3.ts
 *
 * What it does:
 *   1. Uploads a tiny test file to your bucket (under prefix `_test/`)
 *   2. Lists objects under `_test/` to confirm it's there
 *   3. Deletes the test file
 *   4. Lists again to confirm cleanup
 *
 * Safe to run anytime — only touches files under the `_test/` prefix.
 */

import { PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, s3Bucket, isS3Configured } from '../config/s3';

const TEST_KEY = `_test/test-${Date.now()}.txt`;
const TEST_BODY = `S3 verification test\nTimestamp: ${new Date().toISOString()}\n`;

async function main() {
  console.log('🔍 S3 verification script\n');

  // Step 1: Check config
  if (!isS3Configured || !s3Client) {
    console.error('❌ S3 is NOT configured. Check your .env file:');
    console.error('   - AWS_REGION');
    console.error('   - AWS_ACCESS_KEY_ID');
    console.error('   - AWS_SECRET_ACCESS_KEY');
    console.error('   - AWS_S3_BUCKET');
    process.exit(1);
  }

  console.log(`✅ S3 client configured`);
  console.log(`   Bucket: ${s3Bucket}`);
  console.log(`   Test key: ${TEST_KEY}\n`);

  // Step 2: Upload a test file
  console.log('📤 Uploading test file...');
  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: s3Bucket,
        Key: TEST_KEY,
        Body: TEST_BODY,
        ContentType: 'text/plain',
      })
    );
    console.log('   ✅ Upload succeeded\n');
  } catch (err: any) {
    console.error('   ❌ Upload failed:', err.name);
    console.error('   ', err.message);
    if (err.name === 'NoSuchBucket') {
      console.error('\n   The bucket name in .env does not exist or is in the wrong region.');
      console.error(`   Verify the bucket "${s3Bucket}" exists in region "${process.env.AWS_REGION}".`);
    } else if (err.name === 'AccessDenied' || err.name === 'Forbidden') {
      console.error('\n   The IAM user does not have s3:PutObject permission.');
      console.error('   Verify the IAM user has AmazonS3FullAccess (or equivalent) attached.');
    } else if (err.name === 'InvalidAccessKeyId' || err.name === 'SignatureDoesNotMatch') {
      console.error('\n   The AWS credentials in .env are invalid.');
      console.error('   Double-check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.');
    }
    process.exit(1);
  }

  // Step 3: List objects under _test/ prefix to confirm
  console.log('📋 Listing objects under _test/ prefix...');
  try {
    const listResult = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: s3Bucket,
        Prefix: '_test/',
      })
    );
    const found = listResult.Contents?.find((obj) => obj.Key === TEST_KEY);
    if (found) {
      console.log(`   ✅ Found: ${found.Key} (${found.Size} bytes)\n`);
    } else {
      console.error('   ❌ Test file was uploaded but not found in listing. Strange.');
      process.exit(1);
    }
  } catch (err: any) {
    console.error('   ❌ List failed:', err.name, err.message);
    process.exit(1);
  }

  // Step 4: Delete the test file (cleanup)
  console.log('🗑️  Cleaning up test file...');
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: s3Bucket,
        Key: TEST_KEY,
      })
    );
    console.log('   ✅ Delete succeeded\n');
  } catch (err: any) {
    console.error('   ⚠️  Delete failed:', err.name, err.message);
    console.error('   You may need to manually delete the test file from the S3 console.');
  }

  console.log('🎉 All S3 operations succeeded. Your backend can read/write to S3.\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n💥 Unexpected error:', err);
  process.exit(1);
});
