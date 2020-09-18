const cacheName = 'telefy-0'
const files = [
    'index.html',
    'chat.html',
    'favicon.png',
    //'style.css',
    'lib/bootstrap.css',
    'lib/fontawesome.css',
    'lib/socket.io.js',
    'lib/RTCMultiConnection.js',
    'main.js',
    'chat.js',
    //'window-manager.js',
    'lib/jquery.js',
    'lib/popper.js',
    'lib/bootstrap.js',
    'lib/openpgp.js',
    'lib/webfonts/fa-brands-400.woff',
    'lib/webfonts/fa-solid-900.woff2',
    'lib/webfonts/fa-brands-400.woff2',
    'lib/webfonts/fa-regular-400.svg',
    'lib/webfonts/fa-regular-400.eot',
    'lib/webfonts/fa-solid-900.ttf',
    'lib/webfonts/fa-brands-400.svg',
    'lib/webfonts/fa-brands-400.ttf',
    'lib/webfonts/fa-regular-400.woff',
    'lib/webfonts/fa-solid-900.svg',
    'lib/webfonts/fa-regular-400.ttf',
    'lib/webfonts/fa-solid-900.woff',
    'lib/webfonts/fa-regular-400.woff2',
    'lib/webfonts/fa-solid-900.eot',
    'lib/webfonts/fa-brands-400.eot'
]

self.addEventListener('install', e => {
    self.skipWaiting()
    
    e.waitUntil(
        caches.open(cacheName).then(cache => cache.addAll(files))
    )
})

self.addEventListener('fetch', e => {
    const url = new URL(e.request.url)
    
    if(url.host == 'rtcmulticonnection.herokuapp.com')
        e.respondWith(fetch(e.request))
    else {
        url.search = ''
        url.fragment = ''
        const request = new Request(url)

        e.respondWith(caches.match(request).then(r =>
            r || fetch(request).then(
                res => caches.open(cacheName).then(cache => {
                    cache.put(request, res.clone())
                    return res
                })
            )
        ))
    }
})

self.addEventListener('activate', e => e.waitUntil(
    caches.keys().then(keys => Promise.all(
        keys.map(key => {
            if(key != cacheName)
                return caches.delete(key)
        })
    ))
))