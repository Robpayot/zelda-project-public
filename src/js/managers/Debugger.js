// Vendor
import { Pane } from 'tweakpane'
import * as EssentialsPlugin from '@tweakpane/plugin-essentials'
import * as TweakpanePluginMedia from 'tweakpane-plugin-media'

// Modules
// import EventDispatcher from '@/js/modules/EventDispatcher'

// Configs
// import GLOBAL from '@/js/configs/global'

const DEBUGGER_STYLE = `.tweakpane {
    z-index: 100;

    position: fixed;
    top: 0;
    right: 0;

    width: 256px;
    max-height: 100vh;
    overflow: auto;
}

/* Tweakpane style override */
.tp-fldv_c > .tp-cntv {
    margin-left: 0 !important;
}

.tp-tabv_c .tp-brkv > .tp-cntv {
    margin-left: 0 !important;
}`

class Debugger {
  #tabs = null
  #pane
  #isTabPlaceholderRemoved
  constructor() {
    this.#pane = this._createPane()
  }

  destroy() {
    this.#pane.dispose()
  }

  /**
   * Getters & Setters
   */

  get pane() {
    return this.#pane
  }

  /**
   * Public
   */
  addTab(title) {
    if (!this.#tabs) {
      this.#tabs = this._createTabs()
    }

    this.#tabs.addPage({ title })
    this._removeTabPlaceholder()
  }

  gotoTab(name) {
    this.#tabs.pages.forEach((page) => {
      if (page.title === name) page.selected = true
    })
  }

  removeTabs() {
    this.#tabs.dispose()
    this.#tabs = null
  }

  addFolder(options) {
    const { tab } = options

    const expanded = JSON.parse(localStorage.getItem(`debugger-folder-${options.title}-expanded`))
    if (expanded !== null) {
      options.expanded = expanded
    } else {
      options.expanded = false
    }

    let folder
    if (tab) {
      const tabLayer = this._getTab(tab)
      folder = tabLayer.addFolder(options)
    } else {
      folder = this.#pane.addFolder(options)
    }

    folder.on('fold', ({ expanded, target }) => {
      localStorage.setItem(`debugger-folder-${target.title}-expanded`, expanded)
    })
    return folder
  }

  /**
   * Private
   */
  _createPane() {
    const style = document.createElement('style')
    style.appendChild(document.createTextNode(DEBUGGER_STYLE))
    document.head.appendChild(style)

    const container = document.createElement('div')
    container.classList.add('tweakpane')
    document.body.appendChild(container)

    const pane = new Pane({
      title: 'Debugger',
      container: document.querySelector('.tweakpane'),
      expanded: JSON.parse(localStorage.getItem('debugger-expanded')),
    }).on('fold', ({ expanded }) => {
      localStorage.setItem('debugger-expanded', expanded)
    })
    pane.registerPlugin(EssentialsPlugin)
    pane.registerPlugin(TweakpanePluginMedia)
    return pane
  }

  _createTabs() {
    this.#isTabPlaceholderRemoved = false
    const tabs = this.#pane.addTab({ pages: [{ title: '' }] })
    tabs.on('select', (e) => {
      this.dispatchEvent('tab:change', e.target.pages[e.index].title)
    })
    return tabs
  }

  _removeTabPlaceholder() {
    if (!this.#isTabPlaceholderRemoved) {
      this.#tabs.removePage(0)
      this.#isTabPlaceholderRemoved = true
    }
  }

  _getTab(name) {
    const pages = this.#tabs.pages
    for (let i = 0, len = pages.length; i < len; i++) {
      if (pages[i].title === name) return pages[i]
    }
    return null
  }
}

let instance = null

if (import.meta.env.MODE === "development") {
  instance = new Debugger()
}

export default instance
