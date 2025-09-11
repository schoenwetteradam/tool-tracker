import React, { useState, useEffect } from 'react';
import {
  Clock,
  User,
  Wrench,
  Package,
  CheckCircle,
  Save,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  DollarSign,
  Package2,
  Truck
} from 'lucide-react';
import { addToolChange } from '../lib/supabase';

const ToolChangeForm = () => {
  const getCurrentDateTime = () => {
    const now = new Date();
    return {
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      shift: getShiftFromTime(now.getHours())
    };
  };

  const getShiftFromTime = (hour) => {
    if (hour >= 6 && hour < 14) return 1;
    if (hour >= 14 && hour < 22) return 2;
    return 3;
  };

  const [formData, setFormData] = useState({
    ...getCurrentDateTime(),
    operator: '',
    operator_employee_id: '',
    operator_clock_number: '',
    operator_id: null,
    work_center: '',
    equipment_number: '',
    operation: 'Bore',
    part_number: 'CAT536-6763',
    job_number: '',
    heat_number: '',
    material_appearance: 'Normal',
    old_first_rougher: '',
    new_first_rougher: '',
    first_rougher_action: '',
    old_finish_tool: '',
    new_finish_tool: '',
    finish_tool_action: '',
    change_reason: '',
    notes: ''
  });

  const [availableTools, setAvailableTools] = useState({
    roughing: [],
    finishing: [],
    all: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [toolsLoading, setToolsLoading] = useState(true);
  const [costSummary, setCostSummary] = useState({
    oldToolCost: 0,
    newToolCost: 0,
    totalCost: 0
  });

  useEffect(() => {
    fetchToolInventory();
  }, []);

  useEffect(() => {
    calculateCostSummary();
  }, [formData.old_first_rougher, formData.new_first_rougher, formData.old_finish_tool, formData.new_finish_tool, availableTools]);

  const fetchToolInventory = async () => {
    try {
      setToolsLoading(true);
      
      // Updated to use supabase client directly
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      const { data: toolData, error } = await supabase
        .from('tool_inventory_enhanced')
        .select(`
          id,
          material_id,
          description,
          insert_type,
          insert_geometry,
          insert_grade,
          supplier_id,
          supplier_name,
          unit_cost,
          quantity_on_hand,
          min_quantity,
          max_quantity,
          active,
          nose_radius,
          coating,
          lead_time_days
        `)
        .eq('active', true)
        .order('insert_type', { ascending: true })
        .order('insert_geometry', { ascending: true })
        .order('insert_grade', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Process and categorize tools
      const processedTools = toolData || [];
      
      const roughingTools = processedTools.filter(tool => 
        tool.insert_type === 'ROUGHING' || 
        tool.description?.toLowerCase().includes('rough') ||
        tool.insert_grade?.includes('4235') ||
        tool.insert_grade?.includes('4335')
      );

      const finishingTools = processedTools.filter(tool => 
        tool.insert_type === 'FINISHING' || 
        tool.description?.toLowerCase().includes('finish') ||
        tool.insert_grade?.includes('2220') ||
        tool.insert_grade?.includes('MP')
      );

      setAvailableTools({
        roughing: roughingTools,
        finishing: finishingTools,
        all: processedTools
      });

    } catch (error) {
      console.error('Error fetching tool inventory:', error);
      
      // Fallback data based on your sample
      const fallbackData = [
        {
          id: '5',
          material_id: '11-00529',
          description: 'INSERT SNMG 643 MR 4235',
          insert_type: 'ROUGHING',
          insert_geometry: 'SNMG',
          insert_grade: '4235',
          supplier_name: 'BEST ENGINEERING LLC',
          unit_cost: 16.35,
          quantity_on_hand: 100,
          min_quantity: 50,
          active: true,
          lead_time_days: 14
        },
        {
          id: '6',
          material_id: '11-00529',
          description: 'INSERT SNMG 643 MR 4335',
          insert_type: 'ROUGHING',
          insert_geometry: 'SNMG',
          insert_grade: '4335',
          supplier_name: 'BEST ENGINEERING LLC',
          unit_cost: 16.35,
          quantity_on_hand: 100,
          min_quantity: 50,
          active: true,
          lead_time_days: 14
        },
        {
          id: '7',
          material_id: '11-00025',
          description: 'INSERT SNMG 643-MM 2220',
          insert_type: 'FINISHING',
          insert_geometry: 'SNMG',
          insert_grade: '2220',
          supplier_name: 'BEST ENGINEERING LLC',
          unit_cost: 16.71,
          quantity_on_hand: 75,
          min_quantity: 30,
          active: true,
          lead_time_days: 14
        }
      ];

      setAvailableTools({
        roughing: fallbackData.filter(t => t.insert_type === 'ROUGHING'),
        finishing: fallbackData.filter(t => t.insert_type === 'FINISHING'),
        all: fallbackData
      });
    } finally {
      setToolsLoading(false);
    }
  };

  const calculateCostSummary = () => {
    let totalCost = 0;
    
    // Calculate costs for tool changes
    const oldRougher = getToolDetails(formData.old_first_rougher);
    const newRougher = getToolDetails(formData.new_first_rougher);
    const oldFinish = getToolDetails(formData.old_finish_tool);
    const newFinish = getToolDetails(formData.new_finish_tool);

    if (newRougher && formData.first_rougher_action === 'Replace') {
      totalCost += newRougher.unit_cost || 0;
    }
    if (newFinish && formData.finish_tool_action === 'Replace') {
      totalCost += newFinish.unit_cost || 0;
    }

    setCostSummary({
      oldToolCost: (oldRougher?.unit_cost || 0) + (oldFinish?.unit_cost || 0),
      newToolCost: totalCost,
      totalCost: totalCost
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getStockStatus = (tool) => {
    if (!tool || !tool.quantity_on_hand || tool.quantity_on_hand <= 0) return 'out-of-stock';
    if (tool.quantity_on_hand <= tool.min_quantity) return 'low-stock';
    return 'in-stock';
  };

  const getStockIcon = (status) => {
    switch (status) {
      case 'in-stock': return '✅';
      case 'low-stock': return '⚠️';
      case 'out-of-stock': return '❌';
      default: return '❓';
    }
  };

  const formatToolOption = (tool) => {
    const stockStatus = getStockStatus(tool);
    const stockIcon = getStockIcon(stockStatus);
    const stockText = stockStatus === 'out-of-stock' ? ' (OUT OF STOCK)' : 
                     stockStatus === 'low-stock' ? ' (LOW STOCK)' : '';
    
    return `${tool.material_id} - ${tool.insert_geometry} ${tool.insert_grade} (${tool.insert_type}) - Stock: ${tool.quantity_on_hand} ${stockIcon}${stockText}`;
  };

  const getToolDetails = (toolId) => {
    return availableTools.all.find(tool => tool.id === toolId);
  };

  const groupToolsByGeometry = (tools) => {
    return tools.reduce((groups, tool) => {
      const geometry = tool.insert_geometry || 'OTHER';
      if (!groups[geometry]) {
        groups[geometry] = [];
      }
      groups[geometry].push(tool);
      return groups;
    }, {});
  };

  const calculateMaterialRiskScore = () => {
    let riskScore = 0;

    if (formData.heat_number?.startsWith('24')) riskScore += 2;
    if (formData.material_appearance && formData.material_appearance !== 'Normal') riskScore += 1;
    if (formData.change_reason === 'Tool Breakage') riskScore += 2;
    if (formData.change_reason === 'Chipped Edge') riskScore += 1;

    return Math.min(riskScore, 10);
  };

  const estimateCastingDate = (heatNumber) => {
    if (!heatNumber) return null;
    
    if (heatNumber.startsWith('24')) {
      const sequence = heatNumber.substring(2);
      const monthEstimate = Math.ceil(parseInt(sequence.substring(0, 1)) * 1.2);
      return `2024-${monthEstimate.toString().padStart(2, '0')}-01`;
    } else if (heatNumber.startsWith('25')) {
      const sequence = heatNumber.substring(2);
      const monthEstimate = Math.ceil(parseInt(sequence.substring(0, 1)) * 1.2);
      return `2025-${monthEstimate.toString().padStart(2, '0')}-01`;
    }
    return null;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const requiredFields = [
        'date', 'time', 'shift', 'operator', 'work_center', 'equipment_number',
        'operation', 'part_number', 'old_first_rougher', 'new_first_rougher',
        'first_rougher_action', 'old_finish_tool', 'new_finish_tool',
        'finish_tool_action', 'change_reason', 'heat_number'
      ];

      const missingFields = requiredFields.filter(field => !formData[field]);

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Get tool details for enhanced data
      const oldRougherTool = getToolDetails(formData.old_first_rougher);
      const newRougherTool = getToolDetails(formData.new_first_rougher);
      const oldFinishTool = getToolDetails(formData.old_finish_tool);
      const newFinishTool = getToolDetails(formData.new_finish_tool);

      const cleanedData = {
        date: formData.date,
        time: formData.time,
        shift: formData.shift ? Number(formData.shift) : null,
        operator: formData.operator || null,
        operator_employee_id: formData.operator_employee_id || null,
        operator_clock_number: formData.operator_clock_number || null,
        operator_id: formData.operator_id || null,
        work_center: formData.work_center || null,
        equipment_number: formData.equipment_number || null,
        operation: formData.operation || null,
        part_number: formData.part_number || null,
        job_number: formData.job_number || null,
        old_first_rougher: formData.old_first_rougher || null,
        new_first_rougher: formData.new_first_rougher || null,
        first_rougher_action: formData.first_rougher_action || null,
        old_finish_tool: formData.old_finish_tool || null,
        new_finish_tool: formData.new_finish_tool || null,
        finish_tool_action: formData.finish_tool_action || null,
        heat_number: formData.heat_number || null,
        casting_date: estimateCastingDate(formData.heat_number),
        material_appearance: formData.material_appearance || 'Normal',
        material_risk_score: calculateMaterialRiskScore(),
        change_reason: formData.change_reason || null,
        notes: formData.notes || null,
        created_at: new Date().toISOString(),
        // Enhanced tool data
        old_rougher_material_id: oldRougherTool?.material_id || null,
        new_rougher_material_id: newRougherTool?.material_id || null,
        old_finish_material_id: oldFinishTool?.material_id || null,
        new_finish_material_id: newFinishTool?.material_id || null,
        rougher_cost: newRougherTool?.unit_cost || 0,
        finish_cost: newFinishTool?.unit_cost || 0,
        total_tool_cost: costSummary.totalCost,
        old_rougher_supplier: oldRougherTool?.supplier_name || null,
        new_rougher_supplier: newRougherTool?.supplier_name || null,
        old_finish_supplier: oldFinishTool?.supplier_name || null,
        new_finish_supplier: newFinishTool?.supplier_name || null
      };

      const result = await addToolChange(cleanedData);
      setSubmitStatus('success');

      if (cleanedData.material_risk_score >= 5) {
        console.warn('High-risk material detected:', cleanedData.heat_number);
      }

      // Check for low stock alerts
      if (newRougherTool && getStockStatus(newRougherTool) === 'low-stock') {
        console.warn(`Low stock alert: ${newRougherTool.material_id} - ${newRougherTool.quantity_on_hand} remaining`);
      }
      if (newFinishTool && getStockStatus(newFinishTool) === 'low-stock') {
        console.warn(`Low stock alert: ${newFinishTool.material_id} - ${newFinishTool.quantity_on_hand} remaining`);
      }

      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          ...getCurrentDateTime(),
          operator: '',
          operator_employee_id: '',
          operator_clock_number: '',
          operator_id: null,
          work_center: '',
          equipment_number: '',
          operation: 'Bore',
          part_number: 'CAT536-6763',
          job_number: '',
          heat_number: '',
          material_appearance: 'Normal',
          old_first_rougher: '',
          new_first_rougher: '',
          first_rougher_action: '',
          old_finish_tool: '',
          new_finish_tool: '',
          finish_tool_action: '',
          change_reason: '',
          notes: ''
        });
        setSubmitStatus(null);
        setCostSummary({ oldToolCost: 0, newToolCost: 0, totalCost: 0 });
      }, 3000);
    } catch (error) {
      console.error('Error saving enhanced tool change:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (toolsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading tool inventory from database...</p>
          <p className="text-sm text-gray-500 mt-2">Fetching from tool_inventory_enhanced table</p>
        </div>
      </div>
    );
  }

  const groupedRoughingTools = groupToolsByGeometry(availableTools.roughing);
  const groupedFinishingTools = groupToolsByGeometry(availableTools.finishing);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Enhanced Tool Change Form</h1>
        <p className="text-gray-600">Professional tool tracking with inventory integration</p>
        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
          <span>📊 Tools Available: {availableTools.all.length}</span>
          <span>🔧 Roughing: {availableTools.roughing.length}</span>
          <span>✨ Finishing: {availableTools.finishing.length}</span>
        </div>
      </div>

      {/* Cost Summary Panel */}
      {costSummary.totalCost > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
            <DollarSign className="mr-2" size={20} />
            Tool Change Cost Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-700 font-medium">New Tool Cost:</span>
              <span className="ml-2 font-bold">${costSummary.newToolCost.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Total Change Cost:</span>
              <span className="ml-2 font-bold text-lg">${costSummary.totalCost.toFixed(2)}</span>
            </div>
            <div className="text-xs text-blue-600">
              <Package2 className="inline mr-1" size={12} />
              Based on current inventory prices
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {submitStatus === 'success' && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800 font-medium">
              Enhanced tool change data saved successfully! Cost: ${costSummary.totalCost.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {submitStatus === 'error' && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800 font-medium">
              Error saving tool change. Please check required fields.
            </span>
          </div>
        </div>
      )}

      {/* Basic Information Section */}
      <div className="bg-blue-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
          <Clock className="mr-2" size={20} />
          Basic Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shift <span className="text-red-500">*</span>
            </label>
            <select
              name="shift"
              value={formData.shift}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select shift</option>
              <option value="1">1st Shift (6AM-2PM)</option>
              <option value="2">2nd Shift (2PM-10PM)</option>
              <option value="3">3rd Shift (10PM-6AM)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Operator Information Section */}
      <div className="bg-green-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold text-green-900 mb-4 flex items-center">
          <User className="mr-2" size={20} />
          Operator Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Operator Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="operator"
              value={formData.operator}
              onChange={handleInputChange}
              required
              placeholder="Enter operator name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clock Number
            </label>
            <input
              type="text"
              name="operator_clock_number"
              value={formData.operator_clock_number}
              onChange={handleInputChange}
              placeholder="Enter clock number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Equipment Information Section */}
      <div className="bg-purple-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold text-purple-900 mb-4 flex items-center">
          <Wrench className="mr-2" size={20} />
          Equipment & Job Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Work Center <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="work_center"
              value={formData.work_center}
              onChange={handleInputChange}
              required
              placeholder="Enter work center"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Equipment Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="equipment_number"
              value={formData.equipment_number}
              onChange={handleInputChange}
              required
              placeholder="Enter equipment number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Operation <span className="text-red-500">*</span>
            </label>
            <select
              name="operation"
              value={formData.operation}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="Bore">Bore</option>
              <option value="Turn">Turn</option>
              <option value="Face">Face</option>
              <option value="Thread">Thread</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Part Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="part_number"
              value={formData.part_number}
              onChange={handleInputChange}
              required
              placeholder="Enter part number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Enhanced Tool Change Information Section */}
      <div className="bg-orange-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold text-orange-900 mb-4 flex items-center">
          <Package className="mr-2" size={20} />
          Professional Tool Selection
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* First Rougher Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 border-b pb-2">First Rougher</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current First Rougher <span className="text-red-500">*</span>
              </label>
              <select
                name="old_first_rougher"
                value={formData.old_first_rougher}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select current roughing tool</option>
                {Object.entries(groupedRoughingTools).map(([geometry, tools]) => (
                  <optgroup key={geometry} label={`${geometry} Geometry`}>
                    {tools.map(tool => (
                      <option 
                        key={tool.id} 
                        value={tool.id}
                      >
                        {formatToolOption(tool)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {formData.old_first_rougher && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-sm">
                  {(() => {
                    const tool = getToolDetails(formData.old_first_rougher);
                    return tool ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{tool.material_id} - {tool.description}</span>
                          <span className="text-red-700 font-bold">${tool.unit_cost}/ea</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span>Stock: {tool.quantity_on_hand}</span>
                          <span>Supplier: {tool.supplier_name}</span>
                          <span>Lead Time: {tool.lead_time_days} days</span>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New First Rougher <span className="text-red-500">*</span>
              </label>
              <select
                name="new_first_rougher"
                value={formData.new_first_rougher}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select replacement roughing tool</option>
                {Object.entries(groupedRoughingTools).map(([geometry, tools]) => (
                  <optgroup key={geometry} label={`${geometry} Geometry`}>
                    {tools.map(tool => (
                      <option 
                        key={tool.id} 
                        value={tool.id}
                        disabled={getStockStatus(tool) === 'out-of-stock'}
                        className={getStockStatus(tool) === 'out-of-stock' ? 'text-red-500' : 
                                  getStockStatus(tool) === 'low-stock' ? 'text-yellow-600' : ''}
                      >
                        {formatToolOption(tool)} - ${tool.unit_cost}/ea
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {formData.new_first_rougher && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded text-sm">
                  {(() => {
                    const tool = getToolDetails(formData.new_first_rougher);
                    return tool ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{tool.material_id} - {tool.description}</span>
                          <span className="text-green-700 font-bold">${tool.unit_cost}/ea</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span className={`font-medium ${getStockStatus(tool) === 'low-stock' ? 'text-yellow-600' : 'text-green-600'}`}>
                            Stock: {tool.quantity_on_hand} {getStockIcon(getStockStatus(tool))}
                          </span>
                          <span>Supplier: {tool.supplier_name}</span>
                          <span>Lead Time: {tool.lead_time_days} days</span>
                        </div>
                        {getStockStatus(tool) === 'low-stock' && (
                          <div className="flex items-center gap-1 text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                            <AlertTriangle size={12} />
                            <span className="text-xs">Low stock - Consider reordering</span>
                          </div>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rougher Action <span className="text-red-500">*</span>
              </label>
              <select
                name="first_rougher_action"
                value={formData.first_rougher_action}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select action</option>
                <option value="Replace">Replace Insert (New Cost)</option>
                <option value="Index">Index Existing Insert</option>
                <option value="Flip">Flip Existing Insert</option>
              </select>
            </div>
          </div>

          {/* Finish Tool Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Finish Tool</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Finish Tool <span className="text-red-500">*</span>
              </label>
              <select
                name="old_finish_tool"
                value={formData.old_finish_tool}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select current finishing tool</option>
                {Object.entries(groupedFinishingTools).map(([geometry, tools]) => (
                  <optgroup key={geometry} label={`${geometry} Geometry`}>
                    {tools.map(tool => (
                      <option 
                        key={tool.id} 
                        value={tool.id}
                      >
                        {formatToolOption(tool)}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {formData.old_finish_tool && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-sm">
                  {(() => {
                    const tool = getToolDetails(formData.old_finish_tool);
                    return tool ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{tool.material_id} - {tool.description}</span>
                          <span className="text-red-700 font-bold">${tool.unit_cost}/ea</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span>Stock: {tool.quantity_on_hand}</span>
                          <span>Supplier: {tool.supplier_name}</span>
                          <span>Lead Time: {tool.lead_time_days} days</span>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Finish Tool <span className="text-red-500">*</span>
              </label>
              <select
                name="new_finish_tool"
                value={formData.new_finish_tool}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select replacement finishing tool</option>
                {Object.entries(groupedFinishingTools).map(([geometry, tools]) => (
                  <optgroup key={geometry} label={`${geometry} Geometry`}>
                    {tools.map(tool => (
                      <option 
                        key={tool.id} 
                        value={tool.id}
                        disabled={getStockStatus(tool) === 'out-of-stock'}
                        className={getStockStatus(tool) === 'out-of-stock' ? 'text-red-500' : 
                                  getStockStatus(tool) === 'low-stock' ? 'text-yellow-600' : ''}
                      >
                        {formatToolOption(tool)} - ${tool.unit_cost}/ea
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {formData.new_finish_tool && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded text-sm">
                  {(() => {
                    const tool = getToolDetails(formData.new_finish_tool);
                    return tool ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{tool.material_id} - {tool.description}</span>
                          <span className="text-green-700 font-bold">${tool.unit_cost}/ea</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span className={`font-medium ${getStockStatus(tool) === 'low-stock' ? 'text-yellow-600' : 'text-green-600'}`}>
                            Stock: {tool.quantity_on_hand} {getStockIcon(getStockStatus(tool))}
                          </span>
                          <span>Supplier: {tool.supplier_name}</span>
                          <span>Lead Time: {tool.lead_time_days} days</span>
                        </div>
                        {getStockStatus(tool) === 'low-stock' && (
                          <div className="flex items-center gap-1 text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                            <AlertTriangle size={12} />
                            <span className="text-xs">Low stock - Consider reordering</span>
                          </div>
                        )}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Finish Action <span className="text-red-500">*</span>
              </label>
              <select
                name="finish_tool_action"
                value={formData.finish_tool_action}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select action</option>
                <option value="Replace">Replace Insert (New Cost)</option>
                <option value="Index">Index Existing Insert</option>
                <option value="Flip">Flip Existing Insert</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Material Information Section */}
      <div className="bg-yellow-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold text-yellow-900 mb-4">
          Material & Diagnostic Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Heat Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="heat_number"
              value={formData.heat_number}
              onChange={handleInputChange}
              required
              placeholder="Enter heat number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Material Appearance
            </label>
            <select
              name="material_appearance"
              value={formData.material_appearance}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="Normal">Normal</option>
              <option value="Discolored">Discolored</option>
              <option value="Cracked">Cracked</option>
              <option value="Porous">Porous</option>
              <option value="Hard Spots">Hard Spots</option>
            </select>
          </div>
        </div>
      </div>

      {/* Change Reason & Notes Section */}
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Change Reason & Notes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Change Reason <span className="text-red-500">*</span>
            </label>
            <select
              name="change_reason"
              value={formData.change_reason}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <option value="">Select reason</option>
              <option value="Normal Wear">Normal Wear</option>
              <option value="Tool Breakage">Tool Breakage</option>
              <option value="Chipped Edge">Chipped Edge</option>
              <option value="Poor Finish">Poor Finish</option>
              <option value="Size Issues">Size Issues</option>
              <option value="Scheduled Change">Scheduled Change</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              placeholder="Any additional observations or context..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Enhanced Risk & ROI Analysis */}
      {formData.heat_number && (
        <div className="bg-indigo-50 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-indigo-900">Material Risk & Cost Analysis</h3>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-indigo-700">
                  Material Risk Score: <span className="font-bold">{calculateMaterialRiskScore()}/10</span>
                </p>
                <p className="text-sm text-indigo-700">
                  Total Tool Investment: <span className="font-bold">${costSummary.totalCost.toFixed(2)}</span>
                </p>
                {estimateCastingDate(formData.heat_number) && (
                  <p className="text-sm text-indigo-700">
                    Estimated Casting: <span className="font-bold">{estimateCastingDate(formData.heat_number)}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <TrendingUp className={`h-8 w-8 ${calculateMaterialRiskScore() >= 5 ? 'text-red-500' : 'text-green-500'}`} />
              <div className="text-xs text-indigo-600 mt-1">
                <Truck className="inline mr-1" size={12} />
                Lead Time Analysis
              </div>
            </div>
          </div>
          {calculateMaterialRiskScore() >= 5 && (
            <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded text-sm text-red-800">
              <strong>⚠️ High Risk Material Detected:</strong> Consider additional quality checks, slower speeds, and monitoring tool wear more frequently.
            </div>
          )}
          {costSummary.totalCost > 50 && (
            <div className="mt-3 p-3 bg-blue-100 border border-blue-200 rounded text-sm text-blue-800">
              <strong>💰 High Value Tool Change:</strong> Document performance carefully for ROI analysis. Total cost represents significant investment in quality.
            </div>
          )}
        </div>
      )}

      {/* Professional Stock Status Legend */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Stock Status Legend</h3>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-green-600">✅</span>
            <span>In Stock - Normal availability</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-yellow-600">⚠️</span>
            <span>Low Stock - At or below minimum</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-red-600">❌</span>
            <span>Out of Stock - Cannot select</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-blue-600">📊</span>
            <span>Real-time inventory from tool_inventory_enhanced</span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`flex items-center space-x-2 px-8 py-3 rounded-lg font-medium text-white transition-colors ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
          }`}
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="animate-spin" size={20} />
              <span>Saving Enhanced Data...</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>Save Professional Tool Change Record</span>
            </>
          )}
        </button>
      </div>

      {/* Development Footer */}
      <div className="mt-8 text-center text-xs text-gray-500 border-t pt-4">
        <p>Enhanced Tool Change Form v2.0 | Equipment 1254 - LeBlond 4GSR-137 (Bore) | Professional Manufacturing Data Collection</p>
        <p className="mt-1">ROI-focused tool tracking with real-time inventory integration | Work Center 1254 Default Configuration</p>
      </div>
    </div>
  );
};

export default ToolChangeForm;
