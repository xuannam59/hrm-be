import { EmployeeEntity } from '@/modules/employees/entities/employee.entity';
import {
  Inject,
  Injectable,
  mixin,
  NotFoundException,
  PipeTransform,
  Type,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { EEmployeeStatus } from '../constants/employee.constant';

@Injectable()
export class ExistEmployeeBodyPipe implements PipeTransform {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
  ) {}
  async transform(value: any) {
    if (!value?.employeeId) {
      return value;
    }

    const existsEmployee = await this.employeeRepository.exists({
      where: { id: value.employeeId, status: EEmployeeStatus.WORKING },
    });

    if (!existsEmployee) {
      throw new NotFoundException('Employee not found');
    }

    return value;
  }
}

export function EntityExistPipe<T extends ObjectLiteral>(
  entity: EntityTarget<T>,
  field: string = 'id',
): Type<PipeTransform> {
  @Injectable()
  class MixinEntityExistPipe implements PipeTransform {
    constructor(@Inject(DataSource) private readonly dataSource: DataSource) {}
    async transform(value: any) {
      const id =
        value !== null && typeof value === 'object' ? value?.[field] : value;

      if (id === undefined || id === null || id === '') {
        return value;
      }

      const repository = this.dataSource.getRepository(entity);

      const recordExists = await repository.findOne({
        where: { id },
      });

      if (!recordExists) {
        const entityName = typeof entity === 'function' ? entity.name : 'Data';
        throw new NotFoundException(`${entityName} not found`);
      }

      return value;
    }
  }

  return mixin(MixinEntityExistPipe);
}
