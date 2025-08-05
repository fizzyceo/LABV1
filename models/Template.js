import mongoose from "mongoose";

const SubParameterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, default: "text" },
  defaultValue: { type: String, default: "" },
});

const ParameterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subParameters: [SubParameterSchema],
  states: [{ type: String }],
  defaultRange: {
    min: { type: String, default: "" },
    max: { type: String, default: "" },
  },
});

const ActionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["process", "result"], default: "process" },
  parameters: [{ type: String }],
});

const TemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    parameters: [ParameterSchema],
    actions: [ActionSchema],
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Template ||
  mongoose.model("Template", TemplateSchema);
