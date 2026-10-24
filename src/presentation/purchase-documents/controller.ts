import { Request, Response, NextFunction } from 'express';
import {
  CustomError,
  GetPurchaseDocument,
  GetPurchaseDocuments,
  ImportPurchaseDocuments,
  PaginationDto,
  PurchaseDocumentFiltersDto,
  PurchaseDocumentRepository,
  UnvoidPurchaseDocument,
  VoidPurchaseDocument,
  VoidPurchaseDocumentDto,
} from '../../domain';

export class PurchaseDocumentsController {
  constructor(
    private readonly purchaseDocumentRepository: PurchaseDocumentRepository,
    private readonly receiverNrcs: string[],
  ) {}

  public importDocuments = (req: Request, res: Response, next: NextFunction) => {
    const files = Array.isArray(req.files) ? req.files : [];
    if (files.length === 0) return next(CustomError.badRequest('At least one .json file is required in the "files" field'));

    new ImportPurchaseDocuments(this.purchaseDocumentRepository, this.receiverNrcs)
      .execute(
        files.map((file) => ({ name: file.originalname, content: file.buffer })),
        req.user!.id,
      )
      .then((result) => res.json(result))
      .catch(next);
  };

  public getDocuments = (req: Request, res: Response, next: NextFunction) => {
    const [paginationError, paginationDto] = PaginationDto.create(req.query);
    if (paginationError) return next(CustomError.badRequest(paginationError));

    const [filtersError, filtersDto] = PurchaseDocumentFiltersDto.create(req.query);
    if (filtersError) return next(CustomError.badRequest(filtersError));

    new GetPurchaseDocuments(this.purchaseDocumentRepository, req.baseUrl)
      .execute(paginationDto!, filtersDto!)
      .then((documents) => res.json(documents))
      .catch(next);
  };

  public getDocumentById = (req: Request, res: Response, next: NextFunction) => {
    const id = +req.params.id!;
    if (isNaN(id)) return next(CustomError.badRequest('Invalid ID format'));

    new GetPurchaseDocument(this.purchaseDocumentRepository)
      .execute(id)
      .then((document) => res.json(document))
      .catch(next);
  };

  public voidDocument = (req: Request, res: Response, next: NextFunction) => {
    const [error, voidDto] = VoidPurchaseDocumentDto.create({ ...req.body, id: +req.params.id!, userId: req.user!.id });
    if (error) return next(CustomError.badRequest(error));

    new VoidPurchaseDocument(this.purchaseDocumentRepository)
      .execute(voidDto!)
      .then((result) => res.json(result))
      .catch(next);
  };

  public unvoidDocument = (req: Request, res: Response, next: NextFunction) => {
    const id = +req.params.id!;
    if (isNaN(id)) return next(CustomError.badRequest('Invalid ID format'));

    new UnvoidPurchaseDocument(this.purchaseDocumentRepository)
      .execute(id)
      .then((document) => res.json(document))
      .catch(next);
  };
}
