import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import './HomePage.css';

// Assuming you have a logo image in your assets folder
const logo = 'https://i.ibb.co/Pc1Qg5P/logo.png';

function HomePage() {
    const { socket } = useSelector((state) => state.socket);
    const navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState('');
    const [meetingEmail, setMeetingEmail] = useState('');

    const handleJoinMeeting = useCallback((data) => {
        navigate(`/meeting-room/${data.meetingCode}`);
    }, [navigate]);

    useEffect(() => {
        socket.on('meeting-created', handleJoinMeeting);
        socket.on('meeting-joined', handleJoinMeeting); // Add this line
        return () => {
            socket.off('meeting-created', handleJoinMeeting);
            socket.off('meeting-joined', handleJoinMeeting); // Add this line
        };
    }, [socket, handleJoinMeeting]);

    const createNewMeeting = () => {
        socket.emit('create-new-meeting', { email: meetingEmail, meetingCode: null });
    };

    const joinMeeting = () => {
        socket.emit('join-meeting', { email: meetingEmail, meetingCode: meetingCode });
    };

    return (
        <div className="home-container">
            <header className="home-header">
                <img src={logo} alt="Logo" className="home-logo" />
                <h1>Welcome to MyMeet</h1>
            </header>
            <main className="home-main">
                <div className="action-container">
                    <input
                        type="text"
                        placeholder='Enter meeting Email'
                        className="meeting-code-input"
                        value={meetingEmail}
                        onChange={(e) => setMeetingEmail(e.target.value)}
                    />

                    <button className="action-button" onClick={createNewMeeting}>
                        New Meeting
                    </button>
                    <div className="join-meeting">

                        <input
                            type="text"
                            placeholder="Enter meeting code"
                            className="meeting-code-input"
                            value={meetingCode}
                            onChange={(e) => setMeetingCode(e.target.value)}
                        />
                        <button className="action-button" onClick={joinMeeting}>
                            Join
                        </button>
                    </div>
                    <div>
            <button className="action-button" onClick={joinMeeting}>
                            <Link to="/broadcast"> Broad cast</Link>
                        </button>
                        <br />
                        <button className="action-button" onClick={joinMeeting}>
                            <Link to="/consumer"> View</Link>
                        </button>
            </div>
                </div>
                
            </main>
            
            <footer className="home-footer">
                <p>© 2024 MyMeet. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default HomePage;
