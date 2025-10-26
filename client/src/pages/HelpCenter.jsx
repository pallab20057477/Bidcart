import React, { useState } from 'react';
import { FaSearch, FaQuestionCircle, FaShoppingCart, FaGavel, FaUser, FaCreditCard, FaTruck, FaShieldAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const HelpCenter = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const categories = [
    { id: 'all', name: 'All Topics', icon: FaQuestionCircle },
    { id: 'account', name: 'Account', icon: FaUser },
    { id: 'shopping', name: 'Shopping', icon: FaShoppingCart },
    { id: 'auctions', name: 'Auctions', icon: FaGavel },
    { id: 'payments', name: 'Payments', icon: FaCreditCard },
    { id: 'shipping', name: 'Shipping', icon: FaTruck },
    { id: 'security', name: 'Security', icon: FaShieldAlt }
  ];

  const faqs = [
    {
      id: 1,
      category: 'account',
      question: 'How do I create an account?',
      answer: 'Click on the "Sign Up" button in the top right corner of the homepage. Fill in your details including name, email, and password. You\'ll receive a confirmation email to verify your account.'
    },
    {
      id: 2,
      category: 'account',
      question: 'How do I reset my password?',
      answer: 'On the login page, click "Forgot Password". Enter your email address and we\'ll send you a reset link. Follow the instructions in the email to create a new password.'
    },
    {
      id: 3,
      category: 'shopping',
      question: 'How do I search for products?',
      answer: 'Use the search bar at the top of the page to find specific products. You can also browse by categories or use filters to narrow down your results by price, brand, or other criteria.'
    },
    {
      id: 4,
      category: 'shopping',
      question: 'Can I save items for later?',
      answer: 'Yes! Click the heart icon on any product to add it to your wishlist. You can access your saved items from your account dashboard.'
    },
    {
      id: 5,
      category: 'auctions',
      question: 'How do auctions work?',
      answer: 'Auctions are time-limited sales where you can bid on products. Place your bid before the auction ends. If you have the highest bid when time runs out, you win the item at your bid price.'
    },
    {
      id: 6,
      category: 'auctions',
      question: 'What happens if I win an auction?',
      answer: 'Congratulations! You\'ll receive an email confirmation and the item will be added to your cart. You\'ll need to complete the payment within 24 hours to secure your purchase.'
    },
    {
      id: 7,
      category: 'auctions',
      question: 'Can I cancel my bid?',
      answer: 'Bids are binding and cannot be cancelled once placed. Please make sure you want the item at your bid price before confirming your bid.'
    },
    {
      id: 8,
      category: 'payments',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and various digital wallets. All payments are processed securely.'
    },
    {
      id: 9,
      category: 'payments',
      question: 'Is my payment information secure?',
      answer: 'Yes! We use industry-standard SSL encryption and comply with PCI DSS standards. Your payment information is never stored on our servers.'
    },
    {
      id: 10,
      category: 'shipping',
      question: 'How long does shipping take?',
      answer: 'Shipping times vary by location and shipping method. Standard shipping typically takes 3-7 business days, while express shipping takes 1-3 business days.'
    },
    {
      id: 11,
      category: 'shipping',
      question: 'Can I track my order?',
      answer: 'Yes! Once your order ships, you\'ll receive a tracking number via email. You can also track your orders from your account dashboard.'
    },
    {
      id: 12,
      category: 'security',
      question: 'How do you protect my personal information?',
      answer: 'We use advanced encryption, secure servers, and strict privacy policies to protect your data. We never sell your personal information to third parties.'
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFaq = (faqId) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Help Center</h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-8">
            Find answers to your questions and get the help you need
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-gray-900 rounded-lg text-lg focus:ring-2 focus:ring-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Categories</h2>
            <div className="space-y-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                      activeCategory === category.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* FAQ Content */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                {activeCategory === 'all' ? 'All Questions' : categories.find(c => c.id === activeCategory)?.name}
              </h2>
              <span className="text-gray-500">
                {filteredFaqs.length} {filteredFaqs.length === 1 ? 'result' : 'results'}
              </span>
            </div>

            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12">
                <FaQuestionCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600">Try adjusting your search or browse different categories.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFaqs.map((faq) => (
                  <div key={faq.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</h3>
                      {expandedFaq === faq.id ? (
                        <FaChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      ) : (
                        <FaChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      )}
                    </button>
                    {expandedFaq === faq.id && (
                      <div className="px-6 pb-4">
                        <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is here to help you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Contact Support
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
              Live Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;