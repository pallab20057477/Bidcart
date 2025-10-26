import { useState } from 'react';
import { FaLock, FaCreditCard, FaMoneyBillWave } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const PaymentButton = ({ orderId, amount, onSuccess, onError, paymentMethod = 'razorpay' }) => {
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            // Check if Razorpay is already loaded
            if (window.Razorpay) {
                console.log('Razorpay script already loaded');
                resolve(true);
                return;
            }

            console.log('Loading Razorpay script...');
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => {
                console.log('Razorpay script loaded successfully');
                resolve(true);
            };
            script.onerror = () => {
                console.error('Failed to load Razorpay script');
                resolve(false);
            };
            document.body.appendChild(script);
        });
    };

    const handleRazorpayPayment = async () => {
        try {
            setLoading(true);
            console.log('Starting Razorpay payment process...');

            // Load Razorpay script
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                toast.error('Failed to load payment gateway. Please try again.');
                setLoading(false);
                return;
            }

            console.log('Creating payment order for:', { orderId, amount });

            // Create payment order
            let response;
            try {
                response = await api.post('/payments/create-order', {
                    orderId,
                    amount,
                    currency: 'INR'
                });
            } catch (apiError) {
                console.error('API Error:', apiError);
                throw new Error(`Failed to create payment order: ${apiError.response?.data?.message || apiError.message}`);
            }

            const { data } = response;
            console.log('Payment order response:', data);

            if (!data || !data.success) {
                throw new Error(data?.message || 'Failed to create payment order');
            }

            // Validate Razorpay key
            const razorpayKey = process.env.REACT_APP_RAZORPAY_KEY_ID;
            if (!razorpayKey) {
                toast.error('Payment gateway not configured. Please contact support.');
                setLoading(false);
                return;
            }

            // Check if we're in mock mode (server returned mock order)
            if (data.isMock) {
                console.log('Test payment mode detected - showing Razorpay form with test credentials');
                toast('🧪 Test Mode: Use any test card details', {
                    duration: 6000,
                    position: 'top-center',
                    style: {
                        background: '#3B82F6',
                        color: 'white',
                    }
                });
            }

            // Initialize Razorpay
            const options = {
                key: razorpayKey,
                amount: data.amount,
                currency: data.currency,
                name: 'BidCart',
                description: data.isMock ? '🧪 Test Payment - Use Any Card Details' : 'Order Payment',
                order_id: data.razorpayOrderId,
                handler: async function (response) {
                    try {
                        // For mock mode, use mock payment data
                        const paymentData = data.isMock ? {
                            orderId,
                            razorpayOrderId: data.razorpayOrderId,
                            razorpayPaymentId: `pay_mock_${Date.now()}`,
                            razorpaySignature: 'mock_signature_test'
                        } : {
                            orderId,
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature
                        };

                        // Verify payment
                        const result = await api.post('/payments/verify', paymentData);

                        if (result.data.success) {
                            toast.success(data.isMock ? '🎉 Test payment successful!' : '🎉 Payment successful!');
                            if (onSuccess) onSuccess(result.data);
                        } else {
                            throw new Error('Payment verification failed');
                        }
                    } catch (error) {
                        console.error('Payment verification error:', error);
                        toast.error('Payment verification failed');
                        if (onError) onError(error);
                    } finally {
                        setLoading(false);
                    }
                },
                prefill: {
                    name: user?.name || 'Test User',
                    email: user?.email || 'test@example.com',
                    contact: user?.phone || '9999999999'
                },
                theme: {
                    color: data.isMock ? '#10B981' : '#3B82F6' // Green for test mode
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                        toast('Payment cancelled');
                    }
                }
            };

            // Add test card information for mock mode
            if (data.isMock) {
                console.log('🧪 Test Mode - Any card details will work:');
                console.log('Card Number: 4111 1111 1111 1111 (or any)');
                console.log('Expiry: Any future date (e.g., 12/25)');
                console.log('CVV: Any 3 digits (e.g., 123)');
            }

            // Check if Razorpay is available
            if (!window.Razorpay) {
                toast.error('Payment gateway not loaded. Please refresh and try again.');
                setLoading(false);
                return;
            }

            console.log('Initializing Razorpay with options:', options);
            const rzp = new window.Razorpay(options);

            rzp.on('payment.failed', async function (response) {
                console.error('❌ Razorpay Payment Failed:', response.error);
                console.error('Error Code:', response.error.code);
                console.error('Error Description:', response.error.description);
                console.error('Error Reason:', response.error.reason);
                console.error('Full Error Object:', JSON.stringify(response.error, null, 2));

                // Record payment failure
                try {
                    await api.post('/payments/failed', {
                        orderId,
                        error: {
                            code: response.error.code,
                            description: response.error.description,
                            reason: response.error.reason,
                            source: response.error.source,
                            step: response.error.step,
                            metadata: response.error.metadata
                        }
                    });
                } catch (err) {
                    console.error('Error recording payment failure:', err);
                }

                // Show user-friendly error message
                let userMessage = 'Payment failed';
                if (response.error.description) {
                    userMessage = response.error.description;
                } else if (response.error.reason) {
                    userMessage = response.error.reason;
                }

                toast.error(`❌ ${userMessage}`, { duration: 6000 });
                if (onError) onError(response.error);
                setLoading(false);
            });

            console.log('Opening Razorpay payment form...');
            
            try {
                rzp.open();
            } catch (rzpError) {
                console.error('Razorpay open error:', rzpError);
                toast.error('Failed to open payment form. Please check your internet connection.');
                setLoading(false);
                return;
            }
        } catch (error) {
            console.error('Payment error:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            
            // Handle specific error types
            let errorMessage = 'Payment failed. Please try again.';
            
            if (error.response?.status === 404) {
                errorMessage = 'Order not found. Please refresh and try again.';
            } else if (error.response?.status === 500) {
                errorMessage = 'Server error. Please try again or contact support.';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            // Show detailed error in console for debugging
            console.log('📋 Error Summary:', {
                orderId,
                amount,
                errorMessage,
                fullError: error
            });
            
            toast.error(errorMessage, { duration: 5000 });
            if (onError) onError(error);
            setLoading(false);
        }
    };

    const handleCODPayment = async () => {
        try {
            setLoading(true);

            // Process COD payment
            const { data } = await api.post('/payments/cod', { orderId });

            if (data.success) {
                toast.success('Order placed successfully! Pay on delivery.');
                if (onSuccess) onSuccess(data);
            } else {
                throw new Error('Failed to process COD order');
            }
        } catch (error) {
            console.error('COD error:', error);
            toast.error(error.message || 'Failed to process order');
            if (onError) onError(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = () => {
        if (paymentMethod === 'razorpay' || paymentMethod === 'card') {
            handleRazorpayPayment();
        } else if (paymentMethod === 'cod') {
            handleCODPayment();
        } else {
            toast.error('Invalid payment method');
        }
    };

    return (
        <button
            onClick={handlePayment}
            disabled={loading}
            className="btn btn-primary w-full btn-lg gap-2 shadow-md hover:shadow-lg transition-all duration-300"
        >
            {loading ? (
                <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Processing...
                </>
            ) : (
                <>
                    {paymentMethod === 'cod' ? (
                        <>
                            <FaMoneyBillWave />
                            Place Order (COD)
                        </>
                    ) : (
                        <>
                            <FaLock />
                            <FaCreditCard />
                            Pay Now
                        </>
                    )}
                </>
            )}
        </button>
    );
};

export default PaymentButton;
