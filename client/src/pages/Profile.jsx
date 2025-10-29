import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useSocketEvents } from '../hooks/useSocketEvents';
import { FaUser, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { trackOrder, joinCategory } = useSocket();
  const { isConnected, userRole } = useSocketEvents();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });

  useEffect(() => {
    if (user) {
      console.log('👤 Current user data:', user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipCode: user.address?.zipCode || '',
          country: user.address?.country || ''
        }
      });
    }
  }, [user]);

  // Socket.IO integration for user notifications
  useEffect(() => {
    if (isConnected && userRole === 'user') {
      // Join user-specific notification rooms
      joinCategory('electronics'); // Example category
      console.log('User profile connected to real-time notifications');
    }
  }, [isConnected, userRole, joinCategory]);

  const handleInputChange = (field) => (e) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: e.target.value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: e.target.value
      }));
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      console.log('🔄 Starting profile update with data:', formData);
      const result = await updateProfile(formData);
      console.log('📡 Profile update result:', result);
      
      if (result.success) {
        console.log('✅ Profile update successful');
        setEditing(false);
        toast.success('Profile updated successfully!');
      } else {
        console.log('❌ Profile update failed:', result.error);
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('❌ Profile update error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaUser className="text-6xl text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 mb-4">Please login to view your profile</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Profile</h1>
        <p className="text-base-content/70">Manage your account information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-base-100 rounded-2xl shadow-md p-6 mb-8">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="avatar placeholder">
            <div className="bg-primary text-primary-content rounded-full w-16 md:w-20">
              <span className="text-xl md:text-2xl font-semibold">
                {(user?.name || user?.email || 'U')
                  .split(' ')
                  .map(s => s[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold leading-tight">{user?.name || 'User'}</h2>
            <p className="text-sm md:text-base text-base-content/70 break-all">{user?.email}</p>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="btn btn-outline btn-sm md:btn-md"
            >
              <FaEdit className="mr-2" />
              Edit Profile
            </button>
          ) : (
            <div className="hidden md:flex gap-2">
              <button
                onClick={handleUpdateProfile}
                disabled={loading}
                className="btn btn-primary btn-md"
              >
                <FaSave className="mr-2" />
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="btn btn-ghost btn-md"
              >
                <FaTimes className="mr-2" />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Profile Information */}
        <div className="bg-base-100 rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
          <div className="space-y-4">
            <div>
              <label className="label">
                <span className="label-text">Full Name</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={handleInputChange('name')}
                disabled={!editing}
                className="input input-bordered w-full"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                value={formData.email}
                disabled={true}
                className="input input-bordered w-full bg-base-200"
                placeholder="john@example.com"
              />
              <p className="text-xs text-base-content/60 mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="label">
                <span className="label-text">Phone</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                disabled={!editing}
                className="input input-bordered w-full"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-base-100 rounded-2xl shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Address Information</h3>
          <div className="space-y-4">
            <div>
              <label className="label">
                <span className="label-text">Street Address</span>
              </label>
              <input
                type="text"
                value={formData.address.street}
                onChange={handleInputChange('address.street')}
                disabled={!editing}
                className="input input-bordered w-full"
                placeholder="123 Main St"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <span className="label-text">City</span>
                </label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={handleInputChange('address.city')}
                  disabled={!editing}
                  className="input input-bordered w-full"
                  placeholder="New York"
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">State</span>
                </label>
                <input
                  type="text"
                  value={formData.address.state}
                  onChange={handleInputChange('address.state')}
                  disabled={!editing}
                  className="input input-bordered w-full"
                  placeholder="NY"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <span className="label-text">ZIP Code</span>
                </label>
                <input
                  type="text"
                  value={formData.address.zipCode}
                  onChange={handleInputChange('address.zipCode')}
                  disabled={!editing}
                  className="input input-bordered w-full"
                  placeholder="10001"
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Country</span>
                </label>
                <input
                  type="text"
                  value={formData.address.country}
                  onChange={handleInputChange('address.country')}
                  disabled={!editing}
                  className="input input-bordered w-full"
                  placeholder="United States"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky action bar for mobile when editing */}
      {editing && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-base-300 bg-base-100/95 backdrop-blur p-4 flex justify-end gap-2 z-40">
          <button
            onClick={() => setEditing(false)}
            className="btn btn-ghost btn-sm"
          >
            <FaTimes className="mr-2" />
            Cancel
          </button>
          <button
            onClick={handleUpdateProfile}
            disabled={loading}
            className="btn btn-primary btn-sm"
          >
            <FaSave className="mr-2" />
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;