// uploadFunctions.ts
type ProgressCb = (p: { loaded: number; total: number; progress: number }) => void;

// Use 5 MiB (5 * 1024 * 1024 = 5,242,880 bytes)
const CHUNK_SIZE = 5 * 1024 * 1024;

async function uploadChunk({
  endpoint,
  projectId,
  bucketId,
  fileId,
  blob,
  start,
  endExclusive,
  total,
  serverFileId,     // set after first chunk
  permissions,       // only on first chunk
  filename,
  attempt = 1,
  maxAttempts = 5,
}: {
  endpoint: string;
  projectId: string;
  bucketId: string;
  fileId: string;
  blob: Blob;
  start: number;
  endExclusive: number; // exclusive
  total: number;
  serverFileId?: string;
  permissions?: string[];
  filename: string;
  attempt?: number;
  maxAttempts?: number;
}) {
  const form = new FormData();
  const isFinal = endExclusive === total;
  const partSize = blob.size;

  // Sanity: non-final parts must be >= 5 MiB
  if (!isFinal && partSize < CHUNK_SIZE) {
    console.error("Non-final part too small", { partSize, CHUNK_SIZE, start, endExclusive, total });
    throw new Error(`Non-final part < 5MiB: ${partSize}`);
  }

  form.append("fileId", fileId);
  form.append("file", blob, filename);
  if (!serverFileId && permissions?.length) {
    for (const p of permissions) form.append("permissions[]", p);
  }

  const contentRange = `bytes ${start}-${endExclusive - 1}/${total}`;
  const headers = new Headers();
  headers.set("X-Appwrite-Project", projectId);
  headers.set("Content-Range", contentRange);
  if (serverFileId) headers.set("X-Appwrite-Id", serverFileId);

  // Debug logging to verify at runtime
  console.log("Uploading chunk", { start, endExclusive, partSize, contentRange, isFinal });

  try {
    const res = await fetch(`${endpoint}/storage/buckets/${bucketId}/files`, {
      method: "POST",
      body: form,
      headers,
      credentials: "include",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Upload failed (${res.status}): ${text}`);
    }
    return await res.json();
  } catch (err) {
    if (attempt < maxAttempts) {
      const backoffMs = Math.min(15000, 500 * 2 ** (attempt - 1));
      await new Promise(r => setTimeout(r, backoffMs));
      return uploadChunk({
        endpoint,
        projectId,
        bucketId,
        fileId,
        blob,
        start,
        endExclusive,
        total,
        serverFileId,
        permissions,
        filename,
        attempt: attempt + 1,
        maxAttempts,
      });
    }
    throw err;
  }
}

export async function uploadFileChunked({
  endpoint,
  projectId,
  bucketId,
  fileId,
  file,
  permissions,
  onProgress,
}: {
  endpoint: string;
  projectId: string;
  bucketId: string;
  fileId: string;
  file: File;
  permissions?: string[];
  onProgress?: ProgressCb;
}) {
  const total = file.size;

  // Small-file fast path: single request via SDK instead of multipart
  if (total <= CHUNK_SIZE) {
    throw new Error("SMALL_FILE_FAST_PATH"); // handle outside by falling back to storage.createFile
  }

  let uploaded = 0;
  let serverFileId: string | undefined;
  let lastReported = 0;

  for (let start = 0; start < total; start += CHUNK_SIZE) {
    const endExclusive = Math.min(start + CHUNK_SIZE, total);
    const blob = file.slice(start, endExclusive);

    const result = await uploadChunk({
      endpoint,
      projectId,
      bucketId,
      fileId,
      blob,
      start,
      endExclusive,
      total,
      serverFileId,
      permissions: !serverFileId ? permissions : undefined,
      filename: file.name,
    });

    if (!serverFileId) serverFileId = result.$id || result.id || fileId;

    uploaded = endExclusive;
    if (onProgress) {
      const now = performance.now();
      if (now - lastReported > 80 || uploaded === total) {
        lastReported = now;
        onProgress({
          loaded: uploaded,
          total,
          progress: Math.round((uploaded / total) * 100),
        });
      }
    }
  }

  return { $id: serverFileId ?? fileId, sizeOriginal: total, name: file.name };
}
