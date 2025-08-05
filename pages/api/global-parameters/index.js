import dbConnect from '../../../lib/mongodb';
import GlobalParameter from '../../../models/GlobalParameter';

export default async function handler(req, res) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const globalParameters = await GlobalParameter.find({ isActive: true });
        res.status(200).json({ success: true, data: globalParameters });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case 'POST':
      try {
        const globalParameter = await GlobalParameter.create(req.body);
        res.status(201).json({ success: true, data: globalParameter });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    default:
      res.status(400).json({ success: false, error: 'Method not allowed' });
      break;
  }
}