import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { normalizeName } from "../src/lib/users";

const db = new PrismaClient();

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(18, 0, 0, 0);
  return d;
}

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin123";
  const adminName = process.env.ADMIN_NAME ?? "Administrador";

  // The admin is the only account not created through an invite link — someone
  // has to be able to issue the first one.
  const admin = await db.user.upsert({
    where: { nameKey: normalizeName(adminName) },
    update: {},
    create: {
      name: adminName,
      nameKey: normalizeName(adminName),
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: "admin",
    },
  });

  const editorPassword = await bcrypt.hash("editor123", 10);
  const editors = [];
  for (const name of ["Marina Duarte", "Rafael Pontes", "Camila Serra"]) {
    editors.push(
      await db.user.upsert({
        where: { nameKey: normalizeName(name) },
        update: {},
        create: { name, nameKey: normalizeName(name), passwordHash: editorPassword, role: "editor" },
      })
    );
  }

  if ((await db.project.count()) === 0) {
    await db.project.createMany({
      data: [
        {
          title: "Institucional Café Bravo",
          description: "Vídeo institucional de 2 minutos para o site da marca. Cortes dinâmicos, trilha animada.",
          deadline: daysFromNow(12),
          status: "em_edicao",
          createdById: admin.id,
        },
        {
          title: "Reels Agosto — Loja Vitrine",
          description: "Pacote de 6 reels verticais (9:16) para o mês de agosto.",
          deadline: daysFromNow(2),
          status: "em_edicao",
          assignedEditorId: editors[0].id,
          createdById: admin.id,
        },
        {
          title: "Aftermovie Festival Sonora",
          description: "Aftermovie de 90 segundos com os melhores momentos do festival.",
          deadline: daysFromNow(-3),
          status: "em_edicao",
          assignedEditorId: editors[1].id,
          createdById: admin.id,
        },
        {
          title: "Tutorial App Finanças",
          description: "Série de 3 vídeos curtos de onboarding do aplicativo.",
          deadline: daysFromNow(6),
          status: "em_edicao",
          assignedEditorId: editors[2].id,
          createdById: admin.id,
        },
        {
          title: "Teaser Lançamento Coleção Verão",
          deadline: daysFromNow(-10),
          status: "concluido",
          assignedEditorId: editors[0].id,
          createdById: admin.id,
        },
      ],
    });
  }

  console.log(`Seed ok — admin: "${adminName}" / ${adminPassword}; editores: editor123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
