# EventFriend Backend

This repository contains the backend server for the EventFriend application. It is built using Node.js, Express, and Firebase (Cloud Functions, Firestore, and Authentication). The API is responsible for managing user profiles, events, connections, and user interests.

## Features

*   **User Management:** User creation, profile retrieval, and updates.
*   **Event Management:** Create, retrieve, and update events.
*   **Social Connections:** Manage user interests in events and connections between users.
*   **Real-time Chat:** (Via connections endpoints)

## Prerequisites

Before you begin, ensure you have the following installed on your local machine:

*   **Node.js:** (LTS version recommended, e.g., 18.x or 20.x). You can download it from [nodejs.org](https://nodejs.org/).
*   **Firebase CLI:** The command-line tool for managing Firebase projects. If you don't have it, install it globally by running:
    ```bash
    npm install -g firebase-tools
    ```
    > **Note:** On macOS/Linux, you might need to use `sudo npm install -g firebase-tools` if you encounter permission errors.

## Local Development Setup

Follow these steps to get the backend running on your local machine for development and testing.

### 1. Clone the Repository

Clone this repository to your local machine.

```bash
git clone <your-repository-url>
cd event-friend
```

### 2. Log in to Firebase

The Firebase tools need to be authenticated with your Google account to associate this local project with your Firebase project in the cloud.

```bash
firebase login
```
A browser window will open, prompting you to sign in and grant permissions.

### 3. Install Dependencies

This project has its own dependencies for the Cloud Functions. You must navigate into the `functions` directory to install them.

```bash
cd functions
npm install
```

### 4. Configure the Emulators (One-Time Setup)

If this is your first time setting up the project, you need to configure the Firebase emulators to ensure all required services (Authentication, Firestore, Functions) are enabled.

First, navigate back to the project root:
```bash
cd ..
```

Then, run the init command:
```bash
firebase init emulators
```

You will be prompted with a series of questions:
*   **"Which emulators do you want to set up?"**: Use the **arrow keys** to navigate and the **spacebar** to select. **Ensure you select `Authentication Emulator`, `Functions Emulator`, and `Firestore Emulator`**.
*   **"Which port do you want to use for...?"**: You can press **Enter** for each question to accept the default ports.
*   **"Would you like to enable the Emulator UI?"**: Type **`Y`** and press **Enter**. This is essential for debugging.
*   **"Would you like to download the Emulator UI now?"**: Type **`Y`** and press **Enter**.

### 5. Start the Emulators

Now you are ready to start the local server. From the project root (`event-friend`), run:

```bash
firebase emulators:start
```

If successful, you will see a table in your terminal showing that the emulators are running, including a green checkmark next to your `api` function:

```
✔  All emulators ready! It is now safe to connect your app.
i  View Emulator UI at http://127.0.0.1:4000/

┌────────────────┬────────────────┬───────────────────────────────────────────┐
│ Emulator       │ Host:Port      │ View in Emulator UI                       │
├────────────────┼────────────────┼───────────────────────────────────────────┤
│ Authentication │ 127.0.0.1:9099 │ http://127.0.0.1:4000/auth                │
├────────────────┼────────────────┼───────────────────────────────────────────┤
│ Functions      │ 127.0.0.1:5001 │ http://127.0.0.1:4000/functions           │
├────────────────┼────────────────┼───────────────────────────────────────────┤
│ Firestore      │ 127.0.0.1:8080 │ http://127.0.0.1:4000/firestore           │
└────────────────┴────────────────┴───────────────────────────────────────────┘
```
**Your backend is now running!** Leave this terminal window open.

## Running the Full Application

This backend is designed to work with the `event-friend-frontend`. To run the full application:
1.  Keep the backend emulator terminal running.
2.  Open a **new, separate terminal window**.
3.  Navigate to the frontend project directory (`event-friend-frontend`).
4.  Run `npm install` (if you haven't already).
5.  Start the frontend server with `npm start`.

## Troubleshooting Common Issues

If you run into problems, check here first.

*   **Error: `bash: firebase: command not found`**
    *   **Cause:** The Firebase CLI is not installed globally or is not in your system's PATH.
    *   **Solution:** Run `npm install -g firebase-tools` (with `sudo` if needed). Close and reopen your terminal before trying again.

*   **Error: `Failed to load function definition` or `Cannot find package 'express'`**
    *   **Cause:** You haven't installed the dependencies for the Cloud Functions.
    *   **Solution:** Stop the emulator. Run `cd functions`, then `npm install`, then `cd ..`, and finally restart the emulators with `firebase emulators:start`.

*   **Error: `Failed to authenticate, have you run firebase login?`**
    *   **Cause:** You are trying to run an `init` command that requires authentication.
    *   **Solution:** Run `firebase login` and follow the prompts in your browser.

*   **Problem: The Emulator UI says "The Auth Emulator is currently not running"**
    *   **Cause:** The project has not been configured to use the Auth emulator.
    *   **Solution:** Stop the emulators and run the one-time setup command: `firebase init emulators`. Make sure to select the `Authentication Emulator` with the spacebar during the setup process.
