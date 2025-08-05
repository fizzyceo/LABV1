import dbConnect from "../../../lib/mongodb";
import Template from "../../../models/Template";

export default async function handler(req, res) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case "GET":
      try {
        const templates = await Template.find({ isActive: true }).sort({
          createdAt: -1,
        });
        res.status(200).json({ success: true, data: templates });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case "POST":
      try {
        // Generate random code
        const generateRandomCode = () => {
          const timestamp = Date.now().toString(36);
          const randomStr = Math.random().toString(36).substr(2, 5);
          return `${timestamp}-${randomStr}`;
        };

        const randomCode = generateRandomCode();
        const template = await Template.create({
          ...req.body,
          code: randomCode,
        });
        res.status(201).json({ success: true, data: template });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    default:
      res.status(400).json({ success: false, error: "Method not allowed" });
      break;
  }
}
