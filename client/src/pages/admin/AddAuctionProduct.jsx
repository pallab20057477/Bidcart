import React, { useState } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const categories = [
  'Electronics', 'Fashion', 'Home', 'Sports', 'Books', 'Art', 'Collectibles', 'Other', 'Tools & Hardware'
];
const conditions = ['new', 'like-new', 'good', 'fair', 'poor'];

const AddAuctionProduct = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    brand: '',
    condition: 'new',
    stock: 1,
    tags: '',
    images: [],
    auction: {
      startTime: '',
      endTime: '',
      startingBid: '',
      minBidIncrement: 1
    }
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('auction.')) {
      setForm({
        ...form,
        auction: { ...form.auction, [name.split('.')[1]]: value }
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleImageChange = (e) => {
    setImageFiles([...e.target.files]);
  };

  const handleImageUpload = async () => {
    setUploading(true);
    setError('');
    try {
      if (!imageFiles.length) {
        setError('Please select at least one image.');
        setUploading(false);
        return;
      }
      const urls = [];
      for (const file of imageFiles) {
        // Removed client-side type and size validation as per new requirements
        // Debug log
        console.log('Uploading file:', file);
        const formData = new FormData();
        formData.append('image', file);
        // Debug log FormData
        for (let pair of formData.entries()) {
          console.log(pair[0]+ ':', pair[1]);
        }
        try {
          console.log('=== Sending upload request ===');
          const res = await api.post('/upload/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          console.log('=== Upload response received ===');
          console.log('Response status:', res.status);
          console.log('Response data:', res.data);
          urls.push(res.data.url);
        } catch (uploadErr) {
          console.log('=== Upload Error Details ===');
          console.log('Error object:', uploadErr);
          console.log('Error response:', uploadErr.response);
          console.log('Error response data:', uploadErr.response?.data);
          console.log('Error message:', uploadErr.message);
          console.log('Error status:', uploadErr.response?.status);
          
          setError(
            uploadErr.response?.data?.message ||
            uploadErr.response?.data?.error ||
            uploadErr.message ||
            'Image upload failed. Please check the file.'
          );
          setUploading(false);
          return;
        }
      }
      setForm({ ...form, images: urls });
      setSuccess('Images uploaded successfully!');
    } catch (err) {
      setError('Image upload failed.');
      console.log('General upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    // Require at least one image
    if (!form.images || form.images.length === 0) {
      setError('Please upload at least one product image before submitting.');
      setLoading(false);
      return;
    }
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        auction: {
          ...form.auction,
          startingBid: parseFloat(form.auction.startingBid),
          minBidIncrement: parseInt(form.auction.minBidIncrement),
          startTime: new Date(form.auction.startTime).toISOString(),
          endTime: new Date(form.auction.endTime).toISOString()
        }
      };
      await api.post('/products/auction', payload);
      setSuccess('Auction product added successfully!');
      setTimeout(() => navigate('/admin/products'), 1500);
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.error ||
        'Failed to add auction product.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Add Auction Product</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Product Name</label>
          <input type="text" name="name" className="w-full border rounded px-3 py-2" value={form.name} onChange={handleChange} maxLength={100} required />
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea name="description" className="w-full border rounded px-3 py-2" value={form.description} onChange={handleChange} maxLength={2000} required rows={4} />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block font-medium mb-1">Category</label>
            <select name="category" className="w-full border rounded px-3 py-2" value={form.category} onChange={handleChange} required>
              <option value="">Select</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block font-medium mb-1">Brand</label>
            <input type="text" name="brand" className="w-full border rounded px-3 py-2" value={form.brand} onChange={handleChange} />
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block font-medium mb-1">Condition</label>
            <select name="condition" className="w-full border rounded px-3 py-2" value={form.condition} onChange={handleChange}>
              {conditions.map(cond => <option key={cond} value={cond}>{cond}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block font-medium mb-1">Stock</label>
            <input type="number" name="stock" className="w-full border rounded px-3 py-2" value={form.stock} onChange={handleChange} min={1} required />
          </div>
        </div>
        <div>
          <label className="block font-medium mb-1">Tags (comma separated)</label>
          <input type="text" name="tags" className="w-full border rounded px-3 py-2" value={form.tags} onChange={handleChange} />
        </div>
        <div>
          <label className="block font-medium mb-1">Product Price ($)</label>
          <input type="number" name="price" className="w-full border rounded px-3 py-2" value={form.price} onChange={handleChange} min={0} step="0.01" required />
        </div>
        <div>
          <label className="block font-medium mb-1">Product Images</label>
          <input type="file" accept="image/*" multiple onChange={handleImageChange} />
          <button type="button" className="btn btn-secondary mt-2" onClick={handleImageUpload} disabled={uploading || !imageFiles.length}>
            {uploading ? 'Uploading...' : 'Upload Images'}
          </button>
          {form.images.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {form.images.map((url, idx) => (
                <img key={idx} src={url} alt="Product" className="w-20 h-20 object-cover rounded border" />
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Auction Start Time</label>
            <input type="datetime-local" name="auction.startTime" className="w-full border rounded px-3 py-2" value={form.auction.startTime} onChange={handleChange} required />
          </div>
          <div>
            <label className="block font-medium mb-1">Auction End Time</label>
            <input type="datetime-local" name="auction.endTime" className="w-full border rounded px-3 py-2" value={form.auction.endTime} onChange={handleChange} required />
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block font-medium mb-1">Starting Bid ($)</label>
            <input type="number" name="auction.startingBid" className="w-full border rounded px-3 py-2" value={form.auction.startingBid} onChange={handleChange} min={0} step="0.01" required />
          </div>
          <div className="flex-1">
            <label className="block font-medium mb-1">Min Bid Increment ($)</label>
            <input type="number" name="auction.minBidIncrement" className="w-full border rounded px-3 py-2" value={form.auction.minBidIncrement} onChange={handleChange} min={1} required />
          </div>
        </div>
        {success && <div className="text-green-600 font-medium">{success}</div>}
        {error && <div className="text-red-600 font-medium">{error}</div>}
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50" disabled={loading || uploading || form.images.length === 0}>
          {loading ? 'Adding...' : 'Add Auction Product'}
        </button>
      </form>
    </div>
  );
};

export default AddAuctionProduct; 