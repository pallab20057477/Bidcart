const ShippingMethod = require('../models/ShippingMethod');
const ShippingZone = require('../models/ShippingZone');
const Vendor = require('../models/Vendor');

// Get all shipping data (zones, methods, settings) for the current vendor
exports.getShippingData = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    
    const zones = await ShippingZone.find({ vendor: vendor._id });
    const methods = await ShippingMethod.find({ vendor: vendor._id });
    
    // Get shipping settings from vendor profile
    const settings = {
      freeShippingThreshold: vendor.shippingSettings?.freeShippingThreshold || 0,
      processingTime: vendor.shippingSettings?.processingTime || 1,
      returnPolicy: vendor.shippingSettings?.returnPolicy || '',
      trackingEnabled: vendor.shippingSettings?.trackingEnabled !== false,
      internationalShipping: vendor.shippingSettings?.internationalShipping || false
    };
    
    res.json({ 
      success: true, 
      data: {
        zones,
        methods,
        settings,
        recentShipments: [] // TODO: Implement shipment tracking
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Shipping Zones
exports.addShippingZone = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    
    const { name, countries, states, postalCodes, isActive } = req.body;
    
    const zone = new ShippingZone({
      vendor: vendor._id,
      name,
      countries: countries || [],
      states: states || [],
      postalCodes,
      isActive: isActive !== false
    });
    
    await zone.save();
    res.status(201).json({ success: true, zone });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.updateShippingZone = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    
    const { id } = req.params;
    const { name, countries, states, postalCodes, isActive } = req.body;
    
    const zone = await ShippingZone.findOneAndUpdate(
      { _id: id, vendor: vendor._id },
      { name, countries, states, postalCodes, isActive },
      { new: true }
    );
    
    if (!zone) return res.status(404).json({ success: false, message: 'Shipping zone not found' });
    res.json({ success: true, zone });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.deleteShippingZone = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    
    const { id } = req.params;
    const zone = await ShippingZone.findOneAndDelete({ _id: id, vendor: vendor._id });
    
    if (!zone) return res.status(404).json({ success: false, message: 'Shipping zone not found' });
    res.json({ success: true, message: 'Shipping zone deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Shipping Methods
exports.addShippingMethod = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    
    const { name, description, baseRate, perKgRate, freeThreshold, estimatedDays, zoneId, isActive } = req.body;
    
    console.log('Adding shipping method:', { name, description, baseRate, perKgRate, freeThreshold, estimatedDays, zoneId, isActive });
    
    // Prepare method data, excluding zoneId if it's empty
    const methodData = {
      vendor: vendor._id,
      name,
      description,
      baseRate: baseRate || 0,
      perKgRate: perKgRate || 0,
      freeThreshold: freeThreshold || 0,
      estimatedDays: estimatedDays || '3-5',
      isActive: isActive !== false
    };
    
    // Only add zoneId if it's a valid non-empty string
    if (zoneId && zoneId.trim() !== '') {
      methodData.zoneId = zoneId;
    }
    
    const method = new ShippingMethod(methodData);
    
    await method.save();
    res.status(201).json({ success: true, method });
  } catch (error) {
    console.error('Error adding shipping method:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.updateShippingMethod = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    
    const { id } = req.params;
    const { name, description, baseRate, perKgRate, freeThreshold, estimatedDays, zoneId, isActive } = req.body;
    
    // Prepare update data, excluding zoneId if it's empty
    const updateData = {
      name,
      description,
      baseRate,
      perKgRate,
      freeThreshold,
      estimatedDays,
      isActive
    };
    
    // Only add zoneId if it's a valid non-empty string
    if (zoneId && zoneId.trim() !== '') {
      updateData.zoneId = zoneId;
    } else {
      updateData.zoneId = null;
    }
    
    const method = await ShippingMethod.findOneAndUpdate(
      { _id: id, vendor: vendor._id },
      updateData,
      { new: true }
    );
    
    if (!method) return res.status(404).json({ success: false, message: 'Shipping method not found' });
    res.json({ success: true, method });
  } catch (error) {
    console.error('Error updating shipping method:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.deleteShippingMethod = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    
    const { id } = req.params;
    const method = await ShippingMethod.findOneAndDelete({ _id: id, vendor: vendor._id });
    
    if (!method) return res.status(404).json({ success: false, message: 'Shipping method not found' });
    res.json({ success: true, message: 'Shipping method deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Shipping Settings
exports.updateShippingSettings = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    
    const { freeShippingThreshold, processingTime, returnPolicy, trackingEnabled, internationalShipping } = req.body;
    
    vendor.shippingSettings = {
      freeShippingThreshold: freeShippingThreshold || 0,
      processingTime: processingTime || 1,
      returnPolicy: returnPolicy || '',
      trackingEnabled: trackingEnabled !== false,
      internationalShipping: internationalShipping || false
    };
    
    await vendor.save();
    res.json({ success: true, settings: vendor.shippingSettings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}; 