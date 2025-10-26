import React from 'react';
import { FaUsers, FaRocket, FaHeart, FaGlobe, FaShieldAlt, FaHandshake } from 'react-icons/fa';

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">About BidCart</h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto">
            Revolutionizing e-commerce through innovative auction-based shopping experiences
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Our Story */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Story</h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-gray-600 mb-6">
                BidCart was born from a simple idea: what if shopping could be more exciting, 
                fair, and rewarding for everyone involved? We envisioned a platform where 
                buyers could discover amazing deals through auctions while vendors could 
                reach customers in innovative ways.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                Founded in 2024, we've grown from a small startup to a thriving marketplace 
                that connects thousands of buyers and sellers worldwide. Our mission is to 
                democratize e-commerce by giving everyone equal opportunities to buy and sell.
              </p>
              <p className="text-lg text-gray-600">
                Today, BidCart stands as a testament to innovation in online retail, 
                combining the excitement of auctions with the convenience of modern e-commerce.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">10K+</div>
                  <div className="text-gray-600">Active Users</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">5K+</div>
                  <div className="text-gray-600">Products Sold</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600 mb-2">500+</div>
                  <div className="text-gray-600">Vendors</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-orange-600 mb-2">99%</div>
                  <div className="text-gray-600">Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Our Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaShieldAlt className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Trust & Security</h3>
              <p className="text-gray-600">
                We prioritize the security of our users' data and transactions, 
                implementing industry-leading security measures.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaRocket className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Innovation</h3>
              <p className="text-gray-600">
                We continuously evolve our platform with cutting-edge technology 
                to enhance user experience and functionality.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaHandshake className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Fair Trade</h3>
              <p className="text-gray-600">
                We believe in fair and transparent trading practices that benefit 
                both buyers and sellers equally.
              </p>
            </div>
          </div>
        </div>

        {/* Our Team */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Our Team</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <FaUsers className="w-16 h-16 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Development Team</h3>
              <p className="text-gray-600">Building the future of e-commerce</p>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <FaHeart className="w-16 h-16 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Customer Success</h3>
              <p className="text-gray-600">Ensuring amazing user experiences</p>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-r from-green-400 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <FaGlobe className="w-16 h-16 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Global Operations</h3>
              <p className="text-gray-600">Connecting markets worldwide</p>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <FaShieldAlt className="w-16 h-16 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Security Team</h3>
              <p className="text-gray-600">Protecting your data and transactions</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Join Our Journey</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Be part of the e-commerce revolution. Whether you're a buyer looking for great deals 
            or a vendor wanting to reach new customers, BidCart is your platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Start Shopping
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
              Become a Vendor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;