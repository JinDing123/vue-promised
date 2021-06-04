import { ref, unref, watch, Ref } from 'vue-demi'
import { Refable } from './utils'

/**
 * Returns the state of a Promise and observes the Promise if it's a Ref to
 * automatically update the state
 *
 * @param promise Ref of a Promise or raw Promise
 * @param pendingDelay optional delay to wait before displaying pending
 */
export function usePromise<T = unknown>(
  promise: Ref<Promise<T> | null | undefined>, // ! 学会用ts去表示 ref类型的数据。Ref<T> | T
  pendingDelay: Refable<number | string> = 200
) {
  // ! 每一个都是一个ref，外部只要使用到了这个ref，就会收集依赖
  const isPending = ref(false)
  const isDelayElapsed = ref(false)
  const error = ref<Error | undefined | null>()
  const data = ref<T | null | undefined>()

  let timerId: ReturnType<typeof setTimeout> | undefined | null // 获取函数返回类型  https://zhuanlan.zhihu.com/p/59434318

  watch(
    () => unref(promise), //这里就是帮你访问了promise.value, 这里也会收集依赖，更方便一点
    // ! 学会使用这种方法，真的很厉害
    (newPromise) => {
      isPending.value = true
      error.value = null
      if (!newPromise) {
        // promise 可能是null，因为是immediate，所以需要判断一下promise是否存在。外部 newPromise = null 时，这个watch也会监听到，这里就会重新进入到准备状态
        data.value = null
        isPending.value = true
        if (timerId) clearTimeout(timerId) // 清楚延时器
        timerId = null
        return
      }

      if (unref(pendingDelay) > 0) {
        // 延迟时间，延迟时间内，isDelayElapsed 为 false，延迟时间过了，isDelayElapsed 为 true
        isDelayElapsed.value = false
        if (timerId) clearTimeout(timerId) // 清楚定时器为什么 ？，可能是因为之前的 timer 还没有执行，然后又来了一个 timer，需要清楚之前的一个
        timerId = setTimeout(() => {
          isDelayElapsed.value = true
        }, Number(unref(pendingDelay)))
      } else {
        isDelayElapsed.value = true
      }

      newPromise
        .then((newData) => {
          // ensure we are dealing with the same promise
          if (newPromise === unref(promise)) {
            // 自己写肯定就不会有这个判断
            data.value = newData
            isPending.value = false
          }
        })
        .catch((err) => {
          // ensure we are dealing with the same promise
          if (newPromise === unref(promise)) {
            error.value = err
            isPending.value = false
          }
        })
    },
    { immediate: true }
  )

  return { isPending, isDelayElapsed, error, data } // 正常来说，这些 都拿不到值，return出去的就上一个ref(''), 但是就是因为return出来的是ref，外部使用了这个，这个里面watch到了，但是感觉这种写法不好理解
}

let fuc = () => 1

let a = fuc()

// 对于复杂函数应该很好用
let b: ReturnType<typeof fuc> = fuc()
