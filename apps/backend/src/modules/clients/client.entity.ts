import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../../common/base.entity.js';

// Khách hàng / chủ đầu tư
@Entity('clients')
export class Client extends BaseEntity {
  @Column()
  name: string;

  @Column({ name: 'contact_name', type: 'varchar', nullable: true })
  contactName: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', nullable: true })
  address: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
