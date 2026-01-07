// ============================================================
// OC PIPELINE - COMPANY PROFILE SETTINGS PANEL
// Connected to Supabase - org_id: b3912ad3-89a8-4fdc-8816-c6e72b217161
// ============================================================

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Plus,
  Trash2
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

// Types
interface Certification {
  type: string;
  expiration: string;
  certification_number: string;
}

interface CompanySettingsDB {
  id: string;
  org_id: string;
  company_name: string;
  legal_name: string | null;
  dba_name: string | null;
  tax_id: string | null;
  duns_number: string | null;
  cage_code: string | null;
  sam_uei: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  website: string | null;
  license_number: string | null;
  license_state: string | null;
  license_expiration: string | null;
  insurance_provider: string | null;
  policy_number: string | null;
  insurance_expiration: string | null;
  bonding_company: string | null;
  single_bond_limit: number | null;
  aggregate_bond_limit: number | null;
  certifications: Certification[];
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// O'Neill Contractors org_id
const ORG_ID = 'b3912ad3-89a8-4fdc-8816-c6e72b217161';

// Certification type options
const CERTIFICATION_TYPES = [
  { value: '8a', label: '8(a) Business Development' },
  { value: 'SDVOSB', label: 'Service-Disabled Veteran-Owned Small Business' },
  { value: 'VOSB', label: 'Veteran-Owned Small Business' },
  { value: 'HUBZone', label: 'HUBZone' },
  { value: 'WOSB', label: 'Women-Owned Small Business' },
  { value: 'EDWOSB', label: 'Economically Disadvantaged WOSB' },
  { value: 'DBE', label: 'Disadvantaged Business Enterprise' },
  { value: 'MBE', label: 'Minority Business Enterprise' },
  { value: 'WBE', label: 'Women Business Enterprise' },
  { value: 'SBE', label: 'Small Business Enterprise' },
  { value: 'DOBE', label: 'Disabled-Owned Business Enterprise' },
  { value: 'other', label: 'Other' },
];

// US States for dropdown
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

export const CompanyProfilePanel: React.FC = () => {
  const [formData, setFormData] = useState<Partial<CompanySettingsDB>>({
    company_name: '',
    legal_name: '',
    dba_name: '',
    tax_id: '',
    duns_number: '',
    cage_code: '',
    sam_uei: '',
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'United States',
    phone: '',
    fax: '',
    email: '',
    website: '',
    license_number: '',
    license_state: '',
    license_expiration: '',
    insurance_provider: '',
    policy_number: '',
    insurance_expiration: '',
    bonding_company: '',
    single_bond_limit: undefined,
    aggregate_bond_limit: undefined,
    certifications: [],
  });

  const [recordId, setRecordId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Load company settings on mount
  useEffect(() => {
    loadCompanySettings();
  }, []);

  const loadCompanySettings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('company_settings')
        .select('*')
        .eq('org_id', ORG_ID)
        .single();
      
      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No record found - will create on save
          console.log('No company settings found, will create on save');
        } else {
          throw fetchError;
        }
      }
      
