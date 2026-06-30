import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const backupsDir = path.join(process.cwd(), "backups");
const dbPath = path.join(process.cwd(), "prisma", "dev.db");

// Ensure backups directory exists
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

export async function GET() {
  try {
    if (!fs.existsSync(backupsDir)) {
      return NextResponse.json([]);
    }

    const files = fs.readdirSync(backupsDir);
    const backups = files
      .filter((file) => /^backup_\d+\.db$/.test(file))
      .map((file) => {
        const filePath = path.join(backupsDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          createdAt: stats.mtime.toISOString(), // Use mtime as birthtime can be unreliable on some filesystems
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return NextResponse.json(backups);
  } catch (err) {
    console.error("Backup list error:", err);
    return NextResponse.json({ error: "Грешка при извличане на списъка." }, { status: 500 });
  }
}

export async function POST() {
  try {
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: "Базата данни не съществува." }, { status: 404 });
    }

    const timestamp = Date.now();
    const backupFilename = `backup_${timestamp}.db`;
    const backupPath = path.join(backupsDir, backupFilename);

    fs.copyFileSync(dbPath, backupPath);

    return NextResponse.json({
      success: true,
      filename: backupFilename,
    });
  } catch (err) {
    console.error("Backup creation error:", err);
    return NextResponse.json({ error: "Грешка при създаване на резервно копие." }, { status: 500 });
  }
}
