import dbConnect from '../../../lib/mongodb';
import Template from '../../../models/Template';

export default async function handler(req, res) {
  const { method, query: { id } } = req;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const template = await Template.findById(id);
        if (!template) {
          return res.status(404).json({ success: false, error: 'Template not found' });
        }
        res.status(200).json({ success: true, data: template });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case 'PUT':
      try {
        const template = await Template.findByIdAndUpdate(id, req.body, {
          new: true,
          runValidators: true
        });
        if (!template) {
          return res.status(404).json({ success: false, error: 'Template not found' });
        }
        res.status(200).json({ success: true, data: template });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case 'DELETE':
      try {
        const template = await Template.findByIdAndUpdate(id, { isActive: false }, { new: true });
        if (!template) {
          return res.status(404).json({ success: false, error: 'Template not found' });
        }
        res.status(200).json({ success: true, data: template });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    default:
      res.status(400).json({ success: false, error: 'Method not allowed' });
      break;
  }
}