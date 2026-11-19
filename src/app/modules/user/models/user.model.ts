import { DataType, Table, Column, Model } from 'sequelize-typescript';

@Table({
  tableName: 'User',
  timestamps: false,
})
export class User extends Model {
  @Column({ primaryKey: true, autoIncrement: true, type: DataType.INTEGER })
  declare id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare email: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare password: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare passwordSalt: string | null;
}