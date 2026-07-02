import { EmployeeEntity } from '@/modules/employees/entities/employee.entity';
import { Like, Repository } from 'typeorm';

export async function generateNextEmployeeCode(
  employeeRepository: Repository<EmployeeEntity>,
): Promise<string> {
  const employees = await employeeRepository.find({
    where: { employeeCode: Like('EMP%') },
    select: { employeeCode: true },
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
