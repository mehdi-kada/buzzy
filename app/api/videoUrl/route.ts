import { NextResponse } from "next/server";
import { storage, BUCKET_ID } from "@/lib/appwrite";

// GET /api/videoUrl?id=<fileId>
export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const fileId = searchParams.get("id");

		if (!fileId) {
			return NextResponse.json(
				{ error: "Missing required query parameter: id" },
				{ status: 400 }
			);
		}

		if (!BUCKET_ID) {
			return NextResponse.json(
				{ error: "Storage bucket ID is not configured on the server" },
				{ status: 500 }
			);
		}

		// This returns a direct download URL for the file in Appwrite Storage.
		// If your bucket requires auth, the client must be authenticated for the download to succeed.
		const url = storage.getFileDownload(BUCKET_ID, fileId);

		return NextResponse.json({ url });
	} catch (error: any) {
		return NextResponse.json(
			{ error: error?.message ?? "Failed to generate download URL" },
			{ status: 500 }
		);
	}
}

