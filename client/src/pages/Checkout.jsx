import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { FaLock, FaCreditCard, FaMapMarkerAlt, FaShieldAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';
import PaymentButton from '../components/PaymentButton';

const Checkout = () => {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [orderId, setOrderId] = useState(null);
  const [orderCreated, setOrderCreated] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (cart.length === 0) {
      navigate('/cart');
      return;
    }

    // Pre-fill shipping address if user has one
    if (user.address) {
      setShippingAddress(user.address);
    }
  }, [user, cart, navigate]);

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateShipping = () => {
    return 10.00; // Fixed shipping cost
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;

    const subtotal = calculateSubtotal();
    let discount = 0;

    if (appliedCoupon.type === 'percentage') {
      discount = (subtotal * appliedCoupon.value) / 100;
      if (appliedCoupon.maxDiscount && discount > appliedCoupon.maxDiscount) {
        discount = appliedCoupon.maxDiscount;
      }
    } else if (appliedCoupon.type === 'fixed') {
      discount = appliedCoupon.value;
    }

    return Math.min(discount, subtotal);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const shipping = appliedCoupon?.type === 'free_shipping' ? 0 : calculateShipping();
    const discount = calculateDiscount();
    return subtotal + shipping - discount;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    try {
      const response = await api.post('/coupons/validate', {
        code: couponCode.toUpperCase(),
        orderAmount: calculateSubtotal()
      });

      const coupon = response.data.coupon;
      setAppliedCoupon(coupon);

      // Calculate savings message
      let savingsMessage = 'Coupon applied!';
      if (coupon.type === 'free_shipping') {
        savingsMessage = `Coupon applied! You saved $${calculateShipping().toFixed(2)} on shipping`;
      } else {
        const discount = calculateDiscount();
        if (discount > 0) {
          savingsMessage = `Coupon applied! You saved $${discount.toFixed(2)}`;
        }
      }
      toast.success(savingsMessage);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid coupon code');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Coupon removed');
  };

  const handleInputChange = (setter) => (e) => {
    setter(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const validateForm = () => {
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      toast.error('Please fill in all shipping address fields');
      return false;
    }
    return true;
  };

  const handleCreateOrder = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Validate products before creating order
      for (const item of cart) {
        try {
          const productResponse = await api.get(`/products/${item.productId}`);
          const product = productResponse.data;
          
          if (!product.isActive) {
            toast.error(`${item.name} is no longer available`);
            setLoading(false);
            return;
          }
          
          if (product.mode === 'auction' && product.auction?.status === 'cancelled') {
            toast.error(`${item.name} has been cancelled by admin and cannot be purchased`);
            setLoading(false);
            return;
          }
        } catch (error) {
          toast.error(`Unable to verify product: ${item.name}`);
          setLoading(false);
          return;
        }
      }

      const orderData = {
        products: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          mode: item.mode || 'buy-now'
        })),
        shippingAddress,
        paymentMethod: paymentMethod === 'razorpay' ? 'razorpay' : 'cod',
        totalAmount: calculateTotal(),
        subtotal: calculateSubtotal(),
        shippingCost: appliedCoupon?.type === 'free_shipping' ? 0 : calculateShipping(),
        couponCode: appliedCoupon?.code,
        discount: calculateDiscount()
      };

      const response = await api.post('/orders', orderData);
      console.log('Order creation response:', response);

      if (!response.data?.order?._id) {
        throw new Error('Invalid order ID received from server');
      }

      const newOrderId = response.data.order._id;
      setOrderId(newOrderId);

      // If COD, complete the order immediately
      if (paymentMethod === 'cod') {
        clearCart();
        toast.success('Order placed successfully!');
        setTimeout(() => {
          navigate(`/orders/${newOrderId}`);
        }, 1000);
      } else {
        // For online payment, proceed to payment gateway
        setOrderCreated(true);
        toast.success('Order created! Proceeding to payment...');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create order';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (data) => {
    clearCart();
    toast.success('Payment successful! Redirecting...');
    setTimeout(() => {
      navigate(`/orders/${orderId}`);
    }, 1000);
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    toast.error('Payment failed. Please try again or contact support.');
  };

  if (!user || cart.length === 0) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Secure Checkout</h1>
        <p className="text-gray-600 mt-2">Complete your order safely and securely</p>
        
        {/* Test Mode Banner */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Test Mode:</span> You can use any card details for testing. No real charges will be made.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Checkout Form */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <FaMapMarkerAlt className="text-primary mr-2" />
              <h2 className="text-xl font-semibold">Shipping Address</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">
                  <span className="label-text">Street Address</span>
                </label>
                <input
                  type="text"
                  name="street"
                  value={shippingAddress.street}
                  onChange={handleInputChange(setShippingAddress)}
                  className="input input-bordered w-full"
                  placeholder="123 Main St"
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">City</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={shippingAddress.city}
                  onChange={handleInputChange(setShippingAddress)}
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
                  name="state"
                  value={shippingAddress.state}
                  onChange={handleInputChange(setShippingAddress)}
                  className="input input-bordered w-full"
                  placeholder="NY"
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">ZIP Code</span>
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={shippingAddress.zipCode}
                  onChange={handleInputChange(setShippingAddress)}
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
                  name="country"
                  value={shippingAddress.country}
                  onChange={handleInputChange(setShippingAddress)}
                  className="input input-bordered w-full"
                  placeholder="United States"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <FaCreditCard className="text-primary mr-2" />
              <h2 className="text-xl font-semibold">Payment Method</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="razorpay"
                  checked={paymentMethod === 'razorpay'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="radio radio-primary"
                  disabled={orderCreated}
                />
                <label className="label cursor-pointer">
                  <span className="label-text">Online Payment (Razorpay)</span>
                </label>
              </div>

              <div className="flex items-center space-x-4">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="radio radio-primary"
                  disabled={orderCreated}
                />
                <label className="label cursor-pointer">
                  <span className="label-text">Cash on Delivery</span>
                </label>
              </div>
            </div>

            {paymentMethod === 'razorpay' && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start">
                  <FaShieldAlt className="text-blue-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">Secure Payment</p>
                    <p className="text-sm text-blue-700">
                      Your payment is protected with industry-standard encryption. 
                      We support UPI, Credit/Debit Cards, Net Banking, and Digital Wallets.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'cod' && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  Pay cash when your order is delivered to your doorstep.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            {/* Cart Items */}
            <div className="space-y-3 mb-4">
              {cart.map((item) => (
                <div key={item._id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded mr-3"
                    />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            {/* Coupon Code */}
            <div className="border-t pt-4 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Have a coupon?</label>
              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="input input-bordered flex-1"
                    disabled={orderCreated}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || orderCreated}
                    className="btn btn-primary"
                  >
                    {couponLoading ? 'Applying...' : 'Apply'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <p className="font-semibold text-green-800">{appliedCoupon.code}</p>
                    <p className="text-sm text-green-600">{appliedCoupon.name}</p>
                  </div>
                  {!orderCreated && (
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>
                  {appliedCoupon?.type === 'free_shipping' ? (
                    <span className="text-green-600">FREE</span>
                  ) : (
                    `$${calculateShipping().toFixed(2)}`
                  )}
                </span>
              </div>
              {appliedCoupon && calculateDiscount() > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({appliedCoupon.code}):</span>
                  <span>-${calculateDiscount().toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            {!orderCreated ? (
              <button
                onClick={handleCreateOrder}
                disabled={loading}
                className="btn btn-primary w-full mt-6"
              >
                <FaLock className="mr-2" />
                {loading ? 'Processing...' : paymentMethod === 'cod' ? 'Place Order' : 'Continue to Payment'}
              </button>
            ) : (
              <PaymentButton
                orderId={orderId}
                amount={calculateTotal()}
                paymentMethod={paymentMethod}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout; 