## 1. Overview

This is an imgboard application built using Supabase as the backend. The architecture is API-first, meaning the frontend interacts with the database exclusively through custom Edge Functions written in TypeScript. This ensures security, allows for complex business logic, and keeps all sensitive operations on the server. The app supports multiple boards, user accounts, and moderation.

## 2. Core Features & Logic

- **Board-Based Structure:** Content is organized into different boards/categories.
- **Unified Content Model:** Original posts (OPs) and replies are both stored as "posts". A post is either the start of a thread or a reply within one.
- **Inter-Post Linking:** Posts can directly reference/reply to any other post (OPs or other replies) using `>>post_id` syntax. The system efficiently tracks these "backlinks".
- **User Accounts:** Users can sign up and log in with a unique username and profile.
- **Roles:** The system supports `USER`, `MODERATOR`, and `ADMIN` roles.
- **Anonymous Posting:** Users who are not logged in can post anonymously.
- **Rate Limiting:** Resource-intensive actions are rate-limited via a configurable database table.
- **Secure Uploads:** Image uploads use a two-step signed URL flow for security and performance.
- **Unique Images:** The database enforces that a single uploaded image can only be used to start one thread.

## 3. Database Schema

This section documents the static tables and the dynamic, logical components of our database.

#### Tables

- **`public.boards`**: Stores board categories.
  - `id` (PK, BIGINT), `slug` (TEXT, UNIQUE), `name` (TEXT), `description` (TEXT)
- **`public.posts`**: A unified table for both original posts (threads) and replies.
  - `id` (PK, BIGINT): The globally unique ID used for internal linking.
  - `board_id` (FK to boards): The board this post belongs to.
  - `thread_id` (FK to posts): Links all posts in a thread. For OPs, this points to its own `id`.
  - `board_post_id` (INTEGER): The human-readable, per-board sequential ID (the "No." value).
  - `user_id` (FK to auth.users, nullable): The poster's account, if logged in.
  - `image_path` (TEXT): The path to the image in Storage. `NULL` for text-only replies.
  - `comment` (TEXT): The post's content.
  - `poster_ip` (INET): The IP address of anonymous posters.
- **`public.post_mentions`**: A dedicated table to efficiently track `>>` reply links.
  - `source_post_id` (FK to posts): The post containing the mention.
  - `target_post_id` (FK to posts): The post being mentioned.
- **`public.profiles`**: Extends `auth.users` with public profile data.
  - `id` (PK, FK to auth.users), `username` (TEXT, UNIQUE), `avatar_url` (TEXT), `role` (TEXT)
- **`public.app_config`**: Stores dynamic configuration variables like rate limits.
  - `key` (TEXT, PK), `value` (TEXT)
- **`public.action_logs`**: Logs rate-limited actions for enforcement.
  - `id` (PK), `user_id` (FK, nullable), `ip_address` (INET, nullable), `action_type` (TEXT), `created_at`

#### Database Functions (RPCs)

- **`public.create_post(p_board_slug, p_comment, ...)`**
  - **Purpose:** The single, unified source of truth for creating any post (thread or reply).
  - **Actions:**
    1. Intelligently determines the `board_id` based on whether it's a new thread or a reply.
    2. Gets the next sequential `board_post_id` from the correct board's sequence.
    3. Inserts the new post record into `public.posts`. Handles logic for OPs vs. replies.
    4. Parses the comment and populates the `public.post_mentions` table.
  - **Security:** Runs as `SECURITY DEFINER` with `SET search_path = ''` for maximum security.

#### Triggers & Automation

- **Trigger: `on_board_creation`**
  - **Event:** Fires `AFTER INSERT ON public.boards`.
  - **Action:** Executes the `public.create_board_post_sequence()` function.
- **Trigger Function: `public.create_board_post_sequence()`**
  - **Purpose:** Automatically creates a new, dedicated post counter (`SEQUENCE`) for a new board.
  - **Actions:** Creates the sequence, grants `USAGE` permission to the API role, and notifies the API to reload its schema cache.
  - **Security:** Runs as `SECURITY DEFINER` with `SET search_path = ''`.

#### Indexes

- **`posts_unique_non_null_image_path`**
  - **Type:** Partial Unique Index.
  - **Purpose:** A key security feature that ensures any non-NULL `image_path` is unique across the entire `posts` table. This prevents image reuse spam for both OPs and replies with images.

## 4. API Endpoint Specification

#### User & Authentication

| Endpoint                                                    | Description                                                   | Auth | Body / Params                     |
| :---------------------------------------------------------- | :------------------------------------------------------------ | :--- | :-------------------------------- |
| **POST** `/functions/v1/create-user`                | Registers a new user and creates their profile.               | No   | `{ email, password, username }` |
| **POST** `/functions/v1/login-user`                 | Authenticates a user and returns a session.                   | No   | `{ loginIdentifier, password }` |
| **POST** `/functions/v1/generate-avatar-upload-url` | Creates a secure, signed URL for uploading a profile picture. | Yes  | `{ fileType }`                  |
| **POST** `/functions/v1/set-avatar-url`             | Sets the avatar URL in a user's profile after upload.         | Yes  | `{ avatarPath }`                |

#### Content Creation

| Endpoint                                                  | Description                                                        | Auth                  | Body / Params                                       |
| :-------------------------------------------------------- | :----------------------------------------------------------------- | :-------------------- | :-------------------------------------------------- |
| **POST** `/functions/v1/generate-post-upload-url` | Creates a secure, signed URL for uploading a new post image.       | Optional              | `{ fileType }`                                    |
| **POST** `/functions/v1/create-post`              | Creates a new post (thread or reply). Handles images and mentions. | Optional              | `{ boardSlug?, threadId?, imagePath?, comment? }` |
| **POST** `/functions/v1/create-board`             | Creates a new board category.                                      | **Yes (Admin)** | `{ slug, name, description }`                     |

