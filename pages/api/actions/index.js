import dbConnect from "../../../lib/mongodb";
import Action from "../../../models/Action";

export default async function handler(req, res) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case "GET":
      try {
        const actions = await Action.find({}).sort({
          createdAt: -1,
        });
        res.status(200).json({ success: true, data: actions });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case "POST":
      try {
        const action = await Action.create(req.body);
        res.status(201).json({ success: true, data: action });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    default:
      res.status(400).json({ success: false, error: "Method not allowed" });
      break;
  }
}
