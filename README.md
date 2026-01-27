# EduManage - Education ERP System

A modern, scalable, and responsive Education ERP System built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and Framer Motion.

## 🚀 Features

- **Modern UI/UX Design**: Clean SaaS dashboard with professional, minimal, education-friendly design
- **Responsive Layout**: Mobile-first responsive design that works on all devices
- **Dark/Light Mode**: Built-in theme switching with next-themes
- **Smooth Animations**: Subtle animations powered by Framer Motion
- **Reusable Components**: Production-ready, modular component architecture
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Utility-first CSS with custom color palette (#E5F33C primary color)

## 📦 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Theme**: next-themes

## 🎨 Design Features

- Clean SaaS dashboard aesthetic
- Rounded corners (2xl)
- Soft shadows
- Accessible color contrast
- Professional color scheme with #E5F33C accent color

## 📁 Project Structure

```
education-erp/
├── app/
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── dashboard/
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── stat-card.tsx
│   ├── layout/
│   │   ├── header.tsx
│   │   └── footer.tsx
│   ├── providers/
│   │   └── theme-provider.tsx
│   ├── sections/
│   │   ├── analytics.tsx
│   │   ├── faq.tsx
│   │   ├── features.tsx
│   │   ├── hero.tsx
│   │   ├── newsletter.tsx
│   │   ├── testimonials.tsx
│   │   └── trusted-by.tsx
│   └── ui/
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       └── input.tsx
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 🛠️ Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Available Pages

- **Landing Page** (`/`): Marketing homepage with hero, features, testimonials, FAQ, and newsletter sections
- **Dashboard** (`/dashboard`): Main ERP dashboard with statistics, recent activities, and quick actions

## 🧩 Component Library

### UI Components
- `Button`: Versatile button with variants (primary, secondary, outline, ghost)
- `Card`: Flexible card component with header, title, description, and content
- `Input`: Styled input field with label, error, and helper text support
- `Badge`: Status badges with multiple color variants

### Layout Components
- `Header`: Responsive navigation header with theme toggle
- `Footer`: Comprehensive footer with links and social media
- `DashboardSidebar`: Collapsible sidebar navigation for dashboard
- `DashboardHeader`: Dashboard-specific header with search and notifications

### Section Components
- `Hero`: Eye-catching hero section with CTA
- `Features`: Service showcase grid
- `Analytics`: Data visualization section
- `Testimonials`: Customer testimonials carousel
- `FAQ`: Accordion-style FAQ section
- `Newsletter`: Email subscription section

## 🎨 Customization

### Colors
The primary color (#E5F33C) can be customized in `tailwind.config.ts`:

```typescript
colors: {
  primary: {
    DEFAULT: '#E5F33C',
    // ... other shades
  },
}
```

### Typography
Font family can be changed in `app/layout.tsx`:

```typescript
const inter = Inter({ subsets: ['latin'] })
```

## 📱 Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## 🌙 Theme Support

Toggle between light and dark modes using the theme switcher in the header. Theme preference is persisted in localStorage.

## 🚀 Production Build

```bash
npm run build
npm start
```

## 📝 Code Standards

- **Naming Conventions**: PascalCase for components, camelCase for functions/variables
- **No Inline Styles**: All styling via Tailwind utility classes
- **TypeScript**: Strict type checking enabled
- **Comments**: Added where necessary for clarity
- **Reusability**: Components designed for maximum reusability

## 🎓 Educational Features

This ERP system includes modules for:
- Student Management
- Course Management
- Scheduling & Timetables
- Analytics & Reporting
- Finance Management
- Attendance Tracking
- Assignment Management
- Notifications

## 📄 License

This project is created for educational and demonstration purposes.

## 🤝 Contributing

This is a UI/Layout demonstration project. Backend integration and additional features can be added as needed.

---

Built with ❤️ using Next.js, TypeScript, and Tailwind CSS
