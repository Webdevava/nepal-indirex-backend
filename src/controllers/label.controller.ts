import { Request, Response } from 'express';
import { LabelService } from '../services/label.service';
import { AppError } from '../middleware/errorHandler';
import { CreateLabel, LabelResponse, LabelsListResponse, UpdateLabel, BaseResponse } from '../types/label.type';

export class LabelController {
  static async createLabel(req: Request, res: Response<LabelResponse>) {
    const labelData: CreateLabel = req.body;
    if (!req.user?.email) {
      throw new AppError('User email not found', 401);
    }

    const label = await LabelService.createLabel({ ...labelData, created_by: req.user.email });

    return res.status(201).json({
      success: true,
      message: 'Label created successfully',
      data: { label },
    });
  }

  static async getUnlabeledEvents(req: Request, res: Response<LabelsListResponse>) {
    const options = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      deviceId: req.query.deviceId as string | undefined,
      types: req.query.types ? (req.query.types as string).split(',').map(Number).filter(n => !isNaN(n)) : undefined,
      sort: (req.query.sort as 'asc' | 'desc') || 'desc',
    };

    if (options.startDate && isNaN(options.startDate.getTime())) {
      throw new AppError('Invalid start date', 400);
    }
    if (options.endDate && isNaN(options.endDate.getTime())) {
      throw new AppError('Invalid end date', 400);
    }

    const result = await LabelService.getUnlabeledEvents(options);

    return res.status(200).json({
      success: true,
      message: 'Unlabeled events fetched successfully',
      data: result,
    });
  }

  static async getLabels(req: Request, res: Response<LabelsListResponse>) {
    const options = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      createdBy: req.query.createdBy as string | undefined,
      labelType: req.query.labelType as string | undefined,
      deviceId: req.query.deviceId as string | undefined,
      sort: (req.query.sort as 'asc' | 'desc') || 'desc',
    };

    if (options.startDate && isNaN(options.startDate.getTime())) {
      throw new AppError('Invalid start date', 400);
    }
    if (options.endDate && isNaN(options.endDate.getTime())) {
      throw new AppError('Invalid end date', 400);
    }

    const result = await LabelService.getLabels(options);

    return res.status(200).json({
      success: true,
      message: 'Labels fetched successfully',
      data: result,
    });
  }

  static async updateLabel(req: Request, res: Response<LabelResponse>) {
    const labelIdParam = req.params.id;
    if (!labelIdParam) {
      throw new AppError('Label ID is required', 400);
    }
    
    const labelId = parseInt(labelIdParam);
    if (isNaN(labelId)) {
      throw new AppError('Invalid label ID', 400);
    }

    const labelData: UpdateLabel = req.body;
    const label = await LabelService.updateLabel(labelId, labelData);

    return res.status(200).json({
      success: true,
      message: 'Label updated successfully',
      data: { label },
    });
  }

  static async deleteLabel(req: Request, res: Response<BaseResponse>) {
    const labelIdParam = req.params.id;
    if (!labelIdParam) {
      throw new AppError('Label ID is required', 400);
    }
    
    const labelId = parseInt(labelIdParam);
    if (isNaN(labelId)) {
      throw new AppError('Invalid label ID', 400);
    }

    await LabelService.deleteLabel(labelId);

    return res.status(200).json({
      success: true,
      message: 'Label deleted successfully',
    });
  }

  static async deleteLabelsBulk(req: Request, res: Response<BaseResponse>) {
    const { labelIds } = req.body;
    if (!Array.isArray(labelIds) || labelIds.length === 0) {
      throw new AppError('Array of label IDs is required', 400);
    }

    const validIds = labelIds.filter((id: any) => !isNaN(parseInt(id)));
    if (validIds.length === 0) {
      throw new AppError('No valid label IDs provided', 400);
    }

    await LabelService.deleteLabelsBulk(validIds.map((id: any) => parseInt(id)));

    return res.status(200).json({
      success: true,
      message: 'Labels deleted successfully',
    });
  }
}