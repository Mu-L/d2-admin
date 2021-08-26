import { computed, onBeforeUpdate, watch } from 'vue'
import { isBoolean, isArray } from 'lodash-es'
import { createPopper } from '@popperjs/core'
import { $, findElement } from 'd2-projects/d2-utils/vue.js'

/**
 * @param {boolean} props.visible
 * @param {boolean} props.disabled
 * @param {boolean} props.manualMode
 * @param {number} props.autoClose
 * @param {number} props.showAfter
 * @param {number} props.hideAfter
 * @param {string} props.trigger click | focus | hover | manual
 */
export function usePopper (props) {
  let instance = null

  const popperStyle = $({ zIndex: 1 })
  let triggerFocused = false

  const refTrigger = $(null)
  const refPopper = $(null)

  const optionsComputed = $(() => ({
    placement: 'bottom'
  }))

  const isManualMode = $(() => props.manualMode || props.trigger === 'manual')

  const hasVisibleProp = $(() => isBoolean(props.visible))
  const visible = $(!!props.visible)

  let showTimer = null
  let hideTimer = null

  const visibleComputed = computed({
    get () {
      return props.disabled
        ? false
        : (
            $(hasVisibleProp)
              ? props.visible
              : $(visible)
          )
    },
    set (val) {
      if ($(isManualMode)) return
      $(hasVisibleProp)
        ? emit('update:visible', val)
        : $(visible, val)
    },
  })

  const instanceMethod = name => instance[name] || (() => {})

  const destroy = () => instanceMethod('destroy')()
  const forceUpdate = () => instanceMethod('forceUpdate')()
  const setOptions = options => instanceMethod('setOptions')(options)

  function init () {
    const _trigger = findElement($(refTrigger))
    const _popper = $(refPopper)
    const _options = $(optionsComputed)
    instance = createPopper(_trigger, _popper, _options)
  }

  function _show() {
    if (props.autoClose > 0) {
      hideTimer = setTimeout(() => {
        _hide()
      }, props.autoClose)
    }
    visibleComputed.value = true
  }

  function _hide() {
    visibleComputed.value = false
  }

  function clearTimers() {
    clearTimeout(showTimer)
    clearTimeout(hideTimer)
  }

  const show = () => {
    if ($(isManualMode) || props.disabled) return
    clearTimers()
    if (props.showAfter === 0) {
      _show()
    } else {
      showTimer = setTimeout(() => {
        _show()
      }, props.showAfter)
    }
  }

  const hide = () => {
    if ($(isManualMode)) return
    clearTimers()
    if (props.hideAfter > 0) {
      hideTimer = setTimeout(() => {
        close()
      }, props.hideAfter)
    } else {
      close()
    }
  }

  const close = () => {
    _hide()
    if (props.disabled) {
      doDestroy(true)
    }
  }

  function doDestroy(force) {
    if (!instance || ($(visibleComputed) && !force)) return
    detachPopper()
  }

  function detachPopper() {
    destroy()
    instance = null
  }

  // ----


  const events = {}

  function update() {
    if (!$(visibleComputed)) {
      return
    }
    if (instance) {
      instanceMethod('update')()
    } else {
      init()
    }
  }

  function onVisibilityChange(toState) {
    if (toState) {
      popperStyle.value.zIndex ++
      init()
    }
  }

  if (!$(isManualMode)) {
    const toggleState = () => {
      if ($(visibility)) {
        hide()
      } else {
        show()
      }
    }

    const popperEventsHandler = (e) => {
      e.stopPropagation()
      switch (e.type) {
        case 'click': {
          if (triggerFocused) {
            // reset previous focus event
            triggerFocused = false
          } else {
            toggleState()
          }
          break
        }
        case 'mouseenter': {
          show()
          break
        }
        case 'mouseleave': {
          hide()
          break
        }
        case 'focus': {
          triggerFocused = true
          show()
          break
        }
        case 'blur': {
          triggerFocused = false
          hide()
          break
        }
      }
    }

    const triggerEventsMap = {
      click: ['onClick'],
      hover: ['onMouseenter', 'onMouseleave'],
      focus: ['onFocus', 'onBlur'],
    }

    const mapEvents = (t) => {
      triggerEventsMap[t].forEach(event => {
        events[event] = popperEventsHandler
      })
    }

    if (isArray(props.trigger)) {
      Object.values(props.trigger).forEach(mapEvents)
    } else {
      mapEvents(props.trigger)
    }
  }
  // ----

  watch(optionsComputed, options => {
    setOptions(options)
    update()
  })

  watch(visibleComputed, onVisibilityChange)

  onBeforeUpdate(() => {
    $(refTrigger, null)
    $(refPopper, null)
  })

  // watchPostEffect(init)

  return {
    popperRefTrigger: refTrigger,
    popperRefPopper: refPopper,
    popperInstance: instance,
    popperDestroy: destroy,
    popperUpdate: update,
    popperForceUpdate: forceUpdate,
    popperSetOptions: setOptions
  }
}
