import mongoose from 'mongoose';

const ConditionSchema = new mongoose.Schema({
  parameter: { type: String, required: true },
  operator: { 
    type: String, 
    enum: ['equals', 'range', 'contains', 'greater_than', 'less_than'], 
    default: 'equals' 
  },
  value: { type: mongoose.Schema.Types.Mixed },
  processActions: [{ type: String }],
  resultActions: [{ type: String }],
  children: [{ type: mongoose.Schema.Types.Mixed }]
});

const AlgorithmSchema = new mongoose.Schema({
  name: { type: String, required: true },
  template: { type: String, required: true },
  tree: ConditionSchema,
  description: { type: String, default: '' },
  version: { type: String, default: '1.0' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: String, default: 'system' }
}, {
  timestamps: true
});

export default mongoose.models.Algorithm || mongoose.model('Algorithm', AlgorithmSchema);