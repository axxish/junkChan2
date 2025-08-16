
import '@mantine/core/styles.css';

import { Home } from './pages/Home';

import { BrowserRouter, Routes, Route } from 'react-router';


import { ActionIcon, Container, MantineProvider, useMantineColorScheme } from '@mantine/core';
import {IconMoon} from "@tabler/icons-react";
import { BoardPage } from './pages/BoardPage';


function App() {
  //const { toggleColorScheme} = useMantineColorScheme();
  const colorScheme = useMantineColorScheme();
  
  return (
    <BrowserRouter>
        
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/boards/:slug/*" element={<BoardPage></BoardPage>}/>
          </Routes>
       
        <ActionIcon visibleFrom='sm' styles={{root:{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 1000,
        }}} size="xl" variant='filled' onClick={()=>{colorScheme.toggleColorScheme();}} radius="xl" >
          <IconMoon />
          
        </ActionIcon>
    </BrowserRouter>
  )
}

export default App
