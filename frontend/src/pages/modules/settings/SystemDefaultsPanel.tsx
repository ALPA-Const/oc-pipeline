// ============================================================
// OC PIPELINE - SYSTEM DEFAULTS SETTINGS PANEL
// Connected to Supabase - org_id: b3912ad3-89a8-4fdc-8816-c6e72b217161
// ============================================================

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  Calendar,
  Globe,
  Ruler
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

// Types
interface SystemDefaultsDB {
  id: string;
  org_id: string;
  hours_per_day: number;
  days_per_week: number;
  weeks_per_year: number;
  fiscal_year_start_month: number;
  date_format: string;
  time_format: string;
  timezone: string;
  measurement_system: string;
  default_currency_code: string;
  decimal_places_cost: number;
  decimal_places_quantity: number;
  decimal_places_rate: number;
  created_at: string;
  updated_at: string;
}

// O'Neill Contractors org_id
const ORG_ID = 'b3912ad3-89a8-4fdc-8816-c6e72b217161';

// Options
const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (International)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
];

const TIME_FORMATS = [
  { value: '12h', label: '12-hour (1:30 PM)' },
  { value: '24h', label: '24-hour (13:30)' },
];

const MEASUREMENT_SYSTEMS = [
  { value: 'imperial', label: 'Imperial (feet, inches, pounds)' },
  { value: 'metric', label: 'Metric (meters, kilograms)' },
];

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'UTC', label: 'UTC' },
];

