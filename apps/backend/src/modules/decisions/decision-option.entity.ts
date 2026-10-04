import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm';

import { BaseEntity } from '../../common/base.entity.js';
import { Decision } from './decision.entity.js';

@Entity('decision_options')
export class DecisionOption extends BaseEntity {
  @Column({ name: 'decision_id', type: 'uuid' })
  decisionId: string;

  @ManyToOne(() => Decision, (d) => d.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'decision_id' })
  decision: Relation<Decision>;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', array: true, default: '{}' })
  pros: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  cons: string[];

  @Column({ default: 0 })
  position: number;
}
