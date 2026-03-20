import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;

function chatKey(userId: string, chatId: string) {
  return `chats/${userId}/${chatId}.json`;
}

export async function getChatMessages(userId: string, chatId: string) {
  try {
    const res = await r2.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: chatKey(userId, chatId) }),
    );
    const body = await res.Body?.transformToString();
    return body ? JSON.parse(body) : [];
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "NoSuchKey") return [];
    throw err;
  }
}

export async function saveChatMessages(
  userId: string,
  chatId: string,
  messages: unknown[],
) {
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: chatKey(userId, chatId),
      Body: JSON.stringify(messages),
      ContentType: "application/json",
    }),
  );
}

export async function deleteChatMessages(userId: string, chatId: string) {
  await r2.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: chatKey(userId, chatId) }),
  );
}
