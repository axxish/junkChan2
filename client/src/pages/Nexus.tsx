// src/pages/BoardPage.tsx
import { Outlet, Route, Routes, useParams } from "react-router"; // Use react-router-dom
import { useAppDispatch, useAppSelector } from "../store";
import { Page404 } from "./Page404";
import { useEffect } from "react";
import { fetchBoards } from "../slices/boardsSlice";
import { IconHome } from "@tabler/icons-react";
import { ThreadList } from "./ThreadList";

// Import our new styled components
import {
  MainContent,
  Navbar,
  PageContainer
} from "./Nexus.styled";
import { Anchor, Center, Space } from "../components/Common";

export function Nexus() {


  return (
    <PageContainer>
      <Navbar>
        <Space $height={"lg"} />
        <Anchor to="/">Home</Anchor>


        <Anchor to="/login">Login | Sign up</Anchor>
      </Navbar>

      <MainContent>
        <Outlet />

      </MainContent>
    </PageContainer >
  );
}