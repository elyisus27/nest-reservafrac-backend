import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,  } from 'typeorm';

@Entity('cat_way_pay')
export class CatWayPay {
    @PrimaryGeneratedColumn('increment', { name: 'way_pay_id', comment: 'Id for way pay creation' })
    wayPayId: number;

    @Column({ type: 'varchar', name: 'way_pay_name', length: 150, comment: 'Name for the way pay', unique: true })
    wayPayName: string;

    @Column({ type: 'varchar', name: 'short_name', length: 5, comment: 'way pay short name', unique: true })
    shortName: string;

    @Column({ type: 'varchar', name: 'cfdi_key', length: 2, comment: 'CFDI KEY for the way pay', unique: true })
    cfdiKey: string;

    @Column({ type: 'tinyint', name: 'tag_active', width: 1, comment: 'Property indicating if a registry is actived', default: 1 })
    tagActive: number;

    @Column({ type: 'tinyint', name: 'tag_delete', width: 1, comment: 'Property indicating if a registry is eliminated', default: 0 })
    tagDelete: number;

    @Column({ type: 'int', name: 'created_by', comment: 'Property indicating the user who created this record', nullable: true })
    createdBy: number;

    @CreateDateColumn({ name: 'created_at', comment: 'Property indicating the record created date', nullable: true })
    createdAt: Date;

    @Column({ type: 'int', name: 'updated_by', comment: 'Property indicating the last user who updated this record', nullable: true })
    updatedBy: number;

    @UpdateDateColumn({ name: 'updated_at', comment: 'Property indicating the record updated date', nullable: true })
    updatedAt: Date;

}