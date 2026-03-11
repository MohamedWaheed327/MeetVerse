(function () {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const tokenInput = document.getElementById('tokenInput');
    const meetingIdInput = document.getElementById('meetingIdInput');
    const joinBtn = document.getElementById('joinBtn');
    const clearBtn = document.getElementById('clearBtn');
    const statusEl = document.getElementById('status');
    const errorEl = document.getElementById('error');

    let sessionId = null;
    let connection = null;
    let myUserId = null;
    let isDrawing = false;
    let currentPoints = [];
    let eventsReplayed = [];

    function showError(msg) {
        errorEl.textContent = msg || '';
        errorEl.style.display = msg ? 'block' : 'none';
    }

    function setStatus(msg) {
        statusEl.textContent = msg || '';
    }

    function parseJwt(token) {
        try {
            const base64 = token.split('.')[1];
            return JSON.parse(atob(base64));
        } catch (_) {
            return {};
        }
    }

    function getUserIdFromToken(token) {
        const payload = parseJwt(token);
        return payload.sub || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || null;
    }

    function applyEvent(evt, skipIfSelf) {
        if (skipIfSelf && evt.userId === myUserId) return;
        if (evt.type === 'clear') {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        if (evt.type === 'draw' && evt.payloadJson) {
            let payload;
            try {
                payload = JSON.parse(evt.payloadJson);
            } catch (_) {
                return;
            }
            const points = payload.points || [];
            if (points.length < 2) return;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();
        }
    }

    function replayEvents(events) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        eventsReplayed = events || [];
        eventsReplayed.forEach(evt => applyEvent({
            type: evt.type,
            payloadJson: evt.payloadJson,
            userId: evt.userId
        }, false));
    }

    async function join() {
        const token = (tokenInput.value || '').trim();
        const meetingId = (meetingIdInput.value || '').trim();
        if (!token || !meetingId) {
            showError('Enter JWT token and Meeting ID.');
            return;
        }
        showError('');
        setStatus('Getting whiteboard session...');
        joinBtn.disabled = true;

        try {
            const sessionRes = await fetch('/api/meetings/' + encodeURIComponent(meetingId) + '/whiteboard', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (!sessionRes.ok) {
                const t = await sessionRes.text();
                throw new Error(sessionRes.status === 404 ? 'Meeting not found or access denied.' : (t || sessionRes.statusText));
            }
            const session = await sessionRes.json();
            sessionId = session.id;
            myUserId = getUserIdFromToken(token);

            setStatus('Loading existing strokes...');
            const eventsRes = await fetch('/api/whiteboard/sessions/' + sessionId + '/events', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (!eventsRes.ok) throw new Error('Failed to load whiteboard events.');
            const events = await eventsRes.json();
            replayEvents(events);

            const baseUrl = window.location.origin;
            connection = new signalR.HubConnectionBuilder()
                .withUrl(baseUrl + '/hubs/whiteboard?access_token=' + encodeURIComponent(token))
                .withAutomaticReconnect()
                .build();

            connection.on('Error', msg => {
                showError(msg);
                setStatus('Error: ' + msg);
            });
            connection.on('JoinedSession', id => {
                setStatus('Connected. Session: ' + id);
                clearBtn.disabled = false;
            });
            connection.on('ReceiveWhiteboardEvent', payload => {
                applyEvent({
                    type: payload.type,
                    payloadJson: payload.payloadJson,
                    userId: payload.userId
                }, true);
            });

            await connection.start();
            await connection.invoke('JoinSession', sessionId);
        } catch (e) {
            showError(e.message || 'Failed to join whiteboard.');
            setStatus('Join failed.');
            joinBtn.disabled = false;
        }
    }

    function sendEvent(type, payloadJson) {
        if (!connection || connection.state !== signalR.HubConnectionState.Connected || !sessionId) return;
        connection.invoke('SendWhiteboardEvent', sessionId, type, payloadJson).catch(err => {
            showError('Send failed: ' + (err.message || err));
        });
    }

    function getCoords(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        if (e.touches) {
            return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
        }
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    }

    function pointerDown(e) {
        if (!sessionId) return;
        e.preventDefault();
        isDrawing = true;
        const pt = getCoords(e);
        currentPoints = [pt];
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
    }

    function pointerMove(e) {
        if (!isDrawing || !sessionId) return;
        e.preventDefault();
        const pt = getCoords(e);
        currentPoints.push(pt);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
    }

    function pointerUp(e) {
        if (!isDrawing || !sessionId) return;
        e.preventDefault();
        isDrawing = false;
        if (currentPoints.length > 0) {
            sendEvent('draw', JSON.stringify({ points: currentPoints }));
        }
        currentPoints = [];
    }

    function clearBoard() {
        if (!sessionId) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        sendEvent('clear', '{}');
    }

    canvas.addEventListener('mousedown', pointerDown);
    canvas.addEventListener('mousemove', pointerMove);
    canvas.addEventListener('mouseup', pointerUp);
    canvas.addEventListener('mouseleave', pointerUp);
    canvas.addEventListener('touchstart', pointerDown, { passive: false });
    canvas.addEventListener('touchmove', pointerMove, { passive: false });
    canvas.addEventListener('touchend', pointerUp, { passive: false });

    joinBtn.addEventListener('click', join);
    clearBtn.addEventListener('click', clearBoard);
})();
