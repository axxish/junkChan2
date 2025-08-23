import { type Post, type PostViewAction, type UserProfile } from "../util/types";
import { Group, Stack } from "./FlexContainer";
import { Text, Image, Title, Anchor, StatusText, Paper } from "./Common";
import { styled } from "styled-components";
import type { JSX } from "react";

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

const PostPaper = styled(Paper)`
    width: fit-content;
    background-color: ${({theme})=>theme.colors.replyBg};
`;

export function PostView({ p, u, isReply, action }: { p: Post, u?: UserProfile, isReply?: boolean, action?: PostViewAction}) {


    if (!p) {
        return (<StatusText>whoops! this pos could not be loaded!</StatusText>);
    }
    let op: UserProfile = { username: "Anonymous", id: "anon", avatar_url: null, role: "anon" };

    if (u && u.id !== null) {
        op = u;
    }

    let titleContent = (<></>);

    if (p.subject !== null) {
        titleContent = (<PostTitle>{p.subject} <br></br></PostTitle>);
    }

    const dateObj = new Date(p.created_at);

    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    const hour = dateObj.getHours().toString().padStart(2, '0');
    const minute = dateObj.getMinutes().toString().padStart(2, '0');
    const textDay = dateObj.toLocaleString("en-GB", { weekday: "short" });


    const dateString = `${day}/${month}/${year} ${textDay} ${hour}:${minute}`;

    let actionBtn = (<></>);
    
    if(action?.type==="View"){
        actionBtn = (<>[ <Anchor $s={"xs"} to={`threads/${action.post_id}`}>View thread</Anchor> ]</>);
    }

    const content = (<Stack $justify="flex-start" $align="flex-start" $p="sm">
        <div style={{ display: "inline-block" }}>
            {titleContent}
            <PostData>by  {op.username} at: {dateString} {actionBtn}</PostData>
        </div>
        <Group $gap="sm" >
            {p.image_url && <Image src={p.image_url} style={{ maxWidth: "200px" }} alt="Thread image" />}
            <Text $s={"md"}>{p.comment}</Text>
        </Group>
    </Stack>);

    if (isReply) {
        return (<PostPaper>
            {content}
        </PostPaper>);
    }
    return (<>{content}</>);
}