import dbConnect from '../../../lib/mongodb';
import Algorithm from '../../../models/Algorithm';

export default async function handler(req, res) {
  const { method, query: { id } } = req;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const algorithm = await Algorithm.findById(id);
        if (!algorithm) {
          return res.status(404).json({ success: false, error: 'Algorithm not found' });
        }
        res.status(200).json({ success: true, data: algorithm });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case 'PUT':
      try {
        const algorithm = await Algorithm.findByIdAndUpdate(id, req.body, {
          new: true,
          runValidators: true
        });
        if (!algorithm) {
          return res.status(404).json({ success: false, error: 'Algorithm not found' });
        }
        res.status(200).json({ success: true, data: algorithm });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case 'DELETE':
      try {
        const algorithm = await Algorithm.findByIdAndUpdate(id, { isActive: false }, { new: true });
        if (!algorithm) {
          return res.status(404).json({ success: false, error: 'Algorithm not found' });
        }
        res.status(200).json({ success: true, data: algorithm });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    default:
      res.status(400).json({ success: false, error: 'Method not allowed' });
      break;
  }
}