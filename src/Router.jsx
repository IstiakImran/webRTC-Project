import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import Main from './Layout/Main/Main';
import HomePage from './Pages/HomePage/HomePage';
import MeetingRoom from './Pages/MeetingRoom/MeetingRoom';

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