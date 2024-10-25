# Theme Lab webb app with React + Vite Application

Theme Lab is a lightweight and customizable React application built with Vite for fast development and optimal build performance. With a clean, intuitive interface, this app provides a comprehensive set of tools for theme customization, including dynamic color pickers, font options, dark/light mode switching, and theme export functionality. ESLint is included to maintain code quality, and the setup leverages Vite’s Hot Module Replacement (HMR) for a smooth development experience.

## Features

- **React + Vite**: Enjoy fast development with instant Hot Module Replacement.
- **ESLint**: Enforce code quality and consistency with linting rules.
- **Fast Refresh**: Use Babel or SWC to enable Fast Refresh for React components.
- **Dark/Light Theme Switching**: Customizable themes with support for dark and light modes. You can also randomize themes.
- **Dynamic Color Picker**: Integrated color picker with copying features. Colors such as primary, secondary, accent, text and background colors can be changed in real-time.
- **Font Customization**: Choose from predefined fonts or randomize the fonts. It supports fonts for text body and text header.
- **Export Theme**: When you are done you can export your theme by coping the CSS variables and use in your own projects root css file. Choose between the current theme mode or both light and dark mode scheme.
- **Various pages**: Three common and generic pages are available to customize, a classic landing page, a login page and a dashboard page.
- **Dedicated settings sidebar**: The settings sidebar offers different parameters you can tweak.
- **chroma-js** `chroma-js` for advanced color manipulation for the themes and the customization.
- **Charts** Chart integration with a flexible charting library used on dummy data.


Demo site hosted using Vercel: [demo](https://react-color-tester.vercel.app/)

## Prerequisites

To run this application, ensure you have the following installed:

- [Node.js](https://nodejs.org/en/download/) (LTS version recommended)
- npm or yarn package manager

## Additional dependencies
The project also uses the following dependencies:

- chroma-js: A JavaScript library for color conversions and color scales.
- Charting library Recharts


## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/your-repo-name.git](https://github.com/Hashtagsmile/react-color-tester.git
cd color-tester/
```

### 2. Running the Application
To start the development server with Hot Module Replacement (HMR):
```bash
npm run dev
```
The application will be served locally, typically at http://localhost:3000 (depending on your Vite configuration).


### Roadmap
- [x] Demo website on vercel
- [x] Browse through predefined themes and customize them to your own liking in real-time.
- [] Fix the locking mechanism for individual colors
- [] Extend the export to support more formats like wordpress and elementor
- [] Be able to adjust the size of font header and font body and reflect this in the exporting of the theme
- [] Implement general settings tab where the user can change paramters such as card sizes, border-radius, number of dashboard cards etc... to further enhance the customization.
- [] Fix the copy to clipboard
