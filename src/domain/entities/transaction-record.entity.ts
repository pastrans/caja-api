import { DenominationItem } from "../interfaces/denomination-item";
import { EmployeeEntity } from "./employee.entity";

export class TransactionRecordEntity {
  constructor(
    public id: number,
    public amountToCharge: number,
    public cashProvided: number,
    public changeReturned: number,
    public cashRegisterRecordId: number,
    public employeeId: number,
    public denominations: DenominationItem[],
    public date: Date,
    public note?: string | null,
    public employee?: EmployeeEntity
  ) {}

  public static fromObject(object: { [key: string]: any }): TransactionRecordEntity {
    const {
      id,
      amountToCharge,
      cashProvided,
      changeReturned,
      cashRegisterRecordId,
      employeeId,
      denominations,
      date,
      note,
      employee
    } = object;

    if (!id) throw 'Transaction ID is required';
    if (amountToCharge === undefined) throw 'Amount to charge is required';
    if (cashProvided === undefined) throw 'Cash provided is required';
    if (changeReturned === undefined) throw 'Change returned is required';
    if (!cashRegisterRecordId) throw 'CashRegisterRecordId is required';
    if (!employeeId) throw 'Employee ID is required';

    const parsedDate = date ? new Date(date) : new Date();
    if (isNaN(parsedDate.getTime())) throw 'Invalid date format in TransactionRecord';

    return new TransactionRecordEntity(
      Number(id),
      Number(amountToCharge),
      Number(cashProvided),
      Number(changeReturned),
      Number(cashRegisterRecordId),
      Number(employeeId),
      Array.isArray(denominations) ? denominations : [],
      parsedDate,
      note,
      employee ? EmployeeEntity.fromObject(employee) : undefined
    );
  }
}