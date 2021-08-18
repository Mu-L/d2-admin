import {
  isFunction,
  keys,
  mapValues,
  isEqual,
  last,
  isUndefined
} from 'lodash-es'
import {
  defineComponent,
  provide,
  inject,
  computed,
  reactive,
  watch
} from 'vue'
import {
  makeComponentName
} from '../../../utils/name.js'

const namespace = 'config'

const name = makeComponentName(namespace)

const provideName = '__D2_COMPONENTS_CONFIG__'

const componentProps = {
  iconCollection: { type: String, default: '' },
  svgSymbolId: { type: String, default: 'icon-[dir]-[name]' },
  svgDir: { type: String, default: '' }
}

const provideDataDefault = mapValues(
  componentProps,
  (value, key) => getDefault(key)
)

export function useConfig () {
  const config = inject(provideName, provideDataDefault)
  const result = mapValues(
    componentProps,
    (value, key) => computed(() => config[key])
  )
  return result
}

function getDefault (key) {
  const defaultConfig = componentProps?.[key]?.default
  if (isFunction(defaultConfig)) return defaultConfig()
  return defaultConfig
}

function getValid (key, ...values) {
  const defaultValue = getDefault(key)
  return values.find(e => !isEqual(defaultValue, e)) || last(values)
}

function getProvideData (props) {
  if (isUndefined(inject(provideName))) {
    return reactive({
      ...props
    })
  } else {
    const config = useConfig()
    return reactive(
      mapValues(
        props,
        (value, key) => getValid(key, value, config[key].value)
      )
    )
  }
}

export default defineComponent({
  name,
  props: componentProps,
  setup (props, { slots }) {
    let provideData = getProvideData(props)
    keys(props).forEach(key => {
      watch(
        () => props[key],
        () => {
          provideData[key] = props[key]
        }
      )
    })
    provide(provideName, provideData)
    return () => slots.default?.()
  }
})