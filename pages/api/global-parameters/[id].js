import dbConnect from '../../../lib/mongodb';
import GlobalParameter from '../../../models/GlobalParameter';

export default async function handler(req, res) {
  const { method, query: { id } } = req;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const globalParameter = await GlobalParameter.findById(id);
        if (!globalParameter) {
          return res.status(404).json({ success: false, error: 'Global parameter not found' });
        }
        res.status(200).json({ success: true, data: globalParameter });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case 'PUT':
      try {
        const globalParameter = await GlobalParameter.findByIdAndUpdate(id, req.body, {
          new: true,
          runValidators: true
        });
        if (!globalParameter) {
          return res.status(404).json({ success: false, error: 'Global parameter not found' });
        }
        res.status(200).json({ success: true, data: globalParameter });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case 'DELETE':
      try {
        const globalParameter = await GlobalParameter.findByIdAndUpdate(id, { isActive: false }, { new: true });
        if (!globalParameter) {
          return res.status(404).json({ success: false, error: 'Global parameter not found' });
        }
        res.status(200).json({ success: true, data: globalParameter });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    default:
      res.status(400).json({ success: false, error: 'Method not allowed' });
      break;
  }
}