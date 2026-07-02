import { EmployeeEntity } from '@/modules/employees/entities/employee.entity';
import { EntityManager, Like } from 'typeorm';

export async function generateNextEmployeeCode(
  transactionalEntityManager: EntityManager,
): Promise<string> {
  const employees = await transactionalEntityManager.find(EmployeeEntity, {
    where: { employeeCode: Like('EMP%') },
    select: { employeeCode: true },
    order: { employeeCode: 'DESC' },
    take: 1,
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
