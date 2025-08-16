# Imgboard Frontend: Product Requirements Document (PRD)

This document outlines the required components and state management structure for the imgboard frontend application, built with React, TypeScript, Redux Toolkit, and Mantine.

---

## I. Global State Management (Redux Toolkit)

We will use a central Redux store for state that is shared, persisted across views, or affects multiple disconnected components.

### 1. `authSlice.ts`

*   **Responsibility:** Manages the user's authentication session. This is the core global state.
*   **State Shape:**
    ```typescript
    {
      user: User | null;
      status: 'idle' | 'loading' | 'succeeded' | 'failed';
      error: string | null;
    }
    ```
    *Note: The auth token will be managed by the Supabase client library directly, simplifying the slice.*
*   **Key Async Thunks:**
    *   `loginUser({ loginIdentifier, password })`
    *   `registerUser({ email, password, username })`
    *   `logoutUser()`
    *   `checkInitialSession()`: An action to check if a user session exists on app load.

### 2. `boardsSlice.ts`

*   **Responsibility:** Caches the list of all available boards to prevent re-fetching on every visit to the home page.
*   **State Shape:**
    ```typescript
    {
      boards: Board[];
      status: 'idle' | 'loading' | 'succeeded' | 'failed';
      error: string | null;
    }
    ```
*   **Key Async Thunks:**
    *   `fetchBoards()`: Fetches data from `GET /functions/v1/boards`.

### 3. `currentThreadSlice.ts`

*   **Responsibility:** Manages the state of the **single thread being viewed**, including its original post (OP) and paginated replies. This is crucial for seamless reply creation and pagination.
*   **State Shape:**
    ```typescript
    {
      op: Post | null;
      replies: Post[];
      pagination: { currentPage: number; hasMore: boolean; };
      status: 'idle' | 'loading' | 'succeeded' | 'failed';
      error: string | null;
    }
    ```
*   **Key Async Thunks:**
    *   `fetchThread({ postId, page, limit })`: Fetches from `GET /functions/v1/posts/{post_id}`.
    *   `createReply({ threadId, comment, imagePath? })`: Posts a new reply and smartly updates the `replies` array in the state without needing a full re-fetch.

---

## II. Local Component State (React Hooks)

We will use local state (`useState`, `@mantine/form`) for any data that is not shared or does not need to persist.

*   **Forms:** All form inputs (login, registration, post creation) will be managed within their respective components.
*   **UI Controls:** States like "is modal open," "is dropdown active," "show password," etc., will be handled locally.
*   **Board Threads List:** The list of threads for a specific board (`/b/:slug`) will be fetched and managed *locally* within the `BoardPage` component. This data is less "global" than the single *active* thread and doesn't need complex cross-component updates, making local state a simpler and better choice here.

---

## III. Component Architecture

Components will be built using Mantine for UI and will interact with either the Redux store or their own local state as defined above.

### Core Pages & Layout

*   **`Layout.tsx`**: Contains the `AppShell` from Mantine, including a `Navbar` and the main content area for rendering pages.
*   **`Navbar.tsx`**: Top navigation bar. Displays login/register buttons or a user menu by reading from `authSlice`.
*   **`HomePage.tsx`**: Fetches (via `boardsSlice`) and displays the `BoardList`.
*   **`BoardPage.tsx`**:
    *   Receives a `boardSlug` from the URL.
    *   Uses **local state** (`useState`/`useEffect`) to fetch and display the list of `ThreadPreview` components for that board.
    *   Contains a button to open the `CreatePostForm` for starting a new thread.
*   **`ThreadPage.tsx`**:
    *   Receives a `postId` from the URL.
    *   Fetches and displays the OP and replies using the `currentThreadSlice`.
    *   Includes the `CreatePostForm` for adding replies.

### Reusable Components

*   **`BoardCard.tsx`**: Displays a single board's info on the `HomePage`.
*   **`ThreadPreview.tsx`**: A summary card for a thread on the `BoardPage`. Shows image, stats, and comment snippet.
*   **`PostCard.tsx`**: A crucial component for displaying a single post (OP or reply). It shows the image, comment, user info, and action buttons.
*   **`CreatePostForm.tsx`**: A form (likely in a modal) for creating new threads or replies. It will manage its own state for inputs and the file upload process. On successful submission, it will dispatch the appropriate Redux action (`createReply` or a new thunk for creating a thread).