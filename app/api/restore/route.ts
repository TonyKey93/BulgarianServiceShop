import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

const backupsDir = path.join(process.cwd(), "backups");
const dbPath = path.join(process.cwd(), "prisma", "dev.db");

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { filename?: string };
    const filename = body.filename;

    if (!filename || !/^backup_\d+\.db$/.test(filename)) {
      return NextResponse.json({ error: "Невалидно име на файл." }, { status: 400 });
    }

    const backupPath = path.join(backupsDir, filename);
    if (!fs.existsSync(backupPath)) {
      return NextResponse.json({ error: "Резервното копие не е намерено." }, { status: 404 });
    }

    // Disconnect Prisma to release the database file handle
    await prisma.$disconnect();

    // Overwrite database file
    fs.copyFileSync(backupPath, dbPath);

    // Clean up SQLite auxiliary files if they exist
    const journalFiles = [`${dbPath}-journal`, `${dbPath}-wal`, `${dbPath}-shm`];
    for (const jFile of journalFiles) {
      if (fs.existsSync(jFile)) {
        try {
          fs.unlinkSync(jFile);
        } catch (e) {
          console.warn(`Could not delete auxiliary file ${jFile}:`, e);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Restore error:", err);
    return NextResponse.json({ error: "Грешка при възстановяване на базата данни." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");

    if (!filename || !/^backup_\d+\.db$/.test(filename)) {
      return NextResponse.json({ error: "Невалидно име на файл." }, { status: 400 });
    }

    const backupPath = path.join(backupsDir, filename);
    if (!fs.existsSync(backupPath)) {
      return NextResponse.json({ error: "Файлът не е намерен." }, { status: 404 });
    }

    fs.unlinkSync(backupPath);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete backup error:", err);
    return NextResponse.json({ error: "Грешка при изтриване на резервното копие." }, { status: 500 });
  }
}
