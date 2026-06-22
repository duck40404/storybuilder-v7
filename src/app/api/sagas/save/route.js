import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(request) {
  try {
    const body = await request.json();
    const { global_state, episode_history } = body;

    if (!global_state) {
      return NextResponse.json({ error: "Missing global_state" }, { status: 400 });
    }

    // Determine filename
    let spark = global_state.level_1_kernel?.raw_spark_text || global_state.level_1_kernel?.generated_spark;
    let filename = `saga_${Date.now()}.md`;
    
    if (spark && spark.trim() !== "") {
      // Slugify the first 30 characters of the spark
      const slug = spark
        .substring(0, 30)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      if (slug) {
        filename = `${slug}_${Date.now()}.md`;
      }
    }

    const savedSagasDir = path.join(process.cwd(), "saved_sagas");

    // Ensure directory exists (it should, but just in case)
    try {
      await fs.access(savedSagasDir);
    } catch {
      await fs.mkdir(savedSagasDir, { recursive: true });
    }

    const filePath = path.join(savedSagasDir, filename);

    // Format the Markdown string
    const stateJson = JSON.stringify(global_state, null, 2);
    const historyText = Array.isArray(episode_history) ? episode_history.join("\n\n---\n\n") : (episode_history || "No episodes compiled yet.");

    const fileContent = `---json\n${stateJson}\n---\n# The Saga Begins\n\n${historyText}\n`;

    await fs.writeFile(filePath, fileContent, "utf8");

    return NextResponse.json({ success: true, filename });

  } catch (error) {
    console.error("Save Saga Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
