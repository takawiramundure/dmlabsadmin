# How to Reuse the Admin Portal

This dashboard is built as a standalone React application that can be easily repurposed for other clients.

## 1. Copy the Codebase
The `admin-portal` folder is self-contained. You can copy this entire folder to a new project.

## 2. Configuration
All client-specific configurations are centralized.

### Analytics Config
Edit `src/config/analyticsConfig.ts`:
```typescript
export const ANALYTICS_CONFIG = {
    CLIENT_ID: 'YOUR_NEW_CLIENT_ID',
    DEFAULT_PROPERTY_ID: 'YOUR_NEW_PROPERTY_ID',
    // ...
};
```

### Authentication & Firebase
Update `src/firebase.ts` (if applicable) or your auth provider settings with the new project's credentials.

## 3. Deployment
The portal is a standard Vite React app.
- Build: `npm run build`
- Deploy the `dist` folder to any static host (Vercel, Netlify, Firebase Hosting, etc.).
