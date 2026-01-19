import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';

export const getActionItems = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { project_id } = req.query;

    let query = supabase.from('action_items').select('*');

    if (project_id) {
      query = query.eq('project_id', project_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json(data);
  } catch (error) {
    console.error('Get action items error:', error);
    res.status(500).json({ error: 'Failed to fetch action items' });
  }
};

export const getActionItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('action_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      res.status(404).json({ error: 'Action item not found' });
      return;
    }

    res.json(data);
  } catch (error) {
    console.error('Get action item error:', error);
    res.status(500).json({ error: 'Failed to fetch action item' });
  }
};

export const createActionItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const actionItemData = req.body;

    const { data, error } = await supabase
      .from('action_items')
      .insert([{
        ...actionItemData,
        created_by: req.user?.id,
      }])
      .select()
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Create action item error:', error);
    res.status(500).json({ error: 'Failed to create action item' });
  }
};

export const updateActionItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const actionItemData = req.body;

    const { data, error } = await supabase
      .from('action_items')
      .update(actionItemData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json(data);
  } catch (error) {
    console.error('Update action item error:', error);
    res.status(500).json({ error: 'Failed to update action item' });
  }
};

export const deleteActionItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('action_items')
      .delete()
      .eq('id', id);

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ message: 'Action item deleted successfully' });
  } catch (error) {
    console.error('Delete action item error:', error);
    res.status(500).json({ error: 'Failed to delete action item' });
  }
};
