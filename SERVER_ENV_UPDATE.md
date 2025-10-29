# Server Environment Variables Update

## Update these on your Render Backend Service:

Go to your **bidcart-backend** service on Render dashboard → Environment tab

### Update these variables:

```
CLIENT_URL = https://bidcartt.onrender.com
NODE_ENV = production
```

### Keep these the same:
```
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

After updating, your backend will automatically redeploy.