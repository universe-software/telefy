const params = new URLSearchParams(window.location.search)
const roomId = params.get('room')
document.getElementById('room-id').textContent = roomId
const thread = params.get('thread')

if(thread)
    document.getElementById('subthread').classList.remove('d-none')

if(localStorage.getItem('keyring') == null)
    localStorage.setItem('keyring', '[]')
else {
    try {
        JSON.parse(localStorage.getItem('keyring'))
    } catch(e) {
        if(e instanceof SyntaxError)
            localStorage.setItem('keyring', '[]')
        else
            throw e
    }
}

const keyring = JSON.parse(localStorage.getItem('keyring'))

if(roomId == null)
    window.location = 'index.html'

if(localStorage.getItem('events:' + roomId) == null)
    localStorage.setItem('events:' + roomId, '{}')
else {
    try {
        JSON.parse(localStorage.getItem('events:' + roomId))
    } catch(e) {
        if(e instanceof SyntaxError)
            localStorage.setItem('events:' + roomId, '{}')
        else
            throw e
    }
}

const events = JSON.parse(localStorage.getItem('events:' + roomId))

function randomEventId() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let id

    do {
        id = ''

        for(let i = 0; i < 16; i++)
            id += chars.charAt(Math.floor(Math.random() * chars.length))
    } while(events[id])
    
    return id
}

const messages = {}

function randomMessageId() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let id

    do {
        id = ''

        for(let i = 0; i < 16; i++)
            id += chars.charAt(Math.floor(Math.random() * chars.length))
    } while(messages[id])
    
    return id
}

let openEditTextModal = false
const editModal = $('#edit-modal')
let editedMessage

editModal.on('hidden.bs.modal', () => {
    if(openEditTextModal) {
        openEditTextModal = false
        document.getElementById('edit-input').value = messages[editedMessage].events[messages[editedMessage].events.length - 1].content
        $('#edit-text-modal').modal('show')
    }
})

const editTextBtn = document.getElementById('edit-text-btn')

editTextBtn.addEventListener('click', () => {
    openEditTextModal = true
    editModal.modal('hide')
})

function createMessage(id, name, timestamp, content) {
    const el = document.getElementById('template:message').content.cloneNode(true).children[0]
    el.querySelector('.card-title').textContent = name
    const dateTime = new Date(timestamp)
    el.querySelector('.telefy-message-content').textContent = content
    const timeLabel = el.querySelector('.telefy-message-timestamp')
    timeLabel.textContent = new Date().toLocaleDateString() == dateTime.toLocaleDateString() ? dateTime.toLocaleTimeString() : dateTime.toLocaleString()
    const editList = document.querySelector('#edit-modal .modal-body')
    timeLabel.addEventListener('click', async () => {
        while(editList.firstChild)
            editList.removeChild(editList.firstChild)

        const edits = []
        
        for(const edit of messages[id].events)
            edits.push(edit)
        
        edits.sort((a, b) => new Date(a.timestamp) > new Date(b.timestamp) ? -1 : 1)
        
        for(const edit of edits) {
            const editEl = document.getElementById('template:edit').content.cloneNode(true).children[0]
            const editDateTime = new Date(edit.timestamp)
            editEl.querySelector('.card-title').textContent = editDateTime.toLocaleDateString() ? editDateTime.toLocaleTimeString() : editDateTime.toLocaleString()
            editEl.querySelector('.telefy-edit-content').textContent = edit.content
            editList.appendChild(editEl)
        }

        if(messages[id].sender == (await openpgp.key.readArmored(localStorage.getItem('public-key'))).keys[0].keyPacket.keyid.toHex())
            editTextBtn.classList.remove('d-none')
        else
            editTextBtn.classList.add('d-none')

        editedMessage = id
        editModal.modal('show')
    })
    el.querySelector('input[name="room"]').value = roomId
    el.querySelector('input[name="thread"]').value = id
    return el
}

let eventProcess

