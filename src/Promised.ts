import {
  defineComponent,
  isVue3,
  PropType,
  reactive,
  toRefs,
  warn,
} from 'vue-demi'
import { usePromise } from './usePromise'

export const Promised = defineComponent({
  name: 'Promised',
  props: {
    promise: {} as PropType<Promise<unknown> | null | undefined>,
    // validator: p =>
    //   p && typeof (p as any).then === 'function' && typeof (p as any).catch === 'function',

    pendingDelay: {
      type: [Number, String],
      default: 200,
    },
  },

  setup(props, { slots }) {
    // https://www.vue3js.cn/docs/zh/api/refs-api.html#torefs
    const propsAsRefs = toRefs(props) // 就是为了解构 props，props自己是一个proxy，但是 proxy.promise 不是，下面解构出来就会失去响应式特征, 就用 toRefs(props) 包裹起来

    /**
     * const name = props.name 这就会失去响应式，这就是一个值
     * <p>name</p> name 就是一个值，当prop.name 发生变化，这里也不会re-render
     *
     * const refName = toRef(props, 'promise')
     * <p>refName.value</p> 不会失去响应式，底层就是通过 props.name 在访问这个变量
     *
     */
    const promiseState = reactive(
      usePromise(propsAsRefs.promise as any, propsAsRefs.pendingDelay)
    ) // 感觉这里是不是不需要在通过reactive包裹，本来ref就是响应式了, 可能是想方便一点，把每个ref放在一个对象里面，而不用解构出来每一个ref

    return () => {
      if ('combined' in slots) {
        return slots.combined!(promiseState)
      }

      const [slotName, slotData] = promiseState.error
        ? ['rejected', promiseState.error]
        : !promiseState.isPending
        ? ['default', promiseState.data]
        : promiseState.isDelayElapsed
        ? ['pending', promiseState.data]
        : [null]

      if (__DEV__ && slotName && !slots[slotName]) {
        ;(isVue3 ? warn : console.warn)(
          `(vue-promised) Missing slot "${slotName}" in Promised component. This will fail in production.`
        )
        return null
      }

      return slotName && slots[slotName]!(slotData)
    }
  },
})
