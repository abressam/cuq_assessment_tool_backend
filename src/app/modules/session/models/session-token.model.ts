import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'SessionToken',
  timestamps: false,
})
export class SessionToken extends Model {
  @Column({ primaryKey: true, type: DataType.INTEGER })
  declare userId: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare refreshToken: string;
}
