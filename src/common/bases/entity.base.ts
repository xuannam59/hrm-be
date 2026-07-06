import { CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';
import { UpdateDateColumn } from 'typeorm';

export class EntityBase {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
