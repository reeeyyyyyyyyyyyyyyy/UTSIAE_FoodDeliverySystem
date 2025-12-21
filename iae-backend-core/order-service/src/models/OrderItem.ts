import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import Order from './Order';

@Entity('order_items')
class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  menuId!: string;

  @Column()
  quantity!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

  @ManyToOne(() => Order, (order) => order.items)
  order!: Order;

  @Column()
  orderId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}

export default OrderItem;
