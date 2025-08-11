# Project Context: Supabase Imgboard

## 1. Overview

This is an imgboard application built using Supabase as the backend. The architecture is API-first, meaning the frontend interacts with the database exclusively through custom Edge Functions written in TypeScript. This ensures security, allows for complex business logic, and keeps all sensitive operations on the server. The app supports multiple boards, user accounts, and moderation.

## 2. Core Features & Logic

- **Board-Based Structure:** Content is organized into different boards/categories.
- **User Accounts:** Users can sign up and log in with a unique username and profile.
- **Roles:** The system supports `USER`, `MODERATOR`, and `ADMIN` roles.
- **Anonymous Posting:** Users who are not logged in can post anonymously.
- **Rate Limiting:** Anonymous users are rate-limited via a configurable database table.
- **API Design:** The API is efficient, with paginated endpoints to prevent over-fetching data.
- **Coding Style:** Endpoints are built with a higher-order function wrapper (`createApiHandler`) to keep business logic clean and separate from boilerplate (CORS, error handling).

## 3. Database Schema

- **`boards`**:
  - `id` (PK), `slug` (TEXT, unique), `name` (TEXT), `description` (TEXT)
- **`posts`**:
  - `id` (PK), `board_id` (FK), `user_id` (FK, nullable), `image_url` (TEXT), `comment` (TEXT), `poster_ip` (INET), `created_at`
- **`replies`**:
  - `id` (PK), `post_id` (FK), `user_id` (FK, nullable), `comment` (TEXT), `poster_ip` (INET), `created_at`
- **`profiles`**:
  - `id` (PK, FK to auth.users.id), `username` (TEXT, UNIQUE), `avatar_url` (TEXT), `role` (TEXT, default: 'USER')
- **`app_config`**:
  - `key` (TEXT, PK), `value` (TEXT)

## 4. API Endpoint Specification

| Endpoint                                                    | Description                                                   | Auth       | Body / Params                                 |
| :---------------------------------------------------------- | :------------------------------------------------------------ | :--------- | :-------------------------------------------- |
| **POST** `/functions/v1/create-user`                | Registers a new user and creates their profile.               | No         | `{ email, password, username }`             |
| **POST** `/functions/v1/login-user`                 | Authenticates a user and returns a session.                   | No         | `{ email, password }`                       |
| **POST** `/functions/v1/generate-avatar-upload-url` | Creates a secure, signed URL for uploading a profile picture. | Yes        | `{ file_type }`                             |
| **POST** `/functions/v1/set-avatar-url`             | Updates a user's pfp                                          | Yes        | `{ avatar_url }`                            |
| **POST** `/functions/v1/create-post`                | Creates a new image post (thread) on a specific board.        | Optional   | `{ board_slug, image_url, comment }`        |
| **POST** `/functions/v1/create-reply`               | Creates a new reply to a post.                                | Optional   | `{ parent_post_id, comment }`               |
| **GET** `/functions/v1/boards`                      | Retrieves a paginated list of all available boards.           | No         | `?limit=<num>&offset=<num>`                 |
| **GET** `/functions/v1/boards/{board_slug}/posts`   | Retrieves a paginated list of threads for a single board.     | No         | `?limit=<num>&offset=<num>`                 |
| **GET** `/functions/v1/posts/{post_id}`             | Retrieves a single thread and its paginated replies.          | No         | `?replies_limit=<num>&replies_offset=<num>` |
| **DELETE** `/functions/v1/posts/{post_id}`          | Deletes a specific post and all its replies.                  | Yes (Mod+) | *(None)*                                    |
| **DELETE** `/functions/v1/replies/{reply_id}`       | Deletes a specific reply.                                     | Yes (Mod+) | *(None)*                                    |
| **POST** `/functions/v1/generate-post-upload-url`  | Creates a secure, signed URL for uploading a new post image.  |            | { fileType }                                  |

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
