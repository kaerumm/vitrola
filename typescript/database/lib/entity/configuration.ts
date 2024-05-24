import { BaseEntity, Column, Entity, ManyToOne } from 'typeorm'
import { Snowflake } from '../snowflake'
import { PrimaryGeneratedColumn } from 'typeorm/browser'

@Entity()
export class Configuration extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    owner: Snowflake
}
