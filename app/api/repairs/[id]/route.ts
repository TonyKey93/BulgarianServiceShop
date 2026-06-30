import { NextRequest, NextResponse } from "next/server";
import { RepairStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { UpdateRepairInput } from "@/lib/repairs";

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = Number(idParam);

  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Невалиден номер." }, { status: 400 });
  }

  const body = (await request.json()) as UpdateRepairInput;

  const data: {
    clientName?: string;
    clientPhone?: string;
    device?: string;
    defectNotes?: string;
    dateReceived?: Date;
    price?: number | null;
    status?: RepairStatus;
  } = {};

  if (body.clientName !== undefined) data.clientName = body.clientName.trim();
  if (body.clientPhone !== undefined) {
    const phone = body.clientPhone.trim();
    if (!/^0\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "Телефонният номер трябва да се състои от точно 10 цифри и да започва с 0." },
        { status: 400 }
      );
    }
    data.clientPhone = phone;
  }
  if (body.device !== undefined) data.device = body.device.trim();
  if (body.defectNotes !== undefined) data.defectNotes = body.defectNotes.trim();
  if (body.dateReceived !== undefined) data.dateReceived = new Date(body.dateReceived);
  if (body.price !== undefined) data.price = body.price;
  if (body.status !== undefined) data.status = body.status;

  try {
    const repair = await prisma.repair.update({
      where: { id },
      data,
    });
    return NextResponse.json(serializeRepair(repair));
  } catch {
    return NextResponse.json({ error: "Записът не е намерен." }, { status: 404 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = Number(idParam);

  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Невалиден номер." }, { status: 400 });
  }

  try {
    await prisma.repair.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Записът не е намерен." }, { status: 404 });
  }
}