#### Content Retrieval

| Endpoint                                                    | Description                                               | Auth | Body / Params               |
| :---------------------------------------------------------- | :-------------------------------------------------------- | :--- | :-------------------------- |
| **GET** `/functions/v1/boards`                      | Retrieves a paginated list of all available boards.       | No   | *(None)*                  |
| **GET** `/functions/v1/board-threadss/{board_slug}` | Retrieves a paginated list of threads for a single board. | No   | `?limit=<num>&page=<num>` |
| **GET** `/functions/v1/posts/{post_id}`             | Retrieves a single thread and its paginated replies.      | No   | `?limit=<num>&page=<num>` |

#### Moderation

| Endpoint                                              | Description                                  | Auth       | Body / Params |
| :---------------------------------------------------- | :------------------------------------------- | :--------- | :------------ |
| **DELETE** `/functions/v1/posts/{post_id}`    | Deletes a specific post and all its replies. | Yes (Mod+) | *(None)*    |

## 5. Coding Style & Architecture

All Edge Function `index.ts` files **MUST** use the `createApiHandler` wrapper from `_shared/utils.ts`. This abstracts away CORS and top-level error handling. The resulting code should be clean and focused purely on the endpoint's specific business logic.

!!!! FOR RATE LIMITING PURPOSES, createApiHandler now also takes in an optional actionalType parameter.

```typescript
// Template for all `index.ts` files:
import { createApiHandler, ...otherHelpers } from '../_shared/utils.ts'

async function handleMyEndpoint(req: Request): Promise<Response> {
  // 1. Input validation
  // 2. Business logic (DB calls, etc.)
  // 3. Return success or error response using helpers
}

// The main export is always this single line:
Deno.serve(createApiHandler(handleMyEndpoint));
```

## 6. Note on Secure File Uploads (Signed URL Pattern)

The `generate-avatar-upload-url` endpoint (and any future file upload endpoint) follows a strict, two-step secure upload pattern. This is a critical architectural decision.

**The Flow:**

1. **Client-Side Declaration:** The frontend inspects the selected file to determine its MIME type (e.g., `'image/png'`). It then makes a `POST` request to the `/generate-...-url` endpoint, sending the declared `fileType` in the JSON body.
2. **Server-Side Enforcement:** The Edge Function performs these actions:

   * Authenticates the user to get their ID.
   * **Validates** the received `fileType` against a hardcoded allowlist (e.g., `['image/png', 'image/jpeg']`).
   * Constructs a secure, unique path for the file (e.g., `avatars/USER_ID`).
   * Calls Supabase Storage's `createSignedUploadUrl()` to generate a temporary, permission-based URL.
   * Returns this signed URL to the client.
3. **Client-Side Upload:** The frontend receives the signed URL and makes a `PUT` request **directly to that URL**, with the raw file data in the body and the correct `Content-Type` header. The upload bypasses the Edge Function for performance.

**Key Principle:** The Edge Function **never touches the file data**. It is a lightweight, secure "permission granter," while the actual heavy data transfer is offloaded to Supabase's optimized Storage service. This is vital for performance, cost, and scalability.

**Final Safety Net:** A Storage Row Level Security (RLS) policy on the `avatars` bucket provides a final layer of enforcement, checking file size, path, and MIME type at the database level.

## 7. Custom Database Logic (SQL)

This section documents critical SQL functions and triggers that are part of the application's backend logic but do not live in Edge Functions.

### 7.1 `create_board_post_sequence()` [Function & Trigger]

- **Purpose:** To automatically create a dedicated post counter (`SEQUENCE`) for each new board. This enables per-board sequential post IDs.
- **Trigger Event:** Fires `AFTER INSERT` on the `boards` table.
- **SQL Definition:**
  ```sql
  -- The Function
  CREATE OR REPLACE FUNCTION create_board_post_sequence()
  RETURNS TRIGGER AS $$
  BEGIN
    EXECUTE 'CREATE SEQUENCE board_' || NEW.id || '_post_id_seq;';
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- The Trigger
  CREATE TRIGGER on_board_creation
    AFTER INSERT ON boards
    FOR EACH ROW EXECUTE FUNCTION create_board_post_sequence();
  ```

### 7.2 `create_new_post()` [RPC Function]

- **Purpose:** To encapsulate the entire complex logic of creating a new post (thread) in a single, atomic database transaction. It handles getting the next `board_post_id`, inserting the post, and setting its `thread_id`.
- **Called By:** The `create-post` Edge Function.
- **SQL Definition:**
  ```sql
  CREATE OR REPLACE FUNCTION create_new_post(
    p_board_id BIGINT,
    p_image_path TEXT,
    p_comment TEXT,
    p_user_id UUID,
    p_poster_ip INET
  )
  RETURNS TABLE (j json)
  AS $$
  DECLARE
    new_post_id BIGINT;
    new_board_post_id INT;
    seq_name TEXT;
  BEGIN
    seq_name := 'board_' || p_board_id || '_post_id_seq';
    new_board_post_id := nextval(seq_name);

    INSERT INTO posts (board_id, image_path, comment, user_id, poster_ip, board_post_id)
    VALUES (p_board_id, p_image_path, p_comment, p_user_id, p_poster_ip, new_board_post_id)
    RETURNING id INTO new_post_id;

    UPDATE posts SET thread_id = new_post_id WHERE id = new_post_id;

    RETURN QUERY
      SELECT to_json(t) FROM (
        SELECT p.*, b.slug as board_slug
        FROM posts p
        JOIN boards b ON p.board_id = b.id
        WHERE p.id = new_post_id
      ) t;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
  ```
