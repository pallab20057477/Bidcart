# URGENT: Set These Environment Variables on Render Backend

## Go to your Render backend service dashboard:
https://dashboard.render.com/web/srv-d3v2sfv5r7bs73ftt7gg

## Navigate to Environment Variables:
1. Click on your backend service
2. Go to "Environment" tab (left sidebar)
3. Add these variables:

### Required Variables:
```
CLIENT_URL = https://bidcartt.onrender.com
NODE_ENV = production
PORT = 5000
MONGODB_URI = mongodb+srv://pallabdaspallab2005_db_user:tHYsCtxoGQJh3Fq3@cluster0.izfqn21.mongodb.net/bidcart?retryWrites=true&w=majority
JWT_SECRET = 31e47b297b53a3dac035b90386576c4be8333c7c86c31471fefa3c9ce4e8c263
CLOUDINARY_CLOUD_NAME = dgq9gkpik
CLOUDINARY_API_KEY = 484475958613671
CLOUDINARY_API_SECRET = _6-p94_v42Gy0arBeXYSqX2bGSs
RAZORPAY_KEY_ID = rzp_test_1DP5mmOlF5G5ag
RAZORPAY_KEY_SECRET = THzEB2sjWMsJULlpy6L8PgtM
RAZORPAY_WEBHOOK_SECRET = webhook_secret_test
```

## After adding variables:
1. Click "Save Changes"
2. Backend will automatically redeploy
3. Wait 2-3 minutes for redeploy to complete

## Test after redeploy:
1. Visit: https://bidcart-backend.onrender.com/
2. Try login at: https://bidcartt.onrender.com