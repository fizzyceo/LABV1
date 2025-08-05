import mongoose from "mongoose";

const ActionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["process", "result"], default: "process" },
    parameters: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Action || mongoose.model("Action", ActionSchema);
