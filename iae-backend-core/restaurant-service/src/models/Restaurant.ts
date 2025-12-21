import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import MenuItem from './MenuItem';

@Entity('restaurants')
class Restaurant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  address!: string;

  @Column({ nullable: true })
  description?: string;

  @OneToMany(() => MenuItem, (item) => item.restaurant)
  menus?: MenuItem[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

export default Restaurant;
