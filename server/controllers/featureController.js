const Feature = require('../models/Feature');

const createFeature = async (req, res) => {
  try {
    const { title, description, date } = req.body;
    const feature = new Feature({
      title,
      description,
      date,
      createdBy: req.user._id
    });
    await feature.save();
    res.status(201).json(feature);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getAllFeatures = async (req, res) => {
  try {
    const now = new Date();
    const features = await Feature.find({ date: { $gte: now } })
      .sort({ date: 1 })
      .populate('createdBy', 'name email');
    res.json(features);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createFeature,
  getAllFeatures,
}; 