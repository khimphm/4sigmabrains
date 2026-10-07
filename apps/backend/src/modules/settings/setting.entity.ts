import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

// Cấu hình hệ thống dạng key/value (thông tin công ty, nhãn công việc...)
@Entity('settings')
export class Setting {
  @PrimaryColumn()
  key: string;

  @Column({ type: 'jsonb' })
  value: unknown;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
