import { NextRequest, NextResponse } from "next/server";
import { RepairStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CreateRepairInput } from "@/lib/repairs";

function serializeRepair(repair: {
  id: number;
  clientName: string;
  clientPhone: string;
  device: string;
  defectNotes: string;
  dateReceived: Date;
  price: number | null;
  status: RepairStatus;
}) {
  return {
    ...repair,
    dateReceived: repair.dateReceived.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const status = searchParams.get("status")?.trim() ?? "";

  const where: {
    OR?: Array<
      | { clientName: { contains: string } }
      | { clientPhone: { contains: string } }
    >;
    status?: RepairStatus;
  } = {};

  if (search) {
    where.OR = [
      { clientName: { contains: search } },
      { clientPhone: { contains: search } },
    ];
  }

  if (status && Object.values(RepairStatus).includes(status as RepairStatus)) {
    where.status = status as RepairStatus;
  }

  const repairs = await prisma.repair.findMany({
    where,
    orderBy: [{ dateReceived: "desc" }, { id: "desc" }],
  });

  return NextResponse.json(repairs.map(serializeRepair));
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateRepairInput;

  if (!body.clientName?.trim() || !body.clientPhone?.trim() || !body.device?.trim()) {
    return NextResponse.json(
      { error: "Име, телефон и уред са задължителни." },
      { status: 400 }
    );
  }

  const phone = body.clientPhone.trim();
  if (!/^0\d{9}$/.test(phone)) {
    return NextResponse.json(
      { error: "Телефонният номер трябва да се състои от точно 10 цифри и да започва с 0." },
      { status: 400 }
    );
  }

  const repair = await prisma.repair.create({
    data: {
      clientName: body.clientName.trim(),
      clientPhone: body.clientPhone.trim(),
      device: body.device.trim(),
      defectNotes: body.defectNotes?.trim() ?? "",
      dateReceived: body.dateReceived ? new Date(body.dateReceived) : new Date(),
      price: body.price ?? null,
      status: body.status ?? "PRIET",
    },
  });

  return NextResponse.json(serializeRepair(repair), { status: 201 });
}
