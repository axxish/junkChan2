// src/pages/BoardPage.tsx
import { Outlet} from "react-router"; // Use react-router-dom

// Import our new styled components
import {
  MainContent,
  Navbar,
  PageContainer
} from "./Nexus.styled";
import { Anchor, Space } from "../components/Common";

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