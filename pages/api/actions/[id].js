import dbConnect from "../../../lib/mongodb";
import Action from "../../../models/Action";

export default async function handler(req, res) {
  const {
    method,
    query: { id },
  } = req;

  await dbConnect();

  switch (method) {
    case "GET":
      try {
        const action = await Action.findById(id);
        if (!action) {
          return res
            .status(404)
            .json({ success: false, error: "Action not found" });
        }
        res.status(200).json({ success: true, data: action });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case "PUT":
      try {
        const action = await Action.findByIdAndUpdate(id, req.body, {
          new: true,
          runValidators: true,
        });
        if (!action) {
          return res
            .status(404)
            .json({ success: false, error: "Action not found" });
        }
        res.status(200).json({ success: true, data: action });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case "DELETE":
      try {
        const action = await Action.findByIdAndUpdate(
          id,
          { isActive: false },
          { new: true }
        );
        if (!action) {
          return res
            .status(404)
            .json({ success: false, error: "Action not found" });
        }
        res.status(200).json({ success: true, data: action });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    default:
      res.status(400).json({ success: false, error: "Method not allowed" });
      break;
  }
}
