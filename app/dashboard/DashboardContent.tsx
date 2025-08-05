'use client';

import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { FileText, Brain, Settings2, Users, Calendar, TrendingUp } from 'lucide-react';

interface Template {
  _id: string;
  name: string;
  code: string;
  parameters: any[];
  actions: any[];
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface Algorithm {
  _id: string;
  name: string;
  template: string;
  description: string;
  version: string;
  createdAt: string;
  updatedAt: string;
}

interface GlobalParameter {
  _id: string;
  name: string;
  label: string;
  type: string;
  defaultValue: string;
  createdAt: string;
}

export default function DashboardContent() {
  const { data: templates, loading: templatesLoading } = useApi<Template[]>('/api/templates');
  const { data: algorithms, loading: algorithmsLoading } = useApi<Algorithm[]>('/api/algorithms');
  const { data: globalParams, loading: globalParamsLoading } = useApi<GlobalParameter[]>('/api/global-parameters');

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm | null>(null);

  const isLoading = templatesLoading || algorithmsLoading || globalParamsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 text-center">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
      <div className="container mx-auto px-6 py-8">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Templates</p>
                <p className="text-3xl font-bold text-gray-900">{templates?.length || 0}</p>
              </div>
              <FileText className="h-12 w-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Algorithms</p>
                <p className="text-3xl font-bold text-gray-900">{algorithms?.length || 0}</p>
              </div>
              <Brain className="h-12 w-12 text-purple-600" />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Global Parameters</p>
                <p className="text-3xl font-bold text-gray-900">{globalParams?.length || 0}</p>
              </div>
              <Settings2 className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Parameters</p>
                <p className="text-3xl font-bold text-gray-900">
                  {templates?.reduce((acc, template) => acc + template.parameters.length, 0) || 0}
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Templates Section */}
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Templates</h2>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {templates?.map((template) => (
                <div
                  key={template._id}
                  className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                    selectedTemplate?._id === template._id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                  }`}
                  onClick={() => setSelectedTemplate(selectedTemplate?._id === template._id ? null : template)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-600">Code: {template.code}</p>
                      <p className="text-sm text-gray-500">
                        {template.parameters.length} parameters • {template.actions.length} actions
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">
                        {new Date(template.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {selectedTemplate?._id === template._id && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <p className="text-sm text-gray-700 mb-3">{template.description || 'No description available'}</p>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Parameters:</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {template.parameters.map((param, index) => (
                            <div key={index} className="bg-blue-100 px-3 py-1 rounded-lg text-sm">
                              {param.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      {template.actions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <h4 className="font-medium text-gray-900">Actions:</h4>
                          <div className="grid grid-cols-1 gap-2">
                            {template.actions.map((action, index) => (
                              <div key={index} className="bg-purple-100 px-3 py-1 rounded-lg text-sm">
                                {action.name} ({action.type})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {!templates?.length && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p>No templates found. Create your first template in the CMS.</p>
                </div>
              )}
            </div>
          </div>

          {/* Algorithms Section */}
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <Brain className="h-6 w-6 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900">Algorithms</h2>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {algorithms?.map((algorithm) => (
                <div
                  key={algorithm._id}
                  className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                    selectedAlgorithm?._id === algorithm._id
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm'
                  }`}
                  onClick={() => setSelectedAlgorithm(selectedAlgorithm?._id === algorithm._id ? null : algorithm)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{algorithm.name}</h3>
                      <p className="text-sm text-gray-600">Template: {algorithm.template}</p>
                      <p className="text-sm text-gray-500">Version: {algorithm.version}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">
                        {new Date(algorithm.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {selectedAlgorithm?._id === algorithm._id && (
                    <div className="mt-4 pt-4 border-t border-purple-200">
                      <p className="text-sm text-gray-700">
                        {algorithm.description || 'No description available'}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {!algorithms?.length && (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p>No algorithms found. Create your first algorithm in the Builder.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Global Parameters Section */}
        <div className="mt-8 bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <Settings2 className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">Global Parameters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {globalParams?.map((param) => (
              <div key={param._id} className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{param.label}</h3>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {param.type}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Name: {param.name}</p>
                {param.defaultValue && (
                  <p className="text-sm text-gray-500">Default: {param.defaultValue}</p>
                )}
              </div>
            ))}

            {!globalParams?.length && (
              <div className="col-span-full text-center py-8 text-gray-500">
                <Settings2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p>No global parameters found. Create them in the CMS.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}