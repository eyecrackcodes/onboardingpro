# Production Deployment Guide

## URL Access for Candidates

### Current Setup
The application generates URLs like:
- Offer signing: `http://localhost:3000/offer/[candidateId]`
- I9 forms: `http://localhost:3000/i9/[candidateId]`

### Production Setup (Vercel)

When deployed to Vercel, these URLs will automatically work with your production domain:
- Offer signing: `https://your-domain.vercel.app/offer/[candidateId]`
- I9 forms: `https://your-domain.vercel.app/i9/[candidateId]`

### Configuration Steps

1. **Environment Variables**
   Add these to your Vercel project settings:
   ```
   SENDGRID_API_KEY=your_sendgrid_key
   IBR_API_USERNAME=your_ibr_username
   IBR_API_PASSWORD=your_ibr_password
   IBR_MOCK_MODE=false
   ```

2. **Update Firebase**
   - Add your production domain to Firebase authorized domains
   - Go to Firebase Console → Authentication → Settings → Authorized domains
   - Add `your-domain.vercel.app`

3. **Update CORS for Firebase Storage**
   Run this command with your production domain:
   ```bash
   gsutil cors set cors.json gs://onboarding-tracker-c16cc.firebasestorage.app
   ```
   
   Update `cors.json` to include:
   ```json
   {
     "origin": ["https://your-domain.vercel.app", "http://localhost:3000"],
     "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
     "maxAgeSeconds": 3600,
     "responseHeader": ["Content-Type", "Authorization"]
   }
   ```

4. **Email Links**
   The system automatically uses `window.location.origin` so emails will contain the correct production URLs.

### Security Considerations

1. **Public Pages** (No authentication required):
   - `/offer/[id]` - Candidates can sign offers
   - `/i9/[id]` - Candidates can complete I9 forms

2. **Protected Pages** (Authentication required):
   - All admin pages
   - Candidate management pages
   - Document repository

### Testing Production URLs

After deployment:
1. Create a test candidate
2. Send an offer or I9 form
3. Check that the email contains the production URL
4. Verify the candidate can access and complete the form

### Custom Domain

To use a custom domain:
1. Add domain in Vercel project settings
2. Update DNS records as instructed by Vercel
3. Update Firebase authorized domains
4. Update CORS configuration

### SSL/HTTPS
Vercel automatically provides SSL certificates for all deployments, ensuring secure connections for candidates. 