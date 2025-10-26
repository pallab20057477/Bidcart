import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useSocket } from '../../contexts/SocketContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FaGavel, FaClock, FaTrophy, FaUser } from 'react-icons/fa';
import Countdown from 'react-countdown';

const BiddingInterface = ({ product, onBidPlaced }) => {
    const { user, isAuthenticated } = useAuth();
    const { addToCart } = useCart();
    const { socket, connected, joinAuction, leaveAuction } = useSocket();

    const [bids, setBids] = useState([]);
    const [currentBid, setCurrentBid] = useState(0);
    const [bidAmount, setBidAmount] = useState('');
    const [bidding, setBidding] = useState(false);
    const [loading, setLoading] = useState(true);

    // Join auction room and set up real-time listeners
    useEffect(() => {
        if (product?.mode === 'auction' && socket && connected) {
            console.log('🔌 Joining auction room for product:', product._id);
            joinAuction(product._id);
            fetchBids();

            // Listen for real-time bid updates
            const handleBidUpdate = (data) => {
                console.log('📈 Received bid update:', data);
                if (data.productId === product._id) {
                    setCurrentBid(data.currentBid);
                    setBidAmount(data.currentBid + product.auction.minBidIncrement);
                    fetchBids(); // Refresh bid history

                    // Show toast notification for other users' bids
                    if (data.bidder !== user?.name) {
                        toast.success(`New bid: $${data.currentBid} by ${data.bidder}`, {
                            duration: 3000,
                            icon: '💰'
                        });
                    }
                }
            };

            const handleAuctionEnded = (data) => {
                console.log('🏁 Auction ended:', data);
                if (data.productId === product._id) {
                    fetchBids(); // Refresh to show final state

                    if (data.winnerId === user?.id || data.winner === user?.name) {
                        const wonProduct = {
                            ...product,
                            price: data.finalBid || data.currentBid,
                            quantity: 1,
                            isAuctionWin: true
                        };

                        addToCart(wonProduct);
                        toast.success('🎉 Congratulations! You won the auction!', {
                            duration: 6000
                        });
                    } else {
                        toast(`🏆 Auction ended! Winner: ${data.winner}`, {
                            duration: 5000
                        });
                    }
                }
            };

            socket.on('bid-update', handleBidUpdate);
            socket.on('auction-ended', handleAuctionEnded);

            return () => {
                console.log('🔌 Leaving auction room for product:', product._id);
                leaveAuction(product._id);
                socket.off('bid-update', handleBidUpdate);
                socket.off('auction-ended', handleAuctionEnded);
            };
        } else if (product?.mode === 'auction') {
            // Fallback: fetch bids even without socket connection
            fetchBids();
        }
    }, [product, socket, connected, user, addToCart, joinAuction, leaveAuction]);

    useEffect(() => {
        if (product?.auction) {
            setCurrentBid(product.auction.currentBid || product.auction.startingBid);
            setBidAmount((product.auction.currentBid || product.auction.startingBid) + product.auction.minBidIncrement);
        }
    }, [product]);

    const fetchBids = async () => {
        try {
            const response = await api.get(`/bids/product/${product._id}`);
            setBids(response.data || []);
        } catch (error) {
            console.error('Error fetching bids:', error);
            setBids([]);
        } finally {
            setLoading(false);
        }
    };

    const handleBid = async (e) => {
        e.preventDefault();

        if (!isAuthenticated) {
            toast.error('Please login to place a bid');
            return;
        }

        const amount = parseFloat(bidAmount);
        if (amount <= currentBid) {
            toast.error('Bid must be higher than current bid');
            return;
        }

        setBidding(true);
        try {
            const response = await api.post('/bids', {
                productId: product._id,
                amount: amount
            });

            if (response.data.message) {
                toast.success('Bid placed successfully!');

                // Update local state immediately for better UX
                setCurrentBid(amount);
                setBidAmount(amount + product.auction.minBidIncrement);

                // Server will emit socket event to all users in the room
                // No need to emit from client side

                // Refresh bid history
                fetchBids();

                if (onBidPlaced) onBidPlaced(amount);
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to place bid';
            toast.error(message);
        } finally {
            setBidding(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    };

    const isAuctionActive = () => {
        if (product?.mode !== 'auction') return false;
        const now = new Date();
        const startTime = new Date(product.auction.startTime);
        const endTime = new Date(product.auction.endTime);
        return startTime <= now && endTime > now && product.auction.status === 'active';
    };

    const isAuctionScheduled = () => {
        if (product?.mode !== 'auction') return false;
        const now = new Date();
        const startTime = new Date(product.auction.startTime);
        return startTime > now && product.auction.status === 'scheduled';
    };

    const isAuctionEnded = () => {
        if (product?.mode !== 'auction') return false;
        const now = new Date();
        const endTime = new Date(product.auction.endTime);
        return endTime <= now || product.auction.status === 'ended';
    };

    const getHighestBidder = () => {
        if (bids.length === 0) return null;
        return bids.reduce((highest, bid) =>
            bid.amount > highest.amount ? bid : highest
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Socket Connection Status */}
            {!connected && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center text-yellow-800 text-sm">
                        <FaClock className="mr-2" />
                        <span>Real-time updates unavailable. Refresh page to see latest bids.</span>
                    </div>
                </div>
            )}


            {/* Auction Status Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                        <FaGavel className="mr-2 text-blue-600" />
                        Auction Details
                        {connected && (
                            <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live updates enabled"></div>
                        )}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${isAuctionActive() ? 'bg-green-100 text-green-800' :
                        isAuctionScheduled() ? 'bg-blue-100 text-blue-800' :
                            isAuctionEnded() ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {isAuctionActive() ? 'Live Auction' :
                            isAuctionScheduled() ? 'Scheduled' :
                                isAuctionEnded() ? 'Ended' : 'Unknown'}
                    </span>
                </div>

                {/* Bid Information */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="text-2xl font-bold text-green-800 mb-1">
                            {formatPrice(currentBid)}
                        </div>
                        <div className="text-sm text-green-600">Current Highest Bid</div>
                        {connected && (
                            <div className="text-xs text-green-500 mt-1">● Live updates</div>
                        )}
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="text-2xl font-bold text-blue-800 mb-1">
                            {formatPrice(product.auction.startingBid)}
                        </div>
                        <div className="text-sm text-blue-600">Starting Bid</div>
                    </div>
                </div>

                {/* Countdown Timer */}
                {isAuctionActive() && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <FaClock className="mr-2 text-orange-600" />
                                <span className="font-medium text-gray-900">Time Remaining:</span>
                            </div>
                            <Countdown
                                date={new Date(product.auction.endTime)}
                                renderer={({ days, hours, minutes, seconds, completed }) => {
                                    if (completed) {
                                        return <span className="text-red-600 font-bold">Auction Ended</span>;
                                    }
                                    return (
                                        <div className="flex gap-2 text-sm font-mono">
                                            {days > 0 && <span className="bg-white px-2 py-1 rounded border">{days}d</span>}
                                            <span className="bg-white px-2 py-1 rounded border">{hours}h</span>
                                            <span className="bg-white px-2 py-1 rounded border">{minutes}m</span>
                                            <span className="bg-white px-2 py-1 rounded border">{seconds}s</span>
                                        </div>
                                    );
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Scheduled Auction */}
                {isAuctionScheduled() && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <FaClock className="mr-2 text-blue-600" />
                                <span className="font-medium text-gray-900">Starts in:</span>
                            </div>
                            <Countdown
                                date={new Date(product.auction.startTime)}
                                renderer={({ days, hours, minutes, seconds, completed }) => {
                                    if (completed) {
                                        return <span className="text-green-600 font-bold">Starting Now!</span>;
                                    }
                                    return (
                                        <div className="flex gap-2 text-sm font-mono">
                                            {days > 0 && <span className="bg-white px-2 py-1 rounded border">{days}d</span>}
                                            <span className="bg-white px-2 py-1 rounded border">{hours}h</span>
                                            <span className="bg-white px-2 py-1 rounded border">{minutes}m</span>
                                            <span className="bg-white px-2 py-1 rounded border">{seconds}s</span>
                                        </div>
                                    );
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Auction Ended */}
                {isAuctionEnded() && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="font-semibold text-lg mb-3 flex items-center text-gray-900">
                            <FaTrophy className="mr-2 text-yellow-600" />
                            Auction Concluded
                        </h4>
                        {product.auction.winner ? (
                            <div className="bg-white rounded-lg p-4 border">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Winner</div>
                                        <div className="text-lg font-semibold text-gray-900">
                                            {product.auction.winner.name}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Winning Bid</div>
                                        <div className="text-lg font-semibold text-green-600">
                                            {formatPrice(product.auction.currentBid)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <div className="text-gray-500">No bids were placed on this auction</div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bidding Form */}
            {isAuctionActive() && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                        <FaGavel className="mr-2 text-blue-600" />
                        Place Your Bid
                        {connected && (
                            <div className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                Live
                            </div>
                        )}
                    </h3>

                    <form onSubmit={handleBid} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Bid Amount
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 font-medium">$</span>
                                </div>
                                <input
                                    type="number"
                                    value={bidAmount}
                                    onChange={(e) => setBidAmount(e.target.value)}
                                    min={currentBid + product.auction.minBidIncrement}
                                    step="0.01"
                                    className="w-full pl-8 pr-3 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div className="mt-2 text-sm text-gray-500">
                                Minimum bid: {formatPrice(currentBid + product.auction.minBidIncrement)}
                            </div>
                        </div>

                        {/* Quick Bid Buttons */}
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setBidAmount(currentBid + product.auction.minBidIncrement)}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                            >
                                Min Bid
                                <div className="text-xs text-gray-600">
                                    {formatPrice(currentBid + product.auction.minBidIncrement)}
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setBidAmount(currentBid + (product.auction.minBidIncrement * 2))}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                            >
                                +{formatPrice(product.auction.minBidIncrement)}
                            </button>
                            <button
                                type="button"
                                onClick={() => setBidAmount(currentBid + (product.auction.minBidIncrement * 5))}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-3 rounded-lg transition-colors text-sm"
                            >
                                +{formatPrice(product.auction.minBidIncrement * 4)}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={bidding || !bidAmount || parseFloat(bidAmount) <= currentBid}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {bidding ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Placing Bid...
                                </>
                            ) : (
                                <>
                                    <FaGavel className="mr-2" />
                                    Place Bid Now
                                </>
                            )}
                        </button>
                    </form>

                    {/* Current Leader */}
                    {getHighestBidder() && (
                        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                                        <FaUser className="text-white text-sm" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-green-600 font-medium">Current Leader</div>
                                        <div className="font-semibold text-gray-900">
                                            {getHighestBidder().bidder.name}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-green-600">
                                        {formatPrice(getHighestBidder().amount)}
                                    </div>
                                    <div className="text-sm text-green-600">Leading Bid</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BiddingInterface;