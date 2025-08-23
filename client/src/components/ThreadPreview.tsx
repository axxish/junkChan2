// src/components/ThreadPreview.tsx (or wherever it's located)
import { type ThreadPreview } from "../util/types";
import { Group, Stack } from "./FlexContainer";
import { Text, Image, Title, Anchor } from "./Common";
import { styled } from "styled-components";

const PostTitle = styled.h4`
    margin: 0;
    color: ${({ theme }) => theme.colors.postTitle};
  `;

const PostData = styled.span`
  color: ${({ theme }) => theme.colors.greyText};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

//todo: move to common
const ProfilePicture = styled(Image)`
  width: ${({ theme }) => theme.fontSizes.xs};
  display: inline;
  `;

export function ThreadPreviewComponent({ thread }: { thread: ThreadPreview }) {
  const { users } = thread;

  let op = users.find((user) => user.id === thread.user_id);

  const dateObj = new Date(thread.created_at);

  const year = dateObj.getFullYear();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getDate().toString().padStart(2, '0');
  const hour = dateObj.getHours().toString().padStart(2, '0');
  const minute = dateObj.getMinutes().toString().padStart(2, '0');
  const textDay = dateObj.toLocaleString("en-GB", { weekday: "short" });


  const dateString = `${day}/${month}/${year} ${textDay} ${hour}:${minute}`;

  // Provide a default "Anonymous" user object if OP is not found
  if (!op) {
    op = { id: "null", username: "Anonymous", avatar_url: "", role: "USER" };
  }
  let imgTag;
  if (op.avatar_url) {

    imgTag = (<ProfilePicture src={op.avatar_url}></ProfilePicture>);
  }


  return (
    <Stack $justify="flex-start" $align="flex-start" $p="sm">
      <Group $gap={"xs"} $align="flex-end">
        <PostTitle>{thread.subject}</PostTitle>
        <PostData>by   {imgTag} {op.username} at: {dateString} [<Anchor $s={"md"} to="">Join the discussion</Anchor>]
        </PostData>
      </Group>
      <Group $gap="sm" >
        {thread.image_url && <Image src={thread.image_url} style={{ maxWidth: "200px" }} alt="Thread image" />}
        <Text>{thread.comment}</Text>
      </Group>
    </Stack>

  );
}