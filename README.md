# Eventora

Eventora is a full-stack movie discovery and ticket booking platform. It lets users explore movies, view details, select cinema showtimes, choose seats, complete payment, receive booking confirmation email, and verify tickets using a QR code.

The project is built with a React frontend, an Express/MongoDB backend, TMDB movie data, AI recommendations, Razorpay/UPI payment support, and QR-based public ticket verification.

## Features

- User signup, login, profile, and protected routes
- JWT-based authentication
- Movie discovery, search, trending, now playing, and favorites
- Movie detail pages with poster, backdrop, cast, runtime, genres, rating, trailer, and similar movies
- TMDB API integration with local fallback data when TMDB is unavailable
- AI concierge recommendations using Gemini, with fallback recommendations if the API fails
- Cinema/showtime selection with live-provider-ready backend
- Seat selection with booked-seat conflict checks
- Razorpay order creation and backend payment signature verification
- Manual UPI fallback payment flow
- Booking ID and Ticket ID generation
- QR code ticket generation
- Public ticket verification page
- Booking confirmation email
- Password reset OTP email

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Axios
- CSS

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt
- Nodemailer
- Razorpay Orders API

### External Services

- TMDB API for movie data
- Google Gemini API for AI recommendations
- Razorpay API for payments
- Gmail SMTP for emails
- QR Server fallback for QR code generation
- Optional Hovercode API for dynamic QR codes
- Optional MovieGlu-style provider for live cinema showtimes

## Project Structure

```text
eventora 2/
  backend/
    models/
      Booking.js
      User.js
    routes/
      ai.js
      auth.js
      booking.js
      favorites.js
      movies.js
      showtimes.js
    utils/
      email.js
      hovercode.js
      razorpay.js
      tmdbFallback.json
    server.js
    package.json
  frontend/
    src/
      components/
      context/
      screens/
      styles/
      App.jsx
      main.jsx
    package.json
```

The main Eventora app uses the `backend` and `frontend` folders. Other folders in the repository are separate experiments or supporting projects.

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/negiaryan19/eventora.git
cd eventora
```

If your folder name contains spaces, wrap the path in quotes when using `cd`.

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 4. Create backend environment file

Create `backend/.env`:

```env
MONGO_URI=mongodb://localhost:27017/eventora
JWT_SECRET=replace_with_a_long_random_secret

TMDB_API_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

EMAIL_USER=
EMAIL_PASS=

UPI_PAYMENT_URL=
UPI_ID=
UPI_PAYEE_NAME=Eventora

PUBLIC_APP_URL=http://localhost:3000

# Optional dynamic ticket QR provider
HOVERCODE_WORKSPACE_ID=
HOVERCODE_API_TOKEN=

# Optional live showtime provider
MOVIEGLU_CLIENT=
MOVIEGLU_API_KEY=
MOVIEGLU_AUTH=
MOVIEGLU_TERRITORY=IN
MOVIEGLU_API_VERSION=v200
MOVIEGLU_GEOLOCATION=12.9716;77.5946
```

Do not commit `.env` files. Keep real API keys private.

### 5. Start MongoDB

Make sure MongoDB is running locally:

```bash
mongod
```

If you use MongoDB Atlas, place the Atlas connection string in `MONGO_URI`.

### 6. Start the backend

```bash
cd backend
npm start
```

Backend runs on:

```text
http://localhost:5001
```

### 7. Start the frontend

Open a second terminal:

```bash
cd frontend
npm run dev
```

Frontend runs on:

```text
http://localhost:3000
```

## Main API Routes

### Auth

```text
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/profile
PUT  /api/auth/preferences
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Movies

```text
GET /api/movies/trending
GET /api/movies/nowplaying
GET /api/movies/upcoming
GET /api/movies/search?q=movie
GET /api/movies/:id
GET /api/movies/:id/similar
```

### Showtimes

```text
GET /api/showtimes?movieTitle=Dhurandhar&city=Bengaluru
```

### Booking and Payment

```text
GET  /api/booking/booked-seats
POST /api/booking/create-payment
POST /api/booking/verify-payment
POST /api/booking/confirm-upi
GET  /api/booking/my-bookings
GET  /api/booking/public/:ticketCode
```

### Favorites

```text
POST /api/favorites/toggle
GET  /api/favorites
```

### AI

```text
POST /api/ai/recommend
POST /api/ai/chat
```

## Booking Flow

1. User opens a movie detail page.
2. User clicks Book Now.
3. App fetches showtimes from `/api/showtimes`.
4. User selects venue, showtime, and seats.
5. Frontend calls `/api/booking/create-payment`.
6. Backend creates a pending booking.
7. If Razorpay keys exist, backend creates a Razorpay order.
8. If Razorpay is not configured, backend creates a UPI payment QR fallback.
9. After successful payment:
   - Razorpay flow calls `/api/booking/verify-payment`
   - Manual UPI flow calls `/api/booking/confirm-upi`
10. Backend confirms the booking, generates ticket ID and QR code, sends email, and stores the confirmed ticket.
11. User can view the ticket in `/tickets`.
12. Anyone can verify the ticket using `/ticket/:ticketCode`.

## Email Flow

Eventora uses Nodemailer with Gmail SMTP.

Email is used for:

- Welcome email after signup
- Password reset OTP
- Booking confirmation after payment

For Gmail, use a Google App Password, not your normal Gmail password.

## API Fallback Behavior

The app is designed to keep working during API failure:

- If TMDB fails, movies load from `tmdbFallback.json`.
- If Gemini fails, AI recommendations use local fallback plans.
- If Razorpay is not configured, manual UPI fallback is used.
- If Hovercode is not configured, QR Server fallback creates ticket QR images.
- If live showtime provider is not configured, demo showtimes are shown clearly as fallback.

## Scripts

### Backend

```bash
npm start
```

### Frontend

```bash
npm run dev
npm run build
```

## Build

To verify frontend production build:

```bash
cd frontend
npm run build
```

## Security Notes

- Never push `.env` files.
- Rotate any API keys that were shared publicly.
- Use a strong `JWT_SECRET`.
- Use Razorpay test keys during development and live keys only in production.
- Store production secrets in the hosting provider's environment variable system.
- Use HTTPS in production.

## Production Readiness

The core app is functional for local development and demonstration:

- Authentication works
- Movie discovery works
- Booking works
- Payment flow is implemented
- Ticket QR verification works
- Email flow is implemented

Before production deployment:

- Rotate all exposed API keys
- Configure production MongoDB
- Configure live Razorpay keys
- Configure a live showtime provider if real-time cinema data is required
- Set `PUBLIC_APP_URL` to the deployed frontend URL
- Use a secure deployment platform and HTTPS

## Repository

```text
https://github.com/negiaryan19/eventora
```


