import dbConnect from '../../../lib/mongodb';
import Algorithm from '../../../models/Algorithm';

export default async function handler(req, res) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const algorithms = await Algorithm.find({ isActive: true }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: algorithms });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case 'POST':
      try {
        const algorithm = await Algorithm.create(req.body);
        res.status(201).json({ success: true, data: algorithm });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    default:
      res.status(400).json({ success: false, error: 'Method not allowed' });
      break;
  }
}