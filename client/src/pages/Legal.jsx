import React from 'react';
import { FaGavel, FaShieldAlt, FaFileContract, FaExclamationTriangle } from 'react-icons/fa';

const Legal = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Legal Information</h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto">
            Important legal information and policies for BidCart users
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Quick Links */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
            <FaFileContract className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Terms of Service</h3>
            <p className="text-gray-600 text-sm">Rules and conditions for using BidCart</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
            <FaShieldAlt className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Privacy Policy</h3>
            <p className="text-gray-600 text-sm">How we collect and protect your data</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
            <FaGavel className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Auction Rules</h3>
            <p className="text-gray-600 text-sm">Guidelines for participating in auctions</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow">
            <FaExclamationTriangle className="w-12 h-12 text-orange-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Disclaimers</h3>
            <p className="text-gray-600 text-sm">Important legal disclaimers</p>
          </div>
        </div>

        {/* Legal Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-12">
          {/* Company Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Company Information</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed">
                BidCart is operated by BidCart Inc., a company incorporated under the laws of the United States. 
                Our registered office is located at 123 E-commerce Street, Tech City, TC 12345, United States.
              </p>
              <div className="bg-gray-50 rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                <ul className="space-y-2 text-gray-600">
                  <li><strong>Legal Department:</strong> legal@bidcart.com</li>
                  <li><strong>Business Registration:</strong> #BC-2024-001</li>
                  <li><strong>Tax ID:</strong> 12-3456789</li>
                  <li><strong>Phone:</strong> +1 (555) 123-4567</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Intellectual Property</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                All content on BidCart, including but not limited to text, graphics, logos, images, and software, 
                is the property of BidCart Inc. or its content suppliers and is protected by copyright, trademark, 
                and other intellectual property laws.
              </p>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Trademarks</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                "BidCart" and the BidCart logo are trademarks of BidCart Inc. All other trademarks, service marks, 
                and trade names appearing on the site are the property of their respective owners.
              </p>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Copyright</h3>
              <p className="text-gray-600 leading-relaxed">
                © 2024 BidCart Inc. All rights reserved. No part of this website may be reproduced, distributed, 
                or transmitted in any form without prior written permission.
              </p>
            </div>
          </section>

          {/* Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Dispute Resolution</h2>
            <div className="prose prose-gray max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Internal Dispute Resolution</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                BidCart provides an internal dispute resolution system for issues between buyers and sellers. 
                Users can file disputes through their account dashboard, and our team will mediate to find 
                a fair resolution.
              </p>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Governing Law</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                These terms and any disputes arising from your use of BidCart shall be governed by and 
                construed in accordance with the laws of the United States and the State of California.
              </p>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Jurisdiction</h3>
              <p className="text-gray-600 leading-relaxed">
                Any legal action or proceeding arising under these terms will be brought exclusively in 
                the federal or state courts located in California, and you consent to the jurisdiction 
                of such courts.
              </p>
            </div>
          </section>

          {/* Compliance */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Regulatory Compliance</h2>
            <div className="prose prose-gray max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Data Protection</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We comply with applicable data protection laws, including GDPR for European users and 
                CCPA for California residents. Users have rights regarding their personal data as 
                outlined in our Privacy Policy.
              </p>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Consumer Protection</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                BidCart adheres to consumer protection laws and regulations. We provide clear product 
                descriptions, fair return policies, and secure payment processing.
              </p>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Anti-Money Laundering</h3>
              <p className="text-gray-600 leading-relaxed">
                We maintain compliance with anti-money laundering (AML) and know-your-customer (KYC) 
                regulations to prevent fraudulent activities on our platform.
              </p>
            </div>
          </section>

          {/* Disclaimers */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Important Disclaimers</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-start">
                <FaExclamationTriangle className="w-6 h-6 text-yellow-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Limitation of Liability</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    BidCart provides the platform "as is" without warranties of any kind. We are not liable 
                    for any indirect, incidental, special, or consequential damages arising from your use 
                    of the platform.
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Third-Party Content</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Product listings and descriptions are provided by third-party sellers. BidCart does not 
                    guarantee the accuracy, completeness, or reliability of such content.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Legal */}
          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Legal Inquiries</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-600 leading-relaxed mb-4">
                For legal inquiries, copyright concerns, or other legal matters, please contact our legal department:
              </p>
              <div className="space-y-2 text-gray-600">
                <p><strong>Email:</strong> legal@bidcart.com</p>
                <p><strong>Address:</strong> Legal Department, BidCart Inc., 123 E-commerce Street, Tech City, TC 12345</p>
                <p><strong>Response Time:</strong> We aim to respond to legal inquiries within 5-7 business days</p>
              </div>
            </div>
          </section>
        </div>

        {/* Last Updated */}
        <div className="text-center mt-8 text-gray-500">
          <p>Last updated: January 2024</p>
        </div>
      </div>
    </div>
  );
};

export default Legal;