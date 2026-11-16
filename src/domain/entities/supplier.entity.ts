import { CustomError } from '../errors/custom.error';

export class SupplierEntity {
  constructor(
    public id: number,
    public nit: string,
    public nrc: string | null,
    public name: string,
    public commercialName: string | null,
    public activityCode: string | null,
    public activityDescription: string | null,
    public phone: string | null,
    public email: string | null,
    public lastIssueDate: string, // YYYY-MM-DD del DTE más reciente
    public createdAt?: Date,
    public updatedAt?: Date
  ) {}

  public static fromObject(object: { [key: string]: any }): SupplierEntity {
    const { id, nit, nrc, name, commercialName, activityCode, activityDescription, phone, email, lastIssueDate, createdAt, updatedAt } = object;

    if (!id) throw CustomError.internalServer('Supplier ID is required');
    if (!nit) throw CustomError.internalServer('Supplier NIT is required');
    if (!name) throw CustomError.internalServer('Supplier name is required');
    if (!lastIssueDate) throw CustomError.internalServer('Supplier lastIssueDate is required');

    return new SupplierEntity(
      Number(id),
      nit,
      nrc ?? null,
      name,
      commercialName ?? null,
      activityCode ?? null,
      activityDescription ?? null,
      phone ?? null,
      email ?? null,
      new Date(lastIssueDate).toISOString().slice(0, 10),
      createdAt ? new Date(createdAt) : undefined,
      updatedAt ? new Date(updatedAt) : undefined
    );
  }
}
