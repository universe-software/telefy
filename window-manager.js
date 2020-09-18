let nextWindowID = 0
let moveElement = null

function createVideo() {
    const el = document.getElementById('template:video').content.cloneNode(true).children[0]
    makeMovable(el)
    el.id = 'telefy-window-' + nextWindowID
    nextWindowID++
    return el
}

function createContainer(parent) {
    const el = document.getElementById('template:group').content.cloneNode(true).children[0]
    parent.appendChild(el)
    const btn = el.querySelector('.telefy-group-mode-btn')
    const container = el.querySelector('.telefy-group-content')

    function closePopover() {
        btn.popper.destroy()
        btn.popper = undefined
        btn.popover.parentElement.removeChild(btn.popover)
        btn.popover = undefined
    }

    function setMode(mode) {
        el.dataset.mode = mode
        const icon = btn.children[0]
        icon.classList.remove('fa-grip-lines-vertical')
        icon.classList.remove('fa-grip-lines')
        icon.classList.remove('fa-grip-ellipsis-h')
        icon.classList.add({
            'horizontal': 'fa-grip-lines-vertical',
            'vertical': 'fa-grip-lines',
            'tabs': 'fa-ellipsis-h'
        }[mode])

        switch(mode) {
            case 'horizontal':
                container.classList.remove('flex-column', 'tab-content')
                container.classList.add('flex-row')
                el.querySelector('.nav').classList.add('invisible')
                break
            case 'vertical':
                container.classList.remove('flex-row', 'tab-content')
                container.classList.add('flex-column')
                el.querySelector('.nav').classList.add('invisible')
                break
            case 'tabs':
                const nav = el.querySelector('.nav')
                nav.classList.remove('invisible')
                container.classList.add('tab-content')

                for(const tab of nav.children)
                    nav.removeChild(tab)

                for(let i = 0; i < container.children.length; i++) {
                    const child = container.children[i]
                    const tab = document.createElement('li')
                    tab.className = 'nav-item'
                    const tabLink = document.createElement('a')
                    tabLink.className = 'nav-link'
                    tabLink.dataset.toggle = 'tab'
                    tabLink.href = '#' + child.id
                    tabLink.textContent = child.querySelector('.telefy-window-title').textContent
                    tab.appendChild(tabLink)
                    nav.appendChild(tab)

                    if(i == 0) {
                        tabLink.classList.add('active')
                        child.classList.add('active')
                    } else
                        child.classList.remove('active')
                }
        }

        if(btn.popper)
            closePopover()
    }

    setMode('horizontal')
    btn.addEventListener('click', () => {
        if(btn.popper)
            closePopover()
        else {
            btn.popover = document.getElementById('template:group-mode-popover').content.cloneNode(true).children[0]

            btn.popover.querySelector('.telefy-group-mode-horizontal').addEventListener('click', () => setMode('horizontal'))
            btn.popover.querySelector('.telefy-group-mode-vertical').addEventListener('click', () => setMode('vertical'))
            btn.popover.querySelector('.telefy-group-mode-tabs').addEventListener('click', () => setMode('tabs'))

            parent.appendChild(btn.popover)
            btn.popper = new Popper(btn, btn.popover)
        }
    })

    el.querySelector('.telefy-window-bar').addEventListener('click', () => {
        if(moveElement) {
            if(el.dataset.mode == 'tabs')
                alert("Can't move a window into a tabbed group.")
            else {
                try {
                    container.appendChild(moveElement)
                } catch(e) {
                    if(e instanceof DOMException)
                        alert("Can't move a group into itself or any group inside it.")
                    else
                        throw e
                }
            }
            
            moveElement = null
        }
    })

    makeMovable(el)
    el.id = 'telefy-window-' + nextWindowID
    nextWindowID++
    return el
}

function makeMovable(el) {
    const controlsBtn = el.querySelector('.telefy-controls-btn')

    function closePopover() {
        el.controlsPopper.destroy()
        el.controlsPopper = undefined
        document.body.removeChild(el.controlsPopover)
        el.controlsPopover = undefined
    }

    controlsBtn.addEventListener('click', () => {
        if(el.controlsPopover)
            closePopover()
        else {
            el.controlsPopover = document.getElementById('template:window-controls-popover').content.cloneNode(true).children[0]
            document.body.appendChild(el.controlsPopover)
            el.controlsPopper = new Popper(controlsBtn, el.controlsPopover)

            el.controlsPopover.querySelector('.telefy-move-btn').addEventListener('click', e => {
                if(el.parentElement.parentElement.dataset.mode == 'tabs')
                    alert("Can't move a window out of a tabbed group.")
                else {
                    e.stopPropagation()
                    moveElement = el
                }

                closePopover()
            })
        
            el.controlsPopover.querySelector('.telefy-move-back-btn').addEventListener('click', () => {
                const i = Array.prototype.indexOf.call(el.parentElement.children, el)
        
                if(i > 0)
                    el.parentElement.insertBefore(el, el.parentElement.children[i - 1])
                
                closePopover()
            })
        
            el.controlsPopover.querySelector('.telefy-move-forward-btn').addEventListener('click', () => {
                const i = Array.prototype.indexOf.call(el.parentElement.children, el)
        
                if(i < el.parentElement.children.length)
                    el.parentElement.insertBefore(el, el.parentElement.children[i - 1])
                
                closePopover()
            })
        
            el.controlsPopover.querySelector('.telefy-wrap-btn').addEventListener('click', 
                () => {
                    createContainer(el.parentElement).querySelector('.telefy-group-content').appendChild(el)
                    closePopover()
                }
            )
        }
    })
}

const root = createContainer(document.body).querySelector('.telefy-group-content')
/*root.appendChild(createVideo())
const sub = createContainer(root).querySelector('.telefy-group-content')
sub.appendChild(createVideo())
sub.appendChild(createVideo())*/