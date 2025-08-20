// src/components/ThreadPreview.tsx (or wherever it's located)
import { type ThreadPreview } from "../util/types";
import {
  HorizontalGroup,
  PostImage,
  StyledDivider,
  StyledText,
  ThreadContainer,
  Username,
  VerticalStack,
} from "./ThreadPreview.styled";

export function ThreadPreviewComponent({ thread }: { thread: ThreadPreview }) {
  const { users } = thread;

  let op = users.find((user) => user.id === thread.user_id);
  
  // Provide a default "Anonymous" user object if OP is not found
  if (!op) {
    op = { id: "null", username: "Anonymous", avatar_url: "", role: "USER" };
  }

  return (
    <ThreadContainer key={thread.id}>
      <VerticalStack>
        <HorizontalGroup>
          <Username>{op.username}</Username>
        </HorizontalGroup>
        
        <HorizontalGroup gap="sm" style={{ alignItems: 'flex-start' }}>
          {thread.image_url && <PostImage src={thread.image_url} alt="Thread image" />}
          <StyledText>{thread.comment}</StyledText>
        </HorizontalGroup>
      </VerticalStack>
      
      <StyledDivider />
    </ThreadContainer>
  );
}