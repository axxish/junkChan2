// src/components/ThreadPreview.tsx (or wherever it's located)
import { type Thread, type UserProfile } from "../util/types";
import { Group, Stack } from "./FlexContainer";
import { Text, Image, Title, Anchor, StatusText } from "./Common";
import { styled } from "styled-components";
import { PostView } from "./PostView";

const PostTitle = styled.h4`
    margin: 0;
    color: ${({ theme }) => theme.colors.postTitle};
    display: inline-block;
    padding-right: ${({ theme }) => theme.spacing["3xs"]};
  `;

const PostData = styled.span`
  color: ${({ theme }) => theme.colors.greyText};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;


export function ThreadPreviewComponent({ thread }: { thread: Thread }) {

  const { users } = thread;
  if (!thread) {
    return (<StatusText>whoops! this thread could not be loaded!</StatusText>);
  }
  let op: UserProfile = { username: "Anonymous", id: "anon", avatar_url: null, role: "anon" };

  if (thread.op.user_id !== null) {
    op = users[thread.op.user_id];
  }

  return (
   <PostView p={thread.op} u={op}></PostView>
  );
}