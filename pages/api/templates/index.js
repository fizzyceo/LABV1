import dbConnect from '../../../lib/mongodb';
import Template from '../../../models/Template';

export default async function handler(req, res) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const templates = await Template.find({ isActive: true });
        res.status(200).json({ success: true, data: templates });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case 'POST':
      try {
        const template = await Template.create(req.body);
        res.status(201).json({ success: true, data: template });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    default:
      res.status(400).json({ success: false, error: 'Method not allowed' });
      break;
  }
}