# Project Context: Supabase Imgboard

## 1. High-Level Overview
This is an imgboard application built using Supabase as the backend. The architecture is API-first, meaning the frontend interacts with the database exclusively through custom Edge Functions written in TypeScript. This ensures security, allows for complex business logic, and keeps all sensitive operations on the server. The app supports multiple boards, user accounts, and moderation.

## 2. Core Features & Logic
- **Board-Based Structure:** Content is organized into different boards/categories (e.g., /tech/, /art/).
- **User Accounts:** Users can sign up and log in. Registered users have a profile with an avatar and a specific role.
- **Roles:** The system supports `USER`, `MODERATOR`, and `ADMIN` roles. Moderators can delete content.
- **Anonymous Posting:** Users who are not logged in can post anonymously.
- **Rate Limiting:** Anonymous users are rate-limited. The cooldown period and daily post limits are configurable via a database table, not hardcoded.
- **Content:**
    - **Threads:** A top-level post on a board, initiated with an image.
    - **Replies:** A comment made in response to a thread. Replies can link to other posts using `>>post_id` syntax.
- **API Design:** The API is designed to be efficient, with paginated endpoints for lists (boards, threads, replies) to prevent over-fetching data.

## 3. Database Schema

- **`boards`**: Stores board information.
  - `id` (PK), `slug` (TEXT, unique), `name` (TEXT), `description` (TEXT)
- **`posts`**: Stores the top-level thread posts.
  - `id` (PK), `board_id` (FK to boards.id), `user_id` (FK to auth.users.id, nullable), `image_url` (TEXT), `comment` (TEXT), `poster_ip` (INET, for anons), `created_at`
- **`replies`**: Stores replies to posts.
  - `id` (PK), `post_id` (FK to posts.id), `user_id` (FK to auth.users.id, nullable), `comment` (TEXT), `poster_ip` (INET, for anons), `created_at`
- **`profiles`**: Extends the `auth.users` table with public profile data.
  - `id` (PK, FK to auth.users.id), `avatar_url` (TEXT), `role` (TEXT, default: 'USER')
- **`app_config`**: Stores dynamic configuration variables to avoid hardcoding.
  - `key` (TEXT, PK), `value` (TEXT)

## 4. API Endpoint Specification

| Endpoint ID | Method / Path | Description | Query Parameters | Auth Required? |
| :--- | :--- | :--- | :--- | :--- |
| **API-101** | `POST /functions/v1/create-user` | Registers a new user and creates their profile. | *(None)* | No |
| **API-102** | `POST /functions/v1/login-user` | Authenticates a user and returns a session. | *(None)* | No |
| **API-103** | `POST /functions/v1/generate-avatar-upload-url` | Creates a secure, signed URL for uploading a profile picture. | *(None)* | **Yes** |
| **API-104** | `POST /functions/v1/update-profile` | Updates a user's profile data. | *(None)* | **Yes** |
| **API-201** | `POST /functions/v1/create-post` | Creates a new image post (thread) on a specific board. | *(None)* | Optional |
| **API-202** | `POST /functions/v1/create-reply` | Creates a new reply to a post. | *(None)* | Optional |
| **API-301** | `GET /functions/v1/boards` | Retrieves a **paginated** list of all available boards. | `limit`, `offset` | No |
| **API-302** | `GET /functions/v1/boards/{board_slug}/posts` | Retrieves a **paginated** list of threads for a single board. **Does not include replies.** | `limit`, `offset` | No |
| **API-303** | `GET /functions/v1/posts/{post_id}` | Retrieves a single thread (the OP) and a **paginated** list of its replies. | `replies_limit`, `replies_offset` | No |
| **API-501** | `DELETE /functions/v1/posts/{post_id}` | Deletes a specific post and all its replies. | *(None)* | **Yes (Moderator+)** |
| **API-502** | `DELETE /functions/v1/replies/{reply_id}` | Deletes a specific reply. | *(None)* | **Yes (Moderator+)** |
