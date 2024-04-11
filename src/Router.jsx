import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import Main from './Layout/Main/Main';
import HomePage from './Pages/HomePage/HomePage';
import MeetingRoom from './Pages/MeetingRoom/MeetingRoom';
import Viewer from './Pages/OneToMany/Viewer';
import Broadcast from './Pages/OneToMany/Broadcast';

const Router = () => {
    const route = createBrowserRouter([
        {
            path: "/",
            element: <Main></Main>,
            children: [
                {
                    path: "/",
                    element: <HomePage></HomePage>
                },
                {
                    path: '/meeting-room/:meetingCode',
                    element: <MeetingRoom></MeetingRoom>
                },
                {
                    path: '/broadcast',
                    element: <Broadcast></Broadcast>
                },
                {
                    path: '/consumer',
                    element: <Viewer></Viewer>
                }
            ],
        }
    ]);
    return (
        <>
        <RouterProvider router={route} />
        </>
    );
};

export default Router;