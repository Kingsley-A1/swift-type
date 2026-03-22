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

function normalizeChatMessages(payload: unknown) {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((message, index) => {
    if (!message || typeof message !== "object") {
      return {
        id: `legacy-${index}`,
        role: "assistant",
        parts: [{ type: "text", text: String(message ?? "") }],
      };
    }

    const candidate = message as {
      id?: string;
      role?: string;
      parts?: unknown;
      content?: unknown;
    };

    if (Array.isArray(candidate.parts)) {
      return {
        ...candidate,
        id: candidate.id ?? `legacy-${index}`,
        role: candidate.role === "user" ? "user" : "assistant",
      };
    }

    const text = typeof candidate.content === "string" ? candidate.content : "";

    return {
      ...candidate,
      id: candidate.id ?? `legacy-${index}`,
      role: candidate.role === "user" ? "user" : "assistant",
      parts: [{ type: "text", text }],
    };
  });
}

export async function getChatMessages(userId: string, chatId: string) {
  try {
    const res = await r2.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: chatKey(userId, chatId) }),
    );
    const body = await res.Body?.transformToString();
    return body ? normalizeChatMessages(JSON.parse(body)) : [];
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
