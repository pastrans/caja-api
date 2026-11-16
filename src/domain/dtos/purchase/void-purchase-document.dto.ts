export class VoidPurchaseDocumentDto {
  static readonly MAX_REASON_LENGTH = 500;

  private constructor(
    public readonly id: number,
    public readonly reason: string,
    public readonly userId: number,
  ) {}

  static create(props: { [key: string]: any }): [string, undefined] | [undefined, VoidPurchaseDocumentDto] {
    const { id, reason, userId } = props;

    if (!Number.isInteger(id) || id <= 0) return ['Invalid ID format', undefined];
    if (!Number.isInteger(userId) || userId <= 0) return ['userId is required', undefined];

    if (typeof reason !== 'string' || reason.trim() === '') return ['reason is required', undefined];
    if (reason.trim().length > this.MAX_REASON_LENGTH) {
      return [`reason must be at most ${this.MAX_REASON_LENGTH} characters`, undefined];
    }

    return [undefined, new VoidPurchaseDocumentDto(id, reason.trim(), userId)];
  }
}
