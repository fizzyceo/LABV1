import mongoose from 'mongoose';

const GlobalParameterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  type: { type: String, enum: ['text', 'number', 'boolean', 'date'], default: 'text' },
  defaultValue: { type: String, default: '' },
  isRequired: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export default mongoose.models.GlobalParameter || mongoose.model('GlobalParameter', GlobalParameterSchema);