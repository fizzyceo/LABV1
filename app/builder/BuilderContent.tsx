'use client';

import { useState, useRef, useCallback } from 'react';
import { useApi, apiRequest } from '../../hooks/useApi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { TreePine, Save, Trash2, Upload, Download, Plus, Settings, Play } from 'lucide-react';

interface Template {
  _id: string;
  name: string;
  code: string;
  parameters: Parameter[];
  actions: Action[];
}

interface Parameter {
  name: string;
  label: string;
  subParameters: SubParameter[];
}

interface SubParameter {
  name: string;
}

interface Action {
  name: string;
  type: 'process' | 'result';
}

interface GlobalParameter {
  _id: string;
  name: string;
  label: string;
  type: string;
}

interface TreeNode {
  id: string;
  type: 'condition';
  parameter: string;
  operator: 'equals' | 'range' | 'contains' | 'greater_than' | 'less_than';
  value: string | { min: string; max: string };
  processActions: string[];
  resultActions: string[];
  children: TreeNode[];
}

interface Algorithm {
  name: string;
  template: string;
  tree: TreeNode;
  description: string;
  version: string;
}

export default function BuilderContent() {
  const { data: templates, loading: templatesLoading } = useApi<Template[]>('/api/templates');
  const { data: globalParams, loading: globalParamsLoading } = useApi<GlobalParameter[]>('/api/global-parameters');

  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [algorithmName, setAlgorithmName] = useState<string>('');
  const [algorithmDescription, setAlgorithmDescription] = useState<string>('');
  const [rootNode, setRootNode] = useState<TreeNode | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ type: string; value: string; actionType?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoading = templatesLoading || globalParamsLoading;

  // Initialize root node when template is selected
  const handleTemplateChange = useCallback((templateCode: string) => {
    setSelectedTemplate(templateCode);
    if (templateCode) {
      const newRootNode: TreeNode = {
        id: 'root',
        type: 'condition',
        parameter: '',
        operator: 'equals',
        value: '',
        processActions: [],
        resultActions: [],
        children: []
      };
      setRootNode(newRootNode);
    } else {
      setRootNode(null);
    }
  }, []);

  // Get available parameters for the selected template
  const getAvailableParameters = useCallback(() => {
    if (!selectedTemplate || !templates) return [];
    
    const template = templates.find(t => t.code === selectedTemplate);
    if (!template) return [];

    const templateParams = template.parameters.flatMap(param =>
      param.subParameters.map(subParam => ({
        value: `${param.name}.${subParam.name}`,
        label: `${param.label} - ${subParam.name}`
      }))
    );

    const globalParamsList = globalParams?.map(param => ({
      value: param.name,
      label: param.label
    })) || [];

    return [...templateParams, ...globalParamsList];
  }, [selectedTemplate, templates, globalParams]);

  // Get available actions for the selected template
  const getAvailableActions = useCallback(() => {
    if (!selectedTemplate || !templates) return { process: [], result: [] };
    
    const template = templates.find(t => t.code === selectedTemplate);
    if (!template) return { process: [], result: [] };

    const processActions = template.actions.filter(action => action.type === 'process');
    const resultActions = template.actions.filter(action => action.type === 'result');

    return {
      process: processActions.map(action => action.name),
      result: resultActions.map(action => action.name)
    };
  }, [selectedTemplate, templates]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, type: string, value: string, actionType?: string) => {
    setDraggedItem({ type, value, actionType });
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent, targetNode: TreeNode, dropZone: 'parameter' | 'process' | 'result' | 'children') => {
    e.preventDefault();
    
    if (!draggedItem || !rootNode) return;

    const updateNode = (node: TreeNode): TreeNode => {
      if (node.id === targetNode.id) {
        const updatedNode = { ...node };
        
        switch (dropZone) {
          case 'parameter':
            if (draggedItem.type === 'parameter') {
              updatedNode.parameter = draggedItem.value;
            }
            break;
          case 'process':
            if (draggedItem.type === 'action' && draggedItem.actionType === 'process') {
              if (!updatedNode.processActions.includes(draggedItem.value)) {
                updatedNode.processActions = [...updatedNode.processActions, draggedItem.value];
              }
            }
            break;
          case 'result':
            if (draggedItem.type === 'action' && draggedItem.actionType === 'result') {
              if (!updatedNode.resultActions.includes(draggedItem.value)) {
                updatedNode.resultActions = [...updatedNode.resultActions, draggedItem.value];
              }
            }
            break;
          case 'children':
            if (draggedItem.type === 'parameter' && updatedNode.resultActions.length === 0) {
              const newChild: TreeNode = {
                id: `${targetNode.id}-child-${updatedNode.children.length}`,
                type: 'condition',
                parameter: draggedItem.value,
                operator: 'equals',
                value: '',
                processActions: [],
                resultActions: [],
                children: []
              };
              updatedNode.children = [...updatedNode.children, newChild];
            }
            break;
        }
        
        return updatedNode;
      }
      
      return {
        ...node,
        children: node.children.map(child => updateNode(child))
      };
    };

    setRootNode(updateNode(rootNode));
    setDraggedItem(null);
  };

  // Node manipulation functions
  const updateNodeProperty = (nodeId: string, property: keyof TreeNode, value: any) => {
    if (!rootNode) return;

    const updateNode = (node: TreeNode): TreeNode => {
      if (node.id === nodeId) {
        return { ...node, [property]: value };
      }
      return {
        ...node,
        children: node.children.map(child => updateNode(child))
      };
    };

    setRootNode(updateNode(rootNode));
  };

  const addChildNode = (parentId: string) => {
    if (!rootNode) return;

    const updateNode = (node: TreeNode): TreeNode => {
      if (node.id === parentId) {
        if (node.resultActions.length > 0) {
          alert('Cannot add child nodes to nodes with result actions. Result actions are terminal.');
          return node;
        }
        const newChild: TreeNode = {
          id: `${parentId}-child-${node.children.length}`,
          type: 'condition',
          parameter: '',
          operator: 'equals',
          value: '',
          processActions: [],
          resultActions: [],
          children: []
        };
        return {
          ...node,
          children: [...node.children, newChild]
        };
      }
      return {
        ...node,
        children: node.children.map(child => updateNode(child))
      };
    };

    setRootNode(updateNode(rootNode));
  };

  const removeNode = (nodeId: string) => {
    if (!rootNode || nodeId === 'root') return;

    const removeFromChildren = (children: TreeNode[]): TreeNode[] => {
      return children.filter(child => child.id !== nodeId).map(child => ({
        ...child,
        children: removeFromChildren(child.children)
      }));
    };

    setRootNode({
      ...rootNode,
      children: removeFromChildren(rootNode.children)
    });
  };

  const removeAction = (nodeId: string, actionType: 'process' | 'result', action: string) => {
    if (!rootNode) return;

    const updateNode = (node: TreeNode): TreeNode => {
      if (node.id === nodeId) {
        const updatedNode = { ...node };
        if (actionType === 'process') {
          updatedNode.processActions = updatedNode.processActions.filter(a => a !== action);
        } else {
          updatedNode.resultActions = updatedNode.resultActions.filter(a => a !== action);
        }
        return updatedNode;
      }
      return {
        ...node,
        children: node.children.map(child => updateNode(child))
      };
    };

    setRootNode(updateNode(rootNode));
  };

  // Save algorithm
  const handleSaveAlgorithm = async () => {
    if (!algorithmName.trim() || !selectedTemplate || !rootNode) {
      alert('Please fill in all required fields and create at least one condition.');
      return;
    }

    setSaving(true);
    try {
      const algorithm: Algorithm = {
        name: algorithmName,
        template: selectedTemplate,
        tree: rootNode,
        description: algorithmDescription,
        version: '1.0'
      };

      const result = await apiRequest('/api/algorithms', {
        method: 'POST',
        body: JSON.stringify(algorithm)
      });

      if (result.success) {
        alert('Algorithm saved successfully!');
        // Reset form
        setAlgorithmName('');
        setAlgorithmDescription('');
        setRootNode(null);
        setSelectedTemplate('');
      } else {
        alert('Error saving algorithm: ' + result.error);
      }
    } catch (error) {
      alert('Error saving algorithm');
    } finally {
      setSaving(false);
    }
  };

  // Export algorithm
  const handleExportAlgorithm = () => {
    if (!algorithmName.trim() || !selectedTemplate || !rootNode) {
      alert('Please fill in all required fields and create at least one condition.');
      return;
    }

    const algorithm: Algorithm = {
      name: algorithmName,
      template: selectedTemplate,
      tree: rootNode,
      description: algorithmDescription,
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(algorithm, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${algorithmName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_algorithm.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import algorithm
  const handleImportAlgorithm = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const algorithm: Algorithm = JSON.parse(e.target?.result as string);
        setAlgorithmName(algorithm.name);
        setAlgorithmDescription(algorithm.description || '');
        setSelectedTemplate(algorithm.template);
        setRootNode(algorithm.tree);
      } catch (error) {
        alert('Error parsing algorithm file');
      }
    };
    reader.readAsText(file);
  };

  // Clear algorithm
  const handleClearAlgorithm = () => {
    if (confirm('Are you sure you want to clear the entire algorithm?')) {
      setAlgorithmName('');
      setAlgorithmDescription('');
      setRootNode(null);
      setSelectedTemplate('');
    }
  };

  // Render tree node
  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    const availableParams = getAvailableParameters();
    const isTerminal = node.resultActions.length > 0;
    
    return (
      <div key={node.id} className={`ml-${depth * 4} mb-4`}>
        <div 
          className={`bg-white/90 backdrop-blur-lg rounded-xl p-6 shadow-lg border-2 transition-all duration-200 ${
            isTerminal 
              ? 'border-red-300 bg-gradient-to-r from-red-50 to-pink-50' 
              : node.processActions.length > 0
                ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-yellow-50'
                : 'border-green-300 bg-gradient-to-r from-green-50 to-emerald-50'
          }`}
        >
          {/* Condition Configuration */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, node, 'parameter')}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors"
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">Parameter</label>
                <select
                  value={node.parameter}
                  onChange={(e) => updateNodeProperty(node.id, 'parameter', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Parameter</option>
                  {availableParams.map(param => (
                    <option key={param.value} value={param.value}>{param.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Operator</label>
                <select
                  value={node.operator}
                  onChange={(e) => updateNodeProperty(node.id, 'operator', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="equals">Equals</option>
                  <option value="range">Range</option>
                  <option value="contains">Contains</option>
                  <option value="greater_than">Greater Than</option>
                  <option value="less_than">Less Than</option>
                </select>
              </div>
            </div>

            {/* Value inputs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
              {node.operator === 'range' ? (
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Min Value"
                    value={typeof node.value === 'object' ? node.value.min : ''}
                    onChange={(e) => updateNodeProperty(node.id, 'value', {
                      min: e.target.value,
                      max: typeof node.value === 'object' ? node.value.max : ''
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Max Value"
                    value={typeof node.value === 'object' ? node.value.max : ''}
                    onChange={(e) => updateNodeProperty(node.id, 'value', {
                      min: typeof node.value === 'object' ? node.value.min : '',
                      max: e.target.value
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Value"
                  value={typeof node.value === 'string' ? node.value : ''}
                  onChange={(e) => updateNodeProperty(node.id, 'value', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              )}
            </div>
          </div>

          {/* Actions Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Process Actions */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, node, 'process')}
              className="border-2 border-dashed border-blue-300 rounded-lg p-4 min-h-24 hover:border-blue-400 transition-colors"
            >
              <h4 className="font-medium text-blue-600 mb-3 flex items-center gap-2">
                <Play className="h-4 w-4" />
                Process Actions
              </h4>
              <div className="space-y-2">
                {node.processActions.map((action, index) => (
                  <div key={index} className="flex items-center justify-between bg-blue-100 px-3 py-2 rounded-lg">
                    <span className="text-sm text-blue-800">{action}</span>
                    <button
                      onClick={() => removeAction(node.id, 'process', action)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {node.processActions.length === 0 && (
                  <p className="text-sm text-gray-400 italic">Drop process actions here</p>
                )}
              </div>
            </div>

            {/* Result Actions */}
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, node, 'result')}
              className="border-2 border-dashed border-orange-300 rounded-lg p-4 min-h-24 hover:border-orange-400 transition-colors"
            >
              <h4 className="font-medium text-orange-600 mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Result Actions (Terminal)
              </h4>
              <div className="space-y-2">
                {node.resultActions.map((action, index) => (
                  <div key={index} className="flex items-center justify-between bg-orange-100 px-3 py-2 rounded-lg">
                    <span className="text-sm text-orange-800">{action}</span>
                    <button
                      onClick={() => removeAction(node.id, 'result', action)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {node.resultActions.length === 0 && (
                  <p className="text-sm text-gray-400 italic">Drop result actions here</p>
                )}
              </div>
            </div>
          </div>

          {isTerminal && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4">
              <p className="text-red-800 text-sm font-medium">
                🔒 Terminal Node: No further conditions can be added after result actions
              </p>
            </div>
          )}

          {/* Node Controls */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => addChildNode(node.id)}
              disabled={isTerminal}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              Add Condition
            </button>
            
            {node.id !== 'root' && (
              <button
                onClick={() => removeNode(node.id)}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            )}
          </div>

          {/* Children Drop Zone */}
          {!isTerminal && (
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, node, 'children')}
              className="mt-6 border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-16 hover:border-green-400 transition-colors"
            >
              <p className="text-sm text-gray-400 italic text-center">
                Drop parameters here to create child conditions
              </p>
            </div>
          )}
        </div>

        {/* Render children */}
        <div className="ml-6 mt-4">
          {node.children.map(child => renderTreeNode(child, depth + 1))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 text-center">Loading builder data...</p>
        </div>
      </div>
    );
  }

  const availableParams = getAvailableParameters();
  const availableActions = getAvailableActions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 bg-white/90 backdrop-blur-lg shadow-xl border-r border-white/20 sticky top-16 h-screen overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <TreePine className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900">Algorithm Builder</h2>
            </div>

            {/* Template Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a template...</option>
                {templates?.map(template => (
                  <option key={template._id} value={template.code}>{template.name}</option>
                ))}
              </select>
            </div>

            {selectedTemplate && (
              <>
                {/* Parameters */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Parameters</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {availableParams.map(param => (
                      <div
                        key={param.value}
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'parameter', param.value)}
                        className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg cursor-move hover:shadow-md transition-all duration-200"
                      >
                        <p className="text-sm font-medium text-blue-900">{param.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Process Actions */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Process Actions</h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {availableActions.process.map(action => (
                      <div
                        key={action}
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'action', action, 'process')}
                        className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg cursor-move hover:shadow-md transition-all duration-200"
                      >
                        <p className="text-sm font-medium text-blue-900">{action}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Result Actions */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Result Actions</h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {availableActions.result.map(action => (
                      <div
                        key={action}
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'action', action, 'result')}
                        className="p-3 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg cursor-move hover:shadow-md transition-all duration-200"
                      >
                        <p className="text-sm font-medium text-orange-900">{action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Algorithm Details */}
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Algorithm Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Algorithm Name</label>
                <input
                  type="text"
                  value={algorithmName}
                  onChange={(e) => setAlgorithmName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter algorithm name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
                <p className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                  {selectedTemplate || 'No template selected'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={algorithmDescription}
                onChange={(e) => setAlgorithmDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Algorithm description..."
              />
            </div>
          </div>

          {/* Decision Tree */}
          {rootNode && (
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Decision Tree</h3>
              {renderTreeNode(rootNode)}
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={handleSaveAlgorithm}
              disabled={saving || !algorithmName.trim() || !selectedTemplate || !rootNode}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <LoadingSpinner size="sm" /> : <Save className="h-5 w-5" />}
              {saving ? 'Saving...' : 'Save Algorithm'}
            </button>

            <button
              onClick={handleExportAlgorithm}
              disabled={!algorithmName.trim() || !selectedTemplate || !rootNode}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-5 w-5" />
              Export JSON
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Upload className="h-5 w-5" />
              Import JSON
            </button>

            <button
              onClick={handleClearAlgorithm}
              className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-5 w-5" />
              Clear All
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportAlgorithm}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}