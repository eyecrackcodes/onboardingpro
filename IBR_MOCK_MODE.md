# IBR Mock Mode

Since both your credentials and the test credentials are being rejected by IBR, I've added a mock mode so you can continue testing your system while waiting for IBR's response.

## How to Enable Mock Mode

1. Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_IBR_MOCK_MODE=true
```

2. Restart your development server:

```bash
npm run dev
```

## What Mock Mode Does

When enabled, the system will:

- Accept any background check submission
- Return a mock IBR ID (format: `MOCK-timestamp`)
- Simulate successful API responses
- Allow you to test the complete workflow

## Testing with Mock Mode

1. Submit a background check as normal
2. You'll get a mock IBR ID like `MOCK-1234567890`
3. Status checks will return "Review" status
4. You can test the full UI flow

## Disabling Mock Mode

Once you have valid IBR credentials:

1. Remove or set to false in `.env.local`:

```env
NEXT_PUBLIC_IBR_MOCK_MODE=false
```

2. Add your real credentials:

```env
NEXT_PUBLIC_IBR_USERNAME=your-username
NEXT_PUBLIC_IBR_PASSWORD=your-password
```

## Note

Mock mode is for development/testing only. It doesn't actually submit background checks to IBR.
