// ============================================================
// OC PIPELINE - UNITS OF MEASURE SETTINGS PANEL
// Connected to Supabase - org_id: b3912ad3-89a8-4fdc-8816-c6e72b217161
// ============================================================

import React, { useState, useEffect } from 'react';
import { 
  Ruler, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  X
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

// Types
interface UnitOfMeasure {
  id: string;
  org_id: string;
  code: string;
  name: string;
  category: string;
  base_unit_code: string | null;
  conversion_factor: number;
  is_base_unit: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// O'Neill Contractors org_id
const ORG_ID = 'b3912ad3-89a8-4fdc-8816-c6e72b217161';

// Category options
const CATEGORIES = [
  { value: 'length', label: 'Length' },
  { value: 'area', label: 'Area' },
  { value: 'volume', label: 'Volume' },
  { value: 'weight', label: 'Weight' },
  { value: 'count', label: 'Count' },
  { value: 'time', label: 'Time' },
  { value: 'other', label: 'Other' },
];

export const UnitsOfMeasurePanel: React.FC = () => {
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newUnit, setNewUnit] = useState({
    code: '',
    name: '',
    category: 'count',
    is_base_unit: true,
    conversion_factor: 1,
    base_unit_code: '',
  });

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('units_of_measure')
        .select('*')
        .eq('org_id', ORG_ID)
        .order('category', { ascending: true })
        .order('code', { ascending: true });
      
      if (fetchError) throw fetchError;
      setUnits(data || []);
    } catch (err: any) {
      console.error('Error loading units:', err);
      setError('Failed to load: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUnit = async () => {
    if (!newUnit.code || !newUnit.name) {
      setError('Code and Name are required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('units_of_measure')
        .insert({
          org_id: ORG_ID,
          code: newUnit.code.toUpperCase(),
          name: newUnit.name,
          category: newUnit.category,
          is_base_unit: newUnit.is_base_unit,
          conversion_factor: newUnit.conversion_factor,
          base_unit_code: newUnit.is_base_unit ? null : newUnit.base_unit_code || null,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setUnits(prev => [...prev, data]);
      setShowAddForm(false);
      setNewUnit({
        code: '',
        name: '',
        category: 'count',
        is_base_unit: true,
        conversion_factor: 1,
        base_unit_code: '',
      });
    } catch (err: any) {
      console.error('Error adding unit:', err);
      setError('Failed to add: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateUnit = async (unit: UnitOfMeasure) => {
    setIsSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('units_of_measure')
        .update({
          code: unit.code,
          name: unit.name,
          category: unit.category,
          is_base_unit: unit.is_base_unit,
          conversion_factor: unit.conversion_factor,
          base_unit_code: unit.base_unit_code,
          updated_at: new Date().toISOString(),
        })
        .eq('id', unit.id);

      if (updateError) throw updateError;

      setUnits(prev => prev.map(u => u.id === unit.id ? unit : u));
      setEditingId(null);
    } catch (err: any) {
      console.error('Error updating unit:', err);
      setError('Failed to update: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUnit = async (id: string) => {
    if (!confirm('Delete this unit of measure?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('units_of_measure')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setUnits(prev => prev.filter(u => u.id !== id));
    } catch (err: any) {
      console.error('Error deleting unit:', err);
      setError('Failed to delete: ' + (err.message || 'Unknown error'));
    }
  };

  const handleToggleActive = async (unit: UnitOfMeasure) => {
    try {
      const { error: updateError } = await supabase
        .from('units_of_measure')
        .update({ is_active: !unit.is_active, updated_at: new Date().toISOString() })
        .eq('id', unit.id);

      if (updateError) throw updateError;

      setUnits(prev => prev.map(u => 
        u.id === unit.id ? { ...u, is_active: !u.is_active } : u
      ));
    } catch (err: any) {
      setError('Failed to update: ' + (err.message || 'Unknown error'));
    }
  };

  // Group units by category
  const groupedUnits = units.reduce((acc, unit) => {
    if (!acc[unit.category]) acc[unit.category] = [];
    acc[unit.category].push(unit);
    return acc;
  }, {} as Record<string, UnitOfMeasure[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading units...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Ruler className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Units of Measure</h1>
            <p className="text-sm text-gray-500">{units.length} units configured</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Unit
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="mx-6 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-gray-800 mb-3">Add New Unit</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              type="text"
              placeholder="Code (e.g. SF)"
              value={newUnit.code}
              onChange={(e) => setNewUnit(prev => ({ ...prev, code: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              maxLength={10}
            />
            <input
              type="text"
              placeholder="Name (e.g. Square Foot)"
              value={newUnit.name}
              onChange={(e) => setNewUnit(prev => ({ ...prev, name: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={newUnit.category}
              onChange={(e) => setNewUnit(prev => ({ ...prev, category: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleAddUnit}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Save
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Units List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {Object.entries(groupedUnits).map(([category, categoryUnits]) => (
          <section key={category} className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h2 className="font-semibold text-gray-700 capitalize">{category}</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="px-4 py-2 font-medium">Code</th>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Base Unit</th>
                  <th className="px-4 py-2 font-medium">Conversion</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categoryUnits.map((unit) => (
                  <tr key={unit.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm font-medium text-blue-600">{unit.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{unit.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {unit.is_base_unit ? (
                        <span className="text-green-600 text-xs font-medium">BASE</span>
                      ) : (
                        unit.base_unit_code || '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{unit.conversion_factor}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(unit)}
                        className={`text-xs px-2 py-1 rounded-full ${
                          unit.is_active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {unit.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteUnit(unit.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}

        {units.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No units of measure configured. Click "Add Unit" to create one.
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitsOfMeasurePanel;
