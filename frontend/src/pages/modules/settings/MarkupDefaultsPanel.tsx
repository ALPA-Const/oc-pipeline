// ============================================================
// OC PIPELINE - MARKUP DEFAULTS SETTINGS PANEL
// Connected to Supabase - org_id: b3912ad3-89a8-4fdc-8816-c6e72b217161
// ============================================================

import React, { useState, useEffect } from 'react';
import { 
  Percent, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Plus,
  Trash2,
  X,
  Star
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

// Types
interface MarkupDefaults {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  home_office_overhead_percent: number;
  field_office_overhead_percent: number;
  profit_percent: number;
  design_contingency_percent: number;
  construction_contingency_percent: number;
  bond_percent: number;
  insurance_percent: number;
  tax_percent: number;
  escalation_percent: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// O'Neill Contractors org_id
const ORG_ID = 'b3912ad3-89a8-4fdc-8816-c6e72b217161';

const DEFAULT_MARKUP: Partial<MarkupDefaults> = {
  name: '',
  description: '',
  home_office_overhead_percent: 5,
  field_office_overhead_percent: 5,
  profit_percent: 10,
  design_contingency_percent: 5,
  construction_contingency_percent: 5,
  bond_percent: 1.5,
  insurance_percent: 2,
  tax_percent: 0,
  escalation_percent: 3,
  is_default: false,
};

export const MarkupDefaultsPanel: React.FC = () => {
  const [profiles, setProfiles] = useState<MarkupDefaults[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Partial<MarkupDefaults> | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('markup_defaults')
        .select('*')
        .eq('org_id', ORG_ID)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true });
      
      if (fetchError) throw fetchError;
      setProfiles(data || []);
    } catch (err: any) {
      console.error('Error loading markup profiles:', err);
      setError('Failed to load: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editingProfile?.name) {
      setError('Profile name is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const saveData = {
        org_id: ORG_ID,
        name: editingProfile.name,
        description: editingProfile.description || null,
        home_office_overhead_percent: editingProfile.home_office_overhead_percent || 0,
        field_office_overhead_percent: editingProfile.field_office_overhead_percent || 0,
        profit_percent: editingProfile.profit_percent || 0,
        design_contingency_percent: editingProfile.design_contingency_percent || 0,
        construction_contingency_percent: editingProfile.construction_contingency_percent || 0,
        bond_percent: editingProfile.bond_percent || 0,
        insurance_percent: editingProfile.insurance_percent || 0,
        tax_percent: editingProfile.tax_percent || 0,
        escalation_percent: editingProfile.escalation_percent || 0,
        is_default: editingProfile.is_default || false,
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (editingProfile.id) {
        result = await supabase
          .from('markup_defaults')
          .update(saveData)
          .eq('id', editingProfile.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('markup_defaults')
          .insert(saveData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      await loadProfiles();
      setEditingProfile(null);
      setShowAddForm(false);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefault = async (profile: MarkupDefaults) => {
    try {
      // Clear existing default
      await supabase
        .from('markup_defaults')
        .update({ is_default: false })
        .eq('org_id', ORG_ID);

      // Set new default
      await supabase
        .from('markup_defaults')
        .update({ is_default: true })
        .eq('id', profile.id);

      await loadProfiles();
    } catch (err: any) {
      setError('Failed to set default: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (!confirm('Delete this markup profile?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('markup_defaults')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setProfiles(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      setError('Failed to delete: ' + (err.message || 'Unknown error'));
    }
  };

  const calculateTotal = (profile: Partial<MarkupDefaults>) => {
    return (
      (profile.home_office_overhead_percent || 0) +
      (profile.field_office_overhead_percent || 0) +
      (profile.profit_percent || 0) +
      (profile.design_contingency_percent || 0) +
      (profile.construction_contingency_percent || 0) +
      (profile.bond_percent || 0) +
      (profile.insurance_percent || 0) +
      (profile.tax_percent || 0) +
      (profile.escalation_percent || 0)
    ).toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading markup profiles...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Percent className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Markup & Overhead</h1>
            <p className="text-sm text-gray-500">{profiles.length} profiles configured</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingProfile({ ...DEFAULT_MARKUP });
            setShowAddForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Profile
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        
        {/* Edit/Add Form */}
        {(showAddForm || editingProfile) && (
          <div className="mb-6 bg-white rounded-lg border border-blue-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">
              {editingProfile?.id ? 'Edit Profile' : 'New Markup Profile'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Name *</label>
                <input
                  type="text"
                  value={editingProfile?.name || ''}
                  onChange={(e) => setEditingProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Standard Commercial"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={editingProfile?.description || ''}
                  onChange={(e) => setEditingProfile(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
              {[
                { key: 'home_office_overhead_percent', label: 'Home Office OH' },
                { key: 'field_office_overhead_percent', label: 'Field Office OH' },
                { key: 'profit_percent', label: 'Profit' },
                { key: 'design_contingency_percent', label: 'Design Conting.' },
                { key: 'construction_contingency_percent', label: 'Const. Conting.' },
                { key: 'bond_percent', label: 'Bond' },
                { key: 'insurance_percent', label: 'Insurance' },
                { key: 'tax_percent', label: 'Tax' },
                { key: 'escalation_percent', label: 'Escalation' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={(editingProfile as any)?.[key] || 0}
                      onChange={(e) => setEditingProfile(prev => ({
                        ...prev,
                        [key]: parseFloat(e.target.value) || 0
                      }))}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <span className="absolute right-3 top-2 text-gray-400 text-sm">%</span>
                  </div>
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Total</label>
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-semibold text-gray-700">
                  {calculateTotal(editingProfile || {})}%
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={editingProfile?.is_default || false}
                  onChange={(e) => setEditingProfile(prev => ({ ...prev, is_default: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Set as default profile
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingProfile(null); setShowAddForm(false); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className={`bg-white rounded-lg border p-4 ${
                profile.is_default ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{profile.name}</h3>
                    {profile.is_default && (
                      <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3" fill="currentColor" />
                        Default
                      </span>
                    )}
                  </div>
                  {profile.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{profile.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  {!profile.is_default && (
                    <button
                      onClick={() => handleSetDefault(profile)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Set as default"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setEditingProfile(profile)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    title="Edit"
                  >
                    <Percent className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteProfile(profile.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-gray-50 rounded p-2">
                  <span className="text-gray-500">OH (Home)</span>
                  <div className="font-medium">{profile.home_office_overhead_percent}%</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <span className="text-gray-500">OH (Field)</span>
                  <div className="font-medium">{profile.field_office_overhead_percent}%</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <span className="text-gray-500">Profit</span>
                  <div className="font-medium">{profile.profit_percent}%</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <span className="text-gray-500">Design Cont.</span>
                  <div className="font-medium">{profile.design_contingency_percent}%</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <span className="text-gray-500">Const. Cont.</span>
                  <div className="font-medium">{profile.construction_contingency_percent}%</div>
                </div>
                <div className="bg-blue-50 rounded p-2">
                  <span className="text-blue-600">Total</span>
                  <div className="font-semibold text-blue-700">{calculateTotal(profile)}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {profiles.length === 0 && !showAddForm && (
          <div className="text-center py-12 text-gray-400">
            No markup profiles configured. Click "Add Profile" to create one.
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkupDefaultsPanel;
