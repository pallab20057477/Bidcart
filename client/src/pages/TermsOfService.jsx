import React from 'react';
import { FaFileContract, FaGavel, FaShoppingCart, FaExclamationTriangle, FaUserCheck, FaShieldAlt } from 'react-icons/fa';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Terms of Service</h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto">
            Please read these terms carefully before using BidCart
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Terms Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaUserCheck className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">User Responsibilities</h3>
            <p className="text-gray-600 text-sm">Your obligations when using BidCart</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaGavel className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Auction Rules</h3>
            <p className="text-gray-600 text-sm">Guidelines for participating in auctions</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <FaShieldAlt className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Platform Rules</h3>
            <p className="text-gray-600 text-sm">Terms governing the use of our platform</p>
          </div>
        </div>

        {/* Terms Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-12">
          {/* Acceptance of Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Acceptance of Terms</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                By accessing and using BidCart ("the Service"), you accept and agree to be bound by the terms 
                and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
              <p className="text-gray-600 leading-relaxed">
                These Terms of Service ("Terms") govern your use of our website located at bidcart.com 
                (the "Service") operated by BidCart Inc. ("us", "we", or "our").
              </p>
            </div>
          </section>

          {/* Account Registration */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Account Registration</h2>
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-start">
                <FaUserCheck className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Account Requirements</h3>
                  <ul className="text-gray-600 space-y-2">
                    <li>• You must be at least 18 years old to create an account</li>
                    <li>• You must provide accurate and complete information</li>
                    <li>• You are responsible for maintaining the security of your account</li>
                    <li>• You must notify us immediately of any unauthorized use</li>
                    <li>• One person may not maintain more than one account</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Auction Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">3. Auction Terms and Conditions</h2>
            <div className="space-y-6">
              <div className="bg-green-50 rounded-lg p-6">
                <div className="flex items-start">
                  <FaGavel className="w-6 h-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Bidding Rules</h3>
                    <ul className="text-gray-600 space-y-2">
                      <li>• All bids are binding and cannot be retracted</li>
                      <li>• You must have sufficient funds to cover your bid</li>
                      <li>• Bids must be placed before the auction end time</li>
                      <li>• The highest bidder at auction end wins the item</li>
                      <li>• Winners must complete payment within 24 hours</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-6">
                <div className="flex items-start">
                  <FaExclamationTriangle className="w-6 h-6 text-orange-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Auction Violations</h3>
                    <p className="text-gray-600 mb-3">The following actions are prohibited:</p>
                    <ul className="text-gray-600 space-y-2">
                      <li>• Bid manipulation or shill bidding</li>
                      <li>• Creating multiple accounts to bid</li>
                      <li>• Interfering with other users' bidding</li>
                      <li>• Failing to pay for won auctions</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* User Conduct */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">4. User Conduct</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed mb-6">
                You agree to use BidCart in a manner consistent with all applicable laws and regulations. 
                You are prohibited from:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Prohibited Activities</h3>
                  <ul className="text-gray-600 space-y-2">
                    <li>• Posting false or misleading information</li>
                    <li>• Engaging in fraudulent activities</li>
                    <li>• Harassing other users</li>
                    <li>• Violating intellectual property rights</li>
                    <li>• Attempting to hack or disrupt the service</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Content Guidelines</h3>
                  <ul className="text-gray-600 space-y-2">
                    <li>• No offensive or inappropriate content</li>
                    <li>• No spam or unsolicited messages</li>
                    <li>• No copyrighted material without permission</li>
                    <li>• No illegal or prohibited items</li>
                    <li>• Accurate product descriptions required</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Payment Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Payment Terms</h2>
            <div className="bg-purple-50 rounded-lg p-6">
              <div className="flex items-start">
                <FaShoppingCart className="w-6 h-6 text-purple-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Processing</h3>
                  <ul className="text-gray-600 space-y-2">
                    <li>• All payments are processed securely through third-party providers</li>
                    <li>• We accept major credit cards and digital payment methods</li>
                    <li>• Prices are displayed in USD unless otherwise specified</li>
                    <li>• Additional fees (taxes, shipping) will be clearly disclosed</li>
                    <li>• Refunds are subject to our return policy</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Intellectual Property</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                The Service and its original content, features, and functionality are and will remain the 
                exclusive property of BidCart Inc. and its licensors. The Service is protected by copyright, 
                trademark, and other laws.
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">User Content</h3>
                <p className="text-gray-600">
                  By posting content on BidCart, you grant us a non-exclusive, worldwide, royalty-free license 
                  to use, modify, and display your content in connection with the Service.
                </p>
              </div>
            </div>
          </section>

          {/* Disclaimers */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Disclaimers and Limitations</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-start">
                <FaExclamationTriangle className="w-6 h-6 text-yellow-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Disclaimer</h3>
                  <p className="text-gray-600 mb-4">
                    The Service is provided on an "AS IS" and "AS AVAILABLE" basis. BidCart makes no 
                    representations or warranties of any kind, express or implied, as to the operation 
                    of the Service or the information, content, materials, or products included on the Service.
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Limitation of Liability</h3>
                  <p className="text-gray-600">
                    BidCart will not be liable for any damages of any kind arising from the use of the Service, 
                    including but not limited to direct, indirect, incidental, punitive, and consequential damages.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Termination</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                We may terminate or suspend your account and bar access to the Service immediately, without 
                prior notice or liability, under our sole discretion, for any reason whatsoever, including 
                but not limited to a breach of the Terms.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Termination</h3>
                <p className="text-gray-600">
                  If you wish to terminate your account, you may simply discontinue using the Service. 
                  Upon termination, your right to use the Service will cease immediately.
                </p>
              </div>
            </div>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">9. Governing Law</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                These Terms shall be interpreted and governed by the laws of the State of California, 
                without regard to conflict of law provisions.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Any disputes arising from these Terms or your use of the Service will be resolved through 
                binding arbitration in accordance with the rules of the American Arbitration Association.
              </p>
            </div>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">10. Changes to Terms</h2>
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Updates and Modifications</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We reserve the right to modify or replace these Terms at any time. If a revision is material, 
                we will provide at least 30 days notice prior to any new terms taking effect.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section className="border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="space-y-2 text-gray-600">
                <p><strong>Email:</strong> legal@bidcart.com</p>
                <p><strong>Address:</strong> BidCart Inc., 123 E-commerce Street, Tech City, TC 12345</p>
                <p><strong>Phone:</strong> +1 (555) 123-4567</p>
              </div>
            </div>
          </section>
        </div>

        {/* Last Updated */}
        <div className="text-center mt-8 text-gray-500">
          <p>Last updated: January 2024</p>
          <p className="text-sm mt-2">These Terms of Service are effective as of the date listed above.</p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;