async function realProcessEvent(e) {
    console.log('started')
    const signature = await openpgp.signature.readArmored(e.signature)
    const sender = await openpgp.key.readArmored(e.sender)
    let found = false
    
    for(const trust of keyring.concat(localStorage.getItem('public-key'))) {
        const trustKeys = await openpgp.key.readArmored(trust)

        if(trustKeys.keys[0].keyPacket.keyid.toHex() == sender.keys[0].keyPacket.keyid.toHex()) {
            const verified =  await openpgp.verify({
                message: openpgp.cleartext.fromText(e.event),
                publicKeys: trustKeys.keys,
                signature
            })

            if(verified.signatures[0].valid) {
                const senderUser = sender.keys[0].users[0].userId
                const senderDisplay = senderUser.name + ' <' + senderUser.email + '>'
                const event = JSON.parse(e.event)

                if(event.type == 'message') {
                    if(Object.keys(messages).indexOf(event.messageId) > -1) {
                        if(sender.keys[0].keyPacket.keyid.toHex() == messages[event.messageId].sender) {
                            messages[event.messageId].events.push(event)
                            const dateTime = new Date(event.timestamp)
                            let maxDate = new Date(0)

                            for(const editEvent of messages[event.messageId].events) {
                                if(editEvent.id != event.id && new Date(editEvent.timestamp) > maxDate)
                                    maxDate = new Date(editEvent.timestamp)
                            }

                            if(dateTime > maxDate) {
                                messages[event.messageId].el.querySelector('.telefy-message-content').textContent = event.content
                                messages[event.messageId].el.querySelector('.telefy-message-timestamp').textContent = new Date().toLocaleDateString() == dateTime.toLocaleDateString() ? dateTime.toLocaleTimeString() : dateTime.toLocaleString()
                            }
                        }
                    } else {
                        messages[event.messageId] = {id: event.messageId, events: [event], replies: [], sender: sender.keys[0].keyPacket.keyid.toHex()}

                        if(Object.keys(messages).indexOf(event.thread) > -1) {
                            messages[event.thread].replies.push(messages[event.messageId])
                            const threadEl = messages[event.thread].el

                            if(threadEl) {
                                const replies = messages[event.thread].replies.length
                                threadEl.querySelector('.telefy-message-replies').textContent = replies
                                const pluralEl = threadEl.querySelector('.telefy-message-replies-plural')

                                if(replies == 1)
                                    pluralEl.textContent = 'y'
                                else
                                    pluralEl.textContent = 'ies'
                            }
                        }
                
                        if(event.thread == thread) {
                            const el = createMessage(event.messageId, senderDisplay, event.timestamp, event.content)
                            messages[event.messageId].el = el
                            const messagesWithElements = Object.keys(messages).map(message => messages[message]).filter(message => message.el != undefined)
                            messagesWithElements.sort((a, b) => Date.parse(a.events[0].timestamp) < Date.parse(b.events[0].timestamp) ? -1 : 1)
                            let inserted = false

                            for(const message of messagesWithElements) {
                                if(Date.parse(message.events[0].timestamp) > Date.parse(event.timestamp)) {
                                    document.querySelector('main').insertBefore(el, message.el)
                                    inserted = true
                                    break
                                }
                            }

                            if(!inserted)
                                document.querySelector('main').appendChild(el)
                        }
                    }
                }
            }

            found = true
            break
        }
    }

    if(!found) {
        if(confirm("You have received a message or event from an user who's not in your keyring. Do you want to add this user to the keyring so you can receive their messages?")) {
            keyring.push(e.sender)
            localStorage.setItem('keyring', JSON.stringify(keyring))
            processEvent(e)
        }
    }

    console.log('ended')
}

function processEvent(e) {
    if(eventProcess)
        eventProcess = eventProcess.then(() => realProcessEvent(e))
    else
        eventProcess = realProcessEvent(e)
}

const rtc = new RTCMultiConnection()
rtc.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/'
rtc.session = {data: true}

rtc.onmessage = e => {
    if(e.data.type == 'eventId') {
        if(Object.keys(events).indexOf(e.data.id) == -1)
            rtc.send({type: 'request', id: e.data.id})
    } else if(e.data.type == 'request') {
        if(Object.keys(events).indexOf(e.data.id) > -1)
            rtc.send(events[e.data.id])
    } else {
        if(Object.keys(events).indexOf(e.id) == -1) {
            events[e.data.id] = e.data
            localStorage.setItem('events:' + roomId, JSON.stringify(events))
            processEvent(e.data)
        }
    }
}

openpgp.key.readArmored(localStorage.getItem('private-key')).then(keys => {
    function sendMessage(messageId, content) {
        const id = randomEventId()
        const event = JSON.stringify({
            id,
            messageId,
            thread,
            type: 'message',
            room: roomId,
            timestamp: new Date().toUTCString(),
            content
        })
        openpgp.sign({
            message: openpgp.cleartext.fromText(event),
            privateKeys: keys.keys,
            detached: true
        }).then(signature => {
            const data = {
                id,
                sender: localStorage.getItem('public-key'),
                signature: signature.signature,
                event
            }
            rtc.send(data)
            events[data.id] = data
            localStorage.setItem('events:' + roomId, JSON.stringify(events))
            processEvent(data)
        })
    }
    
    document.getElementById('send-form').addEventListener('submit', e => {
        e.preventDefault()
        const input = document.getElementById('message-input')
        sendMessage(randomMessageId(), input.value)
        input.value = ''
        return false
    })

    document.getElementById('edit-form').addEventListener('submit', e => {
        e.preventDefault()
        const input = document.getElementById('edit-input')
        sendMessage(editedMessage, input.value)
        $('#edit-text-modal').modal('hide')
        return false
    })
})

rtc.onopen = () => {
    for(const eventId of Object.keys(events)) {
        console.log('Sending: ' + eventId)
        rtc.send({type: 'eventId', id: eventId})
    }
}

rtc.openOrJoin('telefy:' + roomId)

for(const eventId of Object.keys(events))
    processEvent(events[eventId])