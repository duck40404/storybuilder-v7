import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const savedSagasDir = path.join(process.cwd(), "saved_sagas");

export async function GET() {
  try {
    // Ensure directory exists
    try {
      await fs.access(savedSagasDir);
    } catch {
      await fs.mkdir(savedSagasDir, { recursive: true });
    }

    const files = await fs.readdir(savedSagasDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    // Sort by modified time descending
    const filesWithStats = await Promise.all(
      mdFiles.map(async (f) => {
        const stat = await fs.stat(path.join(savedSagasDir, f));
        return { filename: f, mtime: stat.mtimeMs };
      })
    );

    filesWithStats.sort((a, b) => b.mtime - a.mtime);
    
    return NextResponse.json({ files: filesWithStats.map(f => f.filename) });
  } catch (error) {
    console.error("Load Sagas Error (GET):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { filename } = body;

    if (!filename) {
      return NextResponse.json({ error: "Missing filename" }, { status: 400 });
    }

    // Path traversal protection
    const safeFilename = path.basename(filename);
    const filePath = path.join(savedSagasDir, safeFilename);

    const fileContent = await fs.readFile(filePath, "utf8");

    // Extract JSON block using substring
    const startIndex = fileContent.indexOf("---json");
    if (startIndex === -1) {
      throw new Error("Could not find start of ---json block");
    }
    
    const endDelim = "---";
    const actualStartIndex = startIndex + "---json".length;
    const endIndex = fileContent.indexOf(endDelim, actualStartIndex);

    if (endIndex === -1) {
      throw new Error("Could not find end of --- block");
    }

    const jsonString = fileContent.substring(actualStartIndex, endIndex).trim();
    const global_state = JSON.parse(jsonString);

    return NextResponse.json({ success: true, global_state });

  } catch (error) {
    console.error("Load Saga Error (POST):", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
