/**
 * Cost Code Controller
 * Handles HTTP requests for cost code management
 */
import { Request, Response } from 'express';
import costCodeService from '../services/cost-codes/cost-code.service';

export const listCostCodes = async (req: Request, res: Response) => {
  try {
    const { standard_type, level, parent_id, search, is_active, page = 1, limit = 50 } = req.query;
    
    const filters = {
      standard_type: standard_type as string,
      level: level ? parseInt(level as string, 10) : undefined,
      parent_id: parent_id as string,
      search: search as string,
      is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
    };

    const result = await costCodeService.listCostCodes(
      filters,
      parseInt(page as string, 10),
      parseInt(limit as string, 10)
    );

    res.json({
      success: true,
      data: result.data,
      pagination: {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        total: result.total,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
};

export const getCostCode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const costCode = await costCodeService.getCostCode(id);

    if (!costCode) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Cost code not found' },
      });
    }

    res.json({ success: true, data: costCode });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
};


export const createCostCode = async (req: Request, res: Response) => {
  try {
    const { code, name, description, parent_id, level, standard_type } = req.body;

    if (!code || !name) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Code and name are required' },
      });
    }

    const costCode = await costCodeService.createCostCode({
      code,
      name,
      description,
      parent_id,
      level,
      standard_type,
    });

    res.status(201).json({ success: true, data: costCode });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
};

export const updateCostCode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const costCode = await costCodeService.updateCostCode(id, updates);

    if (!costCode) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Cost code not found' },
      });
    }

    res.json({ success: true, data: costCode });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
};

export const deleteCostCode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await costCodeService.deleteCostCode(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Cost code not found' },
      });
    }

    res.json({ success: true, message: 'Cost code deleted' });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
};

export const getCostCodeChildren = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const children = await costCodeService.getChildren(id);
    res.json({ success: true, data: children });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
};

export const getCostCodeHierarchy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const hierarchy = await costCodeService.getHierarchy(id);
    res.json({ success: true, data: hierarchy });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message },
    });
  }
};
