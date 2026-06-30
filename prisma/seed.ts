import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.repair.deleteMany();

  await prisma.repair.createMany({
    data: [
      {
        clientName: "Георги Петров",
        clientPhone: "0888123456",
        device: "Samsung TV 55\" UE55",
        defectNotes: "Няма картина, има звук",
        dateReceived: new Date("2026-06-18"),
        price: 85,
        status: "CHAKA_CHASTI",
      },
      {
        clientName: "Мария Димитрова",
        clientPhone: "0877654321",
        device: "LG пералня F4V5",
        defectNotes: "Не извърта барабана, грешка LE",
        dateReceived: new Date("2026-06-20"),
        price: null,
        status: "PRIET",
      },
      {
        clientName: "Иван Стоянов",
        clientPhone: "0899111222",
        device: "Philips TV 43\"",
        defectNotes: "Не включва",
        dateReceived: new Date("2026-06-15"),
        price: 120,
        status: "GOTOV",
      },
      {
        clientName: "Елена Николова",
        clientPhone: "0888777666",
        device: "Bosch хладилник",
        defectNotes: "Не охлажда достатъчно",
        dateReceived: new Date("2026-06-10"),
        price: 95,
        status: "IZADEN",
      },
    ],
  });

  console.log("Примерните данни са добавени успешно.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
