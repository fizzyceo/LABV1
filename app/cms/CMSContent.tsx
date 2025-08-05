'use client';

import { useState } from 'react';
import { useApi, apiRequest } from '../../hooks/useApi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Plus, Edit, Trash2, Save, X, Settings2, FileText } from 'lucide-react';

interface Template {
  _id?: string;
  name: string;
  code: string;
  parameters: Parameter[];
  actions: Action[];
  description: string;
}

interface Parameter {
  name: string;
  label: string;
  subParameters: SubParameter[];
  states: string[];
  defaultRange: { min: string; max: string };
}

interface SubParameter {
  name: string;
  type: string;
  defaultValue: string;
}

interface Action {
  name: string;
  type: 'process' | 'result';
  parameters: string[];
}

interface GlobalParameter {
  _id?: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'date';
  defaultValue: string;
  isRequired: boolean;
}

export default function CMSContent() {
  const { data: templates, loading: templatesLoading, refetch: refetchTemplates } = useApi<Template[]>('/api/templates');
  const { data: globalParams, loading: globalParamsLoading, refetch: refetchGlobalParams } = useApi<GlobalParameter[]>('/api/global-parameters');

  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editingGlobalParam, setEditingGlobalParam] = useState<GlobalParameter | null>(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showGlobalParamForm, setShowGlobalParamForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const isLoading = templatesLoading || globalParamsLoading;

  // Template functions
  const handleCreateTemplate = () => {
    setEditingTemplate({
      name: '',
      code: '',
      parameters: [],
      actions: [],
      description: ''
    });
    setShowTemplateForm(true);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate({ ...template });
    setShowTemplateForm(true);
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;

    setSaving(true);
    try {
      const method = editingTemplate._id ? 'PUT' : 'POST';
      const url = editingTemplate._id ? `/api/templates/${editingTemplate._id}` : '/api/templates';
      
      const result = await apiRequest(url, {
        method,
        body: JSON.stringify(editingTemplate)
      });

      if (result.success) {
        setShowTemplateForm(false);
        setEditingTemplate(null);
        refetchTemplates();
      } else {
        alert('Error saving template: ' + result.error);
      }
    } catch (error) {
      alert('Error saving template');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    const result = await apiRequest(`/api/templates/${id}`, { method: 'DELETE' });
    if (result.success) {
      refetchTemplates();
    } else {
      alert('Error deleting template: ' + result.error);
    }
  };

  // Global Parameter functions
  const handleCreateGlobalParam = () => {
    setEditingGlobalParam({
      name: '',
      label: '',
      type: 'text',
      defaultValue: '',
      isRequired: false
    });
    setShowGlobalParamForm(true);
  };

  const handleEditGlobalParam = (param: GlobalParameter) => {
    setEditingGlobalParam({ ...param });
    setShowGlobalParamForm(true);
  };

  const handleSaveGlobalParam = async () => {
    if (!editingGlobalParam) return;

    setSaving(true);
    try {
      const method = editingGlobalParam._id ? 'PUT' : 'POST';
      const url = editingGlobalParam._id ? `/api/global-parameters/${editingGlobalParam._id}` : '/api/global-parameters';
      
      const result = await apiRequest(url, {
        method,
        body: JSON.stringify(editingGlobalParam)
      });

      if (result.success) {
        setShowGlobalParamForm(false);
        setEditingGlobalParam(null);
        refetchGlobalParams();
      } else {
        alert('Error saving global parameter: ' + result.error);
      }
    } catch (error) {
      alert('Error saving global parameter');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGlobalParam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this global parameter?')) return;

    const result = await apiRequest(`/api/global-parameters/${id}`, { method: 'DELETE' });
    if (result.success) {
      refetchGlobalParams();
    } else {
      alert('Error deleting global parameter: ' + result.error);
    }
  };

  // Helper functions for template editing
  const addParameter = () => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      parameters: [...editingTemplate.parameters, {
        name: '',
        label: '',
        subParameters: [{ name: 'result', type: 'text', defaultValue: '' }],
        states: ['normal', 'abnormal'],
        defaultRange: { min: '', max: '' }
      }]
    });
  };

  const removeParameter = (index: number) => {
    if (!editingTemplate) return;
    const newParameters = editingTemplate.parameters.filter((_, i) => i !== index);
    setEditingTemplate({ ...editingTemplate, parameters: newParameters });
  };

  const updateParameter = (index: number, updates: Partial<Parameter>) => {
    if (!editingTemplate) return;
    const newParameters = [...editingTemplate.parameters];
    newParameters[index] = { ...newParameters[index], ...updates };
    setEditingTemplate({ ...editingTemplate, parameters: newParameters });
  };

  const addAction = () => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      actions: [...editingTemplate.actions, {
        name: '',
        type: 'process',
        parameters: []
      }]
    });
  };

  const removeAction = (index: number) => {
    if (!editingTemplate) return;
    const newActions = editingTemplate.actions.filter((_, i) => i !== index);
    setEditingTemplate({ ...editingTemplate, actions: newActions });
  };

  const updateAction = (index: number, updates: Partial<Action>) => {
    if (!editingTemplate) return;
    const newActions = [...editingTemplate.actions];
    newActions[index] = { ...newActions[index], ...updates };
    setEditingTemplate({ ...editingTemplate, actions: newActions });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 text-center">Loading CMS data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
      <div className="container mx-auto px-6 py-8">
        {/* Templates Section */}
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Templates Management</h2>
            </div>
            <button
              onClick={handleCreateTemplate}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Template
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {templates?.map((template) => (
              <div key={template._id} className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template._id!)}
                      className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">Code: {template.code}</p>
                <p className="text-sm text-gray-500 mb-4">{template.description}</p>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>{template.parameters.length} parameters</span>
                  <span>{template.actions.length} actions</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Parameters Section */}
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Settings2 className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900">Global Parameters</h2>
            </div>
            <button
              onClick={handleCreateGlobalParam}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Parameter
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {globalParams?.map((param) => (
              <div key={param._id} className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{param.label}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditGlobalParam(param)}
                      className="p-2 text-gray-500 hover:text-green-600 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGlobalParam(param._id!)}
                      className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">Name: {param.name}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">{param.type}</span>
                  {param.isRequired && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Required</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Template Form Modal */}
      {showTemplateForm && editingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingTemplate._id ? 'Edit Template' : 'Create Template'}
              </h3>
              <button
                onClick={() => setShowTemplateForm(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                  <input
                    type="text"
                    value={editingTemplate.name}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., FNS Template"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template Code</label>
                  <input
                    type="text"
                    value={editingTemplate.code}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., FNS"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={editingTemplate.description}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Template description..."
                />
              </div>

              {/* Parameters Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Parameters</h4>
                  <button
                    onClick={addParameter}
                    className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Parameter
                  </button>
                </div>

                <div className="space-y-4">
                  {editingTemplate.parameters.map((param, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900">Parameter {index + 1}</h5>
                        <button
                          onClick={() => removeParameter(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <input
                          type="text"
                          value={param.name}
                          onChange={(e) => updateParameter(index, { name: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Parameter name (e.g., hematies)"
                        />
                        <input
                          type="text"
                          value={param.label}
                          onChange={(e) => updateParameter(index, { label: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Parameter label (e.g., Hématies)"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={param.states.join(', ')}
                          onChange={(e) => updateParameter(index, { states: e.target.value.split(',').map(s => s.trim()) })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="States (e.g., normal, abnormal)"
                        />
                        <input
                          type="text"
                          value={param.defaultRange.min}
                          onChange={(e) => updateParameter(index, { 
                            defaultRange: { ...param.defaultRange, min: e.target.value } 
                          })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Min range"
                        />
                        <input
                          type="text"
                          value={param.defaultRange.max}
                          onChange={(e) => updateParameter(index, { 
                            defaultRange: { ...param.defaultRange, max: e.target.value } 
                          })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Max range"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Actions</h4>
                  <button
                    onClick={addAction}
                    className="flex items-center gap-2 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Action
                  </button>
                </div>

                <div className="space-y-4">
                  {editingTemplate.actions.map((action, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900">Action {index + 1}</h5>
                        <button
                          onClick={() => removeAction(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={action.name}
                          onChange={(e) => updateAction(index, { name: e.target.value })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          placeholder="Action name (e.g., RERUN_TEST)"
                        />
                        <select
                          value={action.type}
                          onChange={(e) => updateAction(index, { type: e.target.value as 'process' | 'result' })}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="process">Process</option>
                          <option value="result">Result</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleSaveTemplate}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving...' : 'Save Template'}
              </button>
              <button
                onClick={() => setShowTemplateForm(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Parameter Form Modal */}
      {showGlobalParamForm && editingGlobalParam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingGlobalParam._id ? 'Edit Global Parameter' : 'Create Global Parameter'}
              </h3>
              <button
                onClick={() => setShowGlobalParamForm(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Parameter Name</label>
                  <input
                    type="text"
                    value={editingGlobalParam.name}
                    onChange={(e) => setEditingGlobalParam({ ...editingGlobalParam, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., age"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Parameter Label</label>
                  <input
                    type="text"
                    value={editingGlobalParam.label}
                    onChange={(e) => setEditingGlobalParam({ ...editingGlobalParam, label: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., Age"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={editingGlobalParam.type}
                    onChange={(e) => setEditingGlobalParam({ ...editingGlobalParam, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="date">Date</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default Value</label>
                  <input
                    type="text"
                    value={editingGlobalParam.defaultValue}
                    onChange={(e) => setEditingGlobalParam({ ...editingGlobalParam, defaultValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Default value"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingGlobalParam.isRequired}
                    onChange={(e) => setEditingGlobalParam({ ...editingGlobalParam, isRequired: e.target.checked })}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Required parameter</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleSaveGlobalParam}
                disabled={saving}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {saving ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving...' : 'Save Parameter'}
              </button>
              <button
                onClick={() => setShowGlobalParamForm(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}