import { PrismaService } from '@/infrastructure/prisma/prisma.service';

export async function generateNextEmployeeCode(
  prisma: PrismaService,
): Promise<string> {
  const employees = await prisma.employee.findMany({
    select: { employeeCode: true },
    where: { employeeCode: { startsWith: 'EMP' } },
  });

  let max = 0;
  for (const employee of employees) {
    const numericPart = parseInt(
      employee.employeeCode.replace(/^EMP/i, ''),
      10,
    );
    if (!Number.isNaN(numericPart) && numericPart > max) {
      max = numericPart;
    }
  }

  return `EMP${String(max + 1).padStart(3, '0')}`;
}
