# 📸 Instagram Clone - Social Media Platform

A full-featured Instagram-style social media application built with modern web technologies. This project demonstrates a complete social media platform with user authentication, post creation, social interactions, and real-time features.

## 🚀 Features

### 🔐 Authentication System
- **User Registration** - Sign up with email, username, and password
- **Secure Login** - Credentials-based authentication with NextAuth v5
- **Password Hashing** - Secure password storage with bcryptjs
- **Session Management** - Persistent user sessions with JWT tokens

### 👥 Social Features
- **Follow/Unfollow Users** - Build your social network
- **User Profiles** - View user posts, followers, and following counts
- **Search Users** - Find other users with debounced search functionality
- **Feed System** - Personalized feed showing posts from followed users

### 📝 Content Management
- **Create Posts** - Share images with captions
- **AI Image Generation** - Generate images using Z.ai SDK
- **Post Interactions** - Like and comment on posts
- **Post Detail View** - Full post view with all comments and likes

### 🎨 User Experience
- **Responsive Design** - Mobile-first approach with Tailwind CSS
- **Real-time Updates** - Instant UI updates without page refresh
- **Loading States** - Smooth loading indicators and skeletons
- **Error Handling** - Comprehensive error messages and toast notifications

## 🛠️ Technology Stack

### Frontend
- **⚡ Next.js 15** - React framework with App Router
- **📘 TypeScript** - Type-safe development
- **🎨 Tailwind CSS 4** - Utility-first styling
- **🧩 shadcn/ui** - Modern UI components
- **🔄 SWR** - Data fetching and caching
- **🔐 NextAuth v5** - Authentication
- **🎯 React Hook Form** - Form management
- **✅ Zod** - Schema validation

### Backend
- **🗄️ Prisma ORM** - Database management
- **🔐 NextAuth.js** - Authentication routes
- **🤖 Z.ai SDK** - AI image generation
- **🔒 bcryptjs** - Password hashing

### Database
- **📊 SQLite** - Local development database
- **🔄 Prisma Migrations** - Schema management

## 🏗️ Database Schema

The application uses a comprehensive relational database with the following models:

### User Model
```typescript
- id, email, username, name, password
- avatar, bio, createdAt, updatedAt
- Relations: posts, likes, comments, followers, following
```

### Post Model
```typescript
- id, imageUrl, caption, authorId
- createdAt, updatedAt
- Relations: author, likes, comments
```

### Like Model
```typescript
- id, userId, postId, createdAt
- Relations: user, post
- Unique constraint on (userId, postId)
```

### Comment Model
```typescript
- id, content, userId, postId
- createdAt, updatedAt
- Relations: user, post
```

### Follow Model
```typescript
- id, followerId, followingId, createdAt
- Relations: follower, following
- Unique constraint on (followerId, followingId)
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd instagram-clone
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Create .env file
cp .env.example .env

# Add your environment variables
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
DATABASE_URL="file:./dev.db"
```

4. **Set up the database**
```bash
# Push schema to database
npm run db:push

# Generate Prisma client
npm run db:generate
```

5. **Start the development server**
```bash
npm run dev
```

6. **Open the application**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── posts/                # Post management
│   │   ├── likes/                # Like/unlike functionality
│   │   ├── comments/             # Comment system
│   │   ├── follow/               # Follow/unfollow users
│   │   ├── feed/                 # User feed API
│   │   ├── search/               # User search
│   │   └── generate-image/       # AI image generation
│   ├── create/                   # Create post page
│   ├── login/                    # Login page
│   ├── signup/                   # Registration page
│   ├── profile/[username]/       # User profile pages
│   ├── post/[id]/                # Post detail pages
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   ├── feed.tsx                  # Main feed component
│   ├── search.tsx                # Search functionality
│   └── providers.tsx            # Session provider
├── hooks/                        # Custom React hooks
│   ├── use-api-swr.ts           # SWR data fetching
│   ├── use-debounce.ts          # Debounce utility
│   └── use-toast.ts             # Toast notifications
├── lib/                          # Utility libraries
│   ├── auth.ts                   # NextAuth configuration
│   ├── auth.config.ts           # Auth provider config
│   └── db.ts                    # Prisma client
└── types/                        # TypeScript definitions
    └── next-auth.d.ts           # Auth type extensions
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login (NextAuth)

### Posts
- `GET /api/posts` - Get all posts (paginated)
- `POST /api/posts` - Create new post
- `GET /api/posts/[id]` - Get single post with details

### Social Interactions
- `POST /api/likes` - Like a post
- `DELETE /api/likes` - Unlike a post
- `POST /api/comments` - Add comment
- `GET /api/comments` - Get post comments

### Follow System
- `POST /api/follow` - Follow a user
- `DELETE /api/follow` - Unfollow a user

### User Management
- `GET /api/users/[username]` - Get user profile
- `GET /api/users/[username]/posts` - Get user posts
- `GET /api/search` - Search users

### Feed & Content
- `GET /api/feed` - Get personalized feed
- `POST /api/generate-image` - Generate AI image

## 🎯 Key Features Explained

### Authentication Flow
1. User signs up with email, username, name, and password
2. Password is hashed using bcryptjs before storage
3. User logs in with credentials via NextAuth
4. Session is managed with JWT tokens
5. Protected routes redirect to login if not authenticated

### Feed Algorithm
- Fetches posts from users that the current user follows
- Paginated results for better performance
- Real-time updates when new posts are created
- Includes like and comment counts

### Search Functionality
- Debounced search (300ms delay) to reduce API calls
- Searches username and name fields (case-insensitive)
- Results ranked by follower count
- Limited to 10 results for performance

### Image Generation
- Uses Z.ai SDK for AI-powered image generation
- Random prompts for variety
- Base64 encoded images returned as data URLs
- Error handling for failed generations


### Follow Future machinise
 async isFollowing(followerId: string, followingId: string) {
    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return !!follow;
  }

  this is what used to check if the user is following for every user, so that we can check is the user followed or not


## 🧪 Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:push      # Push schema to database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:reset     # Reset database
```

## 🔧 Configuration

### Environment Variables
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
DATABASE_URL="file:./dev.db"
```

### NextAuth Configuration
- Credentials provider for email/password authentication
- Custom session callbacks to include user ID and username
- Custom login/signup pages
- JWT strategy for session management

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Database Considerations
- For production, consider using PostgreSQL or MySQL
- Update `prisma/schema.prisma` provider
- Update `DATABASE_URL` environment variable
- Run `prisma migrate deploy` for production migrations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Code Quality

This project follows best practices:
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Zod** for runtime validation
- **Error boundaries** for graceful error handling
- **Loading states** for better UX
- **Responsive design** for all screen sizes

## 🔒 Security Features

- **Password Hashing** - bcryptjs for secure password storage
- **Input Validation** - Zod schemas for all API inputs
- **CSRF Protection** - NextAuth built-in protection
- **SQL Injection Prevention** - Prisma ORM parameterized queries
- **XSS Protection** - React's built-in XSS protection

## 🌟 Future Enhancements

- [ ] Real-time notifications
- [ ] Stories feature
- [ ] Direct messaging
- [ ] Post editing/deletion
- [ ] Image upload functionality
- [ ] Advanced search filters
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)

## 📞 Support

If you encounter any issues or have questions:
1. Check the existing issues
2. Create a new issue with detailed description
3. Include steps to reproduce the problem
4. Add screenshots if applicable

---

Built with ❤️ using modern web technologies. Demonstrates full-stack development skills with a focus on user experience and code quality.