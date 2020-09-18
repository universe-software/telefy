const params = new URLSearchParams(window.location.search)
const roomId = params.get('room')
document.getElementById('room-id').textContent = roomId
const userContainers = {}

const rtc = new RTCMultiConnection()
rtc.socketURL = 'https://rtcmulticonnection.herokuapp.com:443/'
rtc.session = {video: true}

rtc.onstream = e => {
    
    const video = createVideo()
    e.mediaElement.style.width = '100%'
    e.mediaElement.style.height = '100%'
    video.querySelector('.telefy-video-content').appendChild(e.mediaElement)
    root.appendChild(video)
}

rtc.openOrJoin('telefy:meeting:' + roomId)