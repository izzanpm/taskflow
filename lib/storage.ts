import "server-only";

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_REGION = "auto";
const PRESIGNED_URL_TTL_SECONDS = 900;

export class StorageConfigurationError extends Error {
  constructor() {
    super("R2 storage is not configured.");
    this.name = "StorageConfigurationError";
  }
}

export class StorageRequestError extends Error {
  constructor() {
    super("R2 storage request failed.");
    this.name = "StorageRequestError";
  }
}

function getStorageConfig() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/+$/, "");

  if (
    !accountId ||
    !accessKeyId ||
    !secretAccessKey ||
    !bucketName ||
    !publicUrl
  ) {
    throw new StorageConfigurationError();
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl };
}

function createR2Client(config: ReturnType<typeof getStorageConfig>) {
  return new S3Client({
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    region: R2_REGION,
  });
}

export async function createPresignedR2Url(
  method: "PUT" | "DELETE",
  objectKey: string,
  contentType?: string,
) {
  const config = getStorageConfig();
  const client = createR2Client(config);

  if (method === "PUT") {
    return getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: config.bucketName,
        ContentType: contentType,
        Key: objectKey,
      }),
      { expiresIn: PRESIGNED_URL_TTL_SECONDS },
    );
  }

  return getSignedUrl(
    client,
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: objectKey,
    }),
    { expiresIn: PRESIGNED_URL_TTL_SECONDS },
  );
}

export function getPublicR2Url(objectKey: string) {
  const encodedObjectKey = objectKey
    .split("/")
    .map((part) =>
      encodeURIComponent(part).replace(
        /[!'()*]/g,
        (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
      ),
    )
    .join("/");

  return `${getStorageConfig().publicUrl}/${encodedObjectKey}`;
}

export function getR2ObjectKey(fileUrl: string) {
  const publicUrl = getStorageConfig().publicUrl;
  const prefix = `${publicUrl}/`;
  if (!fileUrl.startsWith(prefix)) {
    throw new StorageRequestError();
  }

  return decodeURIComponent(fileUrl.slice(prefix.length));
}

export async function deleteR2Object(fileUrl: string) {
  const config = getStorageConfig();
  const objectKey = getR2ObjectKey(fileUrl);

  try {
    await createR2Client(config).send(
      new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: objectKey,
      }),
    );
  } catch {
    throw new StorageRequestError();
  }
}