      if (data) {
        setRecordId(data.id);
        setFormData({
          company_name: data.company_name || '',
          legal_name: data.legal_name || '',
          dba_name: data.dba_name || '',
          tax_id: data.tax_id || '',
          duns_number: data.duns_number || '',
          cage_code: data.cage_code || '',
          sam_uei: data.sam_uei || '',
          street_address: data.street_address || '',
          city: data.city || '',
          state: data.state || '',
          zip_code: data.zip_code || '',
          country: data.country || 'United States',
          phone: data.phone || '',
          fax: data.fax || '',
          email: data.email || '',
          website: data.website || '',
          license_number: data.license_number || '',
          license_state: data.license_state || '',
          license_expiration: data.license_expiration || '',
          insurance_provider: data.insurance_provider || '',
          policy_number: data.policy_number || '',
          insurance_expiration: data.insurance_expiration || '',
          bonding_company: data.bonding_company || '',
          single_bond_limit: data.single_bond_limit || undefined,
          aggregate_bond_limit: data.aggregate_bond_limit || undefined,
          certifications: data.certifications || [],
        });
      }
    } catch (err: any) {
      console.error('Error loading company settings:', err);
      setError('Failed to load company settings: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CompanySettingsDB, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaveStatus('idle');
  };

  const handleAddCertification = () => {
    setFormData(prev => ({
      ...prev,
      certifications: [
        ...(prev.certifications || []),
        { type: '', expiration: '', certification_number: '' }
      ]
    }));
  };

  const handleRemoveCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: (prev.certifications || []).filter((_, i) => i !== index)
    }));
  };

  const handleCertificationChange = (index: number, field: keyof Certification, value: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: (prev.certifications || []).map((cert, i) => 
        i === index ? { ...cert, [field]: value } : cert
      )
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    setError(null);

    try {
      const saveData = {
        org_id: ORG_ID,
        company_name: formData.company_name || '',
        legal_name: formData.legal_name || null,
        dba_name: formData.dba_name || null,
        tax_id: formData.tax_id || null,
        duns_number: formData.duns_number || null,
        cage_code: formData.cage_code || null,
        sam_uei: formData.sam_uei || null,
        street_address: formData.street_address || null,
        city: formData.city || null,
        state: formData.state || null,
        zip_code: formData.zip_code || null,
        country: formData.country || 'United States',
        phone: formData.phone || null,
        fax: formData.fax || null,
        email: formData.email || null,
        website: formData.website || null,
        license_number: formData.license_number || null,
        license_state: formData.license_state || null,
        license_expiration: formData.license_expiration || null,
        insurance_provider: formData.insurance_provider || null,
        policy_number: formData.policy_number || null,
        insurance_expiration: formData.insurance_expiration || null,
        bonding_company: formData.bonding_company || null,
        single_bond_limit: formData.single_bond_limit || null,
        aggregate_bond_limit: formData.aggregate_bond_limit || null,
        certifications: formData.certifications || [],
        updated_at: new Date().toISOString(),
      };

      let result;
      
      if (recordId) {
        // Update existing record
        result = await supabase
          .from('company_settings')
          .update(saveData)
          .eq('id', recordId)
          .select()
          .single();
      } else {
        // Insert new record
        result = await supabase
          .from('company_settings')
          .insert(saveData)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      if (result.data) {
        setRecordId(result.data.id);
      }

      setSaveStatus('success');
      
      // Reset success status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
      
    } catch (err: any) {
      console.error('Error saving company settings:', err);
      setSaveStatus('error');
      setError('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading company settings...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Company Profile</h1>
            <p className="text-sm text-gray-500">Company information, licenses, insurance, and bonding</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            saveStatus === 'success' 
              ? 'bg-green-600 text-white' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } disabled:opacity-50`}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saveStatus === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Company Information Section */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Company Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.company_name || ''}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Legal Name</label>
              <input
                type="text"
                value={formData.legal_name || ''}
                onChange={(e) => handleInputChange('legal_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Legal entity name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DBA Name</label>
              <input
                type="text"
                value={formData.dba_name || ''}
                onChange={(e) => handleInputChange('dba_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Doing business as"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID (EIN)</label>
              <input
                type="text"
                value={formData.tax_id || ''}
                onChange={(e) => handleInputChange('tax_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="XX-XXXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DUNS Number</label>
              <input
                type="text"
                value={formData.duns_number || ''}
                onChange={(e) => handleInputChange('duns_number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="9-digit DUNS"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CAGE Code</label>
              <input
                type="text"
                value={formData.cage_code || ''}
                onChange={(e) => handleInputChange('cage_code', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="5-character code"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SAM UEI</label>
              <input
                type="text"
                value={formData.sam_uei || ''}
                onChange={(e) => handleInputChange('sam_uei', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Unique Entity ID"
              />
            </div>

          </div>
        </section>

        {/* Address Section */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <input
                type="text"
                value={formData.street_address || ''}
                onChange={(e) => handleInputChange('street_address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Street address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="City"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <select
                value={formData.state || ''}
                onChange={(e) => handleInputChange('state', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select...</option>
                {US_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
              <input
                type="text"
                value={formData.zip_code || ''}
                onChange={(e) => handleInputChange('zip_code', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="ZIP"
              />
            </div>

          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="(XXX) XXX-XXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fax</label>
              <input
                type="tel"
                value={formData.fax || ''}
                onChange={(e) => handleInputChange('fax', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="(XXX) XXX-XXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="info@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="url"
                value={formData.website || ''}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://www.company.com"
              />
            </div>

          </div>
        </section>

        {/* Licenses & Insurance Section */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Licenses & Insurance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
              <input
                type="text"
                value={formData.license_number || ''}
                onChange={(e) => handleInputChange('license_number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Contractor license #"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License State</label>
              <select
                value={formData.license_state || ''}
                onChange={(e) => handleInputChange('license_state', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select...</option>
                {US_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Expiration</label>
              <input
                type="date"
                value={formData.license_expiration || ''}
                onChange={(e) => handleInputChange('license_expiration', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Provider</label>
              <input
                type="text"
                value={formData.insurance_provider || ''}
                onChange={(e) => handleInputChange('insurance_provider', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Insurance company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Policy Number</label>
              <input
                type="text"
                value={formData.policy_number || ''}
                onChange={(e) => handleInputChange('policy_number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Policy #"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Expiration</label>
              <input
                type="date"
                value={formData.insurance_expiration || ''}
                onChange={(e) => handleInputChange('insurance_expiration', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

          </div>
        </section>

        {/* Bonding Section */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Bonding</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bonding Company</label>
              <input
                type="text"
                value={formData.bonding_company || ''}
                onChange={(e) => handleInputChange('bonding_company', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Surety company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Single Bond Limit</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.single_bond_limit || ''}
                  onChange={(e) => handleInputChange('single_bond_limit', parseFloat(e.target.value) || undefined)}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aggregate Bond Limit</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.aggregate_bond_limit || ''}
                  onChange={(e) => handleInputChange('aggregate_bond_limit', parseFloat(e.target.value) || undefined)}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

          </div>
        </section>

        {/* Certifications Section */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Certifications</h2>
              <p className="text-sm text-gray-500">Optional - for federal and diversity certifications</p>
            </div>
            <button
              onClick={handleAddCertification}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Certification
            </button>
          </div>

          {(formData.certifications || []).length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No certifications added. Click "Add Certification" to add one.
            </div>
          ) : (
            <div className="space-y-3">
              {(formData.certifications || []).map((cert, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                    <select
                      value={cert.type}
                      onChange={(e) => handleCertificationChange(index, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="">Select type...</option>
                      {CERTIFICATION_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Certification #</label>
                    <input
                      type="text"
                      value={cert.certification_number || ''}
                      onChange={(e) => handleCertificationChange(index, 'certification_number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Number"
                    />
                  </div>
                  <div className="w-40">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Expiration</label>
                    <input
                      type="date"
                      value={cert.expiration || ''}
                      onChange={(e) => handleCertificationChange(index, 'expiration', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <button
                    onClick={() => handleRemoveCertification(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default CompanyProfilePanel;
