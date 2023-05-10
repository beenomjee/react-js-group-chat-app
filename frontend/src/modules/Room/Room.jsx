import React, { useEffect, useRef, useState } from 'react'
import styles from './Room.module.scss';
import { useMyContext } from '../../hooks/useMyContext';
import { addPeer, createAnswer } from '../../utils';
import { MdCallEnd } from 'react-icons/md'
import { IconButton } from '../../components'

const Room = () => {
    const { socket, roomName, email, setRoomName } = useMyContext();
    const [users, setUsers] = useState([]);
    const localVideoRef = useRef(null);
    const selectedVideoRef = useRef(null);
    const remoteVideosContainerRef = useRef(null);
    const localStream = useRef(null);
    const [answerNeedToSet, setAnswerNeedToSet] = useState([]);
    const [candidateNeedToSet, setCandidateNeedToSet] = useState([])
    const [removeUserWhichLeave, setRemoveUserWhichLeave] = useState([]);

    const oldRoomJoining = async ({ users }) => {
        if (!localStream.current)
            await getLocalStream();
        for (let user of users) {
            const [peer, offer] = await addPeer(user.socketId, localStream.current, remoteVideosContainerRef.current, selectedVideoRef.current)
            socket.emit('offer', { to: user.socketId, offer });

            // add event for icecandidate
            peer.onicecandidate = async function (e) {
                if (e.candidate) {
                    socket.emit('candidate', { to: user.socketId, candidate: e.candidate });
                }
            }

            setUsers(prev => ([
                ...prev,
                {
                    user,
                    peer
                }
            ]))
        }
    }

    const newRoomCreated = () => {
        console.log('New room created!');
        alert('New Room Created Successfully!');
    }

    const newOfferReceived = async ({ user, offer }) => {
        if (!localStream.current)
            await getLocalStream();
        const [peer, answer] = await createAnswer(user.socketId, localStream.current, remoteVideosContainerRef.current, offer, selectedVideoRef.current);
        socket.emit('answer', { to: user.socketId, answer });

        // add event for icecandidate
        peer.onicecandidate = async function (e) {
            if (e.candidate) {
                socket.emit('candidate', { to: user.socketId, candidate: e.candidate });
            }
        }

        setUsers(prev => ([
            ...prev,
            {
                user,
                peer
            }
        ]))
    }

    const answerRecieved = async ({ user, answer }) => {
        const peer = users.find(u => { return u.user.socketId === user.socketId });
        if (!peer) {
            setAnswerNeedToSet(prev => [
                ...prev,
                { user, answer }
            ])
            return;
        }
        await peer.setLocalDescription(answer);
    }

    const onIceCandidate = async ({ user, candidate }) => {
        const peer = users.find(u => { return u.user.socketId === user.socketId });
        if (!peer) {
            setCandidateNeedToSet(prev => [
                ...prev,
                { user, candidate }
            ])
            return;
        }
        await peer.peer.addIceCandidate(candidate)
    }

    const onLeavePeer = async ({ socketId }) => {
        const peerIndex = users.findIndex(u => { return u.user.socketId === socketId });
        if (peerIndex !== -1) {
            await users[peerIndex].peer.close();
            setUsers(prev => {
                let nowUsers = prev.splice(peerIndex, 1);
                return nowUsers;
            })
            remoteVideosContainerRef.current.querySelector(`#a${socketId}`)?.remove();
        } else {
            setRemoveUserWhichLeave(prev => [
                ...prev,
                socketId
            ])
        }
    }

    const getLocalStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            localVideoRef.current.srcObject = stream;
            localStream.current = stream;
            console.log(stream);
        } catch (err) {
            alert("These permissions are required to access any room.");
            setRoomName('');
        }
    };

    // send signal at start
    useEffect(() => {
        socket.emit('user:join', { email, roomName });
    }, [])

    // useEffect for answer which are not set yet!
    useEffect(() => {
        if (answerNeedToSet.length === 0)
            return;

        const setRemainingAnswers = async () => {
            for (let answer of answerNeedToSet) {
                const peer = users.find(u => { return u.user.socketId === answer.user.socketId });
                if (!peer) {
                    alert("Something went wrong. Please again joint the room!");
                    return;
                }
                await peer.peer.setRemoteDescription(answer.answer);
            }
            setAnswerNeedToSet([]);
        }
        setRemainingAnswers();
    }, [users, answerNeedToSet]);

    // useEffect for candidate which are not set yet!
    useEffect(() => {
        if (candidateNeedToSet.length === 0)
            return;

        const setRemainingCandidate = async () => {
            for (let candidate of candidateNeedToSet) {
                const peer = users.find(u => { return u.user.socketId === candidate.user.socketId });
                if (!peer) {
                    console.log('CANDIDATE ERROR');
                    return;
                }
                console.log(peer);
                await peer.peer.addIceCandidate(candidate.candidate);
            }
            setCandidateNeedToSet([]);
        }
        setRemainingCandidate();
    }, [users, candidateNeedToSet]);

    // useEffect for leave which are not set yet!
    useEffect(() => {
        if (removeUserWhichLeave.length === 0)
            return;

        const setRemainingUsers = async () => {
            for (let socketId of removeUserWhichLeave) {
                const peerIndex = users.findIndex(u => { return u.user.socketId === socketId });
                if (peerIndex !== -1) {
                    await users[peerIndex].peer.close();
                    setUsers(prev => {
                        let nowUsers = prev.splice(peerIndex, 1);
                        return nowUsers;
                    })
                    remoteVideosContainerRef.current.querySelector(`#a${socketId}`)?.remove();
                }
            }
            setRemoveUserWhichLeave([]);
        }
        setRemainingUsers();
    }, [users, removeUserWhichLeave]);

    // socket handles
    useEffect(() => {
        socket.on("room:old", oldRoomJoining)
        socket.on("room:new", newRoomCreated)
        socket.on("offer", newOfferReceived);
        socket.on("answer", answerRecieved);
        socket.on("candidate", onIceCandidate)
        socket.on('user:leave', onLeavePeer);
    }, []);

    const changeSelctedVideo = (e) => {
        const stream = e.target.srcObject
        selectedVideoRef.current.srcObject = stream
        console.log(selectedVideoRef.current, stream);
    }

    const leaveRoomHandler = async (e) => {
        socket.emit('room:leave', {});
        for (let { peer } of users) {
            await peer.close();
        }
        localStream.current && localStream.current.getTracks().forEach(function (track) {
            if (track.readyState == 'live') {
                track.stop();
            }
        });
        setRoomName('');
    }

    return (
        <div className={styles.container}>
            <div className={styles.sideVideos} ref={remoteVideosContainerRef}>
                <video onClick={changeSelctedVideo} muted ref={localVideoRef} src='#' playsInline autoPlay></video>
            </div>
            <video ref={selectedVideoRef} className={styles.selectedVideo} src='#' muted playsInline autoPlay></video>
            <div className={styles.buttons}>
                <IconButton onClick={leaveRoomHandler}><MdCallEnd /></IconButton>
            </div>
        </div>
    )
}

export default Room;