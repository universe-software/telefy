if(navigator.serviceWorker)
    navigator.serviceWorker.register('sw.js').catch(() => null)

document.getElementById('random-id-btn').addEventListener('click', () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let id = ''

    for(let i = 0; i < 16; i++)
        id += chars.charAt(Math.floor(Math.random() * chars.length))
    
    document.getElementById('room-id').value = id
})

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

for(let i = 0; i < keyring.length; i++) {
    const key = keyring[i]
    const el = document.getElementById('template:keyring-entry').content.cloneNode(true).children[0]
    const exportBtn = el.querySelector('.telefy-keyring-entry-export-btn')
    openpgp.key.readArmored(key).then(armored => {
        const user = armored.keys[0].users[0].userId
        el.querySelector('.telefy-keyring-entry-name').textContent = user.name + '<' + user.email + '>'
        exportBtn.setAttribute('download', user.name + '-PUBLIC-key.pgp')
    })
    exportBtn.setAttribute('href', 'data:text/plain,' + encodeURIComponent(key))
    el.querySelector('.telefy-keyring-entry-remove-btn').addEventListener('click', () => {
        keyring.splice(i, 1)
        localStorage.setItem('keyring', JSON.stringify(keyring))
        el.parentElement.removeChild(el)
    })
    document.getElementById('trust-keyring').appendChild(el)
}

if(localStorage.getItem('private-key') == null) {
    for(const el of document.querySelectorAll('.telefy-no-user-key'))
        el.classList.remove('d-none')
} else {
    for(const el of document.querySelectorAll('.telefy-has-user-key'))
        el.classList.remove('d-none')
    
    for(const el of document.querySelectorAll('.telefy-user-key-text'))
        el.textContent = localStorage.getItem('key-name') + ' <' + localStorage.getItem('key-email') + '>'

    const exportPrivateKeyBtn = document.getElementById('export-private-key-btn')
    exportPrivateKeyBtn.setAttribute('href', 'data:text/plain,' + encodeURIComponent(localStorage.getItem('private-key')))
    exportPrivateKeyBtn.setAttribute('download', localStorage.getItem('key-name') + '-PRIVATE-key.pgp')
}

const exportPublicKeyBtn = document.getElementById('export-public-key-btn')

if(localStorage.getItem('public-key') == null) {
    exportPublicKeyBtn.classList.add('d-none')
    document.getElementById('no-public-key-message').classList.remove('d-none')
} else {
    exportPublicKeyBtn.setAttribute('href', 'data:text/plain,' + encodeURIComponent(localStorage.getItem('public-key')))
    exportPublicKeyBtn.setAttribute('download', localStorage.getItem('key-name') + '-PUBLIC-key.pgp')
}

const manageKeysModal = $('#manage-keys-modal')

const generateKeyModal = $('#generate-key-modal')
let openGenerateKeyModal = false
let openImportKeyModal = false

manageKeysModal.on('hidden.bs.modal', () => {
    if(openGenerateKeyModal) {
        openGenerateKeyModal = false
        generateKeyModal.modal('show')
    } else if(openImportKeyModal) {
        openImportKeyModal = false
        $('#import-key-modal').modal('show')
    }
})

document.getElementById('generate-user-key-btn').addEventListener('click', () => {
    openGenerateKeyModal = true
    manageKeysModal.modal('hide')
})

const generateKeyForm = document.getElementById('generate-key-form')
const generatingKeyMessage = document.getElementById('generating-key')
const generatedKeyMessage = document.getElementById('generated-key')
let generatedKey = false

generateKeyForm.addEventListener('submit', e => {
    e.preventDefault()
    const name = document.getElementById('key-name').value
    const email = document.getElementById('key-email').value
    
    generateKeyForm.classList.add('d-none')
    generatingKeyMessage.classList.remove('d-none')
    openpgp.generateKey({
        userIds: [{name, email}],
        rsaBits: 2048
    }).then(key => {
        localStorage.setItem('key-name', name)
        localStorage.setItem('key-email', email)
        localStorage.setItem('private-key', key.privateKeyArmored)
        localStorage.setItem('public-key', key.publicKeyArmored)
        generatedKey = true

        generatingKeyMessage.classList.add('d-none')
        generatedKeyMessage.classList.remove('d-none')
    })
})

generateKeyModal.on('hidden.bs.modal', () => {
    if(generatedKey)
        window.location.reload()

    generateKeyForm.classList.remove('d-none')
    generatingKeyMessage.classList.add('d-none')
    generatedKeyMessage.classList.add('d-none')
})

let importKeyReason
const importKeyMessage = document.getElementById('import-key-message')

document.getElementById('import-private-key-btn').addEventListener('click', () => {
    importKeyReason = 'private'
    importKeyMessage.innerHTML = 'Select your <b>private</b> key file.'
    openImportKeyModal = true
    manageKeysModal.modal('hide')
})

document.getElementById('import-public-key-btn').addEventListener('click', () => {
    importKeyReason = 'trust'
    importKeyMessage.innerHTML = 'Select a <b>public</b> key file to add it to your trust keyring so you can verify messages from that user.'
    openImportKeyModal = true
    manageKeysModal.modal('hide')
})

document.getElementById('import-key-form').addEventListener('submit', e => {
    e.preventDefault()
    const reader = new FileReader()
    reader.addEventListener('load', () => {
        if(importKeyReason == 'private') {
            localStorage.setItem('private-key', reader.result)
            openpgp.key.readArmored(reader.result).then(key => {
                localStorage.setItem('key-name', key.keys[0].users[0].userId.name)
                localStorage.setItem('key-email', key.keys[0].users[0].userId.email)
                importKeyReason = 'public'
                importKeyMessage.innerHTML = 'Now select your <b>public</b> key file.'
                document.getElementById('key-file').value = null
            })
        } else if(importKeyReason == 'public') {
            localStorage.setItem('public-key', reader.result)
            window.location.reload()
        } else {
            keyring.push(reader.result)
            localStorage.setItem('keyring', JSON.stringify(keyring))
            window.location.reload()
        }
    })
    reader.readAsText(document.getElementById('key-file').files[0])
})

document.getElementById('sign-out-btn').addEventListener('click', () => {
    localStorage.removeItem('private-key')
    localStorage.removeItem('public-key')
    window.location.reload()
})