
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, BeforeInsert, BeforeUpdate, IntegerType, JoinTable } from 'typeorm';


@Entity('cat_cfe_contract')
export class CfeContract {
    @PrimaryGeneratedColumn('increment', { name: 'contract_id', comment: 'Id for cfe contract creation' })
    contractId: number;

    @Column({ type: 'varchar', length: 20, name: 'street', comment: 'Street the contract', nullable: false, })
    street: string;

    @Column({ type: 'varchar', length: 20, name: 'receipt_date', comment: 'Estimated Receipt Date' })
    receiptDate: string;

    @Column({ type: 'tinyint', name: 'billing_period_type', width: 1, comment: 'Billing Period 1=Bimonthly 2=Mmonthly', default: 1 })
    billingPeriodType: number;

    @Column({ type: 'varchar', length: 50, name: 'billing_period', width: 1, comment: 'Billing Period 1=Bimonthly 2=Mmonthly', default: 1 })
    billingPeriod: number;

    @Column({ type: 'varchar', length: 50, name: 'receipt_months', comment: ' months when to receive receipt', nullable: true, })
    receiptMonths: string;

    @Column({ type: 'varchar', length: 12, name: 'service_number', comment: 'service_number', nullable: true, })
    serviceNumber: string;

    @Column({ type: 'varchar', length: 6, name: 'meter_number', comment: 'meter_number', nullable: true, })
    meterNumber: string;

    @Column({ type: 'varchar', length: 80, name: 'client_name', comment: 'meter_number', nullable: true, })
    clientName: string;

    @Column({ type: 'varchar', length: 15, name: 'payment_due_date', comment: 'Property indicating payment due date', nullable: true })
    paymentDueDate: string;

    @Column({ type: 'varchar', length: 20, name: 'payment_status', width: 1, comment: ' Payment Status 1=not paid 2=paid', default: 1 })
    paymentStatus: number;

    @Column({ type: 'decimal', precision: 10, scale: 4, name: 'total', comment: 'Subtotal the sale' })
    total: number;

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
