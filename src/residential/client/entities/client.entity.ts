import { ResHouse } from "src/residential/house/entities/house.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('res_client')
export class ResClient {
        
    @PrimaryGeneratedColumn('increment', { name: 'res_client_id', comment: 'Identificador unico de la tabla' })
    resClientId: number;

    @Column({ name: 'first_name', type: 'varchar', length: 100, comment: 'First name for the user'})
    firstName: string;
    
    @Column({ name: 'last_name', type: 'varchar', length: 100, comment: 'Last name for the user'})
    lastName: string;
    
    @Column({ name: 'mother_last_name', type: 'varchar', length: 100, comment: 'Mother last name for the user', nullable: true})
    motherLastName?: string;
    
    @Column({ type:'varchar', name:'email', length:50, comment: 'Email of the client user' })
    email: string;
    
    @Column({ name: 'house_id', type: 'int', comment: 'house id client belongs' })
    houseId:number;

    @Column({ type:'tinyint', name:'tag_active', width:1, comment: 'Property indicating if a registry is actived', default: 1 })
    tagActive: number;
        
    @Column({ type:'tinyint', name:'tag_delete', width:1, comment: 'Property indicating if a registry is eliminated', default: 0 })
    tagDelete: number;
    
    @Column({ type:'int', name:'created_by', comment: 'Property indicating the user who created this record', nullable: true  })
    createdBy: number;
    
    @CreateDateColumn( { name:'created_at', comment: 'Property indicating the record created date', nullable: true  })
    createdAt: Date;
    
    @Column({ type:'int', name:'updated_by', comment: 'Property indicating the last user who updated this record', nullable: true  })
    updatedBy: number;
    
    @UpdateDateColumn({ name:'updated_at', comment: 'Property indicating the record updated date', nullable: true  })
    updatedAt: Date;

    @JoinColumn({ name: "house_id" })
    @ManyToOne(type => ResHouse, h => h.clientId)
    house?: ResHouse

    
}
