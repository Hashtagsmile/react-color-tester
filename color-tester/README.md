# React + Vite Application

This project is a minimal setup of a React application using Vite as the build tool. Vite provides fast development with Hot Module Replacement (HMR) and optimal build speed. This setup also includes ESLint rules for code quality and consistency.

## Features

- **React + Vite**: Enjoy fast development with instant Hot Module Replacement.
- **ESLint**: Enforce code quality and consistency with linting rules.
- **Fast Refresh**: Use Babel or SWC to enable Fast Refresh for React components.
- **Dark/Light Theme Switching**: Customizable themes with support for dark and light modes. You can also randomize themes.
- **Dynamic Color Picker**: Integrated color picker with locking and copying features. Colors such as primary, secondary, accent, text and background colors can be changed in real-time.
- **Font Customization**: Choose from predefined fonts or randomize the fonts. It supports fonts for text body and text header.
- **Export Theme**: When you are done you can export your theme by coping the CSS variables and use in your own projects root css file.
- **Various pages**: Three common pages are available to customize, a classic landing page, a login page and a dashboard page.
- **Dedicated settings sidebar**: The settings sidebar offers different parameters you can tweak.
- **chroma-js** `chroma-js` for advanced color manipulation
- **Charts** Chart integration with a flexible charting library (the used one here is Recharts)

## Prerequisites

To run this application, ensure you have the following installed:

- [Node.js](https://nodejs.org/en/download/) (LTS version recommended)
- npm or yarn package manager

## Additional dependencies
The project also uses the following dependencies:

- chroma-js: A JavaScript library for color conversions and color scales.
- Charting library Recharts

Run the following commands to install them in the root of the directory:
```bash
npm install chroma-js recharts

```
```bash
npm install recharts
```

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/your-repo-name.git](https://github.com/Hashtagsmile/react-color-tester.git
cd react-color-tester/color-tester/
```

### 2. Running the Application
To start the development server with Hot Module Replacement (HMR):
```bash
npm run dev
```
The application will be served locally, typically at http://localhost:3000 (depending on your Vite configuration).
