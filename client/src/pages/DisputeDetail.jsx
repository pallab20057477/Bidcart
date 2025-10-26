import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import socketService from '../utils/socket';
import { toast } from 'react-hot-toast';
import {
  FaExclamationTriangle,
  FaPaperPlane,
  FaDownload,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaFlag,
  FaComments,
  FaShoppingCart,
  FaBox,
  FaArrowLeft
} from 'react-icons/fa';

const DisputeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dispute, setDispute] = useState(null);

  // Get user info to determine navigation path
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';
  const backPath = isAdmin ? '/admin/disputes' : '/disputes';
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch dispute data
  const loadDisputeData = useCallback(async () => {
    try {
      const response = await api.get(`/disputes/${id}`);
      setDispute(response.data);
    } catch (error) {
      toast.error('Failed to fetch dispute details');
      navigate(backPath);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, backPath]);

  // Socket.IO event handlers
  const handleNewMessage = useCallback((data) => {
    if (data.disputeId === id) {
      setDispute(prev => ({
        ...prev,
        messages: [...prev.messages, data.message]
      }));
      scrollToBottom();
    }
  }, [id]);

  const handleStatusChange = useCallback((data) => {
    if (data.disputeId === id) {
      setDispute(prev => ({
        ...prev,
        status: data.status
      }));
      toast.success(`Dispute status changed to ${data.status.replace('_', ' ')}`);
    }
  }, [id]);

  const handleDisputeResolved = useCallback((data) => {
    if (data.disputeId === id) {
      setDispute(prev => ({
        ...prev,
        status: 'resolved',
        resolution: data.resolution,
        resolutionNotes: data.resolutionNotes
      }));
      toast.success('Dispute has been resolved');
    }
  }, [id]);

  const handleDisputeEscalated = useCallback((data) => {
    if (data.disputeId === id) {
      setDispute(prev => ({
        ...prev,
        status: 'escalated',
        escalationReason: data.escalationReason
      }));
      toast('Dispute has been escalated for further review');
    }
  }, [id]);

  const handleTypingIndicator = useCallback((data) => {
    if (data.disputeId === id && data.userId !== JSON.parse(localStorage.getItem('user') || '{}')._id) {
      setTypingUsers(prev => {
        if (data.isTyping) {
          return [...prev.filter(u => u.userId !== data.userId), { userId: data.userId, userName: data.userName }];
        } else {
          return prev.filter(u => u.userId !== data.userId);
        }
      });
    }
  }, [id]);

  useEffect(() => {
    loadDisputeData();

    // Initialize Socket.IO connection
    socketService.connect();

    // Join dispute room for real-time updates
    if (id) {
      socketService.joinDispute(id);
    }

    // Set up Socket.IO event listeners
    socketService.onDisputeMessageReceived(handleNewMessage);
    socketService.onDisputeStatusChanged(handleStatusChange);
    socketService.onDisputeResolved(handleDisputeResolved);
    socketService.onDisputeEscalated(handleDisputeEscalated);
    socketService.onTypingIndicator(handleTypingIndicator);

    // Cleanup on unmount
    return () => {
      if (id) {
        socketService.leaveDispute(id);
      }
      socketService.offDisputeMessageReceived();
      socketService.offDisputeStatusChanged();
      socketService.offDisputeResolved();
      socketService.offDisputeEscalated();
      socketService.offTypingIndicator();
    };
  }, [id, loadDisputeData, handleNewMessage, handleStatusChange, handleDisputeResolved, handleDisputeEscalated, handleTypingIndicator]);

  // Auto-scroll to bottom when messages change, but only if user is already at bottom
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [dispute?.messages, isAtBottom]);

  // Initialize scroll position when messages first load
  useEffect(() => {
    if (dispute?.messages?.length > 0 && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isBottom = scrollTop + clientHeight >= scrollHeight - 20;
      setIsAtBottom(isBottom);

      if (isBottom || scrollTop === 0) {
        setTimeout(() => scrollToBottom(), 100);
      }
    }
  }, [dispute?.messages?.length]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isBottom = scrollTop + clientHeight >= scrollHeight - 20;
    setIsAtBottom(isBottom);
  };

  const handleTyping = (message) => {
    setNewMessage(message);

    if (!isTyping) {
      setIsTyping(true);
      socketService.sendTypingIndicator(id, true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketService.sendTypingIndicator(id, false);
    }, 1000);
  };
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSending(true);

    try {
      await api.post(`/disputes/${id}/messages`, {
        message: newMessage
      });

      setNewMessage('');
      toast.success('Message sent successfully');
      loadDisputeData();
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };



  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <FaExclamationTriangle className="text-amber-500" />;
      case 'under_review':
        return <FaHourglassHalf className="text-blue-500" />;
      case 'resolved':
        return <FaCheckCircle className="text-green-500" />;
      case 'closed':
        return <FaTimesCircle className="text-gray-500" />;
      case 'escalated':
        return <FaFlag className="text-red-500" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'open':
        return 'bg-amber-100 text-amber-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'escalated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      delivery_issue: 'Delivery Issue',
      fake_bidding: 'Fake Bidding',
      item_not_as_described: 'Item Not As Described',
      payment_issue: 'Payment Issue',
      refund_request: 'Refund Request',
      seller_misconduct: 'Seller Misconduct',
      buyer_misconduct: 'Buyer Misconduct',
      technical_issue: 'Technical Issue',
      other: 'Other'
    };
    return labels[category] || category;
  };
  const getResolutionLabel = (resolution) => {
    const labels = {
      refund_full: 'Full Refund',
      refund_partial: 'Partial Refund',
      replacement: 'Replacement',
      compensation: 'Compensation',
      warning_issued: 'Warning Issued',
      account_suspended: 'Account Suspended',
      dispute_dismissed: 'Dispute Dismissed',
      mediation_required: 'Mediation Required'
    };
    return labels[resolution] || resolution;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Dispute not found</h2>
        <button
          onClick={() => navigate(backPath)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to {isAdmin ? 'Admin Disputes' : 'Disputes'}
        </button>
      </div>
    );
  } return (

    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(backPath)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mb-6"
          >
            <FaArrowLeft className="mr-2 w-4 h-4" />
            Back to {isAdmin ? 'Admin Disputes' : 'Disputes'}
          </button>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  {getStatusIcon(dispute.status)}
                  <h1 className="text-3xl font-bold text-gray-900">{dispute.title}</h1>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span className="font-mono">#{dispute.disputeId}</span>
                  <span>•</span>
                  <span>Created {formatDate(dispute.createdAt)}</span>
                  <span>•</span>
                  <span className="capitalize">{getCategoryLabel(dispute.category)}</span>
                </div>
                <p className="text-gray-700 leading-relaxed">{dispute.description}</p>
              </div>

              <div className="flex flex-col gap-2 ml-6">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(dispute.status)}`}>
                  {dispute.status.replace('_', ' ').toUpperCase()}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${dispute.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                  dispute.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    dispute.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                  }`}>
                  {dispute.priority?.toUpperCase() || 'MEDIUM'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Resolution Info */}
            {dispute.status === 'resolved' && dispute.resolution && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <FaCheckCircle className="text-green-600 w-6 h-6" />
                  <h3 className="text-lg font-semibold text-green-900">Dispute Resolved</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-green-800">
                    <span className="font-medium">Resolution:</span> {getResolutionLabel(dispute.resolution)}
                  </p>
                  {dispute.resolutionAmount && (
                    <p className="text-green-800">
                      <span className="font-medium">Amount:</span> ${dispute.resolutionAmount}
                    </p>
                  )}
                  {dispute.resolutionNotes && (
                    <p className="text-green-800">
                      <span className="font-medium">Notes:</span> {dispute.resolutionNotes}
                    </p>
                  )}
                  <p className="text-sm text-green-600">
                    Resolved by {(() => {
                      // WhatsApp-like privacy: Users see "Admin", Admins see actual names
                      if (isAdmin) {
                        // Admin sees actual resolver name
                        return dispute.resolvedBy?.name || 'Admin';
                      } else {
                        // Regular users always see "Admin" for resolved disputes
                        return 'Admin';
                      }
                    })()} on {formatDate(dispute.resolvedAt)}
                  </p>
                </div>
              </div>
            )}
            {/* Messages */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <FaComments className="text-blue-600" />
                    Messages ({dispute.messages?.length || 0})
                  </h2>
                  {dispute.messages?.length > 0 && (
                    <div className="text-sm text-gray-500">
                      Scroll to see all messages
                    </div>
                  )}
                </div>
              </div>

              {/* Scrollable Messages Container */}
              <div className="relative">
                <div
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="h-96 overflow-y-auto border-b border-gray-200"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: '#D1D5DB #F3F4F6' }}
                >
                  {/* Scroll indicator gradient */}
                  <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none z-10"></div>

                  <div className="p-6">
                    <div className="space-y-4">
                      {dispute.messages?.length > 0 ? (
                        dispute.messages.map((message, index) => (
                          <div key={index} className={`border-l-4 p-4 rounded-r-lg ${message.sender?.role === 'admin'
                            ? 'border-green-500 bg-green-50'
                            : 'border-blue-500 bg-gray-50'
                            }`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${message.sender?.role === 'admin' ? 'bg-green-600' : 'bg-blue-600'
                                  }`}>
                                  <span className="text-white text-sm font-medium">
                                    {(() => {
                                      if (isAdmin) {
                                        // Admin sees everyone's actual initials
                                        return message.sender?.name?.charAt(0) || 'U';
                                      } else {
                                        // Regular users see "A" for admin, actual initials for others
                                        if (message.sender?.role === 'admin') {
                                          return 'A';
                                        } else {
                                          return message.sender?.name?.charAt(0) || 'U';
                                        }
                                      }
                                    })()}
                                  </span>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">
                                      {(() => {
                                        // WhatsApp-like naming: Users see "Admin", Admins see actual names
                                        if (isAdmin) {
                                          // Admin sees everyone's actual names
                                          return message.sender?.name || 'Unknown User';
                                        } else {
                                          // Regular users see "Admin" for admin messages, actual names for others
                                          if (message.sender?.role === 'admin') {
                                            return 'Admin';
                                          } else {
                                            return message.sender?.name || 'Unknown User';
                                          }
                                        }
                                      })()}
                                    </span>
                                    {message.sender?.role === 'admin' && (
                                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center" title="Official Support">
                                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-sm text-gray-500 ml-2">{formatDate(message.createdAt)}</span>
                                </div>
                              </div>
                            </div>

                            <p className="text-gray-700 mb-3 ml-13 leading-relaxed">{message.message}</p>
                            {message.attachments?.length > 0 && (
                              <div className="ml-13 grid grid-cols-1 md:grid-cols-2 gap-3">
                                {message.attachments.map((attachment, attIndex) => (
                                  <div key={attIndex} className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                                    {attachment.type === 'image' ? (
                                      <img
                                        src={attachment.url}
                                        alt={attachment.originalName}
                                        className="w-12 h-12 object-cover rounded"
                                      />
                                    ) : (
                                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                                        <FaBox className="text-gray-500 w-6 h-6" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{attachment.originalName}</p>
                                      <p className="text-xs text-gray-500">{formatFileSize(attachment.size || 0)}</p>
                                    </div>
                                    <a
                                      href={attachment.url}
                                      download
                                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                    >
                                      <FaDownload className="w-4 h-4" />
                                    </a>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-16 text-gray-500">
                          <FaComments className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                          <p className="text-sm">Start the conversation by sending a message below</p>
                        </div>
                      )}

                      {/* Typing Indicator */}
                      {typingUsers.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 italic">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span>
                            {typingUsers.length === 1
                              ? `${(() => {
                                const user = typingUsers[0];
                                if (isAdmin) {
                                  return user.userName;
                                } else {
                                  // Check if the typing user is admin (you might need to add role info to typing data)
                                  return user.userRole === 'admin' ? 'Admin' : user.userName;
                                }
                              })()} is typing...`
                              : `${typingUsers.length} people are typing...`
                            }
                          </span>
                        </div>
                      )}

                      {/* Scroll anchor */}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                </div>
                {/* Scroll to bottom button */}
                {!isAtBottom && dispute.messages?.length > 0 && (
                  <button
                    onClick={scrollToBottom}
                    className="absolute bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-20"
                    title="Scroll to bottom"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </button>
                )}
              </div>

              {/* New Message Form */}
              {dispute.status !== 'resolved' && dispute.status !== 'closed' && (
                <div className="p-6 bg-gray-50">
                  <form onSubmit={handleSendMessage} className="space-y-4">
                    <div>
                      <textarea
                        value={newMessage}
                        onChange={(e) => handleTyping(e.target.value)}
                        placeholder="Type your message here..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {sending ? (
                          <>
                            <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <FaPaperPlane className="mr-2 w-4 h-4" />
                            Send Message
                          </>
                        )}
                      </button>
                    </div>

                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Parties */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dispute Participants</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">Complainant</span>
                  </div>
                  <div className="ml-5">
                    <p className="font-medium text-gray-900">{dispute.complainant?.name || 'Unknown User'}</p>
                    <p className="text-sm text-gray-500">{dispute.complainant?.email || 'No email'}</p>
                  </div>
                </div>

                {/* Only show respondent if one exists */}
                {dispute.respondent && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Other Party</span>
                    </div>
                    <div className="ml-5">
                      <p className="font-medium text-gray-900">{dispute.respondent.name}</p>
                      <p className="text-sm text-gray-500">{dispute.respondent.email}</p>
                      <p className="text-xs text-gray-400 mt-1">{dispute.respondent.role || 'User'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Related Items */}
            {(dispute.order || dispute.product) && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Items</h3>
                <div className="space-y-4">
                  {dispute.order && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FaShoppingCart className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700">Order</span>
                      </div>
                      <div className="ml-6">
                        <p className="font-medium text-gray-900">{dispute.order.orderNumber}</p>
                        <p className="text-sm text-gray-500">${dispute.order.totalAmount} • {dispute.order.status}</p>
                      </div>
                    </div>
                  )}

                  {dispute.product && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FaBox className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-medium text-gray-700">Product</span>
                      </div>
                      <div className="ml-6">
                        <p className="font-medium text-gray-900">{dispute.product?.name || 'Product not found'}</p>
                        <p className="text-sm text-gray-500">${dispute.product?.price || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Evidence */}
            {dispute.evidence?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Evidence ({dispute.evidence.length})</h3>
                <div className="space-y-3">
                  {dispute.evidence.map((evidence, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      {evidence.type === 'image' ? (
                        <img
                          src={evidence.url}
                          alt={evidence.originalName}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                          <FaBox className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{evidence.originalName}</p>
                        <p className="text-xs text-gray-500">
                          {evidence.uploadedBy?.name || 'Unknown'} • {formatDate(evidence.uploadedAt)}
                        </p>
                      </div>
                      <a
                        href={evidence.url}
                        download
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      >
                        <FaDownload className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisputeDetail;