import React, { useCallback } from 'react'
import styles from './Home.module.scss';
import { useNavigate } from 'react-router-dom';
import { useMyContext } from '../../hooks/useMyContext';
const Home = () => {
    const { roomName, setRoomName, email, setEmail } = useMyContext();
    const navigate = useNavigate();

    const submitHandler = useCallback((e) => {
        e.preventDefault();
        navigate('/room', { replace: true });
    }, [navigate]);

    return (
        <div className={styles.center}>
            <form onSubmit={submitHandler} action="#" className={styles.container}>
                <input name='email' autoComplete="on" onChange={(e) => setEmail(e.target.value)} value={email} type="email" placeholder='Email' required />
                <input name='room' autoComplete="on" onChange={(e) => setRoomName(e.target.value)} value={roomName} type="text" placeholder='Room Name' required />
                <input type="submit" value="Enter" />
            </form>
        </div>
    )
}

export default Home