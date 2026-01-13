# Troubleshooting Guide

This guide will help you troubleshoot any issues you may encounter after the recent changes.

## Steps to run the application

1.  **Install dependencies:**
    Open your terminal and run the following command to install the necessary dependencies:
    ```bash
    npm install
    ```

2.  **Run the development server:**
    After the installation is complete, run the following command to start the development server:
    ```bash
    npm run dev
    ```

3.  **Access the application:**
    Open your browser and navigate to http://localhost:3000 to see the application in action.

## Potential issues and solutions

### 1. Logo not displaying

If the logo is not displaying correctly, please check the following:

*   **Verify the logo URL:** Go to the admin settings page and check if the logo has been uploaded correctly. You should see the logo preview in the "Logo" section.
*   **Check the browser console:** Open the developer tools in your browser (usually by pressing F12) and check the console for any errors related to fetching the logo.

### 2. Page title not updating

If the page title is not updating correctly, please check the following:

*   **Verify the site title:** Go to the admin settings page and ensure that the "Site Title" input field has the correct value.
*   **Hard refresh the page:** Sometimes the browser might cache the old title. Try a hard refresh (usually Ctrl + Shift + R or Cmd + Shift + R) to see the changes.

If you continue to experience issues, please provide the error messages from the browser console and the terminal, and I will be happy to assist you further.
