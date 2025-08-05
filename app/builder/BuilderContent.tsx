"use client";

import { useState, useRef, useCallback } from "react";
import { useApi, apiRequest } from "../../hooks/useApi";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import {
  TreePine,
  Save,
  Trash2,
  Upload,
  Download,
  Plus,
  Settings,
  Play,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

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
  type: "process" | "result";
}

interface GlobalParameter {
  _id: string;
  name: string;
  label: string;
  type: string;
}

interface TreeNode {
  id: string;
  type: "condition";
  parameter: string;
  operator:
    | "equals"
    | "range"
    | "contains"
    | "greater_than"
    | "less_than"
    | "default"
    | "state";
  value: string | { min: string; max: string };
  processActions: string[];
  resultActions: string[];
  children: TreeNode[];
}

interface Algorithm {
  name: string;
  template: string;
  tree: TreeNode[];
  description: string;
  version: string;
}

export default function BuilderContent() {
  const { data: templates, loading: templatesLoading } =
    useApi<Template[]>("/api/templates");
  const { data: globalParams, loading: globalParamsLoading } = useApi<
    GlobalParameter[]
  >("/api/global-parameters");

  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [algorithmName, setAlgorithmName] = useState<string>("");
  const [algorithmDescription, setAlgorithmDescription] = useState<string>("");
  const [rootNodes, setRootNodes] = useState<TreeNode[]>([]);
  const [expandedParams, setExpandedParams] = useState<Set<string>>(new Set());
  const subParams = ["result", "qc", "unit", "last_value", "last_test"];
  const [draggedItem, setDraggedItem] = useState<{
    type: string;
    value: string;
    actionType?: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoading = templatesLoading || globalParamsLoading;

  // Static actions for when no template is selected
  const staticActions = {
    process: ["CHANGE_RESULT_STATUS", "RERUN_TEST"],
    result: ["VALIDATE", "CALL_EXPERT", "CONDITIONAL_VALIDATION"],
  };

  // Toggle parameter expansion
  const toggleParameter = (paramName: string) => {
    setExpandedParams((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(paramName)) {
        newSet.delete(paramName);
      } else {
        newSet.add(paramName);
      }
      return newSet;
    });
  };

  // Initialize root nodes when template is selected
  const handleTemplateChange = useCallback((templateCode: string) => {
    setSelectedTemplate(templateCode);
    if (templateCode) {
      const newRootNode: TreeNode = {
        id: `root-${Date.now()}`,
        type: "condition",
        parameter: "",
        operator: "equals",
        value: "",
        processActions: [],
        resultActions: [],
        children: [],
      };
      setRootNodes([newRootNode]);
    } else {
      setRootNodes([]);
    }
  }, []);

  // Add a new root-level condition
  const addRootNode = () => {
    if (!selectedTemplate) {
      alert("Please select a template first.");
      return;
    }
    const newRootNode: TreeNode = {
      id: `root-${Date.now()}`,
      type: "condition",
      parameter: "",
      operator: "equals",
      value: "",
      processActions: [],
      resultActions: [],
      children: [],
    };
    setRootNodes((prev) => [...prev, newRootNode]);
  };

  // Get available parameters for the selected template
  const getAvailableParameters = useCallback(() => {
    const globalParamsList =
      globalParams?.map((param) => ({
        value: param.name,
        label: param.name,
      })) || [];

    if (!selectedTemplate || !templates) {
      return [...globalParamsList];
    }

    const template = templates.find((t) => t.code === selectedTemplate);
    if (!template) return [...globalParamsList];

    const templateParams = template.parameters.flatMap((param) =>
      subParams.map((subParam) => ({
        value: `${param.name}.${subParam}`,
        label: `${param.name} - ${subParam}`,
      }))
    );

    return [...templateParams, ...globalParamsList];
  }, [selectedTemplate, templates, globalParams]);

  // Get available actions
  const getAvailableActions = useCallback(() => {
    if (!selectedTemplate || !templates) {
      return staticActions;
    }

    const template = templates.find((t) => t.code === selectedTemplate);
    if (!template) return staticActions;

    const processActions = template.actions
      .filter((action) => action.type === "process")
      .map((action) => action.name);
    const resultActions = template.actions
      .filter((action) => action.type === "result")
      .map((action) => action.name);

    return {
      process:
        processActions.length > 0 ? processActions : staticActions.process,
      result: resultActions.length > 0 ? resultActions : staticActions.result,
    };
  }, [selectedTemplate, templates]);

  // Drag and drop handlers
  const handleDragStart = (
    e: React.DragEvent,
    type: string,
    value: string,
    actionType?: string
  ) => {
    setDraggedItem({ type, value, actionType });
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (
    e: React.DragEvent,
    targetNode: TreeNode,
    dropZone: "parameter" | "process" | "result" | "children"
  ) => {
    e.preventDefault();

    if (!draggedItem) return;

    const updateNode = (node: TreeNode): TreeNode => {
      if (node.id === targetNode.id) {
        const updatedNode = { ...node };

        switch (dropZone) {
          case "parameter":
            if (draggedItem.type === "parameter") {
              updatedNode.parameter = draggedItem.value;
            }
            break;
          case "process":
            if (
              draggedItem.type === "action" &&
              draggedItem.actionType === "process"
            ) {
              if (!updatedNode.processActions.includes(draggedItem.value)) {
                updatedNode.processActions = [
                  ...updatedNode.processActions,
                  draggedItem.value,
                ];
              }
            }
            break;
          case "result":
            if (
              draggedItem.type === "action" &&
              draggedItem.actionType === "result"
            ) {
              if (!updatedNode.resultActions.includes(draggedItem.value)) {
                updatedNode.resultActions = [
                  ...updatedNode.resultActions,
                  draggedItem.value,
                ];
              }
            }
            break;
          case "children":
            if (
              draggedItem.type === "parameter" &&
              updatedNode.resultActions.length === 0
            ) {
              const newChild: TreeNode = {
                id: `${targetNode.id}-child-${updatedNode.children.length}`,
                type: "condition",
                parameter: draggedItem.value,
                operator: "equals",
                value: "",
                processActions: [],
                resultActions: [],
                children: [],
              };
              updatedNode.children = [...updatedNode.children, newChild];
            }
            break;
        }

        return updatedNode;
      }

      return {
        ...node,
        children: node.children.map((child) => updateNode(child)),
      };
    };

    setRootNodes((prev) => prev.map((node) => updateNode(node)));
    setDraggedItem(null);
  };

  // Node manipulation functions
  const updateNodeProperty = (
    nodeId: string,
    property: keyof TreeNode,
    value: any
  ) => {
    setRootNodes((prev) =>
      prev.map((node) => {
        const updateNode = (n: TreeNode): TreeNode => {
          if (n.id === nodeId) {
            return { ...n, [property]: value };
          }
          return {
            ...n,
            children: n.children.map((child) => updateNode(child)),
          };
        };
        return updateNode(node);
      })
    );
  };

  const addChildNode = (parentId: string) => {
    setRootNodes((prev) =>
      prev.map((node) => {
        const updateNode = (n: TreeNode): TreeNode => {
          if (n.id === parentId) {
            if (n.resultActions.length > 0) {
              alert(
                "Cannot add child nodes to nodes with result actions. Result actions are terminal."
              );
              return n;
            }
            const newChild: TreeNode = {
              id: `${parentId}-child-${n.children.length}`,
              type: "condition",
              parameter: "",
              operator: "equals",
              value: "",
              processActions: [],
              resultActions: [],
              children: [],
            };
            return {
              ...n,
              children: [...n.children, newChild],
            };
          }
          return {
            ...n,
            children: n.children.map((child) => updateNode(child)),
          };
        };
        return updateNode(node);
      })
    );
  };

  const removeNode = (nodeId: string) => {
    if (!rootNodes) return;

    if (rootNodes.some((node) => node.id === nodeId)) {
      setRootNodes((prev) => prev.filter((node) => node.id !== nodeId));
      return;
    }

    setRootNodes((prev) =>
      prev.map((node) => {
        const removeFromChildren = (children: TreeNode[]): TreeNode[] => {
          return children
            .filter((child) => child.id !== nodeId)
            .map((child) => ({
              ...child,
              children: removeFromChildren(child.children),
            }));
        };

        return {
          ...node,
          children: removeFromChildren(node.children),
        };
      })
    );
  };

  const removeAction = (
    nodeId: string,
    actionType: "process" | "result",
    action: string
  ) => {
    setRootNodes((prev) =>
      prev.map((node) => {
        const updateNode = (n: TreeNode): TreeNode => {
          if (n.id === nodeId) {
            const updatedNode = { ...n };
            if (actionType === "process") {
              updatedNode.processActions = updatedNode.processActions.filter(
                (a) => a !== action
              );
            } else {
              updatedNode.resultActions = updatedNode.resultActions.filter(
                (a) => a !== action
              );
            }
            return updatedNode;
          }
          return {
            ...n,
            children: n.children.map((child) => updateNode(child)),
          };
        };
        return updateNode(node);
      })
    );
  };

  // Save algorithm
  const handleSaveAlgorithm = async () => {
    if (!algorithmName.trim() || !selectedTemplate || rootNodes.length === 0) {
      alert(
        "Please fill in all required fields and create at least one condition."
      );
      return;
    }

    setSaving(true);
    try {
      const algorithm: Algorithm = {
        name: algorithmName,
        template: selectedTemplate,
        tree: rootNodes,
        description: algorithmDescription,
        version: "1.0",
      };

      const result = await apiRequest("/api/algorithms", {
        method: "POST",
        body: JSON.stringify(algorithm),
      });

      if (result.success) {
        alert("Algorithm saved successfully!");
        setAlgorithmName("");
        setAlgorithmDescription("");
        setRootNodes([]);
        setSelectedTemplate("");
      } else {
        alert("Error saving algorithm: " + result.error);
      }
    } catch (error) {
      alert("Error saving algorithm");
    } finally {
      setSaving(false);
    }
  };

  // Export algorithm
  const handleExportAlgorithm = () => {
    if (!algorithmName.trim() || !selectedTemplate || rootNodes.length === 0) {
      alert(
        "Please fill in all required fields and create at least one condition."
      );
      return;
    }

    const algorithm: Algorithm = {
      name: algorithmName,
      template: selectedTemplate,
      tree: rootNodes,
      description: algorithmDescription,
      version: "1.0",
    };

    const blob = new Blob([JSON.stringify(algorithm, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${algorithmName
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}_algorithm.json`;
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
        setAlgorithmDescription(algorithm.description || "");
        setSelectedTemplate(algorithm.template);
        setRootNodes(
          Array.isArray(algorithm.tree) ? algorithm.tree : [algorithm.tree]
        );
      } catch (error) {
        alert("Error parsing algorithm file");
      }
    };
    reader.readAsText(file);
  };

  // Clear algorithm
  const handleClearAlgorithm = () => {
    if (confirm("Are you sure you want to clear the entire algorithm?")) {
      setAlgorithmName("");
      setAlgorithmDescription("");
      setRootNodes([]);
      setSelectedTemplate("");
      setExpandedParams(new Set());
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
              ? "border-red-300 bg-gradient-to-r from-red-50 to-pink-50"
              : node.processActions.length > 0
              ? "border-orange-300 bg-gradient-to-r from-orange-50 to-yellow-50"
              : "border-green-300 bg-gradient-to-r from-green-50 to-emerald-50"
          }`}
        >
          {/* Condition Configuration */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, node, "parameter")}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors"
              >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parameter
                </label>
                <select
                  value={node.parameter}
                  onChange={(e) =>
                    updateNodeProperty(node.id, "parameter", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Parameter</option>
                  {availableParams.map((param) => (
                    <option key={param.value} value={param.value}>
                      {param.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operator
                </label>
                <select
                  value={node.operator}
                  onChange={(e) =>
                    updateNodeProperty(node.id, "operator", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="equals">Equals</option>
                  <option value="range">Range</option>
                  <option value="contains">Contains</option>
                  <option value="greater_than">Greater Than</option>
                  <option value="less_than">Less Than</option>
                  <option value="default">Default</option>
                  <option value="state">State</option>
                </select>
              </div>
            </div>

            {node.operator !== "default" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value
                </label>
                {node.operator === "range" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Min Value"
                      value={
                        typeof node.value === "object" ? node.value.min : ""
                      }
                      onChange={(e) =>
                        updateNodeProperty(node.id, "value", {
                          min: e.target.value,
                          max:
                            typeof node.value === "object"
                              ? node.value.max
                              : "",
                        })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Max Value"
                      value={
                        typeof node.value === "object" ? node.value.max : ""
                      }
                      onChange={(e) =>
                        updateNodeProperty(node.id, "value", {
                          min:
                            typeof node.value === "object"
                              ? node.value.min
                              : "",
                          max: e.target.value,
                        })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ) : node.operator === "state" ? (
                  <select
                    value={typeof node.value === "string" ? node.value : ""}
                    onChange={(e) =>
                      updateNodeProperty(node.id, "value", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select State</option>
                    <option value="supra">Supra</option>
                    <option value="normal">Normal</option>
                    <option value="extra">Extra</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Value"
                    value={typeof node.value === "string" ? node.value : ""}
                    onChange={(e) =>
                      updateNodeProperty(node.id, "value", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, node, "process")}
              className="border-2 border-dashed border-blue-300 rounded-lg p-4 min-h-24 hover:border-blue-400 transition-colors"
            >
              <h4 className="font-medium text-blue-600 mb-3 flex items-center gap-2">
                <Play className="h-4 w-4" />
                Process Actions
              </h4>
              <div className="space-y-2">
                {node.processActions.map((action, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-blue-100 px-3 py-2 rounded-lg"
                  >
                    <span className="text-sm text-blue-800">{action}</span>
                    <button
                      onClick={() => removeAction(node.id, "process", action)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {node.processActions.length === 0 && (
                  <p className="text-sm text-gray-400 italic">
                    Drop process actions here
                  </p>
                )}
              </div>
            </div>

            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, node, "result")}
              className="border-2 border-dashed border-orange-300 rounded-lg p-4 min-h-24 hover:border-orange-400 transition-colors"
            >
              <h4 className="font-medium text-orange-600 mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Result Actions (Terminal)
              </h4>
              <div className="space-y-2">
                {node.resultActions.map((action, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-orange-100 px-3 py-2 rounded-lg"
                  >
                    <span className="text-sm text-orange-800">{action}</span>
                    <button
                      onClick={() => removeAction(node.id, "result", action)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {node.resultActions.length === 0 && (
                  <p className="text-sm text-gray-400 italic">
                    Drop result actions here
                  </p>
                )}
              </div>
            </div>
          </div>

          {isTerminal && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4">
              <p className="text-red-800 text-sm font-medium">
                🔒 Terminal Node: No further conditions can be added after
                result actions
              </p>
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => addChildNode(node.id)}
              disabled={isTerminal}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              Add Condition
            </button>

            <button
              onClick={() => removeNode(node.id)}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </button>
          </div>

          {!isTerminal && (
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, node, "children")}
              className="mt-6 border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-16 hover:border-green-400 transition-colors"
            >
              <p className="text-sm text-gray-400 italic text-center">
                Drop parameters here to create child conditions
              </p>
            </div>
          )}
        </div>

        <div className="ml-6 mt-4">
          {node.children.map((child) => renderTreeNode(child, depth + 1))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 text-center">
            Loading builder data...
          </p>
        </div>
      </div>
    );
  }

  const availableActions = getAvailableActions();
  const template = templates?.find((t) => t.code === selectedTemplate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
      <div className="flex">
        <div className="w-80 bg-white/95 backdrop-blur-lg shadow-xl border-r border-gray-100 sticky top-0 h-screen overflow-y-auto scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-indigo-600">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <TreePine className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Algorithm Builder
              </h2>
            </div>

            <div className="mb-6 border-b border-gray-100 pb-6">
              <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">
                Template
              </h3>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-all duration-200"
              >
                <option value="">Select a template...</option>
                {templates?.map((template) => (
                  <option key={template._id} value={template.code}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6 border-b border-gray-100 pb-6">
              <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">
                Parameters
              </h3>
              <div className="space-y-2">
                {selectedTemplate &&
                  template?.parameters.map((param) => (
                    <div key={param.name}>
                      <div
                        onClick={() => toggleParameter(param.name)}
                        className="p-3 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg cursor-pointer hover:bg-gradient-to-r hover:from-indigo-100 hover:to-blue-100 transition-all duration-200 flex items-center justify-between"
                      >
                        <p className="text-sm font-medium text-indigo-900">
                          {param.name}
                        </p>
                        {expandedParams.has(param.name) ? (
                          <ChevronDown className="h-4 w-4 text-indigo-600" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-indigo-600" />
                        )}
                      </div>
                      {expandedParams.has(param.name) && (
                        <div className="mt-2 ml-4 space-y-1">
                          {subParams.map((subParam) => (
                            <div
                              key={`${param.name}.${subParam}`}
                              draggable
                              onDragStart={(e) =>
                                handleDragStart(
                                  e,
                                  "parameter",
                                  `${param.name}.${subParam}`
                                )
                              }
                              className="p-2 bg-white/80 border border-gray-200 rounded-lg cursor-move hover:bg-gray-50 hover:border-indigo-300 transition-all duration-200"
                            >
                              <p className="text-xs font-medium text-gray-700">
                                {subParam}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                {globalParams?.map((param) => (
                  <div
                    key={param.name}
                    draggable
                    onDragStart={(e) =>
                      handleDragStart(e, "parameter", param.name)
                    }
                    className="p-3 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg cursor-move hover:bg-gradient-to-r hover:from-indigo-100 hover:to-blue-100 transition-all duration-200"
                  >
                    <p className="text-sm font-medium text-indigo-900">
                      {param.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6 border-b border-gray-100 pb-6">
              <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">
                Process Actions
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Can add conditions after these actions
              </p>
              <div className="space-y-2">
                {availableActions.process.map((action) => (
                  <div
                    key={action}
                    draggable
                    onDragStart={(e) =>
                      handleDragStart(e, "action", action, "process")
                    }
                    className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg cursor-move hover:bg-gradient-to-r hover:from-blue-100 hover:to-cyan-100 transition-all duration-200"
                  >
                    <p className="text-sm font-medium text-blue-900">
                      {action}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">
                Result Actions
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Final outcomes - no conditions after
              </p>
              <div className="space-y-2">
                {availableActions.result.map((action) => (
                  <div
                    key={action}
                    draggable
                    onDragStart={(e) =>
                      handleDragStart(e, "action", action, "result")
                    }
                    className="p-3 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg cursor-move hover:bg-gradient-to-r hover:from-orange-100 hover:to-red-100 transition-all duration-200"
                  >
                    <p className="text-sm font-medium text-orange-900">
                      {action}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Algorithm Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Algorithm Name
                </label>
                <input
                  type="text"
                  value={algorithmName}
                  onChange={(e) => setAlgorithmName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter algorithm name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template
                </label>
                <p className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                  {selectedTemplate || "No template selected"}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={algorithmDescription}
                onChange={(e) => setAlgorithmDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Algorithm description..."
              />
            </div>
          </div>

          {rootNodes.length > 0 && (
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/20 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Decision Tree
                </h3>
                <button
                  onClick={addRootNode}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Root Condition
                </button>
              </div>
              {rootNodes.map((node) => renderTreeNode(node))}
            </div>
          )}

          <div className="flex gap-4 flex-wrap">
            <button
              onClick={handleSaveAlgorithm}
              disabled={
                saving ||
                !algorithmName.trim() ||
                !selectedTemplate ||
                rootNodes.length === 0
              }
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              {saving ? "Saving..." : "Save Algorithm"}
            </button>

            <button
              onClick={handleExportAlgorithm}
              disabled={
                !algorithmName.trim() ||
                !selectedTemplate ||
                rootNodes.length === 0
              }
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

      <style jsx>{`
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: #667eea rgba(0, 0, 0, 0.1);
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 4px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
        }
      `}</style>
    </div>
  );
}
