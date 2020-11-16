import { defineComponent, PropType, reactive, toRefs, warn } from 'vue-demi'
import { usePromise } from './usePromise'

export const Promised = defineComponent({
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
    const propsAsRefs = toRefs(props)
    const promiseState = reactive(
      usePromise(propsAsRefs.promise, propsAsRefs.pendingDelay)
    )

    return () => {
      if ('combined' in slots) {
        return slots.combined!(promiseState)
      }
      const slotName = promiseState.error
        ? 'rejected'
        : !promiseState.pending
        ? 'default'
        : promiseState.delayElapsed
        ? 'pending'
        : null

      if (__DEV__ && slotName && !slots[slotName]) {
        warn(
          `[vue-promised]: Missing slot "${slotName}". This will fail in production.`
        )
        return null
      }

      return slotName && slots[slotName]!(promiseState)
    }
  },
})