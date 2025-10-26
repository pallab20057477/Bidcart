import React from 'react';
import { FaShieldAlt, FaEye, FaUserShield, FaCookie, FaDatabase, FaLock } from 'react-icons/fa';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Privacy Policy</h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto">
            Your privacy is important to us. Learn how we collect, use, and protect your information.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Privacy Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaShieldAlt className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Protection</h3>
            <p className="text-gray-600 text-sm">We use industry-standard encryption to protect your data</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaUserShield className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Rights</h3>
            <p className="text-gray-600 text-sm">You have control over your personal information</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaEye className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Transparency</h3>
            <p className="text-gray-600 text-sm">Clear information about how we use your data</p>
          </div>
        </div>

        {/* Privacy Policy Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-12">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Introduction</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                At BidCart, we are committed to protecting your privacy and ensuring the security of your personal information. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
                website and services.
              </p>
              <p className="text-gray-600 leading-relaxed">
                By using BidCart, you consent to the data practices described in this policy. If you do not agree with 
                the practices described in this policy, please do not use our services.
              </p>
            </div>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Information We Collect</h2>
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="flex items-start">
                  <FaDatabase className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
                    <ul className="text-gray-600 space-y-2">
                      <li>• Name, email address, and phone number</li>
                      <li>• Billing and shipping addresses</li>
                      <li>• Payment information (processed securely by third-party providers)</li>
                      <li>• Account credentials and preferences</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-6">
                <div className="flex items-start">
                  <FaEye className="w-6 h-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Usage Information</h3>
                    <ul className="text-gray-600 space-y-2">
                      <li>• Pages visited and time spent on our site</li>
                      <li>• Products viewed and purchased</li>
                      <li>• Auction participation and bidding history</li>
                      <li>• Device information and IP address</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-6">
                <div className="flex items-start">
                  <FaCookie className="w-6 h-6 text-purple-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Cookies and Tracking</h3>
                    <ul className="text-gray-600 space-y-2">
                      <li>• Essential cookies for site functionality</li>
                      <li>• Analytics cookies to improve our services</li>
                      <li>• Preference cookies to remember your settings</li>
                      <li>• Marketing cookies for personalized ads (with consent)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">How We Use Your Information</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed mb-6">
                We use the information we collect for the following purposes:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Service Provision</h3>
                  <ul className="text-gray-600 space-y-2">
                    <li>• Process orders and payments</li>
                    <li>• Manage your account</li>
                    <li>• Facilitate auctions and bidding</li>
                    <li>• Provide customer support</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Communication</h3>
                  <ul className="text-gray-600 space-y-2">
                    <li>• Send order confirmations</li>
                    <li>• Notify about auction updates</li>
                    <li>• Share promotional offers (with consent)</li>
                    <li>• Provide important service updates</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Information Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Information Sharing</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed mb-6">
                We do not sell, trade, or rent your personal information to third parties. We may share your 
                information only in the following circumstances:
              </p>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Providers</h3>
                  <p className="text-gray-600">
                    We work with trusted third-party service providers for payment processing, shipping, 
                    and analytics. These providers are bound by strict confidentiality agreements.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Legal Requirements</h3>
                  <p className="text-gray-600">
                    We may disclose information when required by law, court order, or to protect our 
                    rights and the safety of our users.
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Transfers</h3>
                  <p className="text-gray-600">
                    In the event of a merger, acquisition, or sale of assets, user information may be 
                    transferred as part of the business transaction.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Security</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start">
                <FaLock className="w-6 h-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Security Measures</h3>
                  <ul className="text-gray-600 space-y-2">
                    <li>• SSL encryption for all data transmission</li>
                    <li>• Secure servers with regular security updates</li>
                    <li>• Access controls and employee training</li>
                    <li>• Regular security audits and monitoring</li>
                    <li>• PCI DSS compliance for payment processing</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Privacy Rights</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed mb-6">
                You have the following rights regarding your personal information:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Access & Portability</h3>
                    <p className="text-gray-600 text-sm">
                      Request a copy of your personal data and download your information.
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Correction</h3>
                    <p className="text-gray-600 text-sm">
                      Update or correct inaccurate personal information.
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Deletion</h3>
                    <p className="text-gray-600 text-sm">
                      Request deletion of your personal data (subject to legal requirements).
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Opt-out</h3>
                    <p className="text-gray-600 text-sm">
                      Unsubscribe from marketing communications at any time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Cookies Policy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Cookies Policy</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                We use cookies and similar technologies to enhance your experience on our website. 
                You can control cookie settings through your browser preferences.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Cookie Management</h3>
                <p className="text-gray-600 text-sm">
                  You can disable cookies in your browser settings, but this may affect the functionality 
                  of our website. Essential cookies cannot be disabled as they are necessary for the 
                  site to function properly.
                </p>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Us</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have questions about this Privacy Policy or want to exercise your privacy rights, 
                please contact us:
              </p>
              <div className="space-y-2 text-gray-600">
                <p><strong>Email:</strong> privacy@bidcart.com</p>
                <p><strong>Address:</strong> Privacy Officer, BidCart Inc., 123 E-commerce Street, Tech City, TC 12345</p>
                <p><strong>Phone:</strong> +1 (555) 123-4567</p>
              </div>
            </div>
          </section>
        </div>

        {/* Last Updated */}
        <div className="text-center mt-8 text-gray-500">
          <p>Last updated: January 2024</p>
          <p className="text-sm mt-2">We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;