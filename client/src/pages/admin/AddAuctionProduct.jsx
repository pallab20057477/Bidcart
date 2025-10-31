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
      // Use multiple image upload endpoint as fallback
      const formData = new FormData();
      for (const file of imageFiles) {
        formData.append('images', file);
      }

      try {
        console.log('=== Testing upload endpoint availability ===');
        // First test if the endpoint exists with a simple GET request
        try {
          const testRes = await api.get('/upload/test');
          console.log('Upload endpoint test:', testRes);
        } catch (testErr) {
          console.log('Upload endpoint test failed:', testErr.response?.status);
        }
        
        console.log('=== Sending upload request ===');
        const res = await api.post('/upload/images', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log('=== Upload response received ===');
        console.log('Response status:', res.status);
        console.log('Response data:', res.data);

        const urls = res.data.imageUrls || [];
        setForm({ ...form, images: urls });
        setSuccess(`${urls.length} image(s) uploaded successfully!`);

        // Clear the file input after successful upload
        setImageFiles([]);

      } catch (uploadErr) {
        console.log('=== Upload Error Details ===');
        console.log('Error object:', uploadErr);
        console.log('Error response:', uploadErr.response);
        console.log('Error response data:', uploadErr.response?.data);
        console.log('Error message:', uploadErr.message);
        console.log('Error status:', uploadErr.response?.status);

        // Prevent page crash by handling the error gracefully
        const errorMessage = uploadErr.response?.data?.message ||
          uploadErr.response?.data?.error ||
          uploadErr.message ||
          'Image upload failed. Server upload endpoint not available (404). Please check server deployment.';

        setError(errorMessage);

        // Don't let the error propagate and crash the page
        console.error('Upload failed, but preventing page crash');
      }
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
    // Temporarily allow submission without images for testing (due to upload endpoint 404)
    if (!form.images || form.images.length === 0) {
      console.warn('No images uploaded - proceeding with empty images array due to upload endpoint issues');
      // setError('Please upload at least one product image before submitting.');
      // setLoading(false);
      // return;
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
      console.log('=== Submitting auction product ===');
      console.log('Payload:', payload);

      const response = await api.post('/products/auction', payload);
      console.log('=== Auction product created successfully ===');
      console.log('Response:', response.data);

      setSuccess('Auction product added successfully!');
      setTimeout(() => navigate('/admin/products'), 1500);
    } catch (err) {
      console.log('=== Auction product creation error ===');
      console.log('Error object:', err);
      console.log('Error response:', err.response);
      console.log('Error response data:', err.response?.data);

      setError(
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.error ||
        err.response?.data?.message ||
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
          <label className="block font-medium mb-2">Product Images (Max 5 images)</label>
          <div className="space-y-3">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />

            {imageFiles.length > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  {imageFiles.length} file(s) selected:
                </p>
                <ul className="text-sm text-gray-700 space-y-1">
                  {Array.from(imageFiles).map((file, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              type="button"
              onClick={handleImageUpload}
              disabled={uploading || !imageFiles.length}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Uploading Images...
                </>
              ) : (
                'Upload Images'
              )}
            </button>
          </div>

          {form.images.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Uploaded Images ({form.images.length}):
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {form.images.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={url}
                      alt={`Product ${idx + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newImages = form.images.filter((_, i) => i !== idx);
                        setForm({ ...form, images: newImages });
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="mt-1 text-xs text-gray-500">
            Supported formats: JPG, PNG, GIF. Max file size: 5MB per image.
          </p>
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