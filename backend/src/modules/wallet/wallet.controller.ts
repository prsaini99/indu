import { Request, Response, NextFunction } from 'express';
import { WalletService } from './wallet.service';
import { sendSuccess } from '../../shared/utils/apiResponse';

const service = new WalletService();

export class WalletController {
  // ==========================================
  // PARENT: WALLET
  // ==========================================

  async getBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getBalance(req.user!.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getTransactions(req.user!.id, req.query as Record<string, string>);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // PUBLIC: CREDIT PACKAGES
  // ==========================================

  async listActivePackages(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.listActivePackages();
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // ADMIN: CREDIT PACKAGES
  // ==========================================

  async listAllPackages(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.listAllPackages();
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createPackage(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.createPackage(req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  async updatePackage(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.updatePackage(req.params.id as string, req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deactivatePackage(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.deactivatePackage(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async softDeletePackage(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.softDeletePackage(req.params.id as string);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // ADMIN: WALLETS
  // ==========================================

  async listAllWallets(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.listAllWallets(req.query as Record<string, string>);
      sendSuccess(res, result.data, 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async adjustCredits(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.adjustCredits(req.params.parentId as string, req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