export const SystemDefaultsPanel: React.FC = () => {
  const [formData, setFormData] = useState<Partial<SystemDefaultsDB>>({
    hours_per_day: 8,
    days_per_week: 5,
    weeks_per_year: 52,
    fiscal_year_start_month: 1,
    date_format: 'MM/DD/YYYY',
    time_format: '12h',
    timezone: 'America/Chicago',
    measurement_system: 'imperial',
    default_currency_code: 'USD',
    decimal_places_cost: 2,
    decimal_places_quantity: 2,
    decimal_places_rate: 4,
  });

  const [recordId, setRecordId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSystemDefaults();
  }, []);

  const loadSystemDefaults = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('system_defaults')
        .select('*')
        .eq('org_id', ORG_ID)
        .single();
      
      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          console.log('No system defaults found, using defaults');
        } else {
          throw fetchError;
        }
      }
      
      if (data) {
        setRecordId(data.id);
        setFormData({
          hours_per_day: data.hours_per_day ?? 8,
          days_per_week: data.days_per_week ?? 5,
          weeks_per_year: data.weeks_per_year ?? 52,
          fiscal_year_start_month: data.fiscal_year_start_month ?? 1,
          date_format: data.date_format || 'MM/DD/YYYY',
          time_format: data.time_format || '12h',
          timezone: data.timezone || 'America/Chicago',
          measurement_system: data.measurement_system || 'imperial',
          default_currency_code: data.default_currency_code || 'USD',
          decimal_places_cost: data.decimal_places_cost ?? 2,
          decimal_places_quantity: data.decimal_places_quantity ?? 2,
          decimal_places_rate: data.decimal_places_rate ?? 4,
        });
      }
    } catch (err: any) {
      console.error('Error loading system defaults:', err);
      setError('Failed to load: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof SystemDefaultsDB, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    setError(null);

    try {
      const saveData = {
        org_id: ORG_ID,
        hours_per_day: formData.hours_per_day,
        days_per_week: formData.days_per_week,
        weeks_per_year: formData.weeks_per_year,
        fiscal_year_start_month: formData.fiscal_year_start_month,
        date_format: formData.date_format,
        time_format: formData.time_format,
        timezone: formData.timezone,
        measurement_system: formData.measurement_system,
        default_currency_code: formData.default_currency_code,
        decimal_places_cost: formData.decimal_places_cost,
        decimal_places_quantity: formData.decimal_places_quantity,
        decimal_places_rate: formData.decimal_places_rate,
        updated_at: new Date().toISOString(),
      };

      let result;
      
      if (recordId) {
        result = await supabase
          .from('system_defaults')
          .update(saveData)
          .eq('id', recordId)
          .select()
          .single();
      } else {
        result = await supabase
          .from('system_defaults')
          .insert(saveData)
          .select()
          .single();
      }

      if (result.error) throw result.error;
      if (result.data) setRecordId(result.data.id);

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
      
    } catch (err: any) {
      console.error('Error saving system defaults:', err);
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
        <span className="ml-3 text-gray-600">Loading system defaults...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-semibold text-gray-800">System Defaults</h1>
            <p className="text-sm text-gray-500">Work hours, date formats, and system preferences</p>
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

      {/* Error */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Work Schedule */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">Work Schedule</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hours per Day</label>
              <input
                type="number"
                min="1"
                max="24"
                step="0.5"
                value={formData.hours_per_day || 8}
                onChange={(e) => handleInputChange('hours_per_day', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Standard workday hours</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Days per Week</label>
              <input
                type="number"
                min="1"
                max="7"
                step="0.5"
                value={formData.days_per_week || 5}
                onChange={(e) => handleInputChange('days_per_week', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Standard workweek days</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weeks per Year</label>
              <input
                type="number"
                min="1"
                max="52"
                value={formData.weeks_per_year || 52}
                onChange={(e) => handleInputChange('weeks_per_year', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Working weeks per year</p>
            </div>

          </div>
        </section>

        {/* Regional Settings */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">Regional Settings</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
              <select
                value={formData.date_format || 'MM/DD/YYYY'}
                onChange={(e) => handleInputChange('date_format', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {DATE_FORMATS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Format</label>
              <select
                value={formData.time_format || '12h'}
                onChange={(e) => handleInputChange('time_format', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {TIME_FORMATS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                value={formData.timezone || 'America/Chicago'}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
              <input
                type="text"
                value={formData.default_currency_code || 'USD'}
                onChange={(e) => handleInputChange('default_currency_code', e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={3}
              />
            </div>

          </div>
        </section>

        {/* Fiscal & Measurement */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">Fiscal & Measurement</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal Year Start</label>
              <select
                value={formData.fiscal_year_start_month || 1}
                onChange={(e) => handleInputChange('fiscal_year_start_month', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Measurement System</label>
              <select
                value={formData.measurement_system || 'imperial'}
                onChange={(e) => handleInputChange('measurement_system', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {MEASUREMENT_SYSTEMS.map(ms => (
                  <option key={ms.value} value={ms.value}>{ms.label}</option>
                ))}
              </select>
            </div>

          </div>
        </section>

        {/* Decimal Precision */}
        <section className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Ruler className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">Decimal Precision</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost Decimals</label>
              <select
                value={formData.decimal_places_cost ?? 2}
                onChange={(e) => handleInputChange('decimal_places_cost', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={0}>0 ($100)</option>
                <option value={2}>2 ($100.00)</option>
                <option value={3}>3 ($100.000)</option>
                <option value={4}>4 ($100.0000)</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">Decimal places for costs</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Decimals</label>
              <select
                value={formData.decimal_places_quantity ?? 2}
                onChange={(e) => handleInputChange('decimal_places_quantity', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={0}>0 (100)</option>
                <option value={2}>2 (100.00)</option>
                <option value={3}>3 (100.000)</option>
                <option value={4}>4 (100.0000)</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">Decimal places for quantities</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rate Decimals</label>
              <select
                value={formData.decimal_places_rate ?? 4}
                onChange={(e) => handleInputChange('decimal_places_rate', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={2}>2 (0.00)</option>
                <option value={3}>3 (0.000)</option>
                <option value={4}>4 (0.0000)</option>
                <option value={5}>5 (0.00000)</option>
                <option value={6}>6 (0.000000)</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">Decimal places for unit rates</p>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
};

export default SystemDefaultsPanel;
