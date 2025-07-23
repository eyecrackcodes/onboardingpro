# IBR Credentials Update

## Issue Found

The IBR API is working correctly, but it's rejecting the credentials we provided. The API response shows:

```xml
<ERROR>Invalid username [ApAttonLL]</ERROR>
```

## Solution

The IBR documentation shows test credentials for the development environment:

- **Username**: `test1`
- **Password**: `pass1`

I've already updated the default credentials in the code to use these test values.

## Options for Moving Forward

### Option 1: Use Test Credentials (Recommended for Development)

The code now uses `test1` / `pass1` as defaults. This should work with the IBR development API.

### Option 2: Use Your Actual Credentials

If you have valid IBR credentials:

1. Create a `.env.local` file in your project root (if not already exists)
2. Add your credentials:

```env
NEXT_PUBLIC_IBR_USERNAME=your-actual-username
NEXT_PUBLIC_IBR_PASSWORD=your-actual-password
```

### Option 3: Contact IBR

If the credentials `ApAttonLL` / `G4#tPkM7@qTT` were provided by IBR:

- They may need to be activated
- They may be for production only (not development)
- Contact IBR support to verify

## Next Steps

1. The code now uses the test credentials from the documentation
2. Try submitting a background check again
3. You should see a successful response with an IBR ID

## Testing After Update

1. Restart your dev server (`npm run dev`)
2. Go to a candidate with passed interview
3. Try submitting a background check
4. Check console for the response

The XML format and API connection are working correctly - we just need valid credentials!
