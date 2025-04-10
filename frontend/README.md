# Scavenger Hunt Frontend

A Svelte-based frontend application for the Scavenger Hunt project. This application consumes the backend API deployed on AWS Elastic Beanstalk.

## Features

- User registration and login
- Create and join teams
- View scavenger hunt items
- Upload images of found items
- Track team progress

## Tech Stack

- **Svelte**: A lightweight, reactive JavaScript framework
- **TypeScript**: For type safety and better developer experience
- **Vite**: Fast, modern build tool
- **Svelte Navigator**: For client-side routing
- **Axios**: For API requests

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```
   cd scavenger-hunt/frontend
   ```
3. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn
   ```

### Development

Start the development server:

```
npm run dev
```

or

```
yarn dev
```

This will start the development server at http://localhost:3000.

### Building for Production

Build the application for production:

```
npm run build
```

or

```
yarn build
```

### Preview Production Build

Preview the production build locally:

```
npm run preview
```

or

```
yarn preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   ├── routes/           # Page components
│   ├── services/         # API services
│   ├── stores/           # Svelte stores for state management
│   ├── App.svelte        # Main application component
│   └── main.ts           # Application entry point
├── public/               # Static assets
├── index.html            # HTML template
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Project dependencies and scripts
```

## API Integration

The frontend communicates with the backend API deployed on AWS Elastic Beanstalk. The base URL for API requests is configured in the `src/services/api.ts` file.

## Deployment

This frontend can be deployed to any static hosting service like Netlify, Vercel, or AWS S3 with CloudFront.

## License

This project is private and not licensed for public use.